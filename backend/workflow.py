"""
Workflow Controller
===================

Orchestrates the full content transformation pipeline:

    Image
      ↓
    Florence-2 + EasyOCR  (image_analyzer)
      ↓
    Structured JSON
      ↓
    Qwen Compression      (llm)
      ↓
    Gemini Generation      (gemini_service)
      ↓
    Qwen Beautification    (llm)
      ↓
    Final JSON Response

Designed for future extension to PDF, audio, and video inputs.
"""

import json

from image_analyzer import analyze_image
from llm import compress_to_json, beautify_output
from gemini_service import generate_from_compressed_json


# ---------------------------------------------------------------------------
# JSON parsing helper
# ---------------------------------------------------------------------------

# Default schema used as fallback when Qwen returns malformed JSON.
_DEFAULT_COMPRESSED = {
    "document_type": "",
    "summary": "",
    "keywords": [],
    "topics": [],
    "entities": [],
    "organizations": [],
    "locations": [],
    "dates": [],
    "statistics": [],
    "risks": [],
    "recommendations": [],
    "important_facts": [],
    "image_context": "",
    "priority": "",
}


def _safe_parse_json(raw: str) -> dict:
    """
    Attempt to parse JSON from Qwen output.

    Handles common issues:
    - Leading/trailing whitespace.
    - Markdown code fences (```json ... ```).
    - Falls back to default schema on failure, embedding raw text in summary.
    """
    cleaned = raw.strip()

    # Strip markdown code fences if present
    if cleaned.startswith("```"):
        lines = cleaned.split("\n")
        # Remove first line (```json) and last line (```)
        lines = [
            line for line in lines
            if not line.strip().startswith("```")
        ]
        cleaned = "\n".join(lines).strip()

    try:
        return json.loads(cleaned)
    except json.JSONDecodeError:
        print("[workflow] WARNING: Qwen returned malformed JSON. Using fallback.")
        fallback = _DEFAULT_COMPRESSED.copy()
        fallback["summary"] = cleaned[:500]  # Preserve what we can
        return fallback


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def process_image(image_path: str) -> dict:
    """
    Full pipeline for image-based content transformation.

    Steps:
        1. Analyze image  →  description + OCR + objects.
        2. Compress        →  structured JSON via Qwen.
        3. Generate        →  concise output via Gemini.
        4. Beautify        →  polished text via Qwen.

    Args:
        image_path: Path to the uploaded image file.

    Returns:
        Complete response dict matching the specified output schema.
    """
    print(f"[workflow] === Starting pipeline for: {image_path} ===")

    # ------------------------------------------------------------------
    # Step 1: Image Analysis (Florence-2 + EasyOCR)
    # ------------------------------------------------------------------
    print("[workflow] Step 1/4 — Image analysis ...")
    image_data = analyze_image(image_path)

    # Build combined text for compression
    combined_text = f"""IMAGE DESCRIPTION:
{image_data['image_description']}

TEXT DETECTED IN IMAGE:
{image_data['ocr_text']}

DETECTED OBJECTS:
{', '.join(image_data['detected_objects']) if image_data['detected_objects'] else 'None'}"""

    # ------------------------------------------------------------------
    # Step 2: Qwen Compression → Structured JSON
    # ------------------------------------------------------------------
    print("[workflow] Step 2/4 — Qwen compression ...")
    compressed_raw = compress_to_json(
        raw_text=combined_text,
        image_context=image_data["image_description"],
    )

    compressed_data = _safe_parse_json(compressed_raw)

    # ------------------------------------------------------------------
    # Step 3: Gemini Generation
    # ------------------------------------------------------------------
    print("[workflow] Step 3/4 — Gemini generation ...")
    compressed_json_str = json.dumps(compressed_data, ensure_ascii=False)
    gemini_output = generate_from_compressed_json(compressed_json_str)

    # ------------------------------------------------------------------
    # Step 4: Qwen Beautification
    # ------------------------------------------------------------------
    print("[workflow] Step 4/4 — Qwen beautification ...")
    final_output = beautify_output(gemini_output)

    # ------------------------------------------------------------------
    # Assemble response
    # ------------------------------------------------------------------
    response = {
        "image_analysis": {
            "image_description": image_data["image_description"],
            "ocr_text": image_data["ocr_text"],
        },
        "compressed_data": compressed_data,
        "gemini_output": gemini_output,
        "final_output": final_output,
    }

    print("[workflow] === Pipeline complete ===")

    return response