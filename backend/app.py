"""
FastAPI Application
===================

Exposes the content transformation pipeline as REST endpoints.

Endpoints:
    GET  /               —  Health check.
    POST /analyze-image  —  Upload image → full pipeline → JSON response.
    POST /process-prompt —  Text prompt → Qwen + Gemini pipeline → JSON response.
"""

import os
import shutil
import uuid

from typing import Optional, List
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from workflow import process_image, process_prompt, process_video, process_audio, process_pdf, ContentViolationError

from contextlib import asynccontextmanager

# ---------------------------------------------------------------------------
# Upload directory
# ---------------------------------------------------------------------------

UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "uploads")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Ensure upload directory exists when server starts."""
    os.makedirs(UPLOAD_DIR, exist_ok=True)
    print(f"[app] Upload directory ready: {UPLOAD_DIR}")
    yield


# ---------------------------------------------------------------------------
# App setup
# ---------------------------------------------------------------------------

app = FastAPI(
    title="Project Gen AI Social",
    description="AI-powered content transformation platform",
    version="2.0.0",
    lifespan=lifespan,
)

# CORS — allow all origins for development
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "https://0239-122-185-51-250.ngrok-free.app",
        "https://wksri-122-185-51-250.run.pinggy-free.link"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------------------------
# Request models
# ---------------------------------------------------------------------------

class PromptRequest(BaseModel):
    prompt: str
    desired_outputs: Optional[List[str]] = None


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@app.get("/")
async def health_check():
    """Health check endpoint."""
    return {"status": "running"}


@app.post("/analyze-image")
async def analyze_uploaded_image(
    file: UploadFile = File(...),
    prompt: Optional[str] = Form(None),
    desired_outputs: Optional[str] = Form(None),
):
    """
    Upload an image and run the full transformation pipeline.

    Pipeline:
        Image → Florence+OCR → Qwen Compression → Gemini → Qwen Beautification
    """
    try:
        ext = os.path.splitext(file.filename)[1] if file.filename else ".png"
        unique_name = f"{uuid.uuid4().hex}{ext}"
        file_path = os.path.join(UPLOAD_DIR, unique_name)

        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        print(f"[app] Image saved: {file_path}")

        import json
        outputs_list = json.loads(desired_outputs) if desired_outputs else None
        
        # We need to update process_image in workflow.py to accept desired_outputs
        result = process_image(file_path, desired_outputs=outputs_list)
        return result

    except ContentViolationError as e:
        print(f"[app] MODERATION BLOCKED: {e.reason}")
        raise HTTPException(
            status_code=403,
            detail={"type": "content_violation", "reason": e.reason},
        )
    except Exception as e:
        print(f"[app] ERROR: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/process-prompt")
async def handle_prompt(body: PromptRequest):
    """
    Process a text-only prompt through the pipeline.

    Pipeline:
        Text → Qwen Compression → Gemini → Qwen Beautification

    No image analysis — skips Florence-2 and EasyOCR entirely.
    """
    try:
        if not body.prompt.strip():
            raise HTTPException(status_code=400, detail="Prompt cannot be empty.")

        print(f"[app] Text prompt received: {body.prompt[:80]}...")

        result = process_prompt(body.prompt, desired_outputs=body.desired_outputs)
        return result

    except HTTPException:
        raise
    except ContentViolationError as e:
        print(f"[app] MODERATION BLOCKED: {e.reason}")
        raise HTTPException(
            status_code=403,
            detail={"type": "content_violation", "reason": e.reason},
        )
    except Exception as e:
        print(f"[app] ERROR: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/analyze-video")
async def analyze_uploaded_video(
    file: UploadFile = File(...),
    prompt: Optional[str] = Form(None),
    desired_outputs: Optional[str] = Form(None),
):
    """
    Upload a video and run the full transformation pipeline.
    """
    try:
        ext = os.path.splitext(file.filename)[1] if file.filename else ".mp4"
        unique_name = f"{uuid.uuid4().hex}{ext}"
        file_path = os.path.join(UPLOAD_DIR, unique_name)

        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        print(f"[app] Video saved: {file_path}")

        import json
        outputs_list = json.loads(desired_outputs) if desired_outputs else None
        
        result = process_video(file_path, desired_outputs=outputs_list)
        return result

    except ContentViolationError as e:
        print(f"[app] MODERATION BLOCKED: {e.reason}")
        raise HTTPException(
            status_code=403,
            detail={"type": "content_violation", "reason": e.reason},
        )
    except Exception as e:
        print(f"[app] ERROR: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/analyze-audio")
async def analyze_uploaded_audio(
    file: UploadFile = File(...),
    prompt: Optional[str] = Form(None),
    desired_outputs: Optional[str] = Form(None),
):
    """
    Upload an audio file and run the full transformation pipeline.
    """
    try:
        ext = os.path.splitext(file.filename)[1] if file.filename else ".mp3"
        unique_name = f"{uuid.uuid4().hex}{ext}"
        file_path = os.path.join(UPLOAD_DIR, unique_name)

        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        print(f"[app] Audio saved: {file_path}")

        import json
        outputs_list = json.loads(desired_outputs) if desired_outputs else None
        
        result = process_audio(file_path, desired_outputs=outputs_list)
        return result

    except ContentViolationError as e:
        print(f"[app] MODERATION BLOCKED: {e.reason}")
        raise HTTPException(
            status_code=403,
            detail={"type": "content_violation", "reason": e.reason},
        )
    except Exception as e:
        print(f"[app] ERROR: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/analyze-pdf")
async def analyze_uploaded_pdf(
    file: UploadFile = File(...),
    prompt: Optional[str] = Form(None),
    desired_outputs: Optional[str] = Form(None),
):
    """
    Upload a PDF and run the full transformation pipeline.
    """
    try:
        ext = os.path.splitext(file.filename)[1] if file.filename else ".pdf"
        unique_name = f"{uuid.uuid4().hex}{ext}"
        file_path = os.path.join(UPLOAD_DIR, unique_name)

        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        print(f"[app] PDF saved: {file_path}")

        import json
        outputs_list = json.loads(desired_outputs) if desired_outputs else None
        
        result = process_pdf(file_path, desired_outputs=outputs_list)
        return result

    except ContentViolationError as e:
        print(f"[app] MODERATION BLOCKED: {e.reason}")
        raise HTTPException(
            status_code=403,
            detail={"type": "content_violation", "reason": e.reason},
        )
    except Exception as e:
        print(f"[app] ERROR: {e}")
        raise HTTPException(status_code=500, detail=str(e))