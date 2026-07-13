"""
RCA Agent — Phase 3
LangGraph-powered Root Cause Analysis agent.

Workflow:
  START
    → query_graph      (Neo4j asset context)
    → search_docs      (Elasticsearch hybrid search)
    → synthesize_rca   (Ollama local LLM)
    → validate         (Ensure citations are grounded)
  END

The agent ONLY reasons from retrieved evidence. It never guesses.
"""
import os
import json
import logging
import httpx
from typing import TypedDict, Annotated, List
from langgraph.graph import StateGraph, END

from graph.neo4j_client import get_neo4j_client

logger = logging.getLogger(__name__)

OLLAMA_URL    = os.environ.get("OLLAMA_URL", "http://localhost:11434")
OLLAMA_MODEL  = os.environ.get("OLLAMA_MODEL", "mistral")
ES_URL        = os.environ.get("ELASTICSEARCH_URL", "http://localhost:9200")
ES_INDEX      = "industrial_chunks"
CONFIDENCE_THRESHOLD = 7.5


# ───────────────────────────────────────────────
# Agent State
# ───────────────────────────────────────────────

class RCAState(TypedDict):
    query: str                     # e.g. "Why did pump P-101 fail last month?"
    asset_id: str                  # Extracted asset tag
    graph_context: dict            # From Neo4j
    doc_chunks: List[dict]         # From Elasticsearch
    hypotheses: List[dict]         # Generated hypotheses
    final_answer: str              # Formatted RCA report
    error: str                     # Non-empty if any step fails


# ───────────────────────────────────────────────
# Step 1: Query the Knowledge Graph
# ───────────────────────────────────────────────

def query_graph(state: RCAState) -> RCAState:
    """Pull full asset history from Neo4j."""
    try:
        client = get_neo4j_client()
        context = client.get_asset_context(state["asset_id"])
        state["graph_context"] = context
        logger.info(f"[RCA] Graph context: {len(context.get('failures', []))} failures, "
                    f"{len(context.get('work_orders', []))} WOs")
    except Exception as e:
        logger.error(f"[RCA] Graph query failed: {e}")
        state["error"] = f"Graph query failed: {e}"
        state["graph_context"] = {}
    return state


# ───────────────────────────────────────────────
# Step 2: Hybrid Search in Elasticsearch
# ───────────────────────────────────────────────

def _embed_query(query: str) -> list:
    """Embed the query text using the same model as ingestion."""
    from ingestion.embedder import document_embedder
    return document_embedder.embed_text(query)


def search_docs(state: RCAState) -> RCAState:
    """Run hybrid Elasticsearch search to find relevant document chunks."""
    try:
        query_vector = _embed_query(state["query"])
        payload = {
            "size": 6,
            "query": {
                "bool": {
                    "should": [
                        {
                            "script_score": {
                                "query": {"match_all": {}},
                                "script": {
                                    "source": "(cosineSimilarity(params.vector, 'chunk_vector') + 1.0) * 5.0",
                                    "params": {"vector": query_vector}
                                }
                            }
                        },
                        {
                            "match": {
                                "content": {
                                    "query": state["query"],
                                    "boost": 0.5
                                }
                            }
                        }
                    ],
                    "filter": [{"term": {"asset_tag": state["asset_id"]}}]
                }
            },
            "_source": ["doc_id", "asset_tag", "plant", "page_number", "content", "source_system"]
        }

        resp = httpx.post(f"{ES_URL}/{ES_INDEX}/_search", json=payload, timeout=30)
        resp.raise_for_status()
        hits = resp.json().get("hits", {}).get("hits", [])

        chunks = []
        for h in hits:
            score = h.get("_score", 0)
            if score >= CONFIDENCE_THRESHOLD:
                src = h["_source"]
                chunks.append({
                    "doc_id": src.get("doc_id"),
                    "page": src.get("page_number"),
                    "asset_tag": src.get("asset_tag"),
                    "plant": src.get("plant"),
                    "text": src.get("content", ""),
                    "score": score,
                })

        state["doc_chunks"] = chunks
        logger.info(f"[RCA] Retrieved {len(chunks)} qualifying doc chunks.")

    except Exception as e:
        logger.error(f"[RCA] Elasticsearch search failed: {e}")
        state["error"] = f"Search failed: {e}"
        state["doc_chunks"] = []

    return state


# ───────────────────────────────────────────────
# Step 3: Synthesize RCA with local LLM
# ───────────────────────────────────────────────

RCA_PROMPT_TEMPLATE = """You are an expert industrial Root Cause Analysis (RCA) engineer.
You must analyse a failure question using ONLY the provided evidence.
Do NOT guess. If the evidence is insufficient, say so explicitly.

=== FAILURE QUESTION ===
{query}

=== KNOWLEDGE GRAPH CONTEXT ===
Equipment: {equipment}
Known Failures: {failures}
Known Causes: {causes}
Recent Work Orders: {work_orders}
Inspections: {inspections}
Incidents: {incidents}

=== SUPPORTING DOCUMENT EVIDENCE ===
{doc_evidence}

=== YOUR TASK ===
Based solely on the above evidence, produce a structured RCA report in this JSON format:
{{
  "summary": "One-sentence root cause summary",
  "hypotheses": [
    {{
      "rank": 1,
      "hypothesis": "Most likely cause",
      "evidence": ["evidence point 1", "evidence point 2"],
      "confidence_score": 0.95,
      "citations": ["doc_id:page_number", ...]
    }}
  ],
  "recommended_actions": ["action 1", "action 2"],
  "evidence_gaps": "What additional data would strengthen the analysis"
}}

Return ONLY valid JSON. No other text."""


def synthesize_rca(state: RCAState) -> RCAState:
    """Call Ollama to synthesize the RCA from graph + doc evidence."""
    if state.get("error"):
        return state

    gc = state.get("graph_context", {})
    doc_evidence = "\n".join([
        f"[{c['doc_id']} p.{c['page']}] {c['text'][:300]}"
        for c in state.get("doc_chunks", [])
    ]) or "No supporting document evidence found."

    prompt = RCA_PROMPT_TEMPLATE.format(
        query=state["query"],
        equipment=json.dumps(gc.get("equipment", {}), indent=2),
        failures=json.dumps(gc.get("failures", []), indent=2),
        causes=json.dumps(gc.get("causes", []), indent=2),
        work_orders=json.dumps(gc.get("work_orders", [])[:5], indent=2),
        inspections=json.dumps(gc.get("inspections", [])[:3], indent=2),
        incidents=json.dumps(gc.get("incidents", [])[:3], indent=2),
        doc_evidence=doc_evidence
    )

    try:
        resp = httpx.post(
            f"{OLLAMA_URL}/api/generate",
            json={"model": OLLAMA_MODEL, "prompt": prompt, "stream": False},
            timeout=180
        )
        resp.raise_for_status()
        raw = resp.json().get("response", "")

        # Extract JSON block
        start = raw.find("{")
        end   = raw.rfind("}") + 1
        if start == -1 or end == 0:
            raise ValueError("No JSON block in LLM response")
        rca_result = json.loads(raw[start:end])
        state["hypotheses"] = rca_result.get("hypotheses", [])
        state["final_answer"] = json.dumps(rca_result, indent=2)

    except Exception as e:
        logger.error(f"[RCA] LLM synthesis failed: {e}")
        state["error"] = f"LLM synthesis failed: {e}"
        state["final_answer"] = ""

    return state


# ───────────────────────────────────────────────
# Step 4: Validate Citations
# ───────────────────────────────────────────────

def validate_rca(state: RCAState) -> RCAState:
    """Ensure the cited doc_ids actually exist in the retrieved chunks."""
    if state.get("error") or not state.get("hypotheses"):
        return state

    valid_doc_ids = {c["doc_id"] for c in state.get("doc_chunks", [])}
    all_citations = []
    for h in state["hypotheses"]:
        for cite in h.get("citations", []):
            doc_ref = cite.split(":")[0]
            all_citations.append(doc_ref)

    invalid = [c for c in all_citations if c not in valid_doc_ids]
    if invalid:
        logger.warning(f"[RCA] Hallucinated citations detected: {invalid}")
        state["error"] = f"Citation validation failed: {invalid}"

    return state


# ───────────────────────────────────────────────
# Build LangGraph Workflow
# ───────────────────────────────────────────────

def build_rca_graph():
    graph = StateGraph(RCAState)
    graph.add_node("query_graph",    query_graph)
    graph.add_node("search_docs",    search_docs)
    graph.add_node("synthesize_rca", synthesize_rca)
    graph.add_node("validate_rca",   validate_rca)

    graph.set_entry_point("query_graph")
    graph.add_edge("query_graph",    "search_docs")
    graph.add_edge("search_docs",    "synthesize_rca")
    graph.add_edge("synthesize_rca", "validate_rca")
    graph.add_edge("validate_rca",   END)

    return graph.compile()


rca_agent = build_rca_graph()


def run_rca(query: str, asset_id: str) -> dict:
    """
    Public entry point for the RCA agent.
    Returns the full analysis or an error message.
    """
    initial_state: RCAState = {
        "query": query,
        "asset_id": asset_id,
        "graph_context": {},
        "doc_chunks": [],
        "hypotheses": [],
        "final_answer": "",
        "error": ""
    }
    final_state = rca_agent.invoke(initial_state)

    if final_state.get("error"):
        return {"status": "error", "message": final_state["error"]}

    return {
        "status": "success",
        "query": query,
        "asset_id": asset_id,
        "rca": json.loads(final_state["final_answer"]) if final_state["final_answer"] else {},
        "source_chunks": [
            {"doc_id": c["doc_id"], "page": c["page"], "score": c["score"]}
            for c in final_state["doc_chunks"]
        ]
    }
