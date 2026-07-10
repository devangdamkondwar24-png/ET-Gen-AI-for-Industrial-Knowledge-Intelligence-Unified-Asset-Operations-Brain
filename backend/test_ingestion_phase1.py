import time
from ingestion.pipeline import IngestionPipeline, SessionLocal
from ingestion.models import Document

def test_ingestion():
    pipeline = IngestionPipeline()
    
    # 1. Create a fake PDF byte payload
    fake_pdf_content = b"%PDF-1.4\n%Fake PDF for Testing Phase 1.1 - RUN 3 POST CLEANUP\n\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n"
    filename = "test_manual.pdf"
    metadata = {
        "source_system": "TestScript",
        "plant": "Pune_Pilot",
        "asset_tag": "P-101",
        "doc_type": "Manual"
    }

    print("--- Starting Ingestion Test ---")
    
    # 2. Process document
    result = pipeline.process_document(fake_pdf_content, filename, metadata)
    print("Pipeline Result:")
    print(result)
    
    if result.get("status") == "success":
        doc_id = result.get("doc_id")
        
        # 3. Verify in Postgres DB
        db = SessionLocal()
        try:
            doc = db.query(Document).filter(Document.doc_id == doc_id).first()
            if doc:
                print("\n--- DB Verification ---")
                print(f"State: {doc.state.value}")
                print(f"MinIO Path: {doc.storage_path}")
                print(f"Text Length: {doc.extracted_text_length}")
                print(f"Pages: {doc.page_count}")
                
                assert doc.state.value in ["parsed", "ocr_pending"], f"Invalid state {doc.state.value}"
                print("SUCCESS: Database state is correct.")
            else:
                print("FAIL: Document not found in DB!")
        finally:
            db.close()
            
    else:
        print("FAIL: Pipeline failed.")

if __name__ == "__main__":
    test_ingestion()
