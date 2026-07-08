"""
OKF Reader — Parses markdown concept files into structured data.
Extracts YAML frontmatter, markdown body, and all markdown links.
"""
from __future__ import annotations
import os
import re
import yaml
from typing import List, Optional
from .schema import ConceptFile, ConceptFrontmatter, ParsedLink

# Regex to match markdown links: [text](target)
LINK_PATTERN = re.compile(r'\[([^\]]+)\]\(([^)]+\.md)\)')


def parse_frontmatter_and_body(content: str) -> tuple[dict, str]:
    """Split a markdown file into YAML frontmatter dict and body string."""
    content = content.strip()
    if not content.startswith("---"):
        return {}, content

    # Find the closing ---
    end_idx = content.find("---", 3)
    if end_idx == -1:
        return {}, content

    frontmatter_str = content[3:end_idx].strip()
    body = content[end_idx + 3:].strip()

    try:
        frontmatter = yaml.safe_load(frontmatter_str) or {}
    except yaml.YAMLError:
        frontmatter = {}

    return frontmatter, body


def extract_links(body: str) -> List[ParsedLink]:
    """Extract all markdown links from the body that point to .md files."""
    links = []
    for match in LINK_PATTERN.finditer(body):
        links.append(ParsedLink(
            text=match.group(1),
            target=match.group(2),
        ))
    return links


def read_concept_file(knowledge_dir: str, relative_path: str) -> Optional[ConceptFile]:
    """
    Read and parse a single OKF concept file.

    Args:
        knowledge_dir: Absolute path to the knowledge/ directory
        relative_path: Path relative to knowledge/, e.g. "equipment/pump-101.md"

    Returns:
        ConceptFile or None if file doesn't exist or can't be parsed
    """
    full_path = os.path.join(knowledge_dir, relative_path)
    if not os.path.isfile(full_path):
        return None

    try:
        with open(full_path, "r", encoding="utf-8") as f:
            content = f.read()
    except (IOError, UnicodeDecodeError):
        return None

    fm_dict, body = parse_frontmatter_and_body(content)

    if "type" not in fm_dict:
        return None

    try:
        frontmatter = ConceptFrontmatter(**fm_dict)
    except Exception:
        return None

    links = extract_links(body)

    # Check which links actually resolve to existing files
    file_dir = os.path.dirname(full_path)
    for link in links:
        target_abs = os.path.normpath(os.path.join(file_dir, link.target))
        link.resolved = os.path.isfile(target_abs)

    return ConceptFile(
        path=relative_path.replace("\\", "/"),
        frontmatter=frontmatter,
        body=body,
        outgoing_links=links,
    )


def list_all_concepts(knowledge_dir: str) -> List[str]:
    """
    List all .md concept files in the knowledge directory.
    Excludes index.md and log.md files.

    Returns list of relative paths like ["equipment/pump-101.md", ...]
    """
    concepts = []
    for root, _dirs, files in os.walk(knowledge_dir):
        for fname in files:
            if not fname.endswith(".md"):
                continue
            if fname in ("index.md", "log.md"):
                continue
            full = os.path.join(root, fname)
            rel = os.path.relpath(full, knowledge_dir).replace("\\", "/")
            concepts.append(rel)
    return sorted(concepts)


def get_incoming_links(knowledge_dir: str, target_path: str) -> List[str]:
    """
    Find all concept files that link TO the given target_path.
    Returns list of relative paths of files that contain a link to target_path.
    """
    incoming = []
    all_files = list_all_concepts(knowledge_dir)

    for file_path in all_files:
        if file_path == target_path:
            continue
        concept = read_concept_file(knowledge_dir, file_path)
        if concept is None:
            continue
        for link in concept.outgoing_links:
            # Resolve the link relative to the source file's directory
            source_dir = os.path.dirname(file_path)
            resolved = os.path.normpath(os.path.join(source_dir, link.target)).replace("\\", "/")
            if resolved == target_path:
                incoming.append(file_path)
                break

    return incoming
