"""
Reindex all documents from PostgreSQL back into Elasticsearch.
Run this inside the container: docker exec etgen_ocr_worker python reindex.py
"""
import os, sys, logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
logger = logging.getLogger("reindex")

DATABASE_URL = os.environ.get("DATABASE_URL", "postgresql://etgen_user:etgen_password@db:5432/etgen_db")

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from ingestion.models import Base, Document, DocumentState
from ingestion.storage import DocumentStorage
from ingestion.universal_router import route_and_parse
from ingestion.text_processing import chunk_text
from ingestion.embedder import document_embedder
from ingestion.indexer import DocumentIndexer

engine = create_engine(DATABASE_URL)
Session = sessionmaker(bind=engine)
db = Session()

storage = DocumentStorage()
indexer = DocumentIndexer()

# Fetch all docs that need reindexing (state = parsed or indexed but ES is empty)
docs = db.query(Document).filter(Document.state.in_(["parsed", "indexed"])).all()
logger.info(f"Found {len(docs)} documents to reindex.")

success, failed = 0, 0
for doc in docs:
    try:
        logger.info(f"Reindexing {doc.filename} ({doc.doc_id})...")
        
        # Fetch raw bytes from MinIO
        file_bytes = storage.get_document(doc.storage_path)
        
        # Re-parse
        parsed = route_and_parse(file_bytes, doc.filename, {
            "plant": doc.plant,
            "asset_tag": doc.asset_tag,
            "source_system": doc.source_system,
        })
        
        chunk_index = 0
        for page in parsed.pages:
            chunks = chunk_text(page["text"])
            for chunk in chunks:
                vector = document_embedder.embed_text(chunk)
                indexer.index_chunk(
                    doc_id=doc.doc_id,
                    plant=doc.plant,
                    asset_tag=doc.asset_tag,
                    source_system=doc.source_system,
                    page_number=page["page_num"],
                    chunk_index=chunk_index,
                    content=chunk,
                    chunk_vector=vector
                )
                chunk_index += 1
        
        doc.state = DocumentState.indexed
        db.commit()
        logger.info(f"  ✓ {doc.filename} → {chunk_index} chunks indexed.")
        success += 1
        
    except Exception as e:
        logger.error(f"  ✗ {doc.filename} failed: {e}")
        failed += 1

db.close()
logger.info(f"\nReindex complete. Success: {success}, Failed: {failed}")
