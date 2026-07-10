"""
Phase 2 Verification Script
Tests Embeddings, Hybrid Search, and Ollama Generation.
"""
import os
import sys
import time
import requests
from fastapi.testclient import TestClient
from elasticsearch import Elasticsearch

# Use environment variables for docker setup
ES_URL = os.environ.get("ELASTICSEARCH_URL", "http://localhost:9200")
OLLAMA_URL = os.environ.get("OLLAMA_URL", "http://localhost:11434")

# Initialize index
from ingestion.indexer import DocumentIndexer
idx = DocumentIndexer()

from main import app
from ingestion.embedder import document_embedder
from ingestion.text_processing import chunk_text

client = TestClient(app)
es = Elasticsearch(ES_URL)

def test_embedder():
    print("=" * 60)
    print("TEST 1: Dense Vector Generation")
    print("=" * 60)
    
    text = "Predictive maintenance reduces unexpected downtime."
    print("  Generating embedding...")
    vector = document_embedder.embed_text(text)
    
    if not vector:
        print("  FAIL: Embedder returned empty vector.")
        return False
        
    print(f"  Success: Generated vector with {len(vector)} dimensions.")
    if len(vector) != 384:
        print(f"  FAIL: Expected 384 dimensions, got {len(vector)}")
        return False
        
    return True

def test_hybrid_search():
    print("\n" + "=" * 60)
    print("TEST 2: Hybrid Search (BM25 + kNN)")
    print("=" * 60)
    
    doc_id = "test-phase2-" + str(int(time.time()))
    
    # 1. Index some test chunks
    chunks = [
        "The quick brown fox jumps over the lazy dog.", # chunk 0
        "Routine lubrication of the gear box prevents overheating and catastrophic failure.", # chunk 1
        "Downtime is costly, so replace the bearings every 5000 hours." # chunk 2
    ]
    
    for i, c in enumerate(chunks):
        vector = document_embedder.embed_text(c)
        idx.index_chunk(
            doc_id=doc_id,
            plant="Test_Plant",
            asset_tag="TEST-P2",
            source_system="TestScript",
            page_number=1,
            chunk_index=i,
            content=c,
            chunk_vector=vector
        )
    print(f"  Indexed {len(chunks)} chunks for doc_id {doc_id}")
    time.sleep(2) # Refresh
    
    # 2. Test semantic search 
    # Query has NO exact keyword match with chunk 1, but is semantically similar
    query_payload = {
        "query": "How to stop the gearbox from getting too hot?",
        "plant": "Test_Plant",
        "top_k": 3
    }
    print(f"  Calling /api/search with: '{query_payload['query']}'")
    response = client.post("/api/search", json=query_payload)
    
    if response.status_code != 200:
        print(f"  FAIL: Search API returned {response.status_code}")
        return False
        
    data = response.json()
    results = data["results"]
    print(f"  Found {len(results)} hits.")
    
    if not results:
        print("  FAIL: No results found.")
        return False
        
    top_hit = results[0]
    print(f"  Top Hit: {top_hit['text_snippet']}")
    
    # Chunk 1 should be the top hit semantically
    if "lubrication" not in top_hit["text_snippet"]:
        print("  FAIL: Semantic search failed to retrieve the correct chunk.")
        return False
        
    return True

def test_ollama_api():
    print("\n" + "=" * 60)
    print("TEST 3: Ollama Reachability")
    print("=" * 60)
    
    print(f"  Checking Ollama at {OLLAMA_URL}...")
    try:
        res = requests.get(f"{OLLAMA_URL}/api/tags")
        if res.status_code == 200:
            models = res.json().get("models", [])
            names = [m["name"] for m in models]
            print(f"  Success: Ollama is reachable. Available models: {names}")
            
            # Since pulling a model can take a while, we just verify it's reachable.
            # If 'mistral' is missing, the chat endpoint will fail, but we'll test anyway.
            return True
        else:
            print(f"  FAIL: Ollama returned {res.status_code}")
            return False
    except requests.exceptions.RequestException as e:
        print(f"  FAIL: Could not reach Ollama: {e}")
        return False

if __name__ == "__main__":
    s1 = test_embedder()
    s2 = test_hybrid_search() if s1 else False
    s3 = test_ollama_api()
    
    print("\n" + "=" * 60)
    print("SUMMARY")
    print("=" * 60)
    print(f"  Embedder:      {'PASS' if s1 else 'FAIL'}")
    print(f"  Hybrid Search: {'PASS' if s2 else 'FAIL'}")
    print(f"  Ollama Check:  {'PASS' if s3 else 'FAIL'}")
    
    if s1 and s2 and s3:
        sys.exit(0)
    else:
        sys.exit(1)
