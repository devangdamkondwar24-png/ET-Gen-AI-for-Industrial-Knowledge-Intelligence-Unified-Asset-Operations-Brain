from dotenv import load_dotenv
import os as _os
load_dotenv(_os.path.join(_os.path.dirname(__file__), ".env"))  # Always load from backend dir

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from api.ingestion import router as ingestion_router
from api.search import router as search_router
from api.chat import router as chat_router
from api.agents import router as agents_router
from api.graph import router as graph_router
from api.dashboard import router as dashboard_router
from api.assets import router as assets_router
from api.reports import router as reports_router

app = FastAPI(title="Industrial Knowledge Intelligence API")

# Setup CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For prototyping
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(ingestion_router, prefix="/api/ingestion", tags=["ingestion"])
app.include_router(search_router, prefix="/api", tags=["search"])
app.include_router(chat_router, prefix="/api", tags=["chat"])
app.include_router(agents_router)   # prefix defined in router
app.include_router(graph_router)    # prefix defined in router
app.include_router(dashboard_router)  # prefix defined in router
app.include_router(assets_router)     # prefix defined in router
app.include_router(reports_router)    # prefix defined in router

@app.get("/")
async def root():
    return {"message": "Industrial Knowledge Intelligence API — Phase 3.0"}
