from fastapi import APIRouter, HTTPException
import os
from pydantic import BaseModel
from typing import List, Optional

from retrieval.agent import retrieve_context
from retrieval.confidence import calculate_confidence
from llm.client import LLMClient
from okf.reader import read_concept_file

router = APIRouter()

class ChatRequest(BaseModel):
    query: str

class Source(BaseModel):
    doc_id: str
    doc_name: str
    snippet: str

class ChatResponse(BaseModel):
    answer: str
    confidence: float
    confidence_label: str
    sources: List[Source]

@router.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    knowledge_dir = os.path.join(os.path.dirname(__file__), "..", "knowledge")
    
    # 1. Agentic Retrieval
    context_files, follow_up_str = retrieve_context(knowledge_dir, request.query)
    
    # 2. Confidence Scoring
    confidence_score, conf_label = calculate_confidence(context_files)
    
    # 3. LLM Answer Generation
    llm = LLMClient()
    answer_result = llm.generate_answer(request.query, context_files, follow_up_str)
    
    # 4. Format Sources
    sources = []
    used_paths = answer_result.get("sources_used", [])
    
    for cf in context_files:
        if cf["path"] in used_paths:
            sources.append(Source(
                doc_id=cf["path"],
                doc_name=cf.get("title", cf["path"]),
                snippet=cf.get("body", "")[:100] + "..."
            ))
            
    return ChatResponse(
        answer=answer_result.get("answer", "Error generating answer."),
        confidence=confidence_score,
        confidence_label=conf_label,
        sources=sources
    )

@router.get("/sources/{file_path:path}")
async def get_source_file(file_path: str):
    """Return raw markdown content of a source file for the UI to display."""
    knowledge_dir = os.path.join(os.path.dirname(__file__), "..", "knowledge")
    
    concept = read_concept_file(knowledge_dir, file_path)
    if not concept:
        raise HTTPException(status_code=404, detail="Source file not found")
        
    return {
        "path": concept.path,
        "title": concept.frontmatter.title,
        "content": f"---\n{concept.frontmatter.model_dump_json()}\n---\n\n{concept.body}"
    }
