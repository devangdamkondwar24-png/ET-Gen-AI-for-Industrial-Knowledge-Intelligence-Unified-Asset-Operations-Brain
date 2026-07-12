import hashlib
import uuid
import json
import logging
from datetime import datetime
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from ingestion.models import Base, Document, DocumentState
from ingestion.storage import DocumentStorage
from ingestion.parser import DocumentParser
from ingestion.indexer import DocumentIndexer
from ingestion.text_processing import chunk_text
from ingestion.embedder import document_embedder

import os
DATABASE_URL = os.environ.get("DATABASE_URL", "postgresql://etgen_user:etgen_password@localhost:5433/etgen_db")

logger = logging.getLogger(__name__)

engine = create_engine(DATABASE_URL)
Base.metadata.create_all(engine)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

class IngestionPipeline:
    def __init__(self):
        self.db_session = SessionLocal()
        self.storage = DocumentStorage()
        self.parser = DocumentParser()
        self.indexer = DocumentIndexer()
        
    def _compute_hash(self, file_bytes: bytes) -> str:
        return hashlib.sha256(file_bytes).hexdigest()

    def process_document(self, file_bytes: bytes, filename: str, metadata: dict) -> dict:
        """
        Executes the Phase 1.1 state machine:
        uploaded -> hash check -> stored -> parsed -> ocr_pending/parsed
        """
        db = SessionLocal()
        try:
            # 1. Uploaded / Hash & Deduplicate
            content_hash = self._compute_hash(file_bytes)
            
            existing_doc = db.query(Document).filter(Document.content_hash == content_hash).first()
            if existing_doc:
                return {
                    "status": "skipped",
                    "reason": "Duplicate file (hash match)",
                    "doc_id": existing_doc.doc_id
                }
                
            doc_id = str(uuid.uuid4())
            object_name = f"{metadata.get('plant', 'unknown')}/{metadata.get('asset_tag', 'general')}/{doc_id}_{filename}"
            
            # Create tracking row (State: uploaded)
            new_doc = Document(
                doc_id=doc_id,
                filename=filename,
                source_system=metadata.get('source_system', 'UserUpload'),
                plant=metadata.get('plant', 'Pune_Pilot'),
                asset_tag=metadata.get('asset_tag'),
                doc_type=metadata.get('doc_type', 'Unknown'),
                content_hash=content_hash,
                state=DocumentState.uploaded
            )
            db.add(new_doc)
            db.commit()
            
            # 2. Store to MinIO (State: stored)
            storage_path = self.storage.upload_document(file_bytes, object_name, metadata)
            new_doc.storage_path = storage_path
            new_doc.state = DocumentState.stored
            db.commit()
            
            # 3. Parse with Universal Router
            try:
                from ingestion.universal_router import route_and_parse
                parsed_doc = route_and_parse(file_bytes, filename, metadata)
                
                total_text = parsed_doc.full_text
                
                new_doc.extracted_text_length = len(total_text)
                new_doc.page_count = parsed_doc.page_count
                
                # Save parsed metadata provenance
                new_doc.parsed_metadata = parsed_doc.provenance
                
                # Quality gate: if text is too short, and it's not a text file, maybe OCR
                # But only if it's pdf, cad, or image. Email/spreadsheet won't get OCR'd.
                needs_ocr = False
                if parsed_doc.error == "CAD_OCR_NEEDED":
                    needs_ocr = True
                elif new_doc.extracted_text_length < 50 and parsed_doc.doc_type in ["pdf", "image"]:
                    needs_ocr = True
                
                if needs_ocr:
                    new_doc.state = DocumentState.ocr_pending
                    logger.info(f"[{doc_id}] Text length too short or CAD needed. Routing to OCR.")
                else:
                    # Digital text successful! Index it.
                    if parsed_doc.error and not total_text:
                        raise Exception(parsed_doc.error)
                        
                    logger.info(f"[{doc_id}] Text extracted successfully. Indexing...")
                    chunk_index = 0
                    for page in parsed_doc.pages:
                        text = page["text"]
                        page_num = page["page_num"]
                        chunks = chunk_text(text)
                        for chunk in chunks:
                            vector = document_embedder.embed_text(chunk)
                            self.indexer.index_chunk(
                                doc_id=new_doc.doc_id,
                                plant=new_doc.plant,
                                asset_tag=new_doc.asset_tag,
                                source_system=new_doc.source_system,
                                page_number=page_num,
                                chunk_index=chunk_index,
                                content=chunk,
                                chunk_vector=vector
                            )
                            chunk_index += 1
                    
                    new_doc.state = DocumentState.indexed
                    logger.info(f"[{doc_id}] Document indexed.")
                    
                db.commit()
                
            except Exception as e:
                new_doc.state = DocumentState.failed
                new_doc.error_message = str(e)
                db.commit()
                return {"status": "failed", "step": "parsing", "error": str(e), "doc_id": doc_id}

            return {
                "status": "success",
                "doc_id": doc_id,
                "state": new_doc.state.value,
                "text_length": new_doc.extracted_text_length,
                "pages": new_doc.page_count
            }

        finally:
            db.close()
