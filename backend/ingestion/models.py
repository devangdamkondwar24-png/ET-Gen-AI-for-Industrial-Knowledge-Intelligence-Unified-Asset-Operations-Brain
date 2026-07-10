from sqlalchemy import Column, String, Integer, DateTime, Enum, JSON
from sqlalchemy.ext.declarative import declarative_base
from datetime import datetime
import enum
import uuid

Base = declarative_base()

class DocumentState(enum.Enum):
    uploaded = "uploaded"
    stored = "stored"
    parsed = "parsed"
    ocr_pending = "ocr_pending"
    ocr_done = "ocr_done"
    indexed = "indexed"
    failed = "failed"

class Document(Base):
    __tablename__ = 'documents'

    doc_id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    filename = Column(String, nullable=False)
    source_system = Column(String, nullable=False) # e.g. 'CMMS', 'QMS', 'UserUpload'
    plant = Column(String, nullable=False) # e.g. 'Pune_Pilot'
    asset_tag = Column(String, nullable=True) # e.g. 'P-101'
    doc_type = Column(String, nullable=False) # e.g. 'SOP', 'WorkOrder'
    version = Column(Integer, default=1)
    
    # Hash for deduplication
    content_hash = Column(String, nullable=False, unique=True)
    
    # State tracking
    state = Column(Enum(DocumentState), default=DocumentState.uploaded)
    
    # Paths
    storage_path = Column(String, nullable=True) # Path in MinIO/S3
    
    # Metrics/Metadata
    extracted_text_length = Column(Integer, default=0)
    page_count = Column(Integer, default=0)
    error_message = Column(String, nullable=True)
    
    ingested_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Optional: store page-level metadata if needed in the relational DB, 
    # though usually this goes to document store/Elasticsearch later.
    parsed_metadata = Column(JSON, nullable=True)
