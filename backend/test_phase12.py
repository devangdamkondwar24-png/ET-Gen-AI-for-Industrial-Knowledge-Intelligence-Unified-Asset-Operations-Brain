"""
Phase 1.2 Verification Script
Tests BM25 search, OCR worker status, and document state.
"""
import os
import sys

# When running inside docker, use container hostnames
ES_URL = os.environ.get("ELASTICSEARCH_URL", "http://localhost:9200")
DB_URL = os.environ.get("DATABASE_URL", "postgresql://etgen_user:etgen_password@localhost:5433/etgen_db")

from elasticsearch import Elasticsearch
from ingestion.pipeline import SessionLocal
from ingestion.models import Document

def test_bm25_search():
    print("=" * 60)
    print("TEST 1: BM25 Search in Elasticsearch")
    print("=" * 60)
    es = Elasticsearch(ES_URL)
    
    # Match all
    result = es.search(index="etgen_documents", query={"match_all": {}})
    total = result["hits"]["total"]["value"]
    print(f"  Total documents indexed: {total}")
    
    for hit in result["hits"]["hits"]:
        src = hit["_source"]
        print(f"  -> doc_id={src['doc_id'][:12]}... plant={src['plant']} asset={src['asset_tag']} page={src['page_number']}")
        print(f"     content preview: {src['content'][:80].strip()}")
    
    # BM25 keyword search
    result = es.search(index="etgen_documents", query={"match": {"content": "Dummy"}})
    print(f"\n  BM25 search for 'Dummy': {result['hits']['total']['value']} hits")
    for hit in result["hits"]["hits"]:
        print(f"    Score: {hit['_score']:.4f} | page {hit['_source']['page_number']}")
    
    return total > 0

def test_document_states():
    print("\n" + "=" * 60)
    print("TEST 2: Document State Machine (Postgres)")
    print("=" * 60)
    db = SessionLocal()
    docs = db.query(Document).all()
    for doc in docs:
        print(f"  [{doc.state}] {doc.doc_id[:12]}... | {doc.filename} | text_len={doc.extracted_text_length} pages={doc.page_count}")
        if doc.parsed_metadata:
            if "ocr_completed_pages" in doc.parsed_metadata:
                print(f"     OCR pages completed: {doc.parsed_metadata['ocr_completed_pages']}")
            if "ocr_artifact_path" in doc.parsed_metadata:
                print(f"     OCR artifact: {doc.parsed_metadata['ocr_artifact_path']}")
    db.close()
    return len(docs) > 0

def test_ocr_artifact():
    print("\n" + "=" * 60)
    print("TEST 3: OCR Artifact in MinIO")
    print("=" * 60)
    from ingestion.storage import DocumentStorage
    storage = DocumentStorage()
    
    db = SessionLocal()
    doc = db.query(Document).filter(Document.state == "indexed").first()
    if doc and doc.parsed_metadata and "ocr_artifact_path" in doc.parsed_metadata:
        artifact_path = doc.parsed_metadata["ocr_artifact_path"]
        data = storage.get_document(artifact_path)
        if data:
            print(f"  OCR artifact found: {artifact_path}")
            print(f"  Size: {len(data)} bytes")
            print(f"  Preview: {data.decode('utf-8')[:200]}")
            db.close()
            return True
        else:
            print(f"  OCR artifact NOT found at: {artifact_path}")
    else:
        print("  No indexed document with OCR artifact found.")
    db.close()
    return False

if __name__ == "__main__":
    results = []
    results.append(("BM25 Search", test_bm25_search()))
    results.append(("Document States", test_document_states()))
    results.append(("OCR Artifact", test_ocr_artifact()))
    
    print("\n" + "=" * 60)
    print("SUMMARY")
    print("=" * 60)
    all_pass = True
    for name, passed in results:
        status = "PASS" if passed else "FAIL"
        print(f"  {status}: {name}")
        if not passed:
            all_pass = False
    
    sys.exit(0 if all_pass else 1)
