"""
Retrieval Benchmark Evaluation
Tests the balance of BM25 and kNN hybrid search.
"""
import sys
import os
import time
from fastapi.testclient import TestClient

# Must add backend dir to sys.path to run standalone
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from main import app
from ingestion.indexer import DocumentIndexer
from ingestion.embedder import document_embedder

client = TestClient(app)
idx = DocumentIndexer()

# Mini-Corpus for evaluation
CORPUS = [
    {"id": "doc1", "text": "The PX-200 pump operates optimally at 500 RPM. Exceeding this can cause cavitation."},
    {"id": "doc2", "text": "Cavitation in centrifugal pumps leads to pitting on the impeller blades and eventual failure."},
    {"id": "doc3", "text": "For the PX-200, replace the primary seals every 10,000 hours of operation."},
    {"id": "doc4", "text": "High vibrations in the motor are usually caused by misalignment or unbalanced rotors."},
    {"id": "doc5", "text": "To align the PX-200 motor, use a laser alignment tool. Tolerance is 0.05mm."},
    {"id": "doc6", "text": "When the equipment gets too hot, check the lubrication levels first."},
]

BENCHMARKS = [
    {
        "type": "Keyword-Heavy",
        "query": "PX-200 pump optimal RPM",
        "expected_doc_id": "doc1"
    },
    {
        "type": "Semantic-Heavy (No exact keywords)",
        "query": "How do I fix equipment that is overheating?",
        "expected_doc_id": "doc6"
    },
    {
        "type": "Mixed",
        "query": "What causes impeller pitting?",
        "expected_doc_id": "doc2"
    },
    {
        "type": "Mixed / Semantic",
        "query": "How often should I change the seals on the PX-200?",
        "expected_doc_id": "doc3"
    },
    {
        "type": "Out-of-Domain (Negative)",
        "query": "What is the capital of France?",
        "expected_doc_id": "NONE"
    },
    {
        "type": "Ambiguous (Negative)",
        "query": "Who is the CEO?",
        "expected_doc_id": "NONE"
    }
]

def setup_corpus():
    print("Setting up evaluation corpus...")
    for doc in CORPUS:
        vector = document_embedder.embed_text(doc["text"])
        idx.index_chunk(
            doc_id=doc["id"],
            plant="Eval_Plant",
            asset_tag="EVAL",
            source_system="Eval",
            page_number=1,
            chunk_index=0,
            content=doc["text"],
            chunk_vector=vector
        )
    time.sleep(2) # Refresh ES
    print("Corpus indexed.")

def run_benchmarks(label="Current"):
    print(f"\n--- Running Benchmarks ({label}) ---")
    score_sum = 0
    success_count = 0
    
    for b in BENCHMARKS:
        print(f"\nQuery: '{b['query']}' [{b['type']}]")
        resp = client.post("/api/search", json={
            "query": b["query"],
            "plant": "Eval_Plant",
            "top_k": 3
        })
        
        if resp.status_code != 200:
            print(f"  Error: {resp.status_code}")
            continue
            
        results = resp.json().get("results", [])
        if not results:
            print("  No results found.")
            continue
            
        top_hit = results[0]
        rank = -1
        for i, res in enumerate(results):
            if res["doc_id"] == b["expected_doc_id"]:
                rank = i + 1
                break
                
        print(f"  Top Hit: {top_hit['doc_id']} | Score: {top_hit['score']:.4f} | Text: {top_hit['text_snippet'][:60]}...")
        if b["expected_doc_id"] == "NONE":
            # For negative tests, we expect the score to be BELOW our threshold of 7.5
            if top_hit['score'] < 7.5:
                print(f"  ✅ SUCCESS: Out-of-Domain query correctly scored low (< 7.5)")
                success_count += 1
            else:
                print(f"  ❌ FAIL: Out-of-Domain query scored too high (>= 7.5)")
            score_sum += top_hit['score']
            continue

        if rank == 1:
            print(f"  ✅ SUCCESS: Expected {b['expected_doc_id']} is Rank 1")
            success_count += 1
        elif rank > 1:
            print(f"  ⚠️ PARTIAL: Expected {b['expected_doc_id']} is Rank {rank}")
        else:
            print(f"  ❌ FAIL: Expected {b['expected_doc_id']} not in top 3")
            
        score_sum += top_hit['score']
        
    print(f"\nTotal Success: {success_count}/{len(BENCHMARKS)}")
    print(f"Average Top Score: {score_sum/len(BENCHMARKS):.4f}")

if __name__ == "__main__":
    setup_corpus()
    run_benchmarks("Pre-Tuning")
