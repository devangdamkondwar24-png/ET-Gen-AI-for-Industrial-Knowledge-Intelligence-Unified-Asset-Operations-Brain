"""
LLM Client — Anthropic Claude wrapper with deterministic mock fallback.

The mock mode activates when:
  - ANTHROPIC_API_KEY is not set, OR
  - USE_MOCK_LLM=true environment variable is set

Mock mode returns plausible canned responses from seed data, making it
suitable for unit tests, offline demos, and rate-limit resilience.
"""
from __future__ import annotations
import os
import json
import re
from typing import Optional


def _get_client_mode() -> str:
    """Determine whether to use real or mock LLM."""
    if os.environ.get("USE_MOCK_LLM", "").lower() in ("true", "1", "yes"):
        return "mock"
    if not os.environ.get("ANTHROPIC_API_KEY"):
        return "mock"
    return "real"


class LLMClient:
    """Unified LLM client that delegates to Claude or the mock backend."""

    def __init__(self):
        self.mode = _get_client_mode()
        self._claude_client = None

        if self.mode == "real":
            try:
                import anthropic
                self._claude_client = anthropic.Anthropic()
            except Exception:
                self.mode = "mock"

    def extract_entities(self, text: str, source_filename: str = "") -> dict:
        """
        Extract entities from document text and return OKF concept data.

        Returns dict with:
            - concepts: list of {type, title, description, tags, equipment_tag, body, ...}
        """
        if self.mode == "mock":
            return MockLLM.extract_entities(text, source_filename)

        prompt = f"""You are an industrial knowledge extraction system. Analyze the following document text and extract structured entities.

For each entity found (equipment, procedures, work orders, incidents, regulations, inspections), provide:
- type: one of "equipment", "procedure", "workorder", "inspection", "regulation", "incident"
- title: concise descriptive title
- description: 1-2 sentence description
- tags: list of relevant keywords
- equipment_tag: if applicable (e.g. "P-101", "V-204")
- body: detailed markdown content about this entity, including all relevant facts from the source text

Also identify cross-references between entities (e.g. a work order mentioning specific equipment).

Source filename: {source_filename}

Document text:
{text[:8000]}

Respond in JSON format:
{{
    "concepts": [
        {{
            "type": "equipment",
            "title": "...",
            "description": "...",
            "tags": ["..."],
            "equipment_tag": "...",
            "body": "..."
        }}
    ],
    "cross_references": [
        {{
            "source_title": "...",
            "target_title": "...",
            "relationship": "..."
        }}
    ]
}}"""

        response = self._claude_client.messages.create(
            model="claude-opus-4-6",
            max_tokens=4096,
            messages=[{"role": "user", "content": prompt}]
        )

        try:
            text_response = response.content[0].text
            # Extract JSON from response (may be wrapped in markdown code block)
            json_match = re.search(r'```(?:json)?\s*(\{.*?\})\s*```', text_response, re.DOTALL)
            if json_match:
                return json.loads(json_match.group(1))
            return json.loads(text_response)
        except (json.JSONDecodeError, IndexError):
            return MockLLM.extract_entities(text, source_filename)

    def generate_crosslinks(
        self, new_concept_summary: str, existing_summaries: list[str]
    ) -> list[str]:
        """
        Given a new concept and summaries of existing concepts,
        return the titles of existing concepts that should be cross-linked.
        """
        if self.mode == "mock":
            return MockLLM.generate_crosslinks(new_concept_summary, existing_summaries)

        prompt = f"""You are a knowledge graph linker for an industrial plant. Given a NEW concept and a list of EXISTING concepts, determine which existing concepts should be cross-linked to the new one.

Return ONLY the titles of existing concepts that have a meaningful relationship (same equipment, related procedures, shared incidents, regulatory applicability, etc.).

NEW CONCEPT:
{new_concept_summary}

EXISTING CONCEPTS:
{chr(10).join(f"- {s}" for s in existing_summaries[:30])}

Respond with a JSON array of titles to link:
["title1", "title2", ...]"""

        response = self._claude_client.messages.create(
            model="claude-opus-4-6",
            max_tokens=1024,
            messages=[{"role": "user", "content": prompt}]
        )

        try:
            text_response = response.content[0].text
            json_match = re.search(r'\[.*?\]', text_response, re.DOTALL)
            if json_match:
                return json.loads(json_match.group(0))
            return json.loads(text_response)
        except (json.JSONDecodeError, IndexError):
            return []

    def generate_answer(
        self, question: str, context_files: list[dict], follow_up_context: str = ""
    ) -> dict:
        """
        Generate an answer to a user question using grounded context from OKF files.

        Args:
            question: User's natural language question
            context_files: List of dicts with {path, title, body} from retrieved concept files
            follow_up_context: Additional context from link-following

        Returns dict with: answer, sources_used (list of paths)
        """
        if self.mode == "mock":
            return MockLLM.generate_answer(question, context_files)

        context_block = ""
        for cf in context_files:
            context_block += f"\n--- FILE: {cf['path']} ---\nTitle: {cf['title']}\n{cf['body']}\n"

        if follow_up_context:
            context_block += f"\n--- ADDITIONAL LINKED CONTEXT ---\n{follow_up_context}\n"

        prompt = f"""You are an expert industrial knowledge copilot. Answer the user's question using ONLY the provided source files. Follow these rules strictly:

1. Only use information from the provided files. Never fabricate information.
2. Cite the specific file path for every claim you make.
3. If the provided files don't contain enough information to answer, say "I don't have enough information in the knowledge base to answer this question confidently" and explain what's missing.
4. Use clear, plain language suitable for a field technician.

SOURCE FILES:
{context_block}

USER QUESTION: {question}

Respond in JSON format:
{{
    "answer": "Your detailed answer with inline citations like [equipment/pump-101.md]",
    "sources_used": ["equipment/pump-101.md", "workorders/wo-001.md"]
}}"""

        response = self._claude_client.messages.create(
            model="claude-opus-4-6",
            max_tokens=2048,
            messages=[{"role": "user", "content": prompt}]
        )

        try:
            text_response = response.content[0].text
            json_match = re.search(r'\{.*\}', text_response, re.DOTALL)
            if json_match:
                return json.loads(json_match.group(0))
            return json.loads(text_response)
        except (json.JSONDecodeError, IndexError):
            return MockLLM.generate_answer(question, context_files)

    def generate_maintenance_rca(
        self, equipment_data: dict, linked_records: list[dict]
    ) -> dict:
        """
        Generate a maintenance recommendation with RCA, citing specific records.

        Returns dict with: recommendation, cited_files, risk_level
        """
        if self.mode == "mock":
            return MockLLM.generate_maintenance_rca(equipment_data, linked_records)

        records_block = ""
        for r in linked_records:
            records_block += f"\n--- {r['type'].upper()}: {r['path']} ---\n{r['title']}\n{r['body']}\n"

        prompt = f"""You are a maintenance intelligence system. Given an equipment record and its linked maintenance history, generate a plain-language maintenance recommendation.

EQUIPMENT:
Title: {equipment_data.get('title', 'Unknown')}
Tag: {equipment_data.get('equipment_tag', 'Unknown')}
Description: {equipment_data.get('description', '')}
Body: {equipment_data.get('body', '')}

LINKED RECORDS:
{records_block}

Generate a recommendation in this tone: "here's what's degrading and here's the record that shows it" — not a bare probability score.

Respond in JSON:
{{
    "recommendation": "Detailed plain-language recommendation citing specific records...",
    "cited_files": ["workorders/wo-001.md", "inspections/insp-001.md"],
    "risk_level": "high|medium|low"
}}"""

        response = self._claude_client.messages.create(
            model="claude-opus-4-6",
            max_tokens=2048,
            messages=[{"role": "user", "content": prompt}]
        )

        try:
            text_response = response.content[0].text
            json_match = re.search(r'\{.*\}', text_response, re.DOTALL)
            if json_match:
                return json.loads(json_match.group(0))
            return json.loads(text_response)
        except (json.JSONDecodeError, IndexError):
            return MockLLM.generate_maintenance_rca(equipment_data, linked_records)


