# ET Gen: Industrial Knowledge Intelligence Platform

An enterprise-grade, **fully offline** platform designed to eliminate knowledge fragmentation in asset-intensive industries. By unifying engineering drawings, maintenance work orders, safety procedures, inspection reports, and regulatory records into a single navigable knowledge base, it bridges the gap between siloed data and actionable operational insights.

> **Zero data leakage. Air-gapped deployment. No cloud dependencies.**

---

## Architecture & Core Technologies

### Backend
| Component | Technology |
|---|---|
| API | FastAPI (Python 3.11) |
| Knowledge Graph | Neo4j Community Edition — industrial ontology (Equipment → FailureMode → Cause → Action) |
| Agentic Orchestration | LangGraph multi-agent workflows (RCA, Compliance, Lessons Learned) |
| Vector + Keyword Search | Elasticsearch 8.x — Hybrid Search (BM25 + kNN cosine similarity) |
| Embeddings | `sentence-transformers` (`all-MiniLM-L6-v2`) — 384-dim, CPU-only |
| Generative AI | Ollama (local open-weights LLM, e.g. `llama3.2:1b`, `mistral`) |
| Document Storage | MinIO — S3-compatible object store |
| Relational DB | PostgreSQL — job tracking & metadata |
| Universal Ingestion | MIME-based router (`libmagic`) → Apache Tika, Tesseract OCR, PyMuPDF, Pandas, extract-msg |
| Proactive Alerts | SSE (`sse-starlette`) — server-sent event stream for live warnings |
| PDF Evidence Export | ReportLab — offline audit-ready PDF report generation |

### Frontend — TECH-OS v2.4
| Component | Technology |
|---|---|
| Framework | React 18 + Vite |
| Styling | Tailwind CSS with custom Stitch design tokens |
| Design System | TECH-OS dark-mode HUD — industrial glassmorphic aesthetic |
| Navigation | Mobile-first bottom navigation bar |
| Fonts | Geist (headlines), JetBrains Mono (labels), Inter (body) |

---

## Key Features

### 🤖 Agentic Workflows
- **RCA Agent** — LangGraph workflow that retrieves asset history from Neo4j, performs hybrid search for manual evidence, and synthesizes ranked root-cause hypotheses with confidence scores and source citations.
- **Compliance Agent** — Automated regulatory gap analysis cross-referencing Neo4j regulation nodes (OISD-STD-105, Factories Act 1948, PESO SMPV Rules) against procedure documentation. Exports PDF audit packages via ReportLab.
- **Lessons Learned Engine** — Batch intelligence pipeline detecting recurring failure patterns and writing insight nodes back into the knowledge graph.

### 📱 TECH-OS Frontend (Mobile-First)
- **Copilot Mode** — Industrial chat interface with confidence-scored responses, source citations, and a sliding bottom-sheet evidence drawer.
- **Evidence Search** — Full-text + semantic search with document-type badges (OISD, Standard, Internal), result highlighting, and asset linkage.
- **Asset View** — Per-asset HUD showing telemetry logs, compliance status, linked work orders, incident history, and graph relationships.
- **Compliance Mode** — Industrial gap card workflow with severity coloring (critical/observation), evidence locker, and compliance trend chart.
- **RCA Mode** — Hypothesis list + evidence panel with confidence bars and citation cards.
- **Alerts** — Proactive SSE-driven warning drawer for anomaly detection and lessons-learned pushes.

### 🏗️ Regulatory Grounding (India-specific)
- OISD-STD-105 (Petroleum Sector Safety)
- Factories Act 1948 (Sections 21, 11, 36, 40)
- PESO SMPV (Pressure Vessel Rules)
- Seeded offline into Elasticsearch — no external API calls

### 📄 Universal Document Ingestion
- PDF (text + scanned/OCR), DOCX, XLSX, CSV, images (JPG/PNG), email archives (.msg)
- Async OCR fallback via Tesseract when Tika fails on scanned documents
- Graph triple extraction via Ollama on every ingested chunk

---

## Prerequisites

- Docker & Docker Compose
- Git

> All Python dependencies, Tesseract, libmagic, and Java (Tika) are fully containerized — no host installation needed.

