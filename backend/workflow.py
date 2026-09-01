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
import os
from datetime import datetime

from image_analyzer import analyze_image
from video_analyzer import analyze_video, unload_video_analyzer
from audio_analyzer import analyze_audio
from pdf_analyzer import analyze_pdf
from llm import compress_to_json, format_outputs, moderate_content
from gemini_service import generate_from_compressed_json
from load_models import unload_florence_model, unload_ocr_reader


class ContentViolationError(Exception):
    """Raised when user content is flagged by the moderation system."""
    def __init__(self, reason: str):
        self.reason = reason
        super().__init__(reason)


# ---------------------------------------------------------------------------
# Output log file  —  stores every pipeline result for inspection
# ---------------------------------------------------------------------------

OUTPUT_LOG_FILE = os.path.join(os.path.dirname(__file__), "output_log.json")


def _save_output_to_file(image_path: str, response: dict):
    """Append the pipeline result to a JSON log file."""
    entry = {
        "timestamp": datetime.now().isoformat(),
        "image_path": image_path,
        "result": response,
    }

    # Load existing entries (or start fresh)
    existing = []
    if os.path.exists(OUTPUT_LOG_FILE):
        try:
            with open(OUTPUT_LOG_FILE, "r", encoding="utf-8") as f:
                existing = json.load(f)
        except (json.JSONDecodeError, IOError):
            existing = []

    existing.append(entry)

    with open(OUTPUT_LOG_FILE, "w", encoding="utf-8") as f:
        json.dump(existing, f, indent=2, ensure_ascii=False)

    print(f"[workflow] Output saved to: {OUTPUT_LOG_FILE}")


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

def process_image(image_path: str, desired_outputs: list = None) -> dict:
    """
    Full pipeline for image-based content transformation.

    Steps:
        1. Analyze image  →  description + OCR + objects.
        2. Compress        →  structured JSON via Qwen.
        3. Generate        →  generic knowledge base via Gemini.
        4. Format          →  specific output types via Qwen.

    Args:
        image_path: Path to the uploaded image file.
        desired_outputs: List of specific requested output formats.

    Returns:
        Complete response dict matching the specified output schema.
    """
    print(f"[workflow] === Starting pipeline for: {image_path} ===")

    # ------------------------------------------------------------------
    # Step 1: Image Analysis (Florence-2 + EasyOCR)
    # ------------------------------------------------------------------
    print("[workflow] Step 1/4 — Image analysis ...")
    image_data = analyze_image(image_path)

    # Free VRAM — Florence-2 and EasyOCR are no longer needed for this request
    unload_florence_model()
    unload_ocr_reader()

    # Build combined text for compression
    combined_text = f"""IMAGE DESCRIPTION:
{image_data['image_description']}

TEXT DETECTED IN IMAGE:
{image_data['ocr_text']}

DETECTED OBJECTS:
{', '.join(image_data['detected_objects']) if image_data['detected_objects'] else 'None'}"""

    # ------------------------------------------------------------------
    # Moderation gate — check extracted text before processing
    # ------------------------------------------------------------------
    moderation_text = f"{image_data.get('ocr_text', '')} {image_data.get('image_description', '')}"
    moderation = moderate_content(moderation_text)
    if not moderation["safe"]:
        print(f"[workflow] BLOCKED: {moderation['reason']}")
        raise ContentViolationError(moderation["reason"])

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
    # Step 4: Qwen Formatting
    # ------------------------------------------------------------------
    print("[workflow] Step 4/4 — Qwen formatting ...")
    final_output = format_outputs(gemini_output, desired_outputs)

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

    # Save output to file for inspection
    _save_output_to_file(image_path, response)

    print("[workflow] === Pipeline complete ===")

    return response


def process_prompt(prompt_text: str, desired_outputs: list = None) -> dict:
    """
    Pipeline for text-only content transformation (no image).

    Steps:
        1. Compress        →  structured JSON via Qwen.
        2. Generate        →  generic knowledge base via Gemini.
        3. Format          →  specific output types via Qwen.

    Args:
        prompt_text: The user's text prompt.
        desired_outputs: List of specific requested output formats.

    Returns:
        Complete response dict with all intermediate and final outputs.
    """
    print(f"[workflow] === Starting text-only pipeline ===")

    # ------------------------------------------------------------------
    # Moderation gate — check prompt before processing
    # ------------------------------------------------------------------
    moderation = moderate_content(prompt_text)
    if not moderation["safe"]:
        print(f"[workflow] BLOCKED: {moderation['reason']}")
        raise ContentViolationError(moderation["reason"])

    # ------------------------------------------------------------------
    # Step 1: Qwen Compression → Structured JSON
    # ------------------------------------------------------------------
    print("[workflow] Step 1/3 — Qwen compression ...")
    compressed_raw = compress_to_json(
        raw_text=prompt_text,
        image_context="N/A — text-only prompt",
    )

    compressed_data = _safe_parse_json(compressed_raw)

    # ------------------------------------------------------------------
    # Step 2: Gemini Generation
    # ------------------------------------------------------------------
    print("[workflow] Step 2/3 — Gemini generation ...")
    compressed_json_str = json.dumps(compressed_data, ensure_ascii=False)
    gemini_output = generate_from_compressed_json(compressed_json_str)

    # ------------------------------------------------------------------
    # Step 3: Qwen Formatting
    # ------------------------------------------------------------------
    print("[workflow] Step 3/3 — Qwen formatting ...")
    final_output = format_outputs(gemini_output, desired_outputs)

    # ------------------------------------------------------------------
    # Assemble response
    # ------------------------------------------------------------------
    response = {
        "image_analysis": None,
        "compressed_data": compressed_data,
        "gemini_output": gemini_output,
        "final_output": final_output,
    }

    # Save output to file for inspection
    _save_output_to_file("text-only-prompt", response)

    print("[workflow] === Pipeline complete ===")

    return response


