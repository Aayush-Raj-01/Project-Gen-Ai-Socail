from fastapi import FastAPI, UploadFile, File
import shutil
import os

from image_analyzer import analyze_image
from llm import generate_response
from pydantic import BaseModel

class GenerateRequest(BaseModel):
    user_input: str
app = FastAPI()

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)


@app.post("/analyze-image")
async def analyze(file: UploadFile = File(...)):

    file_path = os.path.join(
        UPLOAD_DIR,
        file.filename
    )

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    image_data = analyze_image(file_path)

    llm_prompt = f"""
Analyze this image information.

IMAGE DESCRIPTION:
{image_data['description']}

OCR TEXT:
{image_data['ocr_text']}

Generate:
1. Executive Summary
2. Key Insights
3. Risks
4. Recommendations
"""

    llm_response = generate_response(llm_prompt)

    return {
        "description": image_data["description"],
        "ocr_text": image_data["ocr_text"],
        "llm_output": llm_response
    }

@app.post("/generate")
async def generate(request: GenerateRequest):

    result = process_document(
        user_input
    )

    return result