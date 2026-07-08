from fastapi import APIRouter, UploadFile, File, HTTPException, BackgroundTasks
import os
import shutil
from pydantic import BaseModel
from typing import List, Dict, Any, Optional

from ingestion.pipeline import start_ingestion_job, get_job_status, get_recent_jobs

router = APIRouter()

class Node(BaseModel):
    id: str
    label: str
    type: str

class Edge(BaseModel):
    source: str
    target: str
    label: str

class IngestionResponse(BaseModel):
    job_id: str
    message: str

class JobStatusResponse(BaseModel):
    status: str
    progress: int
    message: str
    filename: str
    nodes: Optional[List[Node]] = []
    edges: Optional[List[Edge]] = []

@router.post("/upload", response_model=IngestionResponse)
async def upload_file(file: UploadFile = File(...)):
    # Save uploaded file to temp dir
    temp_dir = os.path.join(os.path.dirname(__file__), "..", "temp_uploads")
    os.makedirs(temp_dir, exist_ok=True)
    
    file_path = os.path.join(temp_dir, file.filename)
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    knowledge_dir = os.path.join(os.path.dirname(__file__), "..", "knowledge")
        
    # Start async job
    job_id = start_ingestion_job(file_path, file.filename, file.content_type, knowledge_dir)
    
    return IngestionResponse(
        job_id=job_id,
        message="Upload received. Processing started."
    )

@router.get("/status/{job_id}", response_model=JobStatusResponse)
async def check_status(job_id: str):
    status = get_job_status(job_id)
    if status.get("status") == "not_found":
        raise HTTPException(status_code=404, detail="Job not found")
    return JobStatusResponse(**status)

@router.get("/recent")
async def recent_jobs():
    return get_recent_jobs()