def process_video(video_path: str, desired_outputs: list = None) -> dict:
    print(f"[workflow] === Starting video pipeline for: {video_path} ===")
    print("[workflow] Step 1/4 — Video analysis ...")
    video_data = analyze_video(video_path)
    
    # Free VRAM immediately after analysis
    unload_video_analyzer()

    # Convert complex multi-modal JSON to a flat text string
    speech_text = " ".join([seg["text"] for seg in video_data.get("speech_transcript", [])])
    
    moderation = moderate_content(speech_text)
    if not moderation["safe"]:
        print(f"[workflow] BLOCKED: {moderation['reason']}")
        raise ContentViolationError(moderation["reason"])

    # Create a dense multi-modal context string for Qwen
    visual_context_lines = []
    for frame in video_data.get("visual_timeline", []):
        t = frame["timestamp_second"]
        objs = ", ".join(frame["objects_inside"]) if frame["objects_inside"] else "none"
        action = frame["action_happening"]
        text = frame["text_written"]
        line = f"[{t}s] Action: {action} | Objects: {objs} | On-Screen Text: {text}"
        visual_context_lines.append(line)
        
    visual_context = "\n".join(visual_context_lines)

    print("[workflow] Step 2/4 — Qwen compression ...")
    compressed_raw = compress_to_json(
        raw_text=speech_text,
        image_context=f"Multi-modal video analysis (Duration: {video_data.get('total_duration_seconds', 0)}s).\n\nVisual Timeline:\n{visual_context}",
    )
    compressed_data = _safe_parse_json(compressed_raw)

    print("[workflow] Step 3/4 — Gemini generation ...")
    compressed_json_str = json.dumps(compressed_data, ensure_ascii=False)
    gemini_output = generate_from_compressed_json(compressed_json_str)

    print("[workflow] Step 4/4 — Qwen formatting ...")
    final_output = format_outputs(gemini_output, desired_outputs)

    response = {
        "video_analysis": video_data,
        "compressed_data": compressed_data,
        "gemini_output": gemini_output,
        "final_output": final_output,
    }
    _save_output_to_file(video_path, response)
    print("[workflow] === Pipeline complete ===")
    return response


def process_audio(audio_path: str, desired_outputs: list = None) -> dict:
    print(f"[workflow] === Starting audio pipeline for: {audio_path} ===")
    print("[workflow] Step 1/4 — Audio analysis ...")
    audio_data = analyze_audio(audio_path)

    moderation = moderate_content(audio_data["transcription"])
    if not moderation["safe"]:
        print(f"[workflow] BLOCKED: {moderation['reason']}")
        raise ContentViolationError(moderation["reason"])

    print("[workflow] Step 2/4 — Qwen compression ...")
    compressed_raw = compress_to_json(
        raw_text=audio_data["transcription"],
        image_context=f"Audio transcription. Language: {audio_data['language']}",
    )
    compressed_data = _safe_parse_json(compressed_raw)

    print("[workflow] Step 3/4 — Gemini generation ...")
    compressed_json_str = json.dumps(compressed_data, ensure_ascii=False)
    gemini_output = generate_from_compressed_json(compressed_json_str)

    print("[workflow] Step 4/4 — Qwen formatting ...")
    final_output = format_outputs(gemini_output, desired_outputs)

    response = {
        "audio_analysis": audio_data,
        "compressed_data": compressed_data,
        "gemini_output": gemini_output,
        "final_output": final_output,
    }
    _save_output_to_file(audio_path, response)
    print("[workflow] === Pipeline complete ===")
    return response


def process_pdf(pdf_path: str, desired_outputs: list = None) -> dict:
    print(f"[workflow] === Starting PDF pipeline for: {pdf_path} ===")
    print("[workflow] Step 1/4 — PDF analysis ...")
    pdf_data = analyze_pdf(pdf_path)

    moderation = moderate_content(pdf_data["extracted_text"])
    if not moderation["safe"]:
        print(f"[workflow] BLOCKED: {moderation['reason']}")
        raise ContentViolationError(moderation["reason"])

    print("[workflow] Step 2/4 — Qwen compression ...")
    compressed_raw = compress_to_json(
        raw_text=pdf_data["extracted_text"],
        image_context=f"PDF extraction. Pages: {pdf_data['page_count']}. Method: {pdf_data['method']}",
    )
    compressed_data = _safe_parse_json(compressed_raw)

    print("[workflow] Step 3/4 — Gemini generation ...")
    compressed_json_str = json.dumps(compressed_data, ensure_ascii=False)
    gemini_output = generate_from_compressed_json(compressed_json_str)

    print("[workflow] Step 4/4 — Qwen formatting ...")
    final_output = format_outputs(gemini_output, desired_outputs)

    response = {
        "pdf_analysis": pdf_data,
        "compressed_data": compressed_data,
        "gemini_output": gemini_output,
        "final_output": final_output,
    }
    _save_output_to_file(pdf_path, response)
    print("[workflow] === Pipeline complete ===")
    return response