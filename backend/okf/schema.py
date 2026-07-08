"""
Pydantic models for OKF concept files.
Each concept type has a YAML frontmatter schema and a markdown body.
"""
from __future__ import annotations
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from enum import Enum


class ConceptType(str, Enum):
    EQUIPMENT = "equipment"
    PROCEDURE = "procedure"
    WORKORDER = "workorder"
    INSPECTION = "inspection"
    REGULATION = "regulation"
    INCIDENT = "incident"


class ConceptFrontmatter(BaseModel):
    """Base frontmatter fields shared by all concept types."""
    type: ConceptType
    title: str
    description: str = ""
    tags: List[str] = Field(default_factory=list)
    timestamp: str = Field(default_factory=lambda: datetime.now().isoformat())
    status: Optional[str] = None  # e.g. "active", "needs_review"

    # Type-specific optional fields
    equipment_tag: Optional[str] = None
    equipment_class: Optional[str] = None
    location: Optional[str] = None
    manufacturer: Optional[str] = None

    procedure_id: Optional[str] = None
    procedure_type: Optional[str] = None  # e.g. "LOTO", "SOP", "Emergency"
    applicable_equipment: Optional[List[str]] = None

    workorder_id: Optional[str] = None
    assigned_to: Optional[str] = None
    priority: Optional[str] = None
    wo_status: Optional[str] = None  # "open", "completed", "cancelled"
    related_equipment: Optional[str] = None

    inspection_id: Optional[str] = None
    inspector: Optional[str] = None
    inspection_type: Optional[str] = None
    result: Optional[str] = None
    next_due: Optional[str] = None

    regulation_body: Optional[str] = None
    regulation_id: Optional[str] = None
    jurisdiction: Optional[str] = None
    effective_date: Optional[str] = None

    incident_id: Optional[str] = None
    severity: Optional[str] = None  # "critical", "high", "medium", "low"
    incident_type: Optional[str] = None  # "near-miss", "injury", "equipment-failure"
    root_cause: Optional[str] = None
    corrective_action: Optional[str] = None


class ParsedLink(BaseModel):
    """A markdown link extracted from a concept file body."""
    text: str        # Display text of the link
    target: str      # Relative path target (e.g. ../equipment/pump-101.md)
    resolved: bool = False  # Whether the target file actually exists


class ConceptFile(BaseModel):
    """A fully parsed OKF concept file."""
    path: str                          # Relative path within knowledge/ (e.g. equipment/pump-101.md)
    frontmatter: ConceptFrontmatter
    body: str                          # Markdown body text
    outgoing_links: List[ParsedLink] = Field(default_factory=list)

    @property
    def filename(self) -> str:
        return self.path.split("/")[-1]

    @property
    def folder(self) -> str:
        parts = self.path.split("/")
        return parts[0] if len(parts) > 1 else ""
