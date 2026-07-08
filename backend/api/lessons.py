from fastapi import APIRouter
from pydantic import BaseModel
from typing import List
import os

from okf.index_manager import IndexManager
from okf.reader import read_concept_file

router = APIRouter()

class Lesson(BaseModel):
    id: str
    title: str
    description: str
    path: str

@router.get("/", response_model=List[Lesson])
async def get_lessons():
    knowledge_dir = os.path.join(os.path.dirname(__file__), "..", "knowledge")
    im = IndexManager(knowledge_dir)
    
    # Retrieve incident files
    results = im.search("incident", limit=10)
    
    items = []
    for path, score in results:
        concept = read_concept_file(knowledge_dir, path)
        if concept and concept.frontmatter.type.value == "incident":
            items.append(Lesson(
                id=concept.frontmatter.model_dump().get("incident_id", "Unknown"),
                title=concept.frontmatter.title,
                description=concept.frontmatter.description,
                path=path
            ))
            
    return items
