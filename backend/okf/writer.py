"""
OKF Writer — Creates and updates markdown concept files with YAML frontmatter.
Owns log.md appends: every create/modify operation records a line in the parent folder's log.md.
"""
from __future__ import annotations
import os
import yaml
from datetime import datetime
from .schema import ConceptFile, ConceptFrontmatter


def _ensure_dir(path: str):
    """Create directory if it doesn't exist."""
    os.makedirs(os.path.dirname(path), exist_ok=True)


def _append_log(knowledge_dir: str, folder: str, message: str):
    """
    Append a timestamped line to the folder's log.md.
    Creates log.md if it doesn't exist.
    """
    log_path = os.path.join(knowledge_dir, folder, "log.md")
    _ensure_dir(log_path)
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    line = f"- `{timestamp}` — {message}\n"

    # Create with header if new
    if not os.path.exists(log_path):
        with open(log_path, "w", encoding="utf-8") as f:
            f.write(f"# Change Log — {folder}\n\n")
            f.write("Chronological history of changes to this folder (append-only).\n\n")
            f.write(line)
    else:
        with open(log_path, "a", encoding="utf-8") as f:
            f.write(line)


def frontmatter_to_yaml(fm: ConceptFrontmatter) -> str:
    """
    Convert a ConceptFrontmatter to a clean YAML string.
    Omits None/empty optional fields for readability.
    """
    data = fm.model_dump(exclude_none=True)
    # Remove empty lists and empty strings
    data = {k: v for k, v in data.items() if v != "" and v != []}
    return yaml.dump(data, default_flow_style=False, sort_keys=False, allow_unicode=True).strip()


def write_concept_file(
    knowledge_dir: str,
    relative_path: str,
    frontmatter: ConceptFrontmatter,
    body: str,
    log_message: str | None = None,
) -> str:
    """
    Write an OKF concept file to disk.

    Args:
        knowledge_dir: Absolute path to the knowledge/ directory
        relative_path: Path relative to knowledge/, e.g. "equipment/pump-101.md"
        frontmatter: The YAML frontmatter data
        body: The markdown body text
        log_message: Custom log message. If None, auto-generates one.

    Returns:
        The absolute path of the written file.
    """
    full_path = os.path.join(knowledge_dir, relative_path)
    _ensure_dir(full_path)

    is_update = os.path.exists(full_path)

    yaml_str = frontmatter_to_yaml(frontmatter)
    content = f"---\n{yaml_str}\n---\n\n{body}\n"

    with open(full_path, "w", encoding="utf-8") as f:
        f.write(content)

    # Append to log.md
    folder = relative_path.split("/")[0] if "/" in relative_path else ""
    if folder:
        filename = relative_path.split("/")[-1]
        if log_message is None:
            action = "Updated" if is_update else "Created"
            log_message = f"{action} `{filename}` — {frontmatter.title}"
        _append_log(knowledge_dir, folder, log_message)

    return full_path


def ensure_index_md(knowledge_dir: str, folder: str, description: str = ""):
    """
    Create a folder's index.md if it doesn't already exist.
    index.md provides progressive disclosure — a summary of what the folder contains.
    """
    index_path = os.path.join(knowledge_dir, folder, "index.md")
    if os.path.exists(index_path):
        return

    _ensure_dir(index_path)
    title = folder.replace("-", " ").replace("_", " ").title()
    content = f"""---
type: index
title: "{title} Index"
description: "{description or f'Index of all {folder} concept files.'}"
---

# {title}

{description or f'This folder contains concept files related to {folder}.'}

## Contents

_This index is auto-updated as new concept files are added._
"""
    with open(index_path, "w", encoding="utf-8") as f:
        f.write(content)


def update_index_md(knowledge_dir: str, folder: str):
    """
    Regenerate the Contents section of a folder's index.md
    to list all concept files in the folder with links.
    """
    index_path = os.path.join(knowledge_dir, folder, "index.md")
    if not os.path.exists(index_path):
        ensure_index_md(knowledge_dir, folder)

    # Read existing content
    with open(index_path, "r", encoding="utf-8") as f:
        content = f.read()

    # List all concept files in this folder (exclude index.md, log.md)
    folder_path = os.path.join(knowledge_dir, folder)
    files = []
    if os.path.isdir(folder_path):
        for fname in sorted(os.listdir(folder_path)):
            if fname.endswith(".md") and fname not in ("index.md", "log.md"):
                files.append(fname)

    # Build the new contents section
    contents_lines = ["## Contents\n"]
    if files:
        for fname in files:
            # Read the file's title from frontmatter
            from .reader import read_concept_file
            concept = read_concept_file(knowledge_dir, f"{folder}/{fname}")
            title = concept.frontmatter.title if concept else fname.replace(".md", "").replace("-", " ").title()
            contents_lines.append(f"- [{title}](./{fname})")
    else:
        contents_lines.append("_No concept files yet._")

    new_contents = "\n".join(contents_lines) + "\n"

    # Replace everything after "## Contents"
    marker = "## Contents"
    if marker in content:
        idx = content.index(marker)
        content = content[:idx] + new_contents
    else:
        content += "\n" + new_contents

    with open(index_path, "w", encoding="utf-8") as f:
        f.write(content)
