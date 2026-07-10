# Industrial Knowledge Intelligence Platform (Offline RAG Engine)

An enterprise-grade platform designed to mitigate knowledge fragmentation in asset-intensive industries by unifying engineering drawings, maintenance work orders, safety procedures, inspection reports, and regulatory records into a single, navigable knowledge base. 

This repository implements a **fully offline, highly secure Retrieval-Augmented Generation (RAG) Engine** ensuring zero data leakage for strict enterprise environments.

## Architecture & Core Technologies

This system is built as a highly robust, containerized microservice architecture.

*   **API Backend**: FastAPI (Python 3.11).
*   **Vector & Keyword Search**: Elasticsearch 8.x executing true **Hybrid Search** (BM25 + kNN using `cosineSimilarity` script scoring).
*   **Embeddings**: `sentence-transformers` (`all-MiniLM-L6-v2`) generating 384-dimensional dense vectors strictly on CPU.
*   **Generative AI**: Local **Ollama** container running open-weights models (e.g., `mistral`).
*   **Document Storage**: MinIO (S3-compatible object storage) for raw files and OCR assets.
*   **Relational Database**: PostgreSQL for job tracking and metadata.
*   **Ingestion & Parsing**: Apache Tika (containerized) for raw text extraction, falling back to a custom asynchronous OCR Worker (`pdf2image` + `pytesseract`) for scanned/hybrid PDFs.

## Phase 2 Highlights
- **Smart Chunking**: Boundary-aware hierarchical chunking (Paragraph -> Sentence -> Character) with deterministic overlapping.
- **Idempotent Ingestion**: Chunk IDs are deterministically generated to prevent duplication across pipeline restarts.
- **Tuned Hybrid Retrieval**: ElasticSearch scores are mathematically balanced (`(cosine + 1.0) * 5.0` vs `BM25 * 0.5`) to prevent unbounded keyword matches from suppressing semantic intent.
- **Anti-Hallucination Guardrails**: The `/api/chat` Copilot enforces a strict confidence threshold (minimum hybrid score of `7.5`). It requires the LLM to output formal `<CITATIONS>`, and intercepts the response if the LLM hallucinates unverified source IDs.

## Prerequisites

*   Docker and Docker Compose
*   *Note: Python, Tesseract, and external dependencies are fully containerized.*

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
- `etgen_tika` (Port 9998)
- `etgen_ollama` (Port 11434)
- `etgen_ocr_worker` (Background Python worker)

### 2. Pull the Local LLM Model
Since Ollama starts empty by default, you must pull a model to enable the chat API. In a new terminal, execute:
```bash
docker exec -d etgen_ollama ollama pull mistral
```
*(Note: Downloading `mistral` will take several minutes depending on your internet connection.)*

### 3. Usage & Testing

You can interact with the system using standard REST calls to the FastAPI backend (running inside the `ocr_worker` container or port-forwarded depending on your config), or by using the built-in evaluation scripts.

**Run the Benchmark Suite:**
To test the retrieval performance and accuracy of the Hybrid Search against exact keyword, semantic, and out-of-domain queries:
```bash
docker exec etgen_ocr_worker python scripts/evaluate_retrieval.py
```

## System Workflow

**Pipeline:** `Ingest → Store → Parse → OCR fallback → Normalize → Chunk → Index → Search`

1. **Ingest:** A document is uploaded via the API.
2. **Store:** The raw file is securely saved to MinIO object storage. Postgres tracks the job state as `pending`.
3. **Parse:** The document is routed to Apache Tika for fast, native text extraction.
4. **OCR Fallback:** If Tika fails (e.g., scanned PDF) or returns insufficient text, the asynchronous OCR worker activates, converting pages to images and processing them via Pytesseract.
5. **Normalize:** Extracted text is cleaned of artifacts, whitespace is standardized, and structural integrity is maintained.
6. **Chunk:** The normalized text is split into boundary-aware hierarchical chunks (Paragraph -> Sentence -> Character) with deterministic overlapping.
7. **Index:** `sentence-transformers` generates a 384-dimensional dense vector for each chunk. The text, vector, and provenance metadata (Page #, Asset Tag) are immediately indexed into Elasticsearch.
8. **Search & Generate:** A user asks a question via the Copilot `/api/chat`. The system executes a Hybrid Search to retrieve context blocks, and the local LLM generates a grounded response with strict source citations.
