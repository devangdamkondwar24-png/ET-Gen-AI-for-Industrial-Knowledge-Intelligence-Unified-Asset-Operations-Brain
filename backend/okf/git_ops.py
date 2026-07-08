"""
OKF Git Operations — Manages the knowledge/ directory as a git repository.
Provides programmatic init, commit, and log operations for audit trail.
"""
from __future__ import annotations
import os
import subprocess
from datetime import datetime
from typing import List, Optional


class GitOps:
    """Manages git operations for the knowledge/ directory."""

    def __init__(self, knowledge_dir: str):
        self.knowledge_dir = os.path.abspath(knowledge_dir)

    def _run(self, *args: str, check: bool = True) -> subprocess.CompletedProcess:
        """Run a git command in the knowledge directory."""
        return subprocess.run(
            ["git"] + list(args),
            cwd=self.knowledge_dir,
            capture_output=True,
            text=True,
            check=check,
        )

    def is_initialized(self) -> bool:
        """Check if the knowledge directory is a git repository."""
        return os.path.isdir(os.path.join(self.knowledge_dir, ".git"))

    def init(self):
        """Initialize git repository if not already initialized."""
        if self.is_initialized():
            return

        os.makedirs(self.knowledge_dir, exist_ok=True)
        self._run("init")
        self._run("config", "user.email", "okf-system@industrial-knowledge.local")
        self._run("config", "user.name", "OKF System")

    def add_and_commit(self, message: str, files: Optional[List[str]] = None):
        """
        Stage files and create a commit.

        Args:
            message: Commit message
            files: Specific files to add (relative to knowledge/).
                   If None, stages all changes.
        """
        if not self.is_initialized():
            self.init()

        if files:
            for f in files:
                self._run("add", f, check=False)
        else:
            self._run("add", "-A")

        # Check if there's anything to commit
        result = self._run("status", "--porcelain", check=False)
        if not result.stdout.strip():
            return  # Nothing to commit

        self._run("commit", "-m", message, check=False)

    def get_log(self, max_entries: int = 50) -> List[dict]:
        """
        Get git log as a list of dicts with hash, date, message.
        """
        if not self.is_initialized():
            return []

        result = self._run(
            "log",
            f"--max-count={max_entries}",
            "--format=%H|%aI|%s",
            check=False
        )

        if not result.stdout.strip():
            return []

        entries = []
        for line in result.stdout.strip().split("\n"):
            parts = line.split("|", 2)
            if len(parts) == 3:
                entries.append({
                    "hash": parts[0],
                    "date": parts[1],
                    "message": parts[2],
                })
        return entries

    def get_file_history(self, file_path: str, max_entries: int = 20) -> List[dict]:
        """Get git log for a specific file."""
        if not self.is_initialized():
            return []

        result = self._run(
            "log",
            f"--max-count={max_entries}",
            "--format=%H|%aI|%s",
            "--follow",
            "--", file_path,
            check=False,
        )

        if not result.stdout.strip():
            return []

        entries = []
        for line in result.stdout.strip().split("\n"):
            parts = line.split("|", 2)
            if len(parts) == 3:
                entries.append({
                    "hash": parts[0],
                    "date": parts[1],
                    "message": parts[2],
                })
        return entries