---

## Setup & Running

### 1. Clone the repository
```bash
git clone https://github.com/devangdamkondwar24-png/ET-Gen-AI-for-Industrial-Knowledge-Intelligence-Unified-Asset-Operations-Brain.git
cd "ET-Gen-AI-for-Industrial-Knowledge-Intelligence-Unified-Asset-Operations-Brain"
```

### 2. Start the backend stack
```bash
cd backend
docker-compose up -d --build
```

Services started:
| Container | Port |
|---|---|
| `etgen_postgres` | 5432 |
| `etgen_minio` | 9000, 9001 |
| `etgen_elasticsearch` | 9200 |
| `etgen_neo4j` | 7474, 7687 |
| `etgen_tika` | 9998 |
| `etgen_ollama` | 11434 |
| `etgen_ocr_worker` | 8000 |

### 3. Pull a local LLM
```bash
docker exec -d etgen_ollama ollama pull llama3.2:1b
```
For higher-quality responses (requires more RAM):
```bash
docker exec -d etgen_ollama ollama pull mistral
```

### 4. Seed regulatory data (first run only)
```bash
docker exec etgen_ocr_worker python scripts/seed_indian_regs.py
docker exec etgen_ocr_worker python scripts/seed_external_incidents.py
```

### 5. Run the frontend
```bash
cd frontend
npm install
npm run dev
```
Open `http://localhost:5173` in your browser.

---

## System Workflow

```
Ingest → Route → Parse → OCR Fallback → Extract Graph Triples → Chunk → Index → Search & Synthesize
```

1. **Ingest** — Document uploaded via API, saved to MinIO.
2. **Route** — `universal_router.py` detects MIME type via `libmagic`.
3. **Parse & OCR** — Specialized parsers (PyMuPDF, Pandas, Tika); async Tesseract OCR fallback for scanned PDFs.
4. **Graph Extraction** — `graph_extractor.py` calls Ollama to parse triples into Neo4j.
5. **Chunk & Index** — Text normalized, chunked, embedded, and indexed into Elasticsearch.
6. **Agentic Synthesis** — LangGraph agent performs hybrid search + graph traversal → grounded answer with citations.

---

## API Endpoints (selected)

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/ingest/upload` | Upload any document |
| `POST` | `/api/agents/chat` | Copilot RAG chat |
| `POST` | `/api/agents/rca` | Run RCA analysis for an asset |
| `POST` | `/api/agents/compliance` | Run compliance gap check |
| `GET` | `/api/alerts/stream` | SSE stream for proactive alerts |
| `GET` | `/api/compliance/report` | Download PDF audit report |
| `POST` | `/api/agents/lessons-learned/run` | Trigger lessons-learned batch job |
| `GET` | `/docs` | FastAPI Swagger UI |

---

## Project Structure

```
et gen/
├── backend/
│   ├── agents/          # RCA, Compliance, Lessons Learned LangGraph agents
│   ├── api/             # FastAPI route handlers
│   ├── graph/           # Neo4j client & ontology
│   ├── ingestion/       # Universal router, OCR worker, graph extractor
│   ├── scripts/         # Seeding scripts for regulations & incidents
│   ├── dataset/         # Offline corpus (Indian regs, external incidents)
│   └── docker-compose.yml
└── frontend/
    ├── src/
    │   ├── pages/       # Copilot, Evidence, Asset, Compliance, RCA, Lessons
    │   ├── components/  # Sidebar (bottom nav), Topbar, Alerts
    │   ├── api/         # TypeScript API client (agents.ts)
    │   └── context/     # AppContext (global state)
    └── tailwind.config.js
```

---

## Design Constraints

- ✅ **Air-gapped** — zero external API calls at runtime
- ✅ **CPU-only embeddings** — no GPU required
- ✅ **Mobile-first UI** — thumb-friendly, bottom-nav, large touch targets
- ✅ **Confidence-first** — every AI answer shows a confidence score and source citations
- ✅ **Indian regulatory grounding** — OISD, Factories Act, PESO seeded offline
- ⚠️ **P&ID parsing** — heuristic extraction only; not industrial-grade computer vision
