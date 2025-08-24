from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import asyncio
from typing import Dict, Any
import uuid
import time
import psutil
import os
from main import main

from dotenv import load_dotenv

load_dotenv()

app = FastAPI(
    title="Content Creator API", 
    version="1.0.0",
    description="High-Performance Content Generation Pipeline with Real-Time Analytics"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

class ContentRequest(BaseModel):
    content: str

class ContentResponse(BaseModel):
    plan_id: str
    status: str
    message: str

# Performance tracking
performance_metrics = {
    "total_generations": 0,
    "total_time": 0.0,
    "average_time": 0.0,
    "fastest_time": 0.0,
    "slowest_time": 0.0,
    "success_rate": 100.0,
    "errors": 0
}

active_plans: Dict[str, Dict[str, Any]] = {}

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy", 
        "timestamp": time.time(),
        "service": "Content Creator API",
        "version": "1.0.0"
    }

@app.post("/api/generate", response_model=ContentResponse)
async def generate_content(request: ContentRequest):
    """Start content generation and return plan ID for tracking"""
    
    plan_id = str(uuid.uuid4())
    
    active_plans[plan_id] = {
        "status": "planning",
        "content": request.content,
        "outputs": {},
        "error": None,
        "start_time": time.time(),
        "cpu_start": psutil.cpu_percent(),
        "memory_start": psutil.virtual_memory().percent
    }
    
    asyncio.create_task(run_content_generation(plan_id, request.content))
    
    return ContentResponse(
        plan_id=plan_id,
        status="planning",
        message="Content generation started with performance tracking"
    )

async def run_content_generation(plan_id: str, content: str):
    """Run the actual content generation by calling main function directly"""
    try:
        start_time = time.time()
        active_plans[plan_id]["status"] = "running"
        
        step_outputs = await main(content)
        
        outputs = {
            "post": step_outputs['$step_0_output'].value,
            "script": step_outputs['$step_1_output'].value, 
            "analysis": step_outputs['$step_2_output'].value
        }
        
        # Calculate performance metrics
        execution_time = time.time() - start_time
        active_plans[plan_id]["execution_time"] = execution_time
        active_plans[plan_id]["outputs"] = outputs
        active_plans[plan_id]["status"] = "completed"
        
        # Update global metrics
        performance_metrics["total_generations"] += 1
        performance_metrics["total_time"] += execution_time
        performance_metrics["average_time"] = performance_metrics["total_time"] / performance_metrics["total_generations"]
        performance_metrics["fastest_time"] = min(performance_metrics["fastest_time"], execution_time)
        performance_metrics["slowest_time"] = max(performance_metrics["slowest_time"], execution_time)
        
        # Success rate calculation
        total_attempts = performance_metrics["total_generations"] + performance_metrics["errors"]
        performance_metrics["success_rate"] = (performance_metrics["total_generations"] / total_attempts) * 100 if total_attempts > 0 else 100.0
        
    except Exception as e:
        execution_time = time.time() - active_plans[plan_id]["start_time"]
        active_plans[plan_id]["status"] = "error"
        active_plans[plan_id]["error"] = str(e)
        active_plans[plan_id]["execution_time"] = execution_time
        
        # Update error metrics
        performance_metrics["errors"] += 1
        total_attempts = performance_metrics["total_generations"] + performance_metrics["errors"]
        performance_metrics["success_rate"] = (performance_metrics["total_generations"] / total_attempts) * 100

@app.get("/api/status/{plan_id}")
async def get_status(plan_id: str):
    """Get the current status of a plan with performance data"""
    
    if plan_id not in active_plans:
        raise HTTPException(status_code=404, detail="Plan not found")
    
    plan_data = active_plans[plan_id]
    
    current_time = time.time()
    elapsed_time = current_time - plan_data["start_time"]
    
    response = {
        "plan_id": plan_id,
        "status": plan_data["status"],
        "outputs": plan_data.get("outputs", {}),
        "error": plan_data.get("error"),
        "performance": {
            "elapsed_time": round(elapsed_time, 2),
            "execution_time": plan_data.get("execution_time", elapsed_time),
            "cpu_usage": psutil.cpu_percent(),
            "memory_usage": psutil.virtual_memory().percent,
            "estimated_completion": "15-30 seconds" if plan_data["status"] == "running" else None
        }
    }
    
    return response

@app.get("/api/analytics")
async def get_analytics():
    """Get comprehensive system analytics and performance metrics"""
    
    system_info = {
        "cpu_count": psutil.cpu_count(),
        "memory_total": round(psutil.virtual_memory().total / (1024**3), 2),  # GB
        "python_version": f"{os.sys.version_info.major}.{os.sys.version_info.minor}.{os.sys.version_info.micro}",
        "uptime": time.time() - (psutil.boot_time() if hasattr(psutil, 'boot_time') else time.time())
    }
    
    real_time = {
        "cpu_usage": psutil.cpu_percent(interval=1),
        "memory_usage": psutil.virtual_memory().percent,
        "active_generations": len([p for p in active_plans.values() if p["status"] == "running"]),
        "queue_size": len([p for p in active_plans.values() if p["status"] == "planning"])
    }
    
    return {
        "performance_metrics": performance_metrics,
        "system_info": system_info,
        "real_time": real_time,
        "status": "operational",
        "version": "1.0.0-pro"
    }

@app.get("/api/health")
async def health_check():
    """Advanced health check with system diagnostics"""
    
    health_status = {
        "status": "healthy",
        "timestamp": time.time(),
        "uptime": time.time() - (psutil.boot_time() if hasattr(psutil, 'boot_time') else time.time()),
        "system": {
            "cpu_usage": psutil.cpu_percent(),
            "memory_usage": psutil.virtual_memory().percent,
            "disk_usage": psutil.disk_usage('/').percent,
        },
        "api": {
            "total_requests": performance_metrics["total_generations"] + performance_metrics["errors"],
            "success_rate": performance_metrics["success_rate"],
            "average_response_time": performance_metrics["average_time"]
        }
    }
    
    if (health_status["system"]["cpu_usage"] > 90 or 
        health_status["system"]["memory_usage"] > 90):
        health_status["status"] = "degraded"
    
    return health_status

@app.get("/")
async def root():
    return {
        "message": "🚀 Content Creator API - High Performance Edition",
        "status": "operational",
        "version": "1.0.0-pro",
        "features": [
            "Real-time performance analytics",
            "System resource monitoring", 
            "Advanced health diagnostics",
            "Production-ready metrics"
        ],
        "endpoints": {
            "generation": "/api/generate",
            "analytics": "/api/analytics", 
            "health": "/api/health",
            "docs": "/docs"
        }
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
