"""
Neo4j Client — Phase 3 Industrial Ontology
Defines the full industrial knowledge graph schema and Cypher query helpers.

Ontology Nodes:
    Equipment, FailureMode, Cause, Action, WorkOrder,
    InspectionFinding, Procedure, Regulation, Incident, NonConformance

Relationships:
    LOCATED_IN, PART_OF, HAS_FAILURE, CAUSED_BY, MITIGATED_BY,
    REPAIRED_BY, INSPECTED_BY, VIOLATES, REFERENCES, DERIVED_FROM,
    SUPPORTED_BY, LINKED_TO
"""
import os
import logging
from typing import Optional
from datetime import datetime
from pydantic import BaseModel, Field
from neo4j import GraphDatabase, exceptions as neo4j_exc

logger = logging.getLogger(__name__)

NEO4J_URI      = os.environ.get("NEO4J_URI",      "bolt://localhost:7687")
NEO4J_USER     = os.environ.get("NEO4J_USER",     "neo4j")
NEO4J_PASSWORD = os.environ.get("NEO4J_PASSWORD",  "industrialpassword")


# ───────────────────────────────────────────────
# Pydantic Ontology Models (validate before write)
# ───────────────────────────────────────────────

class EquipmentNode(BaseModel):
    asset_id: str
    name: str
    asset_type: str              # Pump, Valve, Compressor, Heat Exchanger, etc.
    plant: str
    location: Optional[str] = None
    manufacturer: Optional[str] = None
    install_date: Optional[str] = None
    criticality: Optional[str] = None  # High, Medium, Low

class FailureModeNode(BaseModel):
    failure_id: str
    name: str                    # Seal leak, Vibration, Overheating, Corrosion
    asset_id: str                # Parent equipment
    severity: Optional[str] = None   # Critical, Major, Minor
    first_observed: Optional[str] = None

class CauseNode(BaseModel):
    cause_id: str
    description: str
    category: str                # Mechanical, Electrical, Operational, Environmental
    failure_id: Optional[str] = None

class ActionNode(BaseModel):
    action_id: str
    description: str
    action_type: str             # Corrective, Preventive, Predictive
    assigned_to: Optional[str] = None
    due_date: Optional[str] = None
    status: Optional[str] = "Open"

class WorkOrderNode(BaseModel):
    wo_id: str
    title: str
    asset_id: str
    priority: Optional[str] = None  # P1–P4
    status: Optional[str] = "Open"
    created_date: Optional[str] = None
    closed_date: Optional[str] = None
    doc_id: Optional[str] = None   # Link back to source ES document

class InspectionFindingNode(BaseModel):
    finding_id: str
    asset_id: str
    description: str
    severity: Optional[str] = None
    inspector: Optional[str] = None
    inspection_date: Optional[str] = None
    doc_id: Optional[str] = None

class ProcedureNode(BaseModel):
    procedure_id: str
    title: str
    doc_type: str                # SOP, SWP, LOTO, PTW
    revision: Optional[str] = None
    effective_date: Optional[str] = None
    doc_id: Optional[str] = None

class RegulationNode(BaseModel):
    regulation_id: str
    title: str
    body: str                    # ISO, OSHA, ATEX, API
    clause: Optional[str] = None
    mandatory: bool = True

class IncidentNode(BaseModel):
    incident_id: str
    title: str
    asset_id: Optional[str] = None
    date: Optional[str] = None
    severity: Optional[str] = None   # Near Miss, Minor, Major, Fatality
    description: str
    doc_id: Optional[str] = None

class NonConformanceNode(BaseModel):
    nc_id: str
    description: str
    asset_id: Optional[str] = None
    regulation_id: Optional[str] = None
    status: Optional[str] = "Open"  # Open, Under Review, Closed
    doc_id: Optional[str] = None


# ───────────────────────────────────────────────
# Neo4j Client
# ───────────────────────────────────────────────

