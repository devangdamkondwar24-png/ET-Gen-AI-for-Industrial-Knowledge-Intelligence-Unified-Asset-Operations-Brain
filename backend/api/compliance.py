from fastapi import APIRouter
from pydantic import BaseModel
from typing import List
import os

from okf.index_manager import IndexManager
from okf.reader import read_concept_file

router = APIRouter()

class ComplianceItem(BaseModel):
    id: str
    title: str
    status: str
    path: str

class ComplianceResponse(BaseModel):
    score: int
    items: List[ComplianceItem]

@router.get("/", response_model=ComplianceResponse)
async def get_compliance_status():
    knowledge_dir = os.path.join(os.path.dirname(__file__), "..", "knowledge")
    im = IndexManager(knowledge_dir)
    
    # Retrieve regulation files
    results = im.search("regulation", limit=10)
    
    items = []
    for path, score in results:
        concept = read_concept_file(knowledge_dir, path)
        if concept and concept.frontmatter.type.value == "regulation":
            items.append(ComplianceItem(
                id=concept.frontmatter.model_dump().get("regulation_id", "Unknown"),
                title=concept.frontmatter.title,
                status="Compliant",
                path=path
            ))
            
    # Mocking non-compliant for demonstration
    if len(items) > 0:
        items[0].status = "Review Required"
        
    return ComplianceResponse(
        score=85,
        items=items
    )
