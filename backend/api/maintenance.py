from fastapi import APIRouter
import os
from pydantic import BaseModel
from typing import List, Optional

from retrieval.agent import retrieve_context
from llm.client import LLMClient
from okf.reader import read_concept_file
from okf.index_manager import IndexManager

router = APIRouter()

class SensorData(BaseModel):
    timestamp: str
    vibration: float
    temperature: float

class WorkOrder(BaseModel):
    id: str
    date: str
    description: str
    status: str

class TimelineEvent(BaseModel):
    date: str
    title: str
    description: str
    type: str
    path: str

class MaintenanceResponse(BaseModel):
    equipment_id: str
    sensor_data: List[SensorData]
    work_orders: List[WorkOrder]
    timeline: List[TimelineEvent]
    rca_report: str
    predictive_alert: str

@router.get("/{equipment_id}", response_model=MaintenanceResponse)
async def get_maintenance_data(equipment_id: str):
    knowledge_dir = os.path.join(os.path.dirname(__file__), "..", "knowledge")
    im = IndexManager(knowledge_dir)
    
    # Generate dummy time series data for the graph (simulating live SCADA feed)
    sensor_data = [
        SensorData(timestamp="10:00", vibration=2.1, temperature=65),
        SensorData(timestamp="10:15", vibration=2.3, temperature=66),
        SensorData(timestamp="10:30", vibration=3.5, temperature=70),
        SensorData(timestamp="10:45", vibration=4.2, temperature=75),
        SensorData(timestamp="11:00", vibration=4.8, temperature=82),
    ]
    
    # 1. Retrieve related OKF files using the equipment_id (e.g. P-101)
    results = im.search(equipment_id, limit=20)
    
    work_orders = []
    timeline = []
    context_text = ""
    
    for path, score in results:
        concept = read_concept_file(knowledge_dir, path)
        if not concept: continue
        
        context_text += f"\nFile: {path}\nTitle: {concept.frontmatter.title}\nBody: {concept.body[:300]}...\n"
        
        c_type = concept.frontmatter.type.value
        if c_type == "workorder":
            wo_id = concept.frontmatter.model_dump().get("workorder_id", "Unknown")
            status = concept.frontmatter.model_dump().get("wo_status", "closed").capitalize()
            work_orders.append(WorkOrder(
                id=wo_id,
                date=concept.frontmatter.timestamp[:10],
                description=concept.frontmatter.title,
                status=status
            ))
            timeline.append(TimelineEvent(
                date=concept.frontmatter.timestamp[:10],
                title=concept.frontmatter.title,
                description=concept.frontmatter.description,
                type="Work Order",
                path=path
            ))
        elif c_type in ["inspection", "incident"]:
            timeline.append(TimelineEvent(
                date=concept.frontmatter.timestamp[:10],
                title=concept.frontmatter.title,
                description=concept.frontmatter.description,
                type=c_type.capitalize(),
                path=path
            ))
            
    # Sort timeline by date
    timeline.sort(key=lambda x: x.date, reverse=True)
    
    # 2. Use LLM to generate RCA and predictive alert based on OKF context
    llm = LLMClient()
    
    prompt = f"Analyze the following maintenance history and sensor trends (rising vibration and temp) for {equipment_id}. Provide a Root Cause Analysis report (under 150 words) and a short Predictive Alert (under 30 words)."
    
    answer_result = llm.generate_answer(prompt, [{"path": "context", "body": context_text}], "")
    
    # A bit of parsing since we asked for two things. In a real app we'd use function calling.
    full_answer = answer_result.get("answer", "")
    rca = full_answer
    alert = "Warning: Abnormal operating conditions detected."
    
    if "Predictive Alert:" in full_answer:
        parts = full_answer.split("Predictive Alert:")
        rca = parts[0].replace("Root Cause Analysis:", "").strip()
        alert = parts[1].strip()
        
    return MaintenanceResponse(
        equipment_id=equipment_id,
        sensor_data=sensor_data,
        work_orders=work_orders,
        timeline=timeline,
        rca_report=rca,
        predictive_alert=alert
    )
