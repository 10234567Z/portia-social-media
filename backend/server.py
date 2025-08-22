from fastapi import FastAPI, HTTPException
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import json
import asyncio
from typing import Dict, Any
import uuid
from dotenv import load_dotenv
import logging
from io import StringIO
import sys

from tools.PostCreation import PostCreationTool
from tools.YoutubeScript import ScriptCreationTool
from utilities.file_loader import load_instructions_file

from portia import (
    DefaultToolRegistry,
    InMemoryToolRegistry,
    Portia,
    Config,
    Tool,
    ToolHardError,
    ToolRunContext,
    Message,
)
from portia.cli import CLIExecutionHooks

load_dotenv()

app = FastAPI(title="Content Creator API", version="1.0.0")

# Enable CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Request models
class ContentRequest(BaseModel):
    content: str

class ContentResponse(BaseModel):
    plan_id: str
    status: str
    message: str

# Store active plans
active_plans: Dict[str, Dict[str, Any]] = {}

# Custom log handler to capture logs
class LogCapture:
    def __init__(self):
        self.logs = []
        
    def write(self, message):
        if message.strip():
            self.logs.append(message.strip())
            
    def flush(self):
        pass

@app.post("/api/generate", response_model=ContentResponse)
async def generate_content(request: ContentRequest):
    """Start content generation and return plan ID for tracking"""
    
    plan_id = str(uuid.uuid4())
    
    # Store plan info
    active_plans[plan_id] = {
        "status": "planning",
        "content": request.content,
        "logs": [],
        "outputs": {},
        "error": None
    }
    
    # Start generation in background
    asyncio.create_task(run_content_generation(plan_id, request.content))
    
    return ContentResponse(
        plan_id=plan_id,
        status="planning",
        message="Content generation started"
    )

async def run_content_generation(plan_id: str, content: str):
    """Run the actual content generation"""
    try:
        # Update status
        active_plans[plan_id]["status"] = "running"
        
        # Capture logs
        log_capture = LogCapture()
        
        # Setup logging to capture Portia logs
        logger = logging.getLogger()
        handler = logging.StreamHandler(log_capture)
        handler.setLevel(logging.INFO)
        logger.addHandler(handler)
        
        # Write content to inbox
        with open("inbox.txt", "w") as f:
            f.write(content)
        
        # Setup Portia
        config = Config.from_default(default_log_level="INFO")
        tools = DefaultToolRegistry(config=config) + \
                InMemoryToolRegistry.from_local_tools([PostCreationTool()]) + \
                InMemoryToolRegistry.from_local_tools([ScriptCreationTool()])
        
        portia = Portia(
            config=config,
            tools=tools,
            execution_hooks=CLIExecutionHooks(),
        )
        
        planning_prompt = f"Use the post_creation tool to generate a text post from this description and script_creation tool from this content given: {content}"
        
        # Add log
        active_plans[plan_id]["logs"].append("Planning started...")
        
        # Create plan
        plan = portia.plan(planning_prompt)
        active_plans[plan_id]["logs"].append(f"Plan created with {len(plan.steps)} steps")
        active_plans[plan_id]["plan"] = plan.pretty_print()
        
        # Update status
        active_plans[plan_id]["status"] = "executing"
        active_plans[plan_id]["logs"].append("Executing plan...")
        
        # Run plan
        result = portia.run_plan(plan)
        
        # Extract outputs from logs
        outputs = {}
        for log_entry in log_capture.logs:
            if "Step output -" in log_entry:
                if "post_creation" in active_plans[plan_id]["logs"][-3:]:
                    outputs["post"] = log_entry.split("Step output - ", 1)[1] if len(log_entry.split("Step output - ", 1)) > 1 else ""
                elif "script_creation" in active_plans[plan_id]["logs"][-3:]:
                    outputs["script"] = log_entry.split("Step output - ", 1)[1] if len(log_entry.split("Step output - ", 1)) > 1 else ""
        
        # Store outputs
        active_plans[plan_id]["outputs"] = outputs
        active_plans[plan_id]["logs"].extend(log_capture.logs)
        active_plans[plan_id]["status"] = "completed"
        active_plans[plan_id]["logs"].append("Content generation completed!")
        
        # Clean up logger
        logger.removeHandler(handler)
        
    except Exception as e:
        active_plans[plan_id]["status"] = "error"
        active_plans[plan_id]["error"] = str(e)
        active_plans[plan_id]["logs"].append(f"Error: {str(e)}")

@app.get("/api/status/{plan_id}")
async def get_status(plan_id: str):
    """Get the current status of a plan"""
    
    if plan_id not in active_plans:
        raise HTTPException(status_code=404, detail="Plan not found")
    
    plan_data = active_plans[plan_id]
    
    response = {
        "plan_id": plan_id,
        "status": plan_data["status"],
        "logs": plan_data["logs"],
        "outputs": plan_data.get("outputs", {}),
        "error": plan_data.get("error"),
        "plan": plan_data.get("plan", "")
    }
    
    return response

@app.get("/api/stream/{plan_id}")
async def stream_progress(plan_id: str):
    """Stream live progress updates"""
    
    if plan_id not in active_plans:
        raise HTTPException(status_code=404, detail="Plan not found")
    
    async def event_stream():
        last_log_count = 0
        
        while True:
            plan_data = active_plans[plan_id]
            current_logs = plan_data["logs"]
            
            # Send new logs
            if len(current_logs) > last_log_count:
                new_logs = current_logs[last_log_count:]
                for log in new_logs:
                    yield f"data: {json.dumps({'type': 'log', 'message': log})}\n\n"
                last_log_count = len(current_logs)
            
            # Send status update
            yield f"data: {json.dumps({'type': 'status', 'status': plan_data['status']})}\n\n"
            
            # If completed or error, send final data and break
            if plan_data["status"] in ["completed", "error"]:
                yield f"data: {json.dumps({'type': 'complete', 'outputs': plan_data.get('outputs', {}), 'error': plan_data.get('error')})}\n\n"
                break
                
            await asyncio.sleep(1)
    
    return StreamingResponse(
        event_stream(),
        media_type="text/plain",
        headers={"Cache-Control": "no-cache", "Connection": "keep-alive"}
    )

@app.get("/api/plans")
async def list_plans():
    """List all plans"""
    return {
        "plans": [
            {
                "plan_id": plan_id,
                "status": data["status"],
                "content": data["content"][:100] + "..." if len(data["content"]) > 100 else data["content"]
            }
            for plan_id, data in active_plans.items()
        ]
    }

@app.delete("/api/plans/{plan_id}")
async def delete_plan(plan_id: str):
    """Delete a plan"""
    if plan_id not in active_plans:
        raise HTTPException(status_code=404, detail="Plan not found")
    
    del active_plans[plan_id]
    return {"message": "Plan deleted successfully"}

@app.get("/")
async def root():
    return {"message": "Content Creator API is running", "version": "1.0.0"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
