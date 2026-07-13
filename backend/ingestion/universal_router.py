"""
Universal Document Router — Phase 3
Classifies incoming files by MIME type and routes them to the correct parser.
Supports: PDF, Scanned Images, Spreadsheets, Emails, CAD/P&IDs.
"""
import os
import magic
import logging
from dataclasses import dataclass, field
from typing import Optional

logger = logging.getLogger(__name__)

# ───────────────────────────────────────────────
# Output Contract — all parsers must return this
# ───────────────────────────────────────────────
@dataclass
class ParsedDocument:
    doc_type: str               # Detected type: pdf, spreadsheet, email, image, cad, unknown
    mime_type: str              # Raw MIME string
    full_text: str              # All extracted text joined
    pages: list                 # List of {page_num, text, metadata} dicts
    page_count: int
    provenance: dict            # Source file name, sheet names, email headers, etc.
    error: Optional[str] = None # Non-None means partial extraction


# ───────────────────────────────────────────────
# MIME → Category mapping
# ───────────────────────────────────────────────
MIME_MAP = {
    # PDFs
    "application/pdf": "pdf",
    # Images (scanned docs, P&ID photos)
    "image/jpeg": "image",
    "image/png":  "image",
    "image/tiff": "image",
    "image/bmp":  "image",
    # Spreadsheets
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "spreadsheet",
    "application/vnd.ms-excel": "spreadsheet",
    "text/csv": "spreadsheet",
    # Emails
    "application/vnd.ms-outlook": "email",
    "message/rfc822": "email",
    # CAD / Engineering Drawings
    "image/vnd.dxf": "cad",
    "application/dxf": "cad",
    "application/acad": "cad",
}


def classify(file_bytes: bytes) -> str:
    """Detect MIME type using libmagic, return our doc_type category."""
    mime = magic.from_buffer(file_bytes, mime=True)
    return MIME_MAP.get(mime, "unknown"), mime


# ───────────────────────────────────────────────
# Sub-parsers
# ───────────────────────────────────────────────

def _parse_spreadsheet(file_bytes: bytes, filename: str, provenance: dict) -> ParsedDocument:
    """Parse XLSX / XLS / CSV into normalized text per sheet/row."""
    import pandas as pd
    import io

    ext = filename.lower().split(".")[-1]
    pages = []
    full_text_parts = []

    try:
        if ext == "csv":
            df = pd.read_csv(io.BytesIO(file_bytes))
            text = df.to_string(index=False)
            pages.append({"page_num": 1, "text": text, "metadata": {"sheet": "CSV"}})
            full_text_parts.append(text)
        else:
            xls = pd.ExcelFile(io.BytesIO(file_bytes))
            for i, sheet_name in enumerate(xls.sheet_names):
                df = xls.parse(sheet_name)
                text = f"Sheet: {sheet_name}\n{df.to_string(index=False)}"
                pages.append({"page_num": i + 1, "text": text, "metadata": {"sheet": sheet_name}})
                full_text_parts.append(text)

        provenance["sheet_names"] = [p["metadata"]["sheet"] for p in pages]
        return ParsedDocument(
            doc_type="spreadsheet", mime_type="spreadsheet",
            full_text="\n\n".join(full_text_parts), pages=pages,
            page_count=len(pages), provenance=provenance
        )
    except Exception as e:
        logger.error(f"[UniversalRouter] Spreadsheet parse error: {e}")
        return ParsedDocument(
            doc_type="spreadsheet", mime_type="spreadsheet",
            full_text="", pages=[], page_count=0, provenance=provenance, error=str(e)
        )


def _parse_email(file_bytes: bytes, filename: str, provenance: dict) -> ParsedDocument:
    """Parse .msg or .eml email files into normalized text."""
    ext = filename.lower().split(".")[-1]
    try:
        if ext == "msg":
            import extract_msg
            import tempfile, os
            with tempfile.NamedTemporaryFile(suffix=".msg", delete=False) as tmp:
                tmp.write(file_bytes)
                tmp_path = tmp.name
            try:
                msg = extract_msg.Message(tmp_path)
                body = msg.body or ""
                subject = msg.subject or ""
                sender = msg.sender or ""
                date = str(msg.date) if msg.date else ""
            finally:
                os.unlink(tmp_path)
        else:
            import email
            msg = email.message_from_bytes(file_bytes)
            subject = msg.get("Subject", "")
            sender = msg.get("From", "")
            date = msg.get("Date", "")
            body = ""
            if msg.is_multipart():
                for part in msg.walk():
                    if part.get_content_type() == "text/plain":
                        body += part.get_payload(decode=True).decode("utf-8", errors="replace")
            else:
                body = msg.get_payload(decode=True).decode("utf-8", errors="replace")

        provenance["email_subject"] = subject
        provenance["email_sender"] = sender
        provenance["email_date"] = date

        full_text = f"Subject: {subject}\nFrom: {sender}\nDate: {date}\n\n{body}"
        pages = [{"page_num": 1, "text": full_text, "metadata": {"subject": subject, "sender": sender}}]

        return ParsedDocument(
            doc_type="email", mime_type="email",
            full_text=full_text, pages=pages,
            page_count=1, provenance=provenance
        )
    except Exception as e:
        logger.error(f"[UniversalRouter] Email parse error: {e}")
        return ParsedDocument(
            doc_type="email", mime_type="email",
            full_text="", pages=[], page_count=0, provenance=provenance, error=str(e)
        )


