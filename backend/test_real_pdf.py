import urllib.request
from ingestion.pipeline import IngestionPipeline, SessionLocal
from ingestion.models import Document

def test_real_pdf():
    pipeline = IngestionPipeline()
    
    # Download a tiny valid PDF
    url = "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf"
    print("Downloading dummy PDF...")
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    with urllib.request.urlopen(req) as response:
        pdf_bytes = response.read()

    filename = "dummy_valid.pdf"
    metadata = {
        "source_system": "TestScript",
        "plant": "Pune_Pilot",
        "asset_tag": "P-101",
        "doc_type": "Manual"
    }

    print("--- Starting Ingestion Test ---")
    
    result = pipeline.process_document(pdf_bytes, filename, metadata)
    print("Pipeline Result:")
    print(result)
    
    if result.get("status") == "success":
        doc_id = result.get("doc_id")
        
        # Override state to force OCR worker to pick it up (bypassing Tika logic for this test)
        db = SessionLocal()
        try:
            doc = db.query(Document).filter(Document.doc_id == doc_id).first()
            if doc:
                doc.state = "ocr_pending"
                db.commit()
                print("Forced state to ocr_pending to trigger OCR worker.")
        finally:
            db.close()

if __name__ == "__main__":
    test_real_pdf()
