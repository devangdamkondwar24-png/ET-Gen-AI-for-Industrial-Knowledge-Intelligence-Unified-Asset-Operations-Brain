"""
Phase 1.3 Verification Script
Tests Chunking, Indexing (v2), and Search API.
"""
import os
import sys
import time
from fastapi.testclient import TestClient
from elasticsearch import Elasticsearch

# Using environment variables from docker container
ES_URL = os.environ.get("ELASTICSEARCH_URL", "http://localhost:9200")
# Ensure index is created
from ingestion.indexer import DocumentIndexer
idx = DocumentIndexer()

from main import app
from ingestion.text_processing import chunk_text

client = TestClient(app)
es = Elasticsearch(ES_URL)

def test_chunking_and_ingestion():
    print("=" * 60)
    print("TEST 1: Chunking & Indexing Logic")
    print("=" * 60)
    
    dummy_text_str = (
        f"TEST ID: {time.time()}\n\n"
        "Phase 1.3 introduced text normalization and chunking. This is the first paragraph. "
        "It contains some introductory information about the system architecture.\n\n"
        "The second paragraph details the Elasticsearch chunk mappings. "
        "Each chunk has a unique chunk_id based on the doc_id and chunk_index. "
        "This prevents duplicate chunks on re-ingestion.\n\n"
        "Finally, the search API uses BM25 to score these chunks and returns "
        "the exact text snippet that matched the user's query."
    )
    
    print("  Chunking text...")
    # Test the chunker
    chunks = chunk_text(dummy_text_str, max_chunk_size=150, overlap=20)
    print(f"  Generated {len(chunks)} chunks.")
    
    if len(chunks) < 3:
        print("  FAIL: Did not generate enough chunks.")
        return False, None
        
    doc_id = "test-doc-" + str(int(time.time()))
    
    print("  Indexing chunks...")
    for i, chunk in enumerate(chunks):
        idx.index_chunk(
            doc_id=doc_id,
            plant="Mumbai_HQ",
            asset_tag="TEST-CHUNKS",
            source_system="TestScript",
            page_number=1,
            chunk_index=i,
            content=chunk
        )
        print(f"    Indexed chunk {i} ({len(chunk)} chars)")
        
    time.sleep(2) # Wait for ES refresh
    
    # Check index for chunks
    res = es.search(index="etgen_documents_v2", query={"term": {"doc_id": doc_id}})
    hits = res["hits"]["hits"]
    print(f"  Found {len(hits)} chunks in ES for doc_id {doc_id}")
    
    if len(hits) == 0:
        print("  FAIL: No chunks indexed!")
        return False, doc_id
        
    return True, doc_id

def test_search_api(doc_id):
    print("\n" + "=" * 60)
    print("TEST 2: Search API Endpoint")
    print("=" * 60)
    
    query_payload = {
        "query": "duplicate chunks",
        "plant": "Mumbai_HQ"
    }
    
    print(f"  Calling POST /api/search with payload: {query_payload}")
    response = client.post("/api/search", json=query_payload)
    
    if response.status_code != 200:
        print(f"  FAIL: API returned {response.status_code} - {response.text}")
        return False
        
    data = response.json()
    print(f"  Total hits: {data['total_hits']}")
    
    if data['total_hits'] == 0:
        print("  FAIL: Search returned 0 hits for a known keyword.")
        return False
        
    top_result = data['results'][0]
    print(f"  Top Result Score: {top_result['score']}")
    print(f"  Top Result Chunk ID: {top_result['chunk_id']}")
    print(f"  Top Result Snippet: {top_result['text_snippet'][:100]}...")
    
    if "duplicate chunks" not in top_result['text_snippet']:
        print("  FAIL: Expected keyword not found in the returned text snippet.")
        return False
        
    return True
    
def test_idempotency(doc_id):
    print("\n" + "=" * 60)
    print("TEST 3: Chunk Overwrite Idempotency")
    print("=" * 60)
    
    res_before = es.count(index="etgen_documents_v2", query={"term": {"doc_id": doc_id}})
    count_before = res_before['count']
    print(f"  Chunk count before re-index: {count_before}")
    
    # Force re-index chunk 0
    chunk_id_0 = f"{doc_id}_chunk_0"
    es.index(index="etgen_documents_v2", id=chunk_id_0, document={
        "chunk_id": chunk_id_0,
        "doc_id": doc_id,
        "plant": "Mumbai_HQ",
        "asset_tag": "TEST-CHUNKS",
        "page_number": 1,
        "chunk_index": 0,
        "content": "Re-indexed text snippet."
    })
    
    time.sleep(2) # Refresh
    
    res_after = es.count(index="etgen_documents_v2", query={"term": {"doc_id": doc_id}})
    count_after = res_after['count']
    print(f"  Chunk count after re-index: {count_after}")
    
    # Check if content updated
    res = es.get(index="etgen_documents_v2", id=chunk_id_0)
    updated_content = res['_source']['content']
    print(f"  Updated content: {updated_content}")
    
    if count_before != count_after:
        print("  FAIL: Chunk count increased! Deterministic IDs failed.")
        return False
        
    if updated_content != "Re-indexed text snippet.":
        print("  FAIL: Content did not overwrite.")
        return False
        
    return True

if __name__ == "__main__":
    success1, doc_id = test_chunking_and_ingestion()
    success2 = test_search_api(doc_id) if success1 else False
    success3 = test_idempotency(doc_id) if success1 else False
    
    print("\n" + "=" * 60)
    print("SUMMARY")
    print("=" * 60)
    print(f"  Chunking/Ingestion: {'PASS' if success1 else 'FAIL'}")
    print(f"  Search API:         {'PASS' if success2 else 'FAIL'}")
    print(f"  Idempotency:        {'PASS' if success3 else 'FAIL'}")
    
    if success1 and success2 and success3:
        sys.exit(0)
    else:
        sys.exit(1)
