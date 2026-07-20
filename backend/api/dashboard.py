"""
Dashboard API Router
Returns real-time system health, document counts, and asset counts.
"""
import os
import logging
import httpx
from fastapi import APIRouter

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])

ES_URL = os.environ.get("ELASTICSEARCH_URL", "http://localhost:9200")
ES_INDEX = "etgen_documents_v2"
OLLAMA_URL = os.environ.get("OLLAMA_URL", "http://localhost:11434")
NEO4J_URI = os.environ.get("NEO4J_URI", "bolt://localhost:7687")


async def _check_service(name: str, url: str, timeout: float = 3.0) -> dict:
    """Ping a service and return status."""
    try:
        async with httpx.AsyncClient(timeout=timeout) as client:
            resp = await client.get(url)
            return {"name": name, "status": "up", "code": resp.status_code}
    except Exception as e:
        logger.warning(f"[Dashboard] {name} health check failed: {e}")
        return {"name": name, "status": "down", "error": str(e)}


async def _get_es_doc_count() -> int:
    """Get total document count from Elasticsearch."""
    try:
        async with httpx.AsyncClient(timeout=5) as client:
            resp = await client.get(f"{ES_URL}/{ES_INDEX}/_count")
            if resp.status_code == 200:
                return resp.json().get("count", 0)
    except Exception:
        pass
    return 0


def _get_neo4j_counts() -> dict:
    """Get node counts from Neo4j."""
    try:
        from graph.neo4j_client import get_neo4j_client
        client = get_neo4j_client()
        counts = {}
        for label in ["Equipment", "FailureMode", "WorkOrder", "Incident", "NonConformance"]:
            with client.driver.session() as session:
                result = session.run(f"MATCH (n:{label}) RETURN count(n) AS cnt")
                row = result.single()
                counts[label.lower()] = row["cnt"] if row else 0
        return counts
    except Exception as e:
        logger.warning(f"[Dashboard] Neo4j count query failed: {e}")
        return {}


def _get_open_work_orders() -> list:
    """Get recent open work orders from Neo4j."""
    try:
        from graph.neo4j_client import get_neo4j_client
        client = get_neo4j_client()
        with client.driver.session() as session:
            result = session.run("""
                MATCH (e:Equipment)-[:REPAIRED_BY]->(w:WorkOrder)
                WHERE w.status <> 'Closed'
                RETURN w.wo_id AS wo_id, w.title AS title, w.priority AS priority,
                       w.status AS status, e.asset_id AS asset_id
                ORDER BY w.created_date DESC LIMIT 10
            """)
            return [dict(row) for row in result]
    except Exception as e:
        logger.warning(f"[Dashboard] Open WO query failed: {e}")
        return []


def _get_critical_alerts() -> list:
    """Get critical failure modes and incidents from Neo4j."""
    try:
        from graph.neo4j_client import get_neo4j_client
        client = get_neo4j_client()
        with client.driver.session() as session:
            result = session.run("""
                MATCH (e:Equipment)-[:HAS_FAILURE]->(f:FailureMode)
                WHERE f.severity IN ['Critical', 'Major']
                RETURN e.asset_id AS asset_id, f.name AS failure,
                       f.severity AS severity, f.failure_id AS failure_id
                LIMIT 10
            """)
            return [dict(row) for row in result]
    except Exception as e:
        logger.warning(f"[Dashboard] Critical alerts query failed: {e}")
        return []


@router.get("/summary")
async def dashboard_summary():
    """
    Returns real system health and aggregate data for the dashboard.
    """
    # Check services in parallel
    services = []
    for name, url in [
        ("Elasticsearch", f"{ES_URL}/_cluster/health"),
        ("Ollama", f"{OLLAMA_URL}/api/tags"),
    ]:
        svc = await _check_service(name, url)
        services.append(svc)

    # Neo4j health check (sync driver, so we check differently)
    try:
        from graph.neo4j_client import get_neo4j_client
        client = get_neo4j_client()
        client.driver.verify_connectivity()
        services.append({"name": "Neo4j", "status": "up"})
    except Exception as e:
        services.append({"name": "Neo4j", "status": "down", "error": str(e)})

    # Aggregate counts
    doc_count = await _get_es_doc_count()
    neo4j_counts = _get_neo4j_counts()
    critical_alerts = _get_critical_alerts()
    open_wos = _get_open_work_orders()

    # Compute health index
    total_services = len(services)
    up_services = sum(1 for s in services if s["status"] == "up")
    system_health_pct = round((up_services / total_services) * 100, 1) if total_services > 0 else 0

    return {
        "system_health_pct": system_health_pct,
        "services": services,
        "document_count": doc_count,
        "neo4j_counts": neo4j_counts,
        "equipment_count": neo4j_counts.get("equipment", 0),
        "failure_count": neo4j_counts.get("failuremode", 0),
        "incident_count": neo4j_counts.get("incident", 0),
        "open_work_order_count": neo4j_counts.get("workorder", 0),
        "non_conformance_count": neo4j_counts.get("nonconformance", 0),
        "critical_alerts": critical_alerts,
        "pending_maintenance": open_wos,
    }
