from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from api.ingestion import router as ingestion_router
from api.copilot import router as copilot_router
from api.maintenance import router as maintenance_router
from api.compliance import router as compliance_router
from api.knowledge import router as knowledge_router
from api.lessons import router as lessons_router

app = FastAPI(title="Industrial Knowledge Intelligence API")

# Setup CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # For prototyping
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(ingestion_router, prefix="/api/ingestion", tags=["ingestion"])
app.include_router(copilot_router, prefix="/api/copilot", tags=["copilot"])
app.include_router(maintenance_router, prefix="/api/maintenance", tags=["maintenance"])
app.include_router(compliance_router, prefix="/api/compliance", tags=["compliance"])
app.include_router(knowledge_router, prefix="/api/knowledge", tags=["knowledge"])
app.include_router(lessons_router, prefix="/api/lessons", tags=["lessons"])

@app.get("/")
async def root():
    return {"message": "Welcome to the Industrial Knowledge Intelligence API"}
