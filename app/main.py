from fastapi import FastAPI, Request
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from pydantic import BaseModel
from typing import Dict, List, Any
import json
import os
from datetime import datetime

app = FastAPI(title="Ant Hole Simulation")

# Mount static files directory
app.mount("/static", StaticFiles(directory="app/static"), name="static")

# Mount images directory
app.mount("/img", StaticFiles(directory="img"), name="images")

# Set up Jinja2 templates
templates = Jinja2Templates(directory="app/templates")

# Create logs directory if it doesn't exist
os.makedirs("logs", exist_ok=True)

# Debug log model
class DebugLogEntry(BaseModel):
    timestamp: int
    metrics: Dict[str, Any]
    longFrames: List[Dict[str, Any]]
    errors: List[Dict[str, Any]]
    warnings: List[Dict[str, Any]]
    functionTimings: Dict[str, Any]

@app.get("/", response_class=HTMLResponse)
async def read_root(request: Request):
    return templates.TemplateResponse("new_index.html", {"request": request})

@app.get("/debug", response_class=HTMLResponse)
async def debug_mode(request: Request):
    return templates.TemplateResponse("debug_launcher.html", {"request": request})

@app.get("/simple-debug", response_class=HTMLResponse)
async def simple_debug_mode(request: Request):
    return templates.TemplateResponse("simple_debug.html", {"request": request})

@app.get("/standalone", response_class=HTMLResponse)
async def standalone_debug_mode(request: Request):
    return templates.TemplateResponse("standalone_debug.html", {"request": request})

@app.get("/fixed", response_class=HTMLResponse)
async def fixed_debug_mode(request: Request):
    return templates.TemplateResponse("standalone_debug_fixed.html", {"request": request})

@app.get("/performance", response_class=HTMLResponse)
async def performance_test(request: Request):
    return templates.TemplateResponse("performance_test.html", {"request": request})

@app.get("/performance-index", response_class=HTMLResponse)
async def performance_index(request: Request):
    return templates.TemplateResponse("performance_index.html", {"request": request})

@app.get("/api/debug-log", response_class=HTMLResponse)
async def simple_debug_index(request: Request):
    return templates.TemplateResponse("simple_debug_index.html", {"request": request})

@app.post("/api/debug-log")
async def save_debug_log(log_entry: DebugLogEntry):
    # Create a filename with timestamp
    timestamp = datetime.fromtimestamp(log_entry.timestamp / 1000)
    filename = f"logs/debug_{timestamp.strftime('%Y%m%d_%H%M%S')}.json"

    # Save the log to a file
    with open(filename, "w") as f:
        json.dump(log_entry.model_dump(), f, indent=2)

    return JSONResponse(content={"status": "success", "filename": filename})

@app.get("/debug-viewer", response_class=HTMLResponse)
async def debug_viewer(request: Request):
    # Get list of log files
    log_files = []
    if os.path.exists("logs"):
        log_files = [f for f in os.listdir("logs") if f.endswith(".json")]
        log_files.sort(reverse=True)  # Most recent first

    return templates.TemplateResponse("debug_viewer.html", {
        "request": request,
        "log_files": log_files
    })

@app.get("/api/debug-logs")
async def get_debug_logs():
    # Get list of log files
    log_files = []
    if os.path.exists("logs"):
        log_files = [f for f in os.listdir("logs") if f.endswith(".json")]
        log_files.sort(reverse=True)  # Most recent first

    return JSONResponse(content={"log_files": log_files})

@app.get("/api/debug-log/{filename}")
async def get_debug_log(filename: str):
    # Validate filename to prevent directory traversal
    if ".." in filename or "/" in filename or "\\" in filename:
        return JSONResponse(content={"error": "Invalid filename"}, status_code=400)

    # Check if file exists
    file_path = f"logs/{filename}"
    if not os.path.exists(file_path):
        return JSONResponse(content={"error": "File not found"}, status_code=404)

    # Read and return the log file
    with open(file_path, "r") as f:
        log_data = json.load(f)

    return JSONResponse(content=log_data)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="127.0.0.1", port=8000, reload=True)