def _parse_cad(file_bytes: bytes, filename: str, provenance: dict) -> ParsedDocument:
    """
    Parse DXF files by extracting text entities from vector layers.
    Falls back gracefully if not a valid DXF.
    """
    try:
        import fitz  # PyMuPDF for vector PDFs / SVG
        import io
        # Treat as PDF-like vector drawing — extract text layer
        doc = fitz.open(stream=file_bytes, filetype="pdf")
        pages = []
        full_parts = []
        for i, page in enumerate(doc):
            text = page.get_text("text").strip()
            if text:
                pages.append({"page_num": i + 1, "text": text, "metadata": {"layer": "text_layer"}})
                full_parts.append(text)
        provenance["drawing_pages"] = len(pages)
        return ParsedDocument(
            doc_type="cad", mime_type="cad",
            full_text="\n".join(full_parts), pages=pages,
            page_count=len(pages), provenance=provenance
        )
    except Exception as e:
        logger.warning(f"[UniversalRouter] CAD/DXF parse fallback to OCR signal: {e}")
        # Signal back to caller that OCR is needed
        return ParsedDocument(
            doc_type="cad", mime_type="cad",
            full_text="", pages=[], page_count=0, provenance=provenance,
            error="CAD_OCR_NEEDED"
        )


def _parse_via_tika(file_bytes: bytes, filename: str, doc_type: str, provenance: dict) -> ParsedDocument:
    """General fallback: use Tika for PDFs, images, and unknowns."""
    import requests
    tika_url = os.environ.get("TIKA_SERVER_URL", "http://localhost:9998")
    try:
        resp = requests.put(
            f"{tika_url}/rmeta/text",
            data=file_bytes,
            headers={"Accept": "application/json"},
            timeout=60
        )
        resp.raise_for_status()
        rmeta = resp.json()

        pages = []
        full_parts = []
        for i, part in enumerate(rmeta):
            text = part.get("X-TIKA:content", "").strip()
            if text:
                pages.append({
                    "page_num": i + 1,
                    "text": text,
                    "metadata": {k: v for k, v in part.items() if k != "X-TIKA:content"}
                })
                full_parts.append(text)

        main_meta = rmeta[0] if rmeta else {}
        provenance["tika_content_type"] = main_meta.get("Content-Type", "")
        provenance["author"] = main_meta.get("dc:creator", "")

        return ParsedDocument(
            doc_type=doc_type, mime_type=main_meta.get("Content-Type", ""),
            full_text="\n\n".join(full_parts), pages=pages,
            page_count=len(pages), provenance=provenance
        )
    except Exception as e:
        logger.error(f"[UniversalRouter] Tika parse failed: {e}")
        return ParsedDocument(
            doc_type=doc_type, mime_type="",
            full_text="", pages=[], page_count=0, provenance=provenance, error=str(e)
        )


# ───────────────────────────────────────────────
# Main Router Entry Point
# ───────────────────────────────────────────────

def route_and_parse(file_bytes: bytes, filename: str, extra_metadata: dict = None) -> ParsedDocument:
    """
    Entry point for all document ingestion.
    Classifies the file and dispatches to the correct sub-parser.
    Returns a normalized ParsedDocument.
    """
    extra_metadata = extra_metadata or {}
    provenance = {
        "filename": filename,
        "file_size_bytes": len(file_bytes),
        **extra_metadata
    }

    doc_type, mime_type = classify(file_bytes)
    logger.info(f"[UniversalRouter] '{filename}' → type={doc_type}, mime={mime_type}")

    if doc_type == "spreadsheet":
        return _parse_spreadsheet(file_bytes, filename, provenance)

    elif doc_type == "email":
        return _parse_email(file_bytes, filename, provenance)

    elif doc_type == "cad":
        result = _parse_cad(file_bytes, filename, provenance)
        # If CAD needs OCR, fall through to Tika (which will use OCR on images)
        if result.error == "CAD_OCR_NEEDED":
            return _parse_via_tika(file_bytes, filename, doc_type, provenance)
        return result

    elif doc_type in ("pdf", "image", "unknown"):
        # Check if it's a P&ID image for heuristic parsing
        if doc_type == "image" and ("pid" in filename.lower() or "p&id" in filename.lower() or "drawing" in filename.lower()):
            from ingestion.pid_parser import parse_pid_heuristic
            heuristic_text = parse_pid_heuristic(file_bytes, filename)
            
            # Still run through Tika/OCR for any text labels, but prepend the heuristic topology
            parsed = _parse_via_tika(file_bytes, filename, doc_type, provenance)
            parsed.full_text = heuristic_text + "\n\n" + parsed.full_text
            if parsed.pages:
                parsed.pages[0]["text"] = heuristic_text + "\n\n" + parsed.pages[0]["text"]
            else:
                parsed.pages = [{"page_num": 1, "text": heuristic_text, "metadata": {"heuristic": True}}]
                parsed.page_count = 1
            return parsed

        # PDF with text layer or scanned image — Tika handles both,
        # the OCR worker picks up the pieces if text is too short.
        return _parse_via_tika(file_bytes, filename, doc_type, provenance)

    else:
        logger.warning(f"[UniversalRouter] Unknown type '{doc_type}' for {filename}")
        return _parse_via_tika(file_bytes, filename, "unknown", provenance)
