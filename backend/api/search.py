from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
import os
import logging
from elasticsearch import Elasticsearch
from ingestion.embedder import document_embedder

router = APIRouter()
logger = logging.getLogger(__name__)

es_host = os.environ.get("ELASTICSEARCH_URL", "http://localhost:9200")
es = Elasticsearch(es_host)
INDEX_NAME = "etgen_documents_v2"

class SearchRequest(BaseModel):
    query: str
    plant: Optional[str] = None
    asset_tag: Optional[str] = None
    top_k: int = 5

class SearchResult(BaseModel):
    chunk_id: str
    doc_id: str
    page_number: int
    chunk_index: int
    asset_tag: Optional[str]
    plant: Optional[str]
    score: float
    text_snippet: str

class SearchResponse(BaseModel):
    results: List[SearchResult]
    total_hits: int

@router.post("/search", response_model=SearchResponse)
async def search_documents(request: SearchRequest):
    """
    Hybrid Search: BM25 (keyword) + kNN (semantic) with RRF score fusion.
    """
    if not request.query.strip():
        raise HTTPException(status_code=400, detail="Query cannot be empty")
        
    try:
        # Build filter clauses
        filter_clauses = []
        if request.plant:
            filter_clauses.append({"term": {"plant": request.plant}})
        if request.asset_tag:
            filter_clauses.append({"term": {"asset_tag": request.asset_tag}})

        # Embed the user query for kNN
        query_vector = document_embedder.embed_text(request.query)

        if query_vector:
            # --- Hybrid Search: BM25 + kNN (ES 8.x style) ---
            body = {
                "size": request.top_k,
                "knn": {
                    "field": "chunk_vector",
                    "query_vector": query_vector,
                    "k": request.top_k,
                    "num_candidates": request.top_k * 10,
                    **({"filter": filter_clauses} if filter_clauses else {})
                },
                "query": {
                    "bool": {
                        "should": [
                            {"match": {"content": {"query": request.query, "boost": 0.5}}}
                        ],
                        **({"filter": filter_clauses} if filter_clauses else {})
                    }
                }
            }
        else:
            # Fallback: BM25 only (if embedding model is unavailable)
            body = {
                "size": request.top_k,
                "query": {
                    "bool": {
                        "must": [{"match": {"content": request.query}}],
                        "filter": filter_clauses
                    }
                }
            }

        response = es.search(index=INDEX_NAME, body=body)

        hits = response["hits"]["hits"]
        total_hits = response["hits"]["total"]["value"]

        results = []
        for hit in hits:
            source = hit["_source"]
            results.append(SearchResult(
                chunk_id=source.get("chunk_id", hit["_id"]),
                doc_id=source.get("doc_id", ""),
                page_number=source.get("page_number", 0),
                chunk_index=source.get("chunk_index", 0),
                asset_tag=source.get("asset_tag"),
                plant=source.get("plant"),
                score=hit["_score"],
                text_snippet=source.get("content", "")
            ))

        return SearchResponse(results=results, total_hits=total_hits)

    except Exception as e:
        logger.error(f"Search API error: {e}")
        raise HTTPException(status_code=500, detail=f"Search engine error: {str(e)}")
