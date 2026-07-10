# ET Gen: Industrial Knowledge Intelligence Platform

An enterprise-grade, fully offline platform designed to mitigate knowledge fragmentation in asset-intensive industries. By unifying engineering drawings, maintenance work orders, safety procedures, inspection reports, and regulatory records into a single, navigable knowledge base, this system bridges the gap between siloed data and actionable operational insights.

This repository implements a **fully offline, highly secure Agentic GraphRAG Engine** ensuring zero data leakage for strict enterprise environments.

## Architecture & Core Technologies

This system is built as a highly robust, containerized microservice architecture.

*   **API Backend**: FastAPI (Python 3.11).
*   **Knowledge Graph**: **Neo4j** Community Edition executing industrial ontology reasoning and tracking asset relationships (e.g., Equipment -> FailureMode -> Cause).
*   **Agentic Orchestration**: **LangGraph** multi-agent workflows for complex tasks (Root Cause Analysis, Regulatory Compliance, Batch Pattern Intelligence).
*   **Vector & Keyword Search**: Elasticsearch 8.x executing true **Hybrid Search** (BM25 + kNN using `cosineSimilarity` script scoring).
*   **Embeddings**: `sentence-transformers` (`all-MiniLM-L6-v2`) generating 384-dimensional dense vectors strictly on CPU.
*   **Generative AI**: Local **Ollama** container running open-weights models (e.g., `mistral`) for both chat and structured graph extraction.
*   **Document Storage**: MinIO (S3-compatible object storage) for raw files and OCR assets.
*   **Relational Database**: PostgreSQL for job tracking and metadata.
*   **Universal Ingestion**: A robust MIME-based router (`libmagic`) wrapping Apache Tika, Tesseract OCR, PyMuPDF, Pandas (for spreadsheets), and extract-msg (for email archives).
*   **Frontend**: A generated React SPA via Google Stitch, using a Light Minimalist "Clinical Cockpit" design system.

## Phase 3 & 4 Highlights

- **Industrial Ontology (Neo4j)**: 10 structured nodes (Equipment, FailureMode, Cause, Action, WorkOrder, etc.) with strict Pydantic validation and Cypher constraints.
- **RCA Agent**: A multi-step LangGraph workflow that retrieves graph history, performs hybrid search for manual evidence, and synthesizes root cause hypotheses with strict citation enforcement.
- **Compliance Agent**: Automates regulatory gap analysis by cross-referencing Neo4j regulation nodes against searched procedure documentation.
- **Lessons Learned Job**: A batch intelligence pipeline to detect recurring patterns and write insight nodes back into the graph.
- **Stitch Frontend**: A complete UI including a Copilot Chat interface, RCA Dashboard, and Compliance Alerts view, all wrapped in a clean, minimalist Light Theme.

## Prerequisites

*   Docker and Docker Compose
*   *Note: Python, Tesseract, libmagic, and all external dependencies are fully containerized.*

## Setup & Running

The entire backend infrastructure is orchestrated via Docker Compose.

### 1. Start the Stack

Open a terminal at the root of the project (or in the `backend/` directory) and run:
```bash
docker-compose up -d --build
```
This will spin up:
- `etgen_postgres` (Port 5432)
- `etgen_minio` (Ports 9000, 9001)
- `etgen_elasticsearch` (Port 9200)
- `etgen_neo4j` (Ports 7474, 7687)
- `etgen_tika` (Port 9998)
- `etgen_ollama` (Port 11434)
- `etgen_ocr_worker` (Background Python worker housing FastAPI, LangGraph, and Ingestion pipelines)

### 2. Pull the Local LLM Model
Since Ollama starts empty by default, you must pull a model to enable the chat API and graph extraction. In a new terminal, execute:
```bash
docker exec -d etgen_ollama ollama pull mistral
```
*(Note: Downloading `mistral` will take several minutes depending on your internet connection.)*

### 3. Usage & Testing

You can interact with the system using standard REST calls to the FastAPI backend, or by executing the integrated test suites.

**Verify Logic & Integration (Pass 3):**
To run the strict multi-pass logic checks for the Neo4j ontology, LangGraph states, and universal routing:
```bash
docker exec etgen_ocr_worker python test_phase3.py
```

## System Workflow

**Pipeline:** `Ingest → Route → Parse → OCR fallback → Extract Graph Triples → Normalize → Chunk → Index → Search & Synthesize`

1. **Ingest:** A document is uploaded via the API and securely saved to MinIO.
2. **Route:** The `universal_router.py` detects the exact MIME type via `libmagic`.
3. **Parse & OCR:** The document is sent to specialized parsers (Pandas, PyMuPDF, etc.) or Apache Tika. If Tika fails on a scanned PDF, the async OCR worker activates `pytesseract`.
4. **Extract Graph:** The `graph_extractor.py` calls Ollama to structurally parse chunks, inserting defined triples into the Neo4j Knowledge Graph.
5. **Normalize & Chunk:** Extracted text is cleaned and split into boundary-aware hierarchical chunks.
6. **Index:** Dense vectors are generated and indexed into Elasticsearch alongside exact text and provenance metadata.
7. **Agentic Synthesis:** A user triggers an agent (e.g., via `/api/agents/rca`). The LangGraph agent executes a Hybrid Search in Elasticsearch and traverses relationships in Neo4j, resulting in a grounded, deterministic answer with strict source citations.