class Neo4jClient:
    def __init__(self):
        self.driver = GraphDatabase.driver(NEO4J_URI, auth=(NEO4J_USER, NEO4J_PASSWORD))
        self._ensure_constraints()
        logger.info("[Neo4j] Connected and constraints ensured.")

    def close(self):
        self.driver.close()

    def _run(self, query: str, params: dict = None):
        with self.driver.session() as session:
            return session.run(query, params or {})

    # ── Schema Constraints ──────────────────────
    def _ensure_constraints(self):
        constraints = [
            ("Equipment",         "asset_id"),
            ("FailureMode",       "failure_id"),
            ("Cause",             "cause_id"),
            ("Action",            "action_id"),
            ("WorkOrder",         "wo_id"),
            ("InspectionFinding", "finding_id"),
            ("Procedure",         "procedure_id"),
            ("Regulation",        "regulation_id"),
            ("Incident",          "incident_id"),
            ("NonConformance",    "nc_id"),
        ]
        for label, prop in constraints:
            try:
                self._run(
                    f"CREATE CONSTRAINT IF NOT EXISTS FOR (n:{label}) REQUIRE n.{prop} IS UNIQUE"
                )
            except Exception as e:
                logger.warning(f"[Neo4j] Constraint check for {label}.{prop}: {e}")

    # ── Node Upserts ────────────────────────────

    def upsert_equipment(self, node: EquipmentNode):
        self._run("""
            MERGE (e:Equipment {asset_id: $asset_id})
            SET e += {name: $name, asset_type: $asset_type, plant: $plant,
                      location: $location, manufacturer: $manufacturer,
                      install_date: $install_date, criticality: $criticality}
        """, node.model_dump())

    def upsert_failure_mode(self, node: FailureModeNode):
        self._run("""
            MERGE (f:FailureMode {failure_id: $failure_id})
            SET f += {name: $name, severity: $severity, first_observed: $first_observed}
            WITH f
            MATCH (e:Equipment {asset_id: $asset_id})
            MERGE (e)-[:HAS_FAILURE]->(f)
        """, node.model_dump())

    def upsert_cause(self, node: CauseNode):
        self._run("""
            MERGE (c:Cause {cause_id: $cause_id})
            SET c += {description: $description, category: $category}
            WITH c
            OPTIONAL MATCH (f:FailureMode {failure_id: $failure_id})
            FOREACH (_ IN CASE WHEN f IS NOT NULL THEN [1] ELSE [] END |
                MERGE (f)-[:CAUSED_BY]->(c))
        """, node.model_dump())

    def upsert_action(self, node: ActionNode):
        self._run("""
            MERGE (a:Action {action_id: $action_id})
            SET a += {description: $description, action_type: $action_type,
                      assigned_to: $assigned_to, due_date: $due_date, status: $status}
        """, node.model_dump())

    def upsert_work_order(self, node: WorkOrderNode):
        self._run("""
            MERGE (w:WorkOrder {wo_id: $wo_id})
            SET w += {title: $title, priority: $priority, status: $status,
                      created_date: $created_date, closed_date: $closed_date, doc_id: $doc_id}
            WITH w
            MATCH (e:Equipment {asset_id: $asset_id})
            MERGE (e)-[:REPAIRED_BY]->(w)
        """, node.model_dump())

    def upsert_inspection(self, node: InspectionFindingNode):
        self._run("""
            MERGE (i:InspectionFinding {finding_id: $finding_id})
            SET i += {description: $description, severity: $severity,
                      inspector: $inspector, inspection_date: $inspection_date, doc_id: $doc_id}
            WITH i
            MATCH (e:Equipment {asset_id: $asset_id})
            MERGE (e)-[:INSPECTED_BY]->(i)
        """, node.model_dump())

    def upsert_procedure(self, node: ProcedureNode):
        self._run("""
            MERGE (p:Procedure {procedure_id: $procedure_id})
            SET p += {title: $title, doc_type: $doc_type, revision: $revision,
                      effective_date: $effective_date, doc_id: $doc_id}
        """, node.model_dump())

    def upsert_regulation(self, node: RegulationNode):
        self._run("""
            MERGE (r:Regulation {regulation_id: $regulation_id})
            SET r += {title: $title, body: $body, clause: $clause, mandatory: $mandatory}
        """, node.model_dump())

    def upsert_incident(self, node: IncidentNode):
        self._run("""
            MERGE (i:Incident {incident_id: $incident_id})
            SET i += {title: $title, date: $date, severity: $severity,
                      description: $description, doc_id: $doc_id}
            WITH i
            OPTIONAL MATCH (e:Equipment {asset_id: $asset_id})
            FOREACH (_ IN CASE WHEN e IS NOT NULL THEN [1] ELSE [] END |
                MERGE (e)-[:LINKED_TO]->(i))
        """, node.model_dump())

    def upsert_non_conformance(self, node: NonConformanceNode):
        self._run("""
            MERGE (nc:NonConformance {nc_id: $nc_id})
            SET nc += {description: $description, status: $status, doc_id: $doc_id}
            WITH nc
            OPTIONAL MATCH (r:Regulation {regulation_id: $regulation_id})
            FOREACH (_ IN CASE WHEN r IS NOT NULL THEN [1] ELSE [] END |
                MERGE (nc)-[:VIOLATES]->(r))
            WITH nc
            OPTIONAL MATCH (e:Equipment {asset_id: $asset_id})
            FOREACH (_ IN CASE WHEN e IS NOT NULL THEN [1] ELSE [] END |
                MERGE (e)-[:LINKED_TO]->(nc))
        """, node.model_dump())

    # ── Relationship helpers ─────────────────────

    def link_action_to_failure(self, action_id: str, failure_id: str):
        self._run("""
            MATCH (a:Action {action_id: $action_id}), (f:FailureMode {failure_id: $failure_id})
            MERGE (f)-[:MITIGATED_BY]->(a)
        """, {"action_id": action_id, "failure_id": failure_id})

    def link_procedure_to_regulation(self, procedure_id: str, regulation_id: str):
        self._run("""
            MATCH (p:Procedure {procedure_id: $procedure_id}), (r:Regulation {regulation_id: $regulation_id})
            MERGE (p)-[:REFERENCES]->(r)
        """, {"procedure_id": procedure_id, "regulation_id": regulation_id})

    def set_equipment_location(self, asset_id: str, parent_asset_id: str, rel: str = "LOCATED_IN"):
        """E.g. LOCATED_IN a Plant, PART_OF a System."""
        self._run(f"""
            MATCH (child:Equipment {{asset_id: $child}}), (parent:Equipment {{asset_id: $parent}})
            MERGE (child)-[:{rel}]->(parent)
        """, {"child": asset_id, "parent": parent_asset_id})

    # ── Graph Query helpers ──────────────────────

    def get_asset_context(self, asset_id: str) -> dict:
        """
        Fetch full context for an asset: failures, work orders, inspections, incidents.
        Used by the RCA Agent.
        """
        with self.driver.session() as session:
            result = session.run("""
                MATCH (e:Equipment {asset_id: $asset_id})
                OPTIONAL MATCH (e)-[:HAS_FAILURE]->(f:FailureMode)
                OPTIONAL MATCH (f)-[:CAUSED_BY]->(c:Cause)
                OPTIONAL MATCH (f)-[:MITIGATED_BY]->(a:Action)
                OPTIONAL MATCH (e)-[:REPAIRED_BY]->(w:WorkOrder)
                OPTIONAL MATCH (e)-[:INSPECTED_BY]->(i:InspectionFinding)
                OPTIONAL MATCH (e)-[:LINKED_TO]->(inc:Incident)
                RETURN e,
                    collect(DISTINCT f) AS failures,
                    collect(DISTINCT c) AS causes,
                    collect(DISTINCT a) AS actions,
                    collect(DISTINCT w) AS work_orders,
                    collect(DISTINCT i) AS inspections,
                    collect(DISTINCT inc) AS incidents
            """, {"asset_id": asset_id})
            row = result.single()
            if not row:
                return {}
            return {
                "equipment": dict(row["e"]),
                "failures":    [dict(n) for n in row["failures"] if n],
                "causes":      [dict(n) for n in row["causes"] if n],
                "actions":     [dict(n) for n in row["actions"] if n],
                "work_orders": [dict(n) for n in row["work_orders"] if n],
                "inspections": [dict(n) for n in row["inspections"] if n],
                "incidents":   [dict(n) for n in row["incidents"] if n],
            }

    def get_compliance_gaps(self, regulation_id: str) -> list:
        """
        Find all NonConformance nodes that violate a regulation.
        """
        with self.driver.session() as session:
            result = session.run("""
                MATCH (nc:NonConformance)-[:VIOLATES]->(r:Regulation {regulation_id: $regulation_id})
                OPTIONAL MATCH (e:Equipment)-[:LINKED_TO]->(nc)
                RETURN nc, r, collect(e) AS equipment
            """, {"regulation_id": regulation_id})
            return [
                {
                    "non_conformance": dict(row["nc"]),
                    "regulation": dict(row["r"]),
                    "equipment": [dict(n) for n in row["equipment"] if n],
                }
                for row in result
            ]

    def get_recurring_incidents(self, asset_type: str = None, min_count: int = 2) -> list:
        """
        Find FailureModes that appear in multiple incidents — used by Lessons Learned job.
        """
        filter_clause = "WHERE e.asset_type = $asset_type" if asset_type else ""
        with self.driver.session() as session:
            result = session.run(f"""
                MATCH (e:Equipment)-[:HAS_FAILURE]->(f:FailureMode)
                {filter_clause}
                WITH f.name AS failure_name, collect(e.asset_id) AS affected_assets, count(*) AS occurrences
                WHERE occurrences >= $min_count
                RETURN failure_name, affected_assets, occurrences
                ORDER BY occurrences DESC
            """, {"asset_type": asset_type, "min_count": min_count})
            return [dict(row) for row in result]


# Singleton
_neo4j_client = None

def get_neo4j_client() -> Neo4jClient:
    global _neo4j_client
    if _neo4j_client is None:
        _neo4j_client = Neo4jClient()
    return _neo4j_client
