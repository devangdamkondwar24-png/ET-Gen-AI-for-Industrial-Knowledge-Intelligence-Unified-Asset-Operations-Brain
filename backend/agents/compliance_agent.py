"""
Compliance Agent — Phase 3
LangGraph-powered compliance gap analysis.

Workflow:
  START
    → load_regulations    (Neo4j — all regulation nodes)
    → find_procedures     (Elasticsearch — search for procedure documents)
    → detect_gaps         (Ollama — compare requirements vs. existing docs)
    → format_report       (Structured output with severity and actions)
  END
"""
import os
import json
import logging
import httpx
from typing import TypedDict, List, Optional
from langgraph.graph import StateGraph, END
from graph.neo4j_client import get_neo4j_client

logger = logging.getLogger(__name__)

OLLAMA_URL   = os.environ.get("OLLAMA_URL", "http://localhost:11434")
OLLAMA_MODEL = os.environ.get("OLLAMA_MODEL", "mistral")
ES_URL       = os.environ.get("ELASTICSEARCH_URL", "http://localhost:9200")
ES_INDEX     = "etgen_documents_v2"


# ───────────────────────────────────────────────
# Agent State
# ───────────────────────────────────────────────

class ComplianceState(TypedDict):
    regulation_ids: List[str]         # Which regulations to audit
    plant_filter: Optional[str]       # Filter results to a specific plant
    regulations: List[dict]           # Fetched from Neo4j
    procedure_docs: List[dict]        # Fetched from Elasticsearch
    known_non_conformances: List[dict] # Existing NCs from Neo4j
    gap_analysis: List[dict]          # Generated gap report rows
    error: str


# ───────────────────────────────────────────────
# Step 1: Load Regulations from Neo4j
# ───────────────────────────────────────────────

def load_regulations(state: ComplianceState) -> ComplianceState:
    """Fetch all specified regulations from the graph."""
    try:
        client = get_neo4j_client()
        regs = []
        for reg_id in state["regulation_ids"]:
            with client.driver.session() as session:
                result = session.run(
                    "MATCH (r:Regulation {regulation_id: $id}) RETURN r",
                    {"id": reg_id}
                )
                row = result.single()
                if row:
                    regs.append(dict(row["r"]))

        # Also pull all known non-conformances for these regulations
        ncs = []
        for reg_id in state["regulation_ids"]:
            ncs.extend(client.get_compliance_gaps(reg_id))

        state["regulations"] = regs
        state["known_non_conformances"] = ncs
        logger.info(f"[Compliance] Loaded {len(regs)} regulations, {len(ncs)} existing NCs.")
    except Exception as e:
        logger.error(f"[Compliance] Regulation load failed: {e}")
        state["error"] = f"Regulation load failed: {e}"
        state["regulations"] = []
        state["known_non_conformances"] = []
    return state


# ───────────────────────────────────────────────
# Step 2: Search for Procedure Documents
# ───────────────────────────────────────────────

def find_procedures(state: ComplianceState) -> ComplianceState:
    """Search Elasticsearch for SOP, Procedure, and Safety documents."""
    if state.get("error"):
        return state
    try:
        # Build a broad query for procedural content
        reg_titles = [r.get("title", "") for r in state["regulations"]]
        search_query = " ".join(reg_titles) or "procedure SOP safety inspection"

        plant_filter = []
        if state.get("plant_filter"):
            plant_filter = [{"term": {"plant": state["plant_filter"]}}]

        payload = {
            "size": 10,
            "query": {
                "bool": {
                    "should": [
                        {"match": {"content": {"query": search_query, "boost": 1.0}}},
                        {"terms": {"doc_type": ["SOP", "Procedure", "Safety", "Inspection", "Compliance"]}}
                    ],
                    "filter": plant_filter
                }
            },
            "_source": ["doc_id", "doc_type", "asset_tag", "plant", "page_number", "content", "source_system"]
        }
        resp = httpx.post(f"{ES_URL}/{ES_INDEX}/_search", json=payload, timeout=30)
        resp.raise_for_status()
        hits = resp.json().get("hits", {}).get("hits", [])
        state["procedure_docs"] = [
            {"doc_id": h["_source"]["doc_id"], "page": h["_source"].get("page_number"),
             "text": h["_source"].get("content", "")[:600],
             "doc_type": h["_source"].get("doc_type", "Unknown")}
            for h in hits
        ]
        logger.info(f"[Compliance] Found {len(state['procedure_docs'])} procedure docs.")
    except Exception as e:
        logger.error(f"[Compliance] Document search failed: {e}")
        state["error"] = f"Document search failed: {e}"
        state["procedure_docs"] = []
    return state


