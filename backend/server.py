from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import json
import asyncio
from typing import Dict, Any
import uuid
from dotenv import load_dotenv

import sys
import io
import subprocess
from contextlib import redirect_stdout, redirect_stderr

from tools.PostCreation import PostCreationTool
from tools.YoutubeScript import ScriptCreationTool
from utilities.file_loader import load_instructions_file

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
    """Run the actual content generation by calling main.py and capturing output"""
    try:
        # Update status
        active_plans[plan_id]["status"] = "running"
        active_plans[plan_id]["logs"].append("Starting content generation...")
        
        # Write content to a temp file for main.py to use
        with open("temp_content.txt", "w") as f:
            f.write(content)
        
        active_plans[plan_id]["logs"].append("Running Portia content generation...")
        
        # Run the main.py script and capture its output
        import os
        process = await asyncio.create_subprocess_exec(
            sys.executable, "main.py", 
            "--content", content,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.STDOUT,
            cwd=os.getcwd()
        )
        
        # Read output line by line as it comes
        async for line in process.stdout:
            line_str = line.decode('utf-8').strip()
            if line_str:
                active_plans[plan_id]["logs"].append(line_str)
                
                # Extract step outputs from the CLI logs
                if "Step output -" in line_str:
                    step_output = line_str.split("Step output - ", 1)[1] if len(line_str.split("Step output - ", 1)) > 1 else ""
                    
                    # Check recent logs to determine which step this belongs to
                    recent_logs = active_plans[plan_id]["logs"][-10:]
                    if any("step 0:" in log.lower() for log in recent_logs):
                        active_plans[plan_id]["outputs"]["post"] = step_output
                    elif any("step 1:" in log.lower() for log in recent_logs):
                        active_plans[plan_id]["outputs"]["script"] = step_output
        
        # Wait for process to complete
        await process.wait()
        
        # Check if we got outputs, if not try to extract from final output
        if not active_plans[plan_id]["outputs"]:
            active_plans[plan_id]["logs"].append("Extracting outputs from final result...")
            # Look for final output in logs
            for log in active_plans[plan_id]["logs"]:
                if "Final output:" in log:
                    final_content = log.split("Final output:", 1)[1].strip()
                    # Split into post and script (rough approach)
                    if len(final_content) > 100:
                        mid_point = len(final_content) // 2
                        active_plans[plan_id]["outputs"]["post"] = final_content[:mid_point]
                        active_plans[plan_id]["outputs"]["script"] = final_content[mid_point:]
                    break
        
        # Clean up temp file
        if os.path.exists("temp_content.txt"):
            os.remove("temp_content.txt")
        
        active_plans[plan_id]["status"] = "completed"
        active_plans[plan_id]["logs"].append("Content generation completed successfully!")
        
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
