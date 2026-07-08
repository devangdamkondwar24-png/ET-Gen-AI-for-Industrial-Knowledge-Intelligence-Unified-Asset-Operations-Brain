"""
Ingestion Pipeline — Orchestrates the full document ingestion process.
Runs asynchronously and maintains job state in an in-memory dictionary.
"""
from __future__ import annotations
import os
import uuid
import threading
from typing import Dict, Any, List
from datetime import datetime

from .extractor import extract_text
from llm.client import LLMClient
from okf.schema import ConceptType, ConceptFrontmatter
from okf.writer import write_concept_file
from okf.linker import find_linkable_concepts, cross_link_concepts
from okf.index_manager import IndexManager
from okf.git_ops import GitOps
from okf.reader import read_concept_file


# In-memory job tracking. Note: This will not survive a server restart!
# For a production system, this would be backed by Redis or a database.
_JOB_STORE: Dict[str, Dict[str, Any]] = {}


def start_ingestion_job(file_path: str, filename: str, mime_type: str, knowledge_dir: str) -> str:
    """Start an async ingestion job and return its ID."""
    job_id = str(uuid.uuid4())
    _JOB_STORE[job_id] = {
        "status": "processing",
        "progress": 0,
        "message": "Initializing...",
        "filename": filename,
        "nodes": [],
        "edges": [],
        "created_at": datetime.now().isoformat()
    }

    # Start background thread
    thread = threading.Thread(
        target=_run_pipeline,
        args=(job_id, file_path, filename, mime_type, knowledge_dir)
    )
    thread.daemon = True
    thread.start()

    return job_id


def get_job_status(job_id: str) -> Dict[str, Any]:
    """Get the current status of an ingestion job."""
    return _JOB_STORE.get(job_id, {"status": "not_found", "message": "Job not found"})


def get_recent_jobs() -> List[Dict[str, Any]]:
    """Get list of recent ingestion jobs."""
    jobs = [{"id": k, **v} for k, v in _JOB_STORE.items()]
    jobs.sort(key=lambda x: x["created_at"], reverse=True)
    return jobs[:10]


def _update_job(job_id: str, progress: int, message: str, **kwargs):
    if job_id in _JOB_STORE:
        _JOB_STORE[job_id].update({
            "progress": progress,
            "message": message,
            **kwargs
        })


def _sanitize_filename(name: str) -> str:
    import re
    name = name.lower()
    name = re.sub(r'[^a-z0-9\-]', '-', name)
    name = re.sub(r'-+', '-', name)
    return name.strip('-')


def _run_pipeline(job_id: str, file_path: str, filename: str, mime_type: str, knowledge_dir: str):
    """The main ingestion orchestrator logic."""
    try:
        # 1. Extraction
        _update_job(job_id, 10, "Extracting text from document...")
        text, warnings = extract_text(file_path, mime_type)
        
        if not text:
            # Complete failure
            _update_job(job_id, 100, f"Extraction failed. {warnings[0] if warnings else 'Unknown error'}", status="error")
            return
            
        # 2. LLM Extraction
        _update_job(job_id, 30, "Extracting entities via LLM...")
        llm = LLMClient()
        extraction_result = llm.extract_entities(text, filename)
        concepts_data = extraction_result.get("concepts", [])
        
        if not concepts_data:
            _update_job(job_id, 100, "No entities found in document.", status="complete")
            return

        # 3. Create OKF Files
        _update_job(job_id, 50, "Creating OKF concept files...")
        created_files = []
        nodes = []
        
        for idx, c_data in enumerate(concepts_data):
            c_type = c_data.get("type", "equipment").lower()
            if c_type == "work order": c_type = "workorder"
            
            try:
                ctype_enum = ConceptType(c_type)
            except ValueError:
                ctype_enum = ConceptType.EQUIPMENT
            
            # Generate a filename
            title = c_data.get("title", f"Extracted from {filename}")
            if ctype_enum == ConceptType.EQUIPMENT and c_data.get("equipment_tag"):
                base_name = c_data["equipment_tag"]
            elif ctype_enum == ConceptType.WORKORDER and c_data.get("workorder_id"):
                base_name = c_data["workorder_id"]
            else:
                base_name = title
                
            safe_name = _sanitize_filename(base_name)
            rel_path = f"{ctype_enum.value}s/{safe_name}.md"
            
            # Ensure unique filename
            counter = 1
            orig_rel_path = rel_path
            while os.path.exists(os.path.join(knowledge_dir, rel_path)):
                rel_path = orig_rel_path.replace(".md", f"-{counter}.md")
                counter += 1
            
            # Build frontmatter
            fm_data = {
                "type": ctype_enum,
                "title": title,
                "description": c_data.get("description", ""),
                "tags": c_data.get("tags", []),
                "equipment_tag": c_data.get("equipment_tag"),
            }
            
            # Add warnings if extraction was problematic
            if warnings:
                fm_data["status"] = "needs_review"
                
            fm = ConceptFrontmatter(**fm_data)
            
            body = c_data.get("body", text[:1000])
            if warnings:
                body = f"> **Extraction Warnings**:\n> " + "\n> ".join(warnings) + "\n\n" + body
                
            # Write file
            write_concept_file(knowledge_dir, rel_path, fm, body, log_message=f"Ingested from {filename}")
            created_files.append(rel_path)
            
            nodes.append({
                "id": rel_path,
                "label": title,
                "type": ctype_enum.value.capitalize()
            })
            
        # 4. Cross-linking
        _update_job(job_id, 70, "Resolving cross-links...")
        edges = []
        
        for rel_path in created_files:
            concept = read_concept_file(knowledge_dir, rel_path)
            if not concept:
                continue
                
            # Use linker to find candidates
            candidates = find_linkable_concepts(knowledge_dir, concept)
            
            # We can optionally use the LLM to refine the candidates here if there are many.
            # But for prototype scaling, we'll just link all keyword matches up to a limit.
            top_candidates = candidates[:5]
            
            if top_candidates:
                links_added = cross_link_concepts(knowledge_dir, rel_path, top_candidates)
                for src, tgt in links_added:
                    if src == rel_path:
                        edges.append({
                            "source": src,
                            "target": tgt,
                            "label": "RELATES_TO"
                        })
        
        # 5. Git Commit & Index Update
        _update_job(job_id, 90, "Updating index and audit trail...")
        
        git = GitOps(knowledge_dir)
        git.add_and_commit(f"Ingested {len(created_files)} concepts from {filename}")
        
        im = IndexManager(knowledge_dir)
        for cf in created_files:
            im.index_file(cf)
            
        _update_job(job_id, 100, f"Successfully processed {filename}", status="complete", nodes=nodes, edges=edges)
        
    except Exception as e:
        import traceback
        err = traceback.format_exc()
        print(f"Pipeline error: {err}")
        _update_job(job_id, 100, f"Internal pipeline error: {str(e)}", status="error")
    finally:
        # Cleanup uploaded file
        if os.path.exists(file_path):
            try:
                os.remove(file_path)
            except:
                pass
