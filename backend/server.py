from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import asyncio
from typing import Dict, Any
import uuid
from main import main

from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="Content Creator API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ContentRequest(BaseModel):
    content: str

class ContentResponse(BaseModel):
    plan_id: str
    status: str
    message: str

active_plans: Dict[str, Dict[str, Any]] = {}

@app.post("/api/generate", response_model=ContentResponse)
async def generate_content(request: ContentRequest):
    """Start content generation and return plan ID for tracking"""
    
    plan_id = str(uuid.uuid4())
    
    active_plans[plan_id] = {
        "status": "planning",
        "content": request.content,
        "outputs": {},
        "error": None
    }
    
    asyncio.create_task(run_content_generation(plan_id, request.content))
    
    return ContentResponse(
        plan_id=plan_id,
        status="planning",
        message="Content generation started"
    )

async def run_content_generation(plan_id: str, content: str):
    """Run the actual content generation by calling main function directly"""
    try:
        active_plans[plan_id]["status"] = "running"
        
        step_outputs = await main(content)
        
        outputs = {
            "post": step_outputs['$step_0_output'].value,
            "script": step_outputs['$step_1_output'].value, 
            "analysis": step_outputs['$step_2_output'].value
        }
        
        active_plans[plan_id]["outputs"] = outputs
        active_plans[plan_id]["status"] = "completed"
        
    except Exception as e:
        active_plans[plan_id]["status"] = "error"
        active_plans[plan_id]["error"] = str(e)

@app.get("/api/status/{plan_id}")
async def get_status(plan_id: str):
    """Get the current status of a plan"""
    
    if plan_id not in active_plans:
        raise HTTPException(status_code=404, detail="Plan not found")
    
    plan_data = active_plans[plan_id]
    
    response = {
        "plan_id": plan_id,
        "status": plan_data["status"],
        "outputs": plan_data.get("outputs", {}),
        "error": plan_data.get("error"),
        "plan": plan_data.get("plan", "")
    }
    
    return response

@app.get("/")
async def root():
    return {"message": "Content Creator API is running gucci"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