class MockLLM:
    """Deterministic mock LLM that returns plausible canned responses from seed data."""

    @staticmethod
    def extract_entities(text: str, source_filename: str = "") -> dict:
        """Return mock entities based on keyword detection in the text."""
        text_lower = text.lower()
        concepts = []

        # Detect equipment tags
        tag_pattern = re.compile(r'\b([A-Z]{1,3}-\d{2,4})\b')
        tags_found = tag_pattern.findall(text)

        if "pump" in text_lower or any("P-" in t for t in tags_found):
            equip_tag = next((t for t in tags_found if t.startswith("P-")), "P-101")
            concepts.append({
                "type": "equipment",
                "title": f"Centrifugal Pump {equip_tag}",
                "description": f"Industrial centrifugal pump {equip_tag} extracted from {source_filename}",
                "tags": ["pump", "centrifugal", "rotating-equipment", equip_tag.lower()],
                "equipment_tag": equip_tag,
                "body": f"## Overview\n\n{equip_tag} is an industrial centrifugal pump identified in the uploaded document.\n\n### Extracted Information\n\n{text[:500]}"
            })

        if "valve" in text_lower or any("V-" in t for t in tags_found):
            equip_tag = next((t for t in tags_found if t.startswith("V-")), "V-204")
            concepts.append({
                "type": "equipment",
                "title": f"Control Valve {equip_tag}",
                "description": f"Control valve {equip_tag} extracted from {source_filename}",
                "tags": ["valve", "control-valve", equip_tag.lower()],
                "equipment_tag": equip_tag,
                "body": f"## Overview\n\n{equip_tag} is a control valve identified in the uploaded document.\n\n### Extracted Information\n\n{text[:500]}"
            })

        if "work order" in text_lower or "maintenance" in text_lower or "repair" in text_lower:
            concepts.append({
                "type": "workorder",
                "title": f"Work Order — {source_filename or 'Uploaded Document'}",
                "description": "Maintenance work order extracted from uploaded document",
                "tags": ["maintenance", "work-order", "repair"],
                "body": f"## Work Order Details\n\n{text[:800]}"
            })

        if "procedure" in text_lower or "sop" in text_lower or "loto" in text_lower or "lock" in text_lower:
            concepts.append({
                "type": "procedure",
                "title": f"Procedure — {source_filename or 'Uploaded Document'}",
                "description": "Standard operating procedure extracted from uploaded document",
                "tags": ["procedure", "sop", "safety"],
                "body": f"## Procedure Details\n\n{text[:800]}"
            })

        if "inspection" in text_lower or "audit" in text_lower:
            concepts.append({
                "type": "inspection",
                "title": f"Inspection Report — {source_filename or 'Uploaded Document'}",
                "description": "Inspection report extracted from uploaded document",
                "tags": ["inspection", "audit", "assessment"],
                "body": f"## Inspection Details\n\n{text[:800]}"
            })

        if "incident" in text_lower or "near miss" in text_lower or "accident" in text_lower:
            concepts.append({
                "type": "incident",
                "title": f"Incident Report — {source_filename or 'Uploaded Document'}",
                "description": "Safety incident extracted from uploaded document",
                "tags": ["incident", "safety", "near-miss"],
                "body": f"## Incident Details\n\n{text[:800]}"
            })

        # Fallback: if nothing specific detected, create a generic entry
        if not concepts:
            concepts.append({
                "type": "equipment",
                "title": f"Document Extract — {source_filename or 'Unknown'}",
                "description": f"General entity extracted from {source_filename}",
                "tags": ["document", "extracted"],
                "body": f"## Extracted Content\n\n{text[:1000]}"
            })

        return {"concepts": concepts, "cross_references": []}

    @staticmethod
    def generate_crosslinks(
        new_concept_summary: str, existing_summaries: list[str]
    ) -> list[str]:
        """Mock crosslink detection via simple keyword overlap."""
        new_words = set(new_concept_summary.lower().split())
        matches = []
        for summary in existing_summaries:
            summary_words = set(summary.lower().split())
            overlap = new_words & summary_words
            # Filter out common words
            meaningful = overlap - {"the", "a", "an", "is", "of", "and", "to", "in", "for", "on", "with", "from"}
            if len(meaningful) >= 2:
                # Extract title from summary (assume first line or before " — ")
                title = summary.split(" — ")[0].split("\n")[0].strip()
                matches.append(title)
        return matches[:5]

    @staticmethod
    def generate_answer(question: str, context_files: list[dict]) -> dict:
        """Generate a mock answer from the provided context files."""
        q_lower = question.lower()

        if not context_files:
            return {
                "answer": "I don't have enough information in the knowledge base to answer this question confidently. No relevant concept files were found matching your query. Try rephrasing or check if relevant documents have been ingested.",
                "sources_used": []
            }

        # Build answer from available context
        sources = [cf["path"] for cf in context_files]
        snippets = []
        for cf in context_files[:3]:
            body_preview = cf.get("body", "")[:200]
            snippets.append(f"From [{cf['path']}]: {cf.get('title', 'Unknown')} — {body_preview}")

        answer_parts = [
            f"Based on {len(context_files)} relevant records in the knowledge base:\n"
        ]
        for snippet in snippets:
            answer_parts.append(f"• {snippet}\n")

        if "maintenance" in q_lower and "safety" in q_lower or "procedure" in q_lower:
            answer_parts.append(
                "\nThe maintenance records and safety procedures are cross-linked in the knowledge base. "
                "Please review the cited source files for complete details."
            )

        return {
            "answer": "\n".join(answer_parts),
            "sources_used": sources
        }

    @staticmethod
    def generate_maintenance_rca(
        equipment_data: dict, linked_records: list[dict]
    ) -> dict:
        """Generate a mock maintenance recommendation."""
        equip_title = equipment_data.get("title", "Unknown Equipment")
        equip_tag = equipment_data.get("equipment_tag", "")

        cited = [r["path"] for r in linked_records]

        wo_records = [r for r in linked_records if r.get("type") == "workorder"]
        insp_records = [r for r in linked_records if r.get("type") == "inspection"]
        incident_records = [r for r in linked_records if r.get("type") == "incident"]

        rec_parts = [f"## Maintenance Assessment for {equip_title} ({equip_tag})\n"]

        if wo_records:
            rec_parts.append(f"### Work Order History ({len(wo_records)} records)")
            rec_parts.append(f"The maintenance history shows {len(wo_records)} work orders. ")
            for wo in wo_records[:3]:
                rec_parts.append(f"- **{wo['title']}** [{wo['path']}]: {wo.get('body', '')[:150]}")

        if insp_records:
            rec_parts.append(f"\n### Inspection Findings ({len(insp_records)} records)")
            for insp in insp_records[:2]:
                rec_parts.append(f"- **{insp['title']}** [{insp['path']}]: {insp.get('body', '')[:150]}")

        if incident_records:
            rec_parts.append(f"\n### Related Incidents ({len(incident_records)} records)")
            rec_parts.append("⚠️ There are incident records linked to this equipment that should be reviewed:")
            for inc in incident_records[:2]:
                rec_parts.append(f"- **{inc['title']}** [{inc['path']}]")

        rec_parts.append("\n### Recommendation")
        rec_parts.append(
            f"Based on the linked records, {equip_title} shows a pattern of recurring maintenance needs. "
            f"The work order history suggests seal and bearing components are the primary failure modes. "
            f"Recommend scheduling a comprehensive inspection within the next maintenance window."
        )

        risk = "high" if incident_records else ("medium" if len(wo_records) > 1 else "low")

        return {
            "recommendation": "\n".join(rec_parts),
            "cited_files": cited,
            "risk_level": risk,
        }
