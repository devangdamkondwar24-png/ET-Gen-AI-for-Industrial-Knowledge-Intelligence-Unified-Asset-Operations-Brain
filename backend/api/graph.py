"""
Graph API Router — Phase 3
Exposes Neo4j asset context for the frontend Asset Viewer.
"""
from fastapi import APIRouter, HTTPException
from graph.neo4j_client import get_neo4j_client

router = APIRouter(prefix="/api/graph", tags=["graph"])


@router.get("/asset/{asset_id}")
def get_asset_context(asset_id: str):
    """
    Fetch full knowledge graph context for an asset:
    failures, causes, actions, work orders, inspections, and incidents.
    """
    try:
        client = get_neo4j_client()
        context = client.get_asset_context(asset_id)
        if not context:
            raise HTTPException(status_code=404, detail=f"Asset '{asset_id}' not found in graph.")
        return context
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/compliance/gaps/{regulation_id}")
def get_compliance_gaps(regulation_id: str):
    """Fetch all non-conformances for a regulation from the graph."""
    try:
        client = get_neo4j_client()
        gaps = client.get_compliance_gaps(regulation_id)
        return {"regulation_id": regulation_id, "gaps": gaps}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
