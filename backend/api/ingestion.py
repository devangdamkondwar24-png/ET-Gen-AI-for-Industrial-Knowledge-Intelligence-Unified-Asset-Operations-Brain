from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from pydantic import BaseModel
import os

from ingestion.pipeline import IngestionPipeline

router = APIRouter()
pipeline = IngestionPipeline()

class IngestionResult(BaseModel):
    status: str
    doc_id: str = None
    state: str = None
    text_length: int = 0
    pages: int = 0
    error: str = None
    reason: str = None

@router.post("/upload", response_model=IngestionResult)
async def upload_document(
    file: UploadFile = File(...),
    source_system: str = Form("UserUpload"),
    plant: str = Form("Pune_Pilot"),
    asset_tag: str = Form(None),
    doc_type: str = Form("Unknown")
):
    try:
        # Read file bytes into memory (for MVP, careful with massive files)
        file_bytes = await file.read()
        
        metadata = {
            "source_system": source_system,
            "plant": plant,
            "asset_tag": asset_tag,
            "doc_type": doc_type
        }
        
        # Process synchronously for testing (will be moved to Celery/Airflow in Phase 5)
        result = pipeline.process_document(file_bytes, file.filename, metadata)
        return result
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
