"""
Graph Extractor — Phase 3
Uses Ollama (local LLM) to extract structured industrial entities from document chunks
and write them into the Neo4j knowledge graph.

Output: Equipment, FailureMode, Cause, Action, WorkOrder,
        InspectionFinding, Procedure, Regulation, Incident, NonConformance
"""
import os
import json
import uuid
import logging
import httpx
from graph.neo4j_client import (
    get_neo4j_client,
    EquipmentNode, FailureModeNode, CauseNode, ActionNode,
    WorkOrderNode, InspectionFindingNode, ProcedureNode,
    RegulationNode, IncidentNode, NonConformanceNode
)

logger = logging.getLogger(__name__)

OLLAMA_URL   = os.environ.get("OLLAMA_URL", "http://localhost:11434")
OLLAMA_MODEL = os.environ.get("OLLAMA_MODEL", "mistral")

EXTRACTION_PROMPT = """You are an industrial knowledge extraction engine.
Given the following text from an industrial document, extract any entities that belong to these types:

1. Equipment — physical assets (pumps, valves, compressors, heat exchangers, reactors, etc.)
2. FailureMode — documented failures or defects (seal leak, vibration, overheating, pitting)
3. Cause — root causes of failures (fatigue, corrosion, improper lubrication)
4. Action — maintenance or corrective actions (replace seal, re-align motor, clean filter)
5. WorkOrder — maintenance work orders with IDs or references
6. InspectionFinding — findings from inspections or audits
7. Procedure — SOPs, safety procedures, PTWs, LOTOs
8. Regulation — regulatory standards, ISO, OSHA, API clauses
9. Incident — accidents, near misses, safety events
10. NonConformance — gaps, deviations, audit failures

Return ONLY a valid JSON object with this exact structure:
{
  "equipment": [{"asset_id": "...", "name": "...", "asset_type": "...", "plant": "..."}],
  "failure_modes": [{"failure_id": "...", "name": "...", "asset_id": "...", "severity": "..."}],
  "causes": [{"cause_id": "...", "description": "...", "category": "...", "failure_id": "..."}],
  "actions": [{"action_id": "...", "description": "...", "action_type": "..."}],
  "work_orders": [{"wo_id": "...", "title": "...", "asset_id": "...", "priority": "..."}],
  "inspection_findings": [{"finding_id": "...", "asset_id": "...", "description": "...", "severity": "..."}],
  "procedures": [{"procedure_id": "...", "title": "...", "doc_type": "SOP"}],
  "regulations": [{"regulation_id": "...", "title": "...", "body": "...", "clause": "..."}],
  "incidents": [{"incident_id": "...", "title": "...", "description": "...", "severity": "..."}],
  "non_conformances": [{"nc_id": "...", "description": "...", "status": "Open"}]
}

If no entities of a type are found, return an empty list for that key.
Do not invent data. Only extract what is clearly present in the text.
Assign short, readable IDs. If a document ID references an asset tag, preserve it.

TEXT:
{text}
"""


def _call_ollama(prompt: str) -> str:
    """Call local Ollama and return the raw text response."""
    try:
        response = httpx.post(
            f"{OLLAMA_URL}/api/generate",
            json={"model": OLLAMA_MODEL, "prompt": prompt, "stream": False},
            timeout=120
        )
        response.raise_for_status()
        return response.json().get("response", "")
    except Exception as e:
        logger.error(f"[GraphExtractor] Ollama call failed: {e}")
        return ""


def _safe_id(prefix: str, value: str) -> str:
    """Generate a safe, deterministic ID from a prefix + value."""
    return f"{prefix}_{value[:20].replace(' ', '_').lower()}" if value else f"{prefix}_{uuid.uuid4().hex[:8]}"


