"""
Agent API Router — Phase 3
Exposes endpoints for the RCA and Compliance LangGraph agents.
"""
import logging
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional

logger = logging.getLogger(__name__)

from agents.rca_agent import run_rca
from agents.compliance_agent import run_compliance_check
from agents.lessons_learned_job import run_lessons_learned_pipeline, get_all_insights

router = APIRouter(prefix="/api/agents", tags=["agents"])


# ── RCA ──────────────────────────────────────────────────────

class RCARequest(BaseModel):
    query: str
    asset_id: str

@router.post("/rca")
def rca_endpoint(req: RCARequest):
    """
    Run a Root Cause Analysis agent for a given failure question and asset.
    Returns ranked hypotheses with citations and recommended actions.
    """
    result = run_rca(req.query, req.asset_id)
    if result["status"] == "error":
        raise HTTPException(status_code=422, detail=result["message"])

    # Transform backend result to match frontend RCAResponse interface
    rca_data = result.get("rca", {})
    source_chunks = result.get("source_chunks", [])
    raw_hypotheses = rca_data.get("hypotheses", [])

    hypotheses = []
    for i, h in enumerate(raw_hypotheses):
        conf_label = h.get("confidence", "LOW").upper()
        if conf_label not in ("HIGH", "MEDIUM", "LOW"):
            conf_label = "MEDIUM"
        conf_pct = {"HIGH": 85, "MEDIUM": 60, "LOW": 30}.get(conf_label, 50)

        # Build citations from source_chunks
        citations = []
        for cite_ref in h.get("citations", []):
            parts = str(cite_ref).split(":")
            doc_id = parts[0] if parts else cite_ref
            page = int(parts[1]) if len(parts) > 1 and parts[1].isdigit() else 1
            # Find matching source chunk for score
            score = 0.0
            text_preview = ""
            for sc in source_chunks:
                if sc.get("doc_id") == doc_id:
                    score = sc.get("score", 0.0)
                    break
            citations.append({
                "doc_id": doc_id,
                "page": page,
                "score": score,
                "text_preview": text_preview,
            })

        hypotheses.append({
            "id": f"HYP-{i+1:03d}",
            "title": h.get("hypothesis", f"Hypothesis {i+1}"),
            "description": "; ".join(h.get("evidence", [])),
            "confidence": conf_pct,
            "confidence_label": conf_label,
            "citations": citations,
        })

    return {
        "asset_id": result.get("asset_id", req.asset_id),
        "query": result.get("query", req.query),
        "hypotheses": hypotheses,
        "graph_context": rca_data,
    }


# ── Compliance ───────────────────────────────────────────────

class ComplianceRequest(BaseModel):
    regulation_ids: List[str]
    plant_filter: Optional[str] = None

@router.post("/compliance")
def compliance_endpoint(req: ComplianceRequest):
    """
    Run a compliance gap analysis for a set of regulations.
    Returns per-regulation status, severity, and recommended actions.
    """
    result = run_compliance_check(req.regulation_ids, req.plant_filter)
    if result["status"] == "error":
        raise HTTPException(status_code=422, detail=result["message"])

    # Transform backend result to match frontend ComplianceResponse interface
    raw_gaps = result.get("gaps", [])
    gap_analysis = []
    for g in raw_gaps:
        status = g.get("status", "MISSING").upper()
        if status not in ("COMPLIANT", "GAP", "MISSING"):
            status = "GAP" if status == "UNKNOWN" else status
        severity = g.get("severity", "MEDIUM").upper()
        if severity not in ("LOW", "MEDIUM", "HIGH", "CRITICAL"):
            severity = "MEDIUM"

        evidence_docs = g.get("evidence_doc_ids", [])
        evidence_doc = evidence_docs[0] if evidence_docs else None

        gap_analysis.append({
            "regulation_id": g.get("regulation_id", ""),
            "clause": g.get("regulation_title", ""),
            "requirement": g.get("requirement_summary", g.get("gap_description", "")),
            "status": status,
            "evidence_doc": evidence_doc,
            "severity": severity,
            "recommended_action": g.get("recommended_action", "Review required"),
        })

    return {
        "plant_filter": req.plant_filter,
        "total_gaps": sum(1 for g in gap_analysis if g["status"] != "COMPLIANT"),
        "gap_analysis": gap_analysis,
    }


# ── Lessons Learned ──────────────────────────────────────────

class LessonsRequest(BaseModel):
    asset_type: Optional[str] = None

@router.post("/lessons-learned/run")
def run_lessons_endpoint(req: LessonsRequest = LessonsRequest()):
    """
    Trigger the lessons-learned batch pipeline manually.
    Scans recurring failures and writes insights to the graph.
    """
    result = run_lessons_learned_pipeline(req.asset_type)
    return result

@router.get("/lessons-learned/insights")
def get_insights_endpoint():
    """
    Retrieve all LessonsLearnedInsight nodes from Neo4j for the alerts dashboard.
    """
    return {"insights": get_all_insights()}
