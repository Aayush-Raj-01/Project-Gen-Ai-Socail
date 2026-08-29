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

from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from workflow import process_image, process_prompt, ContentViolationError

# ---------------------------------------------------------------------------
# App setup
# ---------------------------------------------------------------------------

app = FastAPI(
    title="Project Gen AI Social",
    description="AI-powered content transformation platform",
    version="2.0.0",
)

# CORS — allow all origins for development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Upload directory
# ---------------------------------------------------------------------------

UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "uploads")


@app.on_event("startup")
async def startup_event():
    """Ensure upload directory exists when server starts."""
    os.makedirs(UPLOAD_DIR, exist_ok=True)
    print(f"[app] Upload directory ready: {UPLOAD_DIR}")


# ---------------------------------------------------------------------------
# Request models
# ---------------------------------------------------------------------------

class PromptRequest(BaseModel):
    prompt: str


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

        result = process_image(file_path)
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

        result = process_prompt(body.prompt)
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