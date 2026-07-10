"""
Lessons Learned Batch Pipeline — Phase 3
Scheduled intelligence job that:
  1. Scans Neo4j for recurring failure patterns
  2. Clusters incidents and non-conformances by asset type
  3. Generates actionable alerts via Ollama
  4. Writes warning/insight nodes back to Neo4j

Run via: python -m agents.lessons_learned_job
Or schedule with APScheduler / cron.
"""
import os
import json
import logging
import httpx
from datetime import datetime

from graph.neo4j_client import get_neo4j_client

logger = logging.getLogger(__name__)

OLLAMA_URL   = os.environ.get("OLLAMA_URL",    "http://localhost:11434")
OLLAMA_MODEL = os.environ.get("OLLAMA_MODEL",  "mistral")

RECURRENCE_THRESHOLD = 2    # Failures appearing >= this many times are flagged
INSIGHT_LABEL        = "LessonsLearnedInsight"

INSIGHT_PROMPT = """You are an industrial reliability engineer specializing in failure pattern analysis.

=== RECURRING FAILURE PATTERNS DETECTED ===
{patterns}

=== YOUR TASK ===
For each recurring failure pattern, generate a lessons-learned insight.
Return ONLY a valid JSON array:

[
  {{
    "failure_name": "...",
    "affected_assets": ["asset_id1", "asset_id2"],
    "occurrence_count": 3,
    "pattern_summary": "Brief description of the recurring problem",
    "root_cause_hypothesis": "Most likely systemic cause",
    "recommended_preventive_action": "Actionable recommendation to prevent recurrence",
    "urgency": "Immediate | High | Medium | Low",
    "alert_message": "Short operator-facing warning message"
  }}
]

Base your analysis only on the patterns provided. Do not invent failure modes."""


def _call_ollama(prompt: str) -> str:
    try:
        resp = httpx.post(
            f"{OLLAMA_URL}/api/generate",
            json={"model": OLLAMA_MODEL, "prompt": prompt, "stream": False},
            timeout=180
        )
        resp.raise_for_status()
        return resp.json().get("response", "")
    except Exception as e:
        logger.error(f"[LessonsLearned] Ollama call failed: {e}")
        return ""


def _write_insight_to_graph(client, insight: dict):
    """Write a LessonsLearnedInsight node to Neo4j."""
    with client.driver.session() as session:
        session.run("""
            MERGE (li:LessonsLearnedInsight {failure_name: $failure_name})
            SET li.pattern_summary = $pattern_summary,
                li.root_cause_hypothesis = $root_cause_hypothesis,
                li.recommended_action = $recommended_preventive_action,
                li.urgency = $urgency,
                li.alert_message = $alert_message,
                li.occurrence_count = $occurrence_count,
                li.last_updated = $last_updated
        """, {**insight, "last_updated": datetime.utcnow().isoformat()})

        # Link to affected equipment
        for asset_id in insight.get("affected_assets", []):
            session.run("""
                MATCH (e:Equipment {asset_id: $asset_id})
                MERGE (li:LessonsLearnedInsight {failure_name: $failure_name})
                MERGE (e)-[:DERIVED_FROM]->(li)
            """, {"asset_id": asset_id, "failure_name": insight["failure_name"]})


def run_lessons_learned_pipeline(asset_type: str = None):
    """
    Main entry point for the batch lessons-learned job.
    Scans all recurring patterns and generates actionable insights.
    """
    logger.info(f"[LessonsLearned] Starting batch pipeline. Filter: asset_type={asset_type}")

    client = get_neo4j_client()

    # ── Step 1: Get recurring failure patterns ────────────────
    patterns = client.get_recurring_incidents(
        asset_type=asset_type,
        min_count=RECURRENCE_THRESHOLD
    )

    if not patterns:
        logger.info("[LessonsLearned] No recurring patterns found above threshold. Exiting.")
        return {"status": "no_patterns", "insights_written": 0}

    logger.info(f"[LessonsLearned] Found {len(patterns)} recurring patterns.")

    # ── Step 2: Generate insights via Ollama ──────────────────
    prompt = INSIGHT_PROMPT.format(patterns=json.dumps(patterns, indent=2))
    raw = _call_ollama(prompt)

    if not raw.strip():
        logger.error("[LessonsLearned] Empty LLM response. Aborting.")
        return {"status": "error", "message": "Empty LLM response"}

    try:
        start = raw.find("[")
        end   = raw.rfind("]") + 1
        if start == -1 or end == 0:
            raise ValueError("No JSON array in response")
        insights = json.loads(raw[start:end])
    except Exception as e:
        logger.error(f"[LessonsLearned] JSON parse failed: {e}\nRaw: {raw[:300]}")
        return {"status": "error", "message": f"JSON parse failed: {e}"}

    # ── Step 3: Write insights back to Neo4j ──────────────────
    written = 0
    for insight in insights:
        try:
            _write_insight_to_graph(client, insight)
            written += 1
            logger.info(f"[LessonsLearned] Insight written: {insight.get('failure_name')} "
                        f"(urgency={insight.get('urgency')})")
        except Exception as e:
            logger.warning(f"[LessonsLearned] Failed to write insight: {e}")

    logger.info(f"[LessonsLearned] Pipeline complete. {written}/{len(insights)} insights written.")
    return {
        "status": "success",
        "patterns_found": len(patterns),
        "insights_written": written,
        "insights": insights
    }


def get_all_insights() -> list:
    """
    Fetch all LessonsLearnedInsight nodes from Neo4j for the alerts dashboard.
    """
    client = get_neo4j_client()
    with client.driver.session() as session:
        result = session.run("""
            MATCH (li:LessonsLearnedInsight)
            OPTIONAL MATCH (e:Equipment)-[:DERIVED_FROM]->(li)
            RETURN li, collect(e.asset_id) AS assets
            ORDER BY li.last_updated DESC
        """)
        return [
            {**dict(row["li"]), "affected_assets": row["assets"]}
            for row in result
        ]


if __name__ == "__main__":
    import sys
    logging.basicConfig(level=logging.INFO)
    asset_filter = sys.argv[1] if len(sys.argv) > 1 else None
    result = run_lessons_learned_pipeline(asset_type=asset_filter)
    print(json.dumps(result, indent=2))