# ───────────────────────────────────────────────
# Step 3: Detect Gaps with Local LLM
# ───────────────────────────────────────────────

GAP_PROMPT = """You are a regulatory compliance specialist for an industrial plant.

=== REGULATIONS TO AUDIT ===
{regulations}

=== EXISTING PROCEDURE DOCUMENTS FOUND ===
{procedure_docs}

=== KNOWN NON-CONFORMANCES (already recorded) ===
{known_ncs}

=== YOUR TASK ===
For each regulation, determine whether the existing documentation adequately satisfies it.
Return ONLY a valid JSON array, where each object represents one compliance gap or pass:

[
  {{
    "regulation_id": "...",
    "regulation_title": "...",
    "requirement_summary": "What the regulation requires",
    "status": "COMPLIANT | GAP | MISSING | UNKNOWN",
    "evidence_doc_ids": ["doc_id that supports compliance, if any"],
    "gap_description": "Describe the gap or confirm compliance",
    "severity": "Critical | High | Medium | Low | None",
    "recommended_action": "What must be done to close the gap"
  }}
]

Do NOT invent evidence. If a document clearly addresses a regulation, mark it COMPLIANT.
If no documents address it at all, mark it MISSING.
"""


def detect_gaps(state: ComplianceState) -> ComplianceState:
    """Call Ollama to identify compliance gaps."""
    if state.get("error"):
        return state

    prompt = GAP_PROMPT.format(
        regulations=json.dumps(state["regulations"], indent=2),
        procedure_docs=json.dumps(state["procedure_docs"], indent=2),
        known_ncs=json.dumps(state["known_non_conformances"][:10], indent=2)
    )

    try:
        resp = httpx.post(
            f"{OLLAMA_URL}/api/generate",
            json={"model": OLLAMA_MODEL, "prompt": prompt, "stream": False},
            timeout=600
        )
        resp.raise_for_status()
        raw = resp.json().get("response", "")

        start = raw.find("[")
        end   = raw.rfind("]") + 1
        if start == -1 or end == 0:
            raise ValueError("No JSON array in LLM response")
        gaps = json.loads(raw[start:end])
        state["gap_analysis"] = gaps
        logger.info(f"[Compliance] Gap analysis: {len(gaps)} rows generated.")

    except Exception as e:
        logger.error(f"[Compliance] Gap detection failed: {e}")
        state["error"] = f"Gap detection failed: {e}"
        state["gap_analysis"] = []
    return state


# ───────────────────────────────────────────────
# Build LangGraph Workflow
# ───────────────────────────────────────────────

def build_compliance_graph():
    graph = StateGraph(ComplianceState)
    graph.add_node("load_regulations", load_regulations)
    graph.add_node("find_procedures",  find_procedures)
    graph.add_node("detect_gaps",      detect_gaps)

    graph.set_entry_point("load_regulations")
    graph.add_edge("load_regulations", "find_procedures")
    graph.add_edge("find_procedures",  "detect_gaps")
    graph.add_edge("detect_gaps",      END)

    return graph.compile()


compliance_agent = build_compliance_graph()


def run_compliance_check(regulation_ids: list, plant_filter: str = None) -> dict:
    """Public entry point for compliance gap analysis."""
    initial_state: ComplianceState = {
        "regulation_ids": regulation_ids,
        "plant_filter": plant_filter,
        "regulations": [],
        "procedure_docs": [],
        "known_non_conformances": [],
        "gap_analysis": [],
        "error": ""
    }
    final = compliance_agent.invoke(initial_state)

    if final.get("error"):
        return {"status": "error", "message": final["error"]}

    return {
        "status": "success",
        "plant": plant_filter or "all",
        "regulations_audited": len(final["regulations"]),
        "gaps": final["gap_analysis"]
    }
