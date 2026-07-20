"""
Reports API Router
Aggregates past analysis insights and provides report metadata.
"""
import logging
from fastapi import APIRouter, HTTPException

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/reports", tags=["reports"])


@router.get("")
def list_reports():
    """
    Return available report types and any stored insights from the knowledge graph.
    """
    # Static report type definitions
    report_types = [
        {
            "id": "rca",
            "title": "Root Cause Analysis",
            "description": "Run failure analysis on specific assets using knowledge graph + document evidence.",
            "icon": "analytics",
            "route": "/rca",
        },
        {
            "id": "compliance",
            "title": "Regulatory Compliance Audit",
            "description": "Check plant compliance against ISO, OSHA, and other regulatory standards.",
            "icon": "fact_check",
            "route": "/compliance",
        },
        {
            "id": "lessons",
            "title": "Lessons Learned",
            "description": "Pattern intelligence from recurring failures across asset types.",
            "icon": "school",
            "route": "/lessons",
        },
    ]

    # Pull any stored insights from Neo4j
    insights = []
    try:
        from graph.neo4j_client import get_neo4j_client
        client = get_neo4j_client()
        with client.driver.session() as session:
            # Lessons learned insights
            result = session.run("""
                MATCH (l:LessonsLearnedInsight)
                RETURN l
                ORDER BY l.created_at DESC
                LIMIT 20
            """)
            for row in result:
                insights.append(dict(row["l"]))
    except Exception as e:
        logger.warning(f"[Reports] Could not load insights: {e}")

    # Pull recent non-conformances as compliance history
    compliance_history = []
    try:
        from graph.neo4j_client import get_neo4j_client
        client = get_neo4j_client()
        with client.driver.session() as session:
            result = session.run("""
                MATCH (nc:NonConformance)
                OPTIONAL MATCH (nc)-[:VIOLATES]->(r:Regulation)
                RETURN nc.nc_id AS nc_id, nc.description AS description,
                       nc.status AS status, r.regulation_id AS regulation_id,
                       r.title AS regulation_title
                ORDER BY nc.nc_id DESC
                LIMIT 10
            """)
            for row in result:
                compliance_history.append(dict(row))
    except Exception as e:
        logger.warning(f"[Reports] Could not load compliance history: {e}")

    return {
        "report_types": report_types,
        "insights": insights,
        "compliance_history": compliance_history,
    }