def extract_and_populate_graph(text: str, doc_id: str, asset_tag: str = None, plant: str = "Unknown") -> dict:
    """
    Given a chunk of text from an ingested document:
    1. Call the local LLM to extract entities.
    2. Validate with Pydantic.
    3. Write to Neo4j.
    Returns a summary of what was written.
    """
    prompt = EXTRACTION_PROMPT.format(text=text[:3000])  # Cap at 3000 chars per chunk
    raw_response = _call_ollama(prompt)

    if not raw_response.strip():
        logger.warning("[GraphExtractor] Empty response from Ollama.")
        return {"written": 0, "error": "empty_response"}

    # ── Parse JSON ─────────────────────────────
    try:
        # Find the JSON block in the response
        start = raw_response.find("{")
        end   = raw_response.rfind("}") + 1
        if start == -1 or end == 0:
            raise ValueError("No JSON block found in response")
        extracted = json.loads(raw_response[start:end])
    except Exception as e:
        logger.error(f"[GraphExtractor] JSON parse failed: {e}\nRaw: {raw_response[:300]}")
        return {"written": 0, "error": "json_parse_failed"}

    client = get_neo4j_client()
    write_count = 0

    # ── Equipment ──────────────────────────────
    for item in extracted.get("equipment", []):
        try:
            node = EquipmentNode(
                asset_id=item.get("asset_id") or _safe_id("eq", item.get("name", "")),
                name=item.get("name", "Unknown Equipment"),
                asset_type=item.get("asset_type", "Generic"),
                plant=item.get("plant") or plant,
                location=item.get("location"),
                manufacturer=item.get("manufacturer"),
                criticality=item.get("criticality")
            )
            client.upsert_equipment(node)
            write_count += 1
        except Exception as e:
            logger.warning(f"[GraphExtractor] Equipment write failed: {e}")

    # ── FailureMode ────────────────────────────
    for item in extracted.get("failure_modes", []):
        try:
            node = FailureModeNode(
                failure_id=item.get("failure_id") or _safe_id("fm", item.get("name", "")),
                name=item.get("name", "Unknown Failure"),
                asset_id=item.get("asset_id") or asset_tag or "unknown",
                severity=item.get("severity")
            )
            client.upsert_failure_mode(node)
            write_count += 1
        except Exception as e:
            logger.warning(f"[GraphExtractor] FailureMode write failed: {e}")

    # ── Cause ──────────────────────────────────
    for item in extracted.get("causes", []):
        try:
            node = CauseNode(
                cause_id=item.get("cause_id") or _safe_id("ca", item.get("description", "")),
                description=item.get("description", "Unknown Cause"),
                category=item.get("category", "Unknown"),
                failure_id=item.get("failure_id")
            )
            client.upsert_cause(node)
            write_count += 1
        except Exception as e:
            logger.warning(f"[GraphExtractor] Cause write failed: {e}")

    # ── Action ─────────────────────────────────
    for item in extracted.get("actions", []):
        try:
            node = ActionNode(
                action_id=item.get("action_id") or _safe_id("ac", item.get("description", "")),
                description=item.get("description", "Unknown Action"),
                action_type=item.get("action_type", "Corrective"),
                assigned_to=item.get("assigned_to"),
                due_date=item.get("due_date"),
                status=item.get("status", "Open")
            )
            client.upsert_action(node)
            write_count += 1
        except Exception as e:
            logger.warning(f"[GraphExtractor] Action write failed: {e}")

    # ── WorkOrder ──────────────────────────────
    for item in extracted.get("work_orders", []):
        try:
            node = WorkOrderNode(
                wo_id=item.get("wo_id") or _safe_id("wo", item.get("title", "")),
                title=item.get("title", "Unknown Work Order"),
                asset_id=item.get("asset_id") or asset_tag or "unknown",
                priority=item.get("priority"),
                status=item.get("status", "Open"),
                created_date=item.get("created_date"),
                doc_id=doc_id
            )
            client.upsert_work_order(node)
            write_count += 1
        except Exception as e:
            logger.warning(f"[GraphExtractor] WorkOrder write failed: {e}")

    # ── InspectionFinding ──────────────────────
    for item in extracted.get("inspection_findings", []):
        try:
            node = InspectionFindingNode(
                finding_id=item.get("finding_id") or _safe_id("if", item.get("description", "")),
                asset_id=item.get("asset_id") or asset_tag or "unknown",
                description=item.get("description", "Unknown Finding"),
                severity=item.get("severity"),
                inspector=item.get("inspector"),
                inspection_date=item.get("inspection_date"),
                doc_id=doc_id
            )
            client.upsert_inspection(node)
            write_count += 1
        except Exception as e:
            logger.warning(f"[GraphExtractor] InspectionFinding write failed: {e}")

    # ── Procedure ──────────────────────────────
    for item in extracted.get("procedures", []):
        try:
            node = ProcedureNode(
                procedure_id=item.get("procedure_id") or _safe_id("pr", item.get("title", "")),
                title=item.get("title", "Unknown Procedure"),
                doc_type=item.get("doc_type", "SOP"),
                revision=item.get("revision"),
                effective_date=item.get("effective_date"),
                doc_id=doc_id
            )
            client.upsert_procedure(node)
            write_count += 1
        except Exception as e:
            logger.warning(f"[GraphExtractor] Procedure write failed: {e}")

    # ── Regulation ─────────────────────────────
    for item in extracted.get("regulations", []):
        try:
            node = RegulationNode(
                regulation_id=item.get("regulation_id") or _safe_id("rg", item.get("title", "")),
                title=item.get("title", "Unknown Regulation"),
                body=item.get("body", "Unknown"),
                clause=item.get("clause"),
                mandatory=item.get("mandatory", True)
            )
            client.upsert_regulation(node)
            write_count += 1
        except Exception as e:
            logger.warning(f"[GraphExtractor] Regulation write failed: {e}")

    # ── Incident ───────────────────────────────
    for item in extracted.get("incidents", []):
        try:
            node = IncidentNode(
                incident_id=item.get("incident_id") or _safe_id("inc", item.get("title", "")),
                title=item.get("title", "Unknown Incident"),
                asset_id=item.get("asset_id") or asset_tag,
                date=item.get("date"),
                severity=item.get("severity"),
                description=item.get("description", ""),
                doc_id=doc_id
            )
            client.upsert_incident(node)
            write_count += 1
        except Exception as e:
            logger.warning(f"[GraphExtractor] Incident write failed: {e}")

    # ── NonConformance ─────────────────────────
    for item in extracted.get("non_conformances", []):
        try:
            node = NonConformanceNode(
                nc_id=item.get("nc_id") or _safe_id("nc", item.get("description", "")),
                description=item.get("description", "Unknown Non-Conformance"),
                asset_id=item.get("asset_id") or asset_tag,
                regulation_id=item.get("regulation_id"),
                status=item.get("status", "Open"),
                doc_id=doc_id
            )
            client.upsert_non_conformance(node)
            write_count += 1
        except Exception as e:
            logger.warning(f"[GraphExtractor] NonConformance write failed: {e}")

    logger.info(f"[GraphExtractor] doc={doc_id} → {write_count} graph nodes written.")
    return {"written": write_count, "extracted": extracted}
