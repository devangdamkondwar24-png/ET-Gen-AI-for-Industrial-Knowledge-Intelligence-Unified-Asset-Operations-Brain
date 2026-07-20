"""
Assets API Router
List and retrieve equipment assets from the Neo4j knowledge graph.
"""
import logging
from fastapi import APIRouter, HTTPException

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/assets", tags=["assets"])


@router.get("")
def list_assets():
    """
    Return all Equipment nodes from Neo4j with summary info.
    """
    try:
        from graph.neo4j_client import get_neo4j_client
        client = get_neo4j_client()
        with client.driver.session() as session:
            result = session.run("""
                MATCH (e:Equipment)
                OPTIONAL MATCH (e)-[:HAS_FAILURE]->(f:FailureMode)
                OPTIONAL MATCH (e)-[:REPAIRED_BY]->(w:WorkOrder)
                OPTIONAL MATCH (e)-[:LINKED_TO]->(inc:Incident)
                RETURN e,
                    count(DISTINCT f) AS failure_count,
                    count(DISTINCT w) AS work_order_count,
                    count(DISTINCT inc) AS incident_count
                ORDER BY e.asset_id
            """)
            assets = []
            for row in result:
                eq = dict(row["e"])
                eq["failure_count"] = row["failure_count"]
                eq["work_order_count"] = row["work_order_count"]
                eq["incident_count"] = row["incident_count"]
                assets.append(eq)

        return {"assets": assets, "total": len(assets)}

    except Exception as e:
        logger.error(f"[Assets] Failed to list assets: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to load assets: {e}")


@router.get("/{asset_id}")
def get_asset_detail(asset_id: str):
    """
    Return full context for a single asset — equipment info, failures,
    work orders, inspections, incidents.
    """
    try:
        from graph.neo4j_client import get_neo4j_client
        client = get_neo4j_client()
        context = client.get_asset_context(asset_id)
        if not context:
            raise HTTPException(status_code=404, detail=f"Asset '{asset_id}' not found")
        return context

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[Assets] Failed to get asset detail: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to load asset: {e}")
