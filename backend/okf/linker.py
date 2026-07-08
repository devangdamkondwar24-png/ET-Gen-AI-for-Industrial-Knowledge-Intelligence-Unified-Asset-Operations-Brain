"""
OKF Linker — Cross-link resolution between concept files.
Given a new concept, finds existing concepts it should link to
and inserts bidirectional markdown links.
"""
from __future__ import annotations
import os
import re
from typing import List, Tuple
from .schema import ConceptFile, ConceptFrontmatter
from .reader import read_concept_file, list_all_concepts, extract_links


def find_linkable_concepts(
    knowledge_dir: str,
    new_concept: ConceptFile,
) -> List[str]:
    """
    Find existing concept files that the new concept should link to.
    Uses keyword matching on equipment tags, titles, and tags.

    Returns list of relative paths of linkable concepts.
    """
    candidates = []
    all_files = list_all_concepts(knowledge_dir)

    # Extract keywords from the new concept
    keywords = set()
    keywords.add(new_concept.frontmatter.title.lower())
    for tag in new_concept.frontmatter.tags:
        keywords.add(tag.lower())
    if new_concept.frontmatter.equipment_tag:
        keywords.add(new_concept.frontmatter.equipment_tag.lower())
    if new_concept.frontmatter.related_equipment:
        keywords.add(new_concept.frontmatter.related_equipment.lower())

    # Also extract equipment tag patterns from the body (e.g. P-101, V-204)
    tag_pattern = re.compile(r'\b([A-Z]{1,3}-\d{2,4})\b', re.IGNORECASE)
    body_tags = tag_pattern.findall(new_concept.body)
    for bt in body_tags:
        keywords.add(bt.lower())

    for file_path in all_files:
        if file_path == new_concept.path:
            continue

        existing = read_concept_file(knowledge_dir, file_path)
        if existing is None:
            continue

        # Check for keyword overlap
        existing_keywords = set()
        existing_keywords.add(existing.frontmatter.title.lower())
        for tag in existing.frontmatter.tags:
            existing_keywords.add(tag.lower())
        if existing.frontmatter.equipment_tag:
            existing_keywords.add(existing.frontmatter.equipment_tag.lower())

        if keywords & existing_keywords:
            candidates.append(file_path)

    return candidates


def compute_relative_link(source_path: str, target_path: str) -> str:
    """
    Compute a relative markdown link from source to target.
    Both paths are relative to knowledge/.

    Example: source="workorders/wo-001.md", target="equipment/pump-101.md"
    Result: "../equipment/pump-101.md"
    """
    source_dir = os.path.dirname(source_path)
    rel = os.path.relpath(target_path, source_dir).replace("\\", "/")
    return rel


def add_link_to_body(body: str, link_text: str, link_target: str) -> str:
    """
    Add a markdown link to the body if it doesn't already exist.
    Appends to a "## Related Concepts" section.
    """
    # Check if this link already exists
    if link_target in body:
        return body

    related_section = "## Related Concepts"
    link_line = f"- [{link_text}]({link_target})"

    if related_section in body:
        # Append to existing section
        idx = body.index(related_section) + len(related_section)
        # Find end of section (next ## or end of body)
        next_section = body.find("\n## ", idx)
        if next_section == -1:
            body = body.rstrip() + "\n" + link_line + "\n"
        else:
            body = body[:next_section].rstrip() + "\n" + link_line + "\n" + body[next_section:]
    else:
        body = body.rstrip() + "\n\n" + related_section + "\n\n" + link_line + "\n"

    return body


def cross_link_concepts(
    knowledge_dir: str,
    new_concept_path: str,
    target_paths: List[str],
) -> List[Tuple[str, str]]:
    """
    Create bidirectional links between the new concept and each target.

    Returns list of (source_path, target_path) pairs where links were added.
    """
    from .writer import write_concept_file

    links_added = []

    new_concept = read_concept_file(knowledge_dir, new_concept_path)
    if new_concept is None:
        return links_added

    for target_path in target_paths:
        target_concept = read_concept_file(knowledge_dir, target_path)
        if target_concept is None:
            continue

        # Add link from new → target
        rel_link = compute_relative_link(new_concept_path, target_path)
        new_body = add_link_to_body(
            new_concept.body,
            target_concept.frontmatter.title,
            rel_link
        )
        if new_body != new_concept.body:
            write_concept_file(
                knowledge_dir, new_concept_path,
                new_concept.frontmatter, new_body,
                log_message=f"Added cross-link from `{new_concept.filename}` → `{target_concept.filename}`"
            )
            new_concept = read_concept_file(knowledge_dir, new_concept_path)
            links_added.append((new_concept_path, target_path))

        # Add link from target → new (bidirectional)
        rev_link = compute_relative_link(target_path, new_concept_path)
        target_body = add_link_to_body(
            target_concept.body,
            new_concept.frontmatter.title,
            rev_link
        )
        if target_body != target_concept.body:
            write_concept_file(
                knowledge_dir, target_path,
                target_concept.frontmatter, target_body,
                log_message=f"Added cross-link from `{target_concept.filename}` → `{new_concept.filename}`"
            )
            links_added.append((target_path, new_concept_path))

    return links_added
