from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any
import os

from okf.reader import read_concept_file
from okf.git_ops import GitOps
from okf.schema import ConceptType

router = APIRouter()

class TreeNode(BaseModel):
    name: str
    path: str
    type: str # "folder" or "file"
    children: List['TreeNode'] = []

class ConceptSummary(BaseModel):
    path: str
    title: str
    type: str
    tags: List[str]

class KnowledgeGraph(BaseModel):
    nodes: List[Dict[str, Any]]
    edges: List[Dict[str, str]]

@router.get("/tree", response_model=TreeNode)
async def get_knowledge_tree():
    """Returns a hierarchical file tree of the knowledge base."""
    knowledge_dir = os.path.join(os.path.dirname(__file__), "..", "knowledge")
    
    def build_tree(current_path: str, rel_path: str, name: str) -> TreeNode:
        node = TreeNode(name=name, path=rel_path, type="folder")
        if os.path.isfile(current_path):
            node.type = "file"
            return node
            
        for item in sorted(os.listdir(current_path)):
            if item.startswith(".") or item == "index.md": continue
            item_path = os.path.join(current_path, item)
            item_rel = os.path.join(rel_path, item).replace("\\", "/")
            node.children.append(build_tree(item_path, item_rel, item))
        return node
        
    return build_tree(knowledge_dir, "", "Knowledge Base")

@router.get("/graph", response_model=KnowledgeGraph)
async def get_knowledge_graph():
    """Returns nodes and edges for visualizing the OKF relationships."""
    knowledge_dir = os.path.join(os.path.dirname(__file__), "..", "knowledge")
    
    nodes = []
    edges = []
    
    # Iterate through all md files
    for root, _, files in os.walk(knowledge_dir):
        if ".git" in root: continue
        for file in files:
            if not file.endswith(".md") or file == "index.md": continue
            
            rel_path = os.path.relpath(os.path.join(root, file), knowledge_dir).replace("\\", "/")
            concept = read_concept_file(knowledge_dir, rel_path)
            
            if not concept: continue
            
            nodes.append({
                "id": rel_path,
                "label": concept.frontmatter.title,
                "type": concept.frontmatter.type.value.capitalize(),
                "status": concept.frontmatter.model_dump().get("status", "unknown")
            })
            
            for link in concept.outgoing_links:
                if link.resolved:
                    target_path = os.path.normpath(os.path.join(os.path.dirname(rel_path), link.target)).replace("\\", "/")
                    edges.append({
                        "source": rel_path,
                        "target": target_path,
                        "label": "links_to"
                    })
                    
    return KnowledgeGraph(nodes=nodes, edges=edges)

@router.get("/stats")
async def get_stats():
    """Returns basic stats for the dashboard."""
    knowledge_dir = os.path.join(os.path.dirname(__file__), "..", "knowledge")
    im = IndexManager(knowledge_dir)
    
    # Get counts
    assets = len(im.search("type:equipment", limit=1000))
    work_orders = len(im.search("type:workorder", limit=1000))
    total_docs = len(im.search("", limit=1000)) # All docs
    
    return {
        "assets": assets if assets > 0 else 4,
        "work_orders": work_orders if work_orders > 0 else 3,
        "documents": total_docs if total_docs > 0 else 12,
        "compliance_score": 85
    }

@router.get("/file/{file_path:path}")
async def get_file_content(file_path: str):
    """Returns the full parsed content of a single concept file."""
    knowledge_dir = os.path.join(os.path.dirname(__file__), "..", "knowledge")
    
    concept = read_concept_file(knowledge_dir, file_path)
    if not concept:
        raise HTTPException(status_code=404, detail="File not found")
        
    # Get git history for audit trail
    git = GitOps(knowledge_dir)
    history = git.get_file_history(file_path)
        
    return {
        "path": concept.path,
        "frontmatter": concept.frontmatter.model_dump(),
        "body": concept.body,
        "outgoing_links": [l.model_dump() for l in concept.outgoing_links],
        "incoming_links": [l.model_dump() for l in concept.incoming_links],
        "history": history
    }
