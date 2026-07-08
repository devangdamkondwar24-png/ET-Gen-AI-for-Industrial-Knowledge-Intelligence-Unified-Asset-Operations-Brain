"""
OKF Index Manager — SQLite FTS5 full-text search index.
Builds and maintains a keyword search index over all OKF concept files.
Also generates/updates index.md files for each folder.
"""
from __future__ import annotations
import os
import sqlite3
from typing import List, Tuple
from .reader import read_concept_file, list_all_concepts
from .writer import ensure_index_md, update_index_md


class IndexManager:
    """Manages the SQLite FTS5 search index for the knowledge/ directory."""

    def __init__(self, knowledge_dir: str, db_path: str | None = None):
        self.knowledge_dir = os.path.abspath(knowledge_dir)
        if db_path is None:
            # Store the index DB alongside the knowledge directory, not inside it
            parent = os.path.dirname(self.knowledge_dir)
            db_path = os.path.join(parent, "knowledge_index.db")
        self.db_path = db_path
        self._init_db()

    def _init_db(self):
        """Create the FTS5 virtual table if it doesn't exist."""
        conn = sqlite3.connect(self.db_path)
        conn.execute("""
            CREATE VIRTUAL TABLE IF NOT EXISTS concepts_fts USING fts5(
                path,
                title,
                type,
                tags,
                description,
                body,
                equipment_tag,
                content='',
                tokenize='porter unicode61'
            )
        """)
        conn.commit()
        conn.close()

    def rebuild_index(self):
        """
        Drop and rebuild the entire FTS index from the knowledge/ directory.
        Call after bulk changes or on startup.
        """
        conn = sqlite3.connect(self.db_path)
        conn.execute("DELETE FROM concepts_fts")

        all_files = list_all_concepts(self.knowledge_dir)
        for rel_path in all_files:
            concept = read_concept_file(self.knowledge_dir, rel_path)
            if concept is None:
                continue
            conn.execute(
                "INSERT INTO concepts_fts(path, title, type, tags, description, body, equipment_tag) VALUES (?, ?, ?, ?, ?, ?, ?)",
                (
                    concept.path,
                    concept.frontmatter.title,
                    concept.frontmatter.type.value,
                    " ".join(concept.frontmatter.tags),
                    concept.frontmatter.description,
                    concept.body,
                    concept.frontmatter.equipment_tag or "",
                )
            )

        conn.commit()
        conn.close()

        # Also update all index.md files
        self._update_all_indexes()

    def index_file(self, relative_path: str):
        """Add or update a single file in the FTS index."""
        concept = read_concept_file(self.knowledge_dir, relative_path)
        if concept is None:
            return

        conn = sqlite3.connect(self.db_path)
        # Remove old entry if exists
        conn.execute("DELETE FROM concepts_fts WHERE path = ?", (relative_path,))
        conn.execute(
            "INSERT INTO concepts_fts(path, title, type, tags, description, body, equipment_tag) VALUES (?, ?, ?, ?, ?, ?, ?)",
            (
                concept.path,
                concept.frontmatter.title,
                concept.frontmatter.type.value,
                " ".join(concept.frontmatter.tags),
                concept.frontmatter.description,
                concept.body,
                concept.frontmatter.equipment_tag or "",
            )
        )
        conn.commit()
        conn.close()

        # Update the folder's index.md
        folder = concept.folder
        if folder:
            update_index_md(self.knowledge_dir, folder)

    def search(self, query: str, limit: int = 20) -> List[Tuple[str, float]]:
        """
        Search the FTS index for matching concept files.

        Returns list of (relative_path, rank_score) tuples.
        Higher rank score = better match.
        FTS5 rank is negative (closer to 0 = better), we negate for intuitive use.
        """
        conn = sqlite3.connect(self.db_path)

        # Clean query for FTS5 — handle basic cases
        clean_query = self._clean_query(query)

        try:
            cursor = conn.execute(
                """
                SELECT path, rank
                FROM concepts_fts
                WHERE concepts_fts MATCH ?
                ORDER BY rank
                LIMIT ?
                """,
                (clean_query, limit)
            )
            results = [(row[0], -row[1]) for row in cursor.fetchall()]
        except sqlite3.OperationalError:
            # If FTS query syntax is invalid, fall back to simple search
            # Split into individual terms and OR them
            terms = query.strip().split()
            if not terms:
                return []
            fallback_query = " OR ".join(f'"{t}"' for t in terms if t.strip())
            try:
                cursor = conn.execute(
                    "SELECT path, rank FROM concepts_fts WHERE concepts_fts MATCH ? ORDER BY rank LIMIT ?",
                    (fallback_query, limit)
                )
                results = [(row[0], -row[1]) for row in cursor.fetchall()]
            except sqlite3.OperationalError:
                results = []

        conn.close()
        return results

    def _clean_query(self, query: str) -> str:
        """
        Clean a natural language query for FTS5 MATCH syntax.
        Converts to implicit OR between terms for broader matching.
        """
        # Remove special characters that break FTS5
        import re
        cleaned = re.sub(r'[^\w\s\-]', ' ', query)
        terms = cleaned.strip().split()
        if not terms:
            return '""'

        # Use OR between terms for broad matching
        # Quote terms with hyphens (equipment tags like P-101)
        quoted = []
        for t in terms:
            if '-' in t:
                quoted.append(f'"{t}"')
            else:
                quoted.append(t)

        return " OR ".join(quoted)

    def _update_all_indexes(self):
        """Update index.md for every folder in the knowledge directory."""
        if not os.path.isdir(self.knowledge_dir):
            return

        for entry in os.listdir(self.knowledge_dir):
            folder_path = os.path.join(self.knowledge_dir, entry)
            if os.path.isdir(folder_path) and not entry.startswith("."):
                ensure_index_md(self.knowledge_dir, entry)
                update_index_md(self.knowledge_dir, entry)
