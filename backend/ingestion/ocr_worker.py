import os
import time
import json
import logging
from typing import List, Dict
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from ingestion.models import Document, DocumentState
from ingestion.storage import DocumentStorage
from ingestion.indexer import DocumentIndexer
from ingestion.text_processing import chunk_text
from ingestion.embedder import document_embedder

import pytesseract
from pdf2image import convert_from_bytes

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger("OCRWorker")

DATABASE_URL = os.environ.get("DATABASE_URL", "postgresql://etgen_user:etgen_password@localhost:5433/etgen_db")
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

class OCRWorker:
    def __init__(self):
        self.storage = DocumentStorage()
        self.indexer = DocumentIndexer()

    def process_pending_documents(self):
        db = SessionLocal()
        try:
            # Simple lock: just grab one and update it to processing to avoid double-processing
            # In a true distributed system, use FOR UPDATE SKIP LOCKED
            doc = db.query(Document).filter(Document.state == DocumentState.ocr_pending).first()
            
            if not doc:
                return # Nothing to do
                
            logger.info(f"Picked up document for OCR: {doc.doc_id}")
            
            # Fetch raw bytes
            file_bytes = self.storage.get_document(doc.storage_path)
            if not file_bytes:
                logger.error(f"Could not fetch {doc.storage_path} from MinIO")
                doc.state = DocumentState.failed
                db.commit()
                return

            # Prepare page-level tracking in parsed_metadata
            metadata = doc.parsed_metadata or {}
            completed_pages = metadata.get("ocr_completed_pages", [])
            
            try:
                # Convert PDF to images
                images = convert_from_bytes(file_bytes)
                doc.page_count = len(images)
                
                full_text = ""
                ocr_results = []
                
                for i, image in enumerate(images):
                    page_num = i + 1
                    if page_num in completed_pages:
                        logger.info(f"[{doc.doc_id}] Skipping page {page_num} (already OCR'd)")
                        continue
                        
                    logger.info(f"[{doc.doc_id}] Running OCR on page {page_num}/{len(images)}...")
                    page_text = pytesseract.image_to_string(image)
                    
                    if page_text.strip():
                        # Chunk, Embed, and Index
                        chunks = chunk_text(page_text)
                        for chunk_idx, chunk in enumerate(chunks):
                            vector = document_embedder.embed_text(chunk)
                            self.indexer.index_chunk(
                                doc_id=doc.doc_id,
                                plant=doc.plant,
                                asset_tag=doc.asset_tag,
                                source_system=doc.source_system,
                                page_number=page_num,
                                chunk_index=chunk_idx,
                                content=chunk,
                                chunk_vector=vector
                            )
                        full_text += f"\n--- Page {page_num} ---\n{page_text}\n"
                        ocr_results.append({"page": page_num, "text": page_text})
                    
                    completed_pages.append(page_num)
                    metadata["ocr_completed_pages"] = completed_pages
                    doc.parsed_metadata = metadata
                    db.commit() # Save progress page by page
                    
                # Save OCR artifact to MinIO
                ocr_artifact_path = doc.storage_path.replace(".pdf", "_ocr.txt")
                self.storage.upload_document(full_text.encode('utf-8'), ocr_artifact_path, {})
                
                doc.extracted_text_length = len(full_text)
                metadata["ocr_artifact_path"] = ocr_artifact_path
                doc.parsed_metadata = metadata
                doc.state = DocumentState.indexed
                
                db.commit()
                logger.info(f"[{doc.doc_id}] OCR complete and indexed.")
                
            except Exception as e:
                logger.error(f"OCR Failed for {doc.doc_id}: {e}")
                # Don't fail the document entirely if we completed some pages, 
                # but for simplicity, we mark it failed to inspect
                doc.state = DocumentState.failed
                db.commit()
                
        finally:
            db.close()

if __name__ == "__main__":
    logger.info("Starting OCR Worker...")
    worker = OCRWorker()
    while True:
        try:
            worker.process_pending_documents()
        except Exception as e:
            logger.error(f"Worker crash loop caught: {e}")
        time.sleep(5)
