from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware

import os
import shutil

from image_analyzer import analyze_image
from llm import generate_response

app = FastAPI(title="Project Gen AI Social API")

# Allow Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # restrict later in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)


@app.get("/")
def home():
    return {
        "status": "running",
        "service": "Project Gen AI Social"
    }


@app.post("/analyze-image")
async def analyze_uploaded_image(
    file: UploadFile = File(...)
):
    try:

        file_path = os.path.join(
            UPLOAD_DIR,
            file.filename
        )

        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(
                file.file,
                buffer
            )

        image_data = analyze_image(file_path)

        prompt = f"""
You are a cybersecurity and content-analysis expert.

IMAGE DESCRIPTION:
{image_data["description"]}

TEXT DETECTED IN IMAGE:
{image_data["ocr_text"]}

Generate:

1. Executive Summary
2. Key Insights
3. Risks
4. Recommendations

Use clear professional language.
"""

        llm_output = generate_response(prompt)

        return {
            "success": True,
            "image_description": image_data["description"],
            "ocr_text": image_data["ocr_text"],
            "llm_response": llm_output
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )


@app.post("/generate")
async def generate_text(
    data: dict
):
    try:

        prompt = data.get("prompt")

        if not prompt:
            raise HTTPException(
                status_code=400,
                detail="Prompt is required"
            )

        response = generate_response(prompt)

        return {
            "success": True,
            "response": response
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )