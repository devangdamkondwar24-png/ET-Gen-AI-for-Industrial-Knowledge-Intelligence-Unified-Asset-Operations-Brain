"""
Agent API Router — Phase 3
Exposes endpoints for the RCA and Compliance LangGraph agents.
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional

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
    return result


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
    return result


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
