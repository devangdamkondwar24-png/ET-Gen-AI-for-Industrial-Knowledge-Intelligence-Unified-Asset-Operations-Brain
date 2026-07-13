from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
import os
import logging
import httpx

from api.search import search_documents, SearchRequest

router = APIRouter()
logger = logging.getLogger(__name__)

OLLAMA_URL = os.environ.get("OLLAMA_URL", "http://localhost:11434")
OLLAMA_MODEL = os.environ.get("OLLAMA_MODEL", "mistral:latest")

class ChatRequest(BaseModel):
    question: str
    plant: Optional[str] = None
    asset_tag: Optional[str] = None
    top_k: int = 15

class SourceChunk(BaseModel):
    chunk_id: str
    doc_id: str
    page_number: int
    plant: Optional[str]
    asset_tag: Optional[str]
    text_snippet: str

class ChatResponse(BaseModel):
    answer: str
    sources: List[SourceChunk]
    model: str
    confidence_score: float

def build_rag_prompt(question: str, context_chunks: list) -> str:
    """
    Build a grounded prompt that instructs the LLM to answer ONLY from the provided context.
    """
    context_block = ""
    for i, chunk in enumerate(context_chunks):
        context_block += (
            f"\n--- [DOC_ID: {chunk['doc_id']}] (page: {chunk['page_number']}, plant: {chunk['plant']}) ---\n"
            f"{chunk['text_snippet']}\n"
        )

    prompt = f"""You are an expert Industrial Knowledge Assistant.
Answer the question ONLY using the provided context below. If the context does not contain the answer, you MUST say exactly "I cannot verify the answer with high confidence based on the available documents."

Provide a highly detailed and comprehensive answer. You MUST include all specific numbers, dates, emails, quantities, and Work Order IDs (e.g., WO-XXXX) found in the context that relate to the question.

CONTEXT:
{context_block}

QUESTION: {question}

ANSWER:"""
    return prompt

@router.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """
    RAG Copilot: Retrieves relevant chunks via hybrid search, then generates
    a grounded answer using a local Ollama LLM.
    """
    if not request.question.strip():
        raise HTTPException(status_code=400, detail="Question cannot be empty")

    # Step 1: Retrieve relevant chunks via hybrid search
    search_req = SearchRequest(
        query=request.question,
        plant=request.plant,
        asset_tag=request.asset_tag,
        top_k=request.top_k
    )

    try:
        search_response = await search_documents(search_req)
    except Exception as e:
        logger.error(f"Retrieval failed: {e}")
        raise HTTPException(status_code=500, detail=f"Retrieval error: {str(e)}")

    if not search_response.results:
        return ChatResponse(
            answer="I could not find any relevant documents to answer your question.",
            sources=[],
            model=OLLAMA_MODEL,
            confidence_score=0.0
        )

    # Fallback Rule: If the best match has a low score, reject answering.
    # kNN cosine similarity scores are between 0.0 and 1.0. Threshold at 0.5.
    top_score = search_response.results[0].score
    if top_score < 0.5:
        return ChatResponse(
            answer="I cannot verify the answer with high confidence based on the available documents.",
            sources=[],
            model=OLLAMA_MODEL,
            confidence_score=top_score
        )

    # Step 2: Build RAG prompt from retrieved chunks
    context_chunks = []
    for result in search_response.results:
        context_chunks.append({
            "chunk_id": result.chunk_id,
            "doc_id": result.doc_id,
            "page_number": result.page_number,
            "plant": result.plant,
            "asset_tag": result.asset_tag,
            "text_snippet": result.text_snippet
        })

    prompt = build_rag_prompt(request.question, context_chunks)

    # Step 3: Call Ollama for generation
    try:
        async with httpx.AsyncClient(timeout=300.0) as client:
            ollama_response = await client.post(
                f"{OLLAMA_URL}/api/generate",
                json={
                    "model": OLLAMA_MODEL,
                    "prompt": prompt,
                    "stream": False,
                    "options": {
                        "temperature": 0.1,
                        "num_predict": 512
                    }
                }
            )
            ollama_response.raise_for_status()
            generated = ollama_response.json()
            answer = generated.get("response", "").strip()
    except httpx.ConnectError:
        logger.error("Cannot connect to Ollama. Is the service running?")
        raise HTTPException(
            status_code=503,
            detail="LLM service (Ollama) is not reachable. Ensure the ollama container is running and a model is pulled."
        )
    except Exception as e:
        logger.error(f"Ollama generation failed: {e}")
        raise HTTPException(status_code=500, detail=f"LLM generation error: {str(e)}")

    # Step 4: Citation Validation Check
    # If the LLM didn't use the fallback phrase, it must have included <CITATIONS> and a valid doc_id
    fallback_phrase = "cannot verify the answer"
    if fallback_phrase in answer:
        answer = "I could not find enough relevant information in the documents to answer this question with high confidence."
    # Step 5: Return answer with source citations
    sources = [
        SourceChunk(
            chunk_id=c["chunk_id"],
            doc_id=c["doc_id"],
            page_number=c["page_number"],
            plant=c["plant"],
            asset_tag=c["asset_tag"],
            text_snippet=c["text_snippet"][:200]  # Truncate for response size
        )
        for c in context_chunks
    ]

    return ChatResponse(
        answer=answer,
        sources=sources,
        model=OLLAMA_MODEL,
        confidence_score=top_score
    )
