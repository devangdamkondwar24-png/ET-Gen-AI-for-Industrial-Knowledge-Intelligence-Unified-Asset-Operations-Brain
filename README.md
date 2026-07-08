# Industrial Knowledge Intelligence Platform

An enterprise-grade platform designed to mitigate knowledge fragmentation in asset-intensive industries by unifying engineering drawings, maintenance work orders, safety procedures, inspection reports, and regulatory records into a single, navigable knowledge base.

## Architecture & Core Technologies

This prototype moves beyond mock data into a fully functional backend utilizing local file storage to emulate robust operations.

*   **Frontend**: Next.js (App Router), Tailwind CSS v4, React Flow, Recharts, Lucide React.
*   **Backend**: FastAPI, SQLite (FTS5 Search), Git (Audit Trails).
*   **Knowledge Storage (OKF)**: Open Knowledge Format (v0.1) — Git-versioned Markdown with strict YAML frontmatter schemas.
*   **AI Engine**: Agentic retrieval architecture using keyword search and deterministic link-traversal rather than opaque vector databases, paired with Claude 3.5 Sonnet (via Anthropic API) and a fallback local mock-LLM for deterministic testing.
*   **Ingestion Pipeline**: Asynchronous background workers using `pdfplumber` and `Tesseract OCR` for document entity extraction.

## Prerequisites

*   Node.js (v18 or higher)
*   Python (3.9 or higher)
*   Tesseract OCR (Installed and added to system PATH)
*   Poppler (Required by `pdf2image`, added to system PATH)

## Setup & Running

You need to run both the frontend and backend servers simultaneously.

### 1. Environment Variables
Create a `.env` file in the `backend/` directory:
```env
ANTHROPIC_API_KEY=your_api_key_here
USE_MOCK_LLM=true  # Set to 'false' to use real Anthropic LLM
```

### 2. Start the Backend (FastAPI)

Open a terminal and navigate to the `backend` directory:
```bash
cd backend
```

Create and activate a virtual environment:
```bash
python -m venv .venv
# Windows:
.\.venv\Scripts\activate
# macOS/Linux:
source .venv/bin/activate
```

Install dependencies:
```bash
pip install -r requirements.txt
```

Start the server:
```bash
uvicorn main:app --reload
```
The backend API will run on `http://localhost:8000`.

### 3. Start the Frontend (Next.js)

Open a second terminal and navigate to the `frontend` directory:
```bash
cd frontend
```

Install dependencies:
```bash
npm install
```

Start the development server:
```bash
npm run dev
```
The frontend application will be available at `http://localhost:3000`.

## Modules & Features

1.  **Dashboard**: High-level overview of active tracking metrics.
2.  **Knowledge Browser**: A fully interactive file tree visualizing the OKF markdown files, including rendered markdown, incoming/outgoing link references, and git-backed audit trails.
3.  **Ingestion Pipeline**: Upload documents to kick off an asynchronous extraction job. Extracts entities and dependencies into the Git-versioned OKF format, generating a visual React Flow graph.
4.  **Expert Copilot**: An agentic RAG chat interface relying on explicit keyword-based retrieval and link-hopping to provide answers with source citations and confidence scores.
5.  **Maintenance Intelligence**: Aggregates time-series sensor telemetry, work order histories, and incident reports into a unified timeline, executing AI-generated Root Cause Analysis (RCA).
6.  **Compliance Analyzer**: Highlights gaps between standard operating procedures (SOPs) and safety regulations.
