"""
Retrieval Agent — Implements agentic retrieval via keyword search and link following.
No vector embeddings are used.
"""
import os
from typing import List, Dict, Any, Tuple
from okf.index_manager import IndexManager
from okf.reader import read_concept_file
from .confidence import calculate_confidence


def retrieve_context(knowledge_dir: str, query: str, limit: int = 5) -> Tuple[List[Dict[str, Any]], str]:
    """
    Agentic retrieval process:
    1. FTS5 Keyword Search
    2. Read index.md for orientation (skipped if search yields good results)
    3. Follow markdown links up to 1 hop to gather context.
    
    Returns:
        (context_files, follow_up_context)
    """
    im = IndexManager(knowledge_dir)
    
    # 1. Keyword search
    search_results = im.search(query, limit=limit)
    
    context_files = []
    seen_paths = set()
    link_following_context = []
    
    for rel_path, score in search_results:
        if rel_path in seen_paths:
            continue
            
        concept = read_concept_file(knowledge_dir, rel_path)
        if not concept:
            continue
            
        seen_paths.add(rel_path)
        context_files.append({
            "path": rel_path,
            "title": concept.frontmatter.title,
            "body": concept.body,
            "rank_score": score
        })
        
        # 3. Follow links (1 hop)
        for link in concept.outgoing_links:
            if not link.resolved:
                continue
                
            # Resolve relative link
            source_dir = os.path.dirname(rel_path)
            linked_path = os.path.normpath(os.path.join(source_dir, link.target)).replace("\\", "/")
            
            if linked_path in seen_paths:
                continue
                
            # Only pull in linked files if they seem somewhat relevant (to save LLM context window)
            # In a full system, we might use the LLM to decide which links to follow.
            # Here, we'll just grab the first few resolved links.
            if len(seen_paths) >= limit + 3:
                break
                
            linked_concept = read_concept_file(knowledge_dir, linked_path)
            if linked_concept:
                seen_paths.add(linked_path)
                context_files.append({
                    "path": linked_path,
                    "title": linked_concept.frontmatter.title,
                    "body": linked_concept.body[:1500], # truncate linked context
                    "rank_score": 0.0 # came from a link, not a direct match
                })
                link_following_context.append(f"Followed link from {concept.filename} to {linked_concept.filename}")

    # Optionally grab index.md if we got very few hits
    if len(context_files) < 2:
        for folder in ["equipment", "procedures", "workorders", "incidents", "inspections", "regulations"]:
            idx_path = f"{folder}/index.md"
            if os.path.exists(os.path.join(knowledge_dir, idx_path)):
                with open(os.path.join(knowledge_dir, idx_path), "r", encoding="utf-8") as f:
                    idx_text = f.read()
                    if query.lower() in idx_text.lower():
                        link_following_context.append(f"Found mention in {idx_path}")

    follow_up_str = "\n".join(link_following_context)
    return context_files, follow_up_str
