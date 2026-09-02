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


def _save_output_to_file(file_paths_str: str, response: dict):
    """Append the pipeline result to a JSON log file."""
    entry = {
        "timestamp": datetime.now().isoformat(),
        "file_paths": file_paths_str,
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

def process_image(file_paths: list[str], prompt: str = None, desired_outputs: list = None):
    """
    Full pipeline for image-based content transformation.

    Steps:
        1. Analyze images →  description + OCR + objects (batched).
        2. Compress        →  structured JSON via Qwen.
        3. Generate        →  generic knowledge base via Gemini.
        4. Format          →  specific output types via Qwen.
    """
    print(f"[workflow] === Starting pipeline for {len(file_paths)} images ===")

    print("[workflow] Step 1/4 — Image analysis ...")
    yield 'data: {"status": "Analyzing images and extracting OCR..."}\n\n'
    
    combined_texts = []
    all_image_data = []

    for path in file_paths:
        data = analyze_image(path)
        all_image_data.append(data)
        
        text = f"--- Image: {os.path.basename(path)} ---\n"
        text += f"DESCRIPTION:\n{data['image_description']}\n"
        text += f"OCR TEXT:\n{data['ocr_text']}\n"
        text += f"OBJECTS:\n{', '.join(data['detected_objects']) if data['detected_objects'] else 'None'}\n"
        combined_texts.append(text)

    unload_florence_model()
    unload_ocr_reader()

    combined_text = "\n".join(combined_texts)

    moderation_text = " ".join([d.get('ocr_text', '') + " " + d.get('image_description', '') for d in all_image_data])
    moderation = moderate_content(moderation_text)
    if not moderation["safe"]:
        print(f"[workflow] BLOCKED: {moderation['reason']}")
        raise ContentViolationError(moderation["reason"])

    print("[workflow] Step 2/4 — Qwen compression ...")
    yield 'data: {"status": "Compressing multimodal context via Qwen..."}\n\n'
    
    compressed_raw = compress_to_json(
        raw_text=combined_text,
        image_context="Batch of images containing: " + " | ".join([d['image_description'][:100] for d in all_image_data]),
    )

    compressed_data = _safe_parse_json(compressed_raw)

    # ------------------------------------------------------------------
    # Step 3: Gemini Generation → Knowledge Base
    # ------------------------------------------------------------------
    print("[workflow] Step 3/4 — Gemini generation ...")
    yield 'data: {"status": "Generating deep insights via Gemini..."}\n\n'
    
    compressed_json_str = json.dumps(compressed_data, ensure_ascii=False)
    gemini_output = generate_from_compressed_json(compressed_json_str, user_prompt=prompt)

    # ------------------------------------------------------------------
    # Step 4: Qwen Formatting → Final User Output
    # ------------------------------------------------------------------
    print("[workflow] Step 4/4 — Qwen formatting ...")
    yield 'data: {"status": "Formatting final output exactly to specifications..."}\n\n'
    
    final_output = format_outputs(gemini_output, desired_outputs)

    # ------------------------------------------------------------------
    # Assemble response
    # ------------------------------------------------------------------
    response = {
        "image_analysis": all_image_data,
        "compressed_data": compressed_data,
        "gemini_output": gemini_output,
        "final_output": final_output,
    }

    _save_output_to_file(", ".join(file_paths), response)

    print("[workflow] === Pipeline complete ===")
    yield f'data: {{"result": {json.dumps(response, ensure_ascii=False)}}}\n\n'


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


def process_video(file_paths: list[str], prompt: str = None, desired_outputs: list = None):
    print(f"[workflow] === Starting video pipeline for {len(file_paths)} videos ===")
    print("[workflow] Step 1/4 — Video analysis ...")
    yield 'data: {"status": "Processing video frames and extracting speech..."}\n\n'
    
    all_speech = []
    all_visuals = []
    all_video_data = []
    
    for path in file_paths:
        data = analyze_video(path)
        all_video_data.append(data)
        
        speech = " ".join([seg["text"] for seg in data.get("speech_transcript", [])])
        all_speech.append(f"--- Video: {os.path.basename(path)} ---\n" + speech)
        
        for frame in data.get("visual_timeline", []):
            t = frame["timestamp_second"]
            objs = ", ".join(frame["objects_inside"]) if frame["objects_inside"] else "none"
            action = frame["action_happening"]
            text = frame["text_written"]
            all_visuals.append(f"[{os.path.basename(path)} @ {t}s] Action: {action} | Objects: {objs} | Text: {text}")

    unload_video_analyzer()

    speech_text = "\n".join(all_speech)
    visual_context = "\n".join(all_visuals)

    moderation = moderate_content(speech_text)
    if not moderation["safe"]:
        print(f"[workflow] BLOCKED: {moderation['reason']}")
        raise ContentViolationError(moderation["reason"])

    print("[workflow] Step 2/4 — Qwen compression ...")
    yield 'data: {"status": "Compressing multi-modal context via Qwen..."}\n\n'
    compressed_raw = compress_to_json(
        raw_text=speech_text,
        image_context=f"Multi-video analysis.\n\nVisual Timeline:\n{visual_context}",
    )
    compressed_data = _safe_parse_json(compressed_raw)

    print("[workflow] Step 3/4 — Gemini generation ...")
    yield 'data: {"status": "Generating deep insights via Gemini..."}\n\n'
    compressed_json_str = json.dumps(compressed_data, ensure_ascii=False)
    gemini_output = generate_from_compressed_json(compressed_json_str, user_prompt=prompt)

    print("[workflow] Step 4/4 — Qwen formatting ...")
    yield 'data: {"status": "Formatting final output exactly to specifications..."}\n\n'
    final_output = format_outputs(gemini_output, desired_outputs)

    response = {
        "video_analysis": all_video_data,
        "compressed_data": compressed_data,
        "gemini_output": gemini_output,
        "final_output": final_output,
    }
    _save_output_to_file(", ".join(file_paths), response)
    print("[workflow] === Pipeline complete ===")
    yield f'data: {{"result": {json.dumps(response, ensure_ascii=False)}}}\n\n'


def process_audio(file_paths: list[str], prompt: str = None, desired_outputs: list = None):
    print(f"[workflow] === Starting audio pipeline for {len(file_paths)} files ===")
    print("[workflow] Step 1/4 — Audio analysis ...")
    yield 'data: {"status": "Transcribing audio files..."}\n\n'
    
    all_audio_data = []
    all_transcripts = []
    
    for path in file_paths:
        data = analyze_audio(path)
        all_audio_data.append(data)
        all_transcripts.append(f"--- Audio: {os.path.basename(path)} ---\n" + data["transcription"])

    combined_transcript = "\n\n".join(all_transcripts)

    moderation = moderate_content(combined_transcript)
    if not moderation["safe"]:
        print(f"[workflow] BLOCKED: {moderation['reason']}")
        raise ContentViolationError(moderation["reason"])

    print("[workflow] Step 2/4 — Qwen compression ...")
    yield 'data: {"status": "Compressing audio transcripts via Qwen..."}\n\n'
    compressed_raw = compress_to_json(
        raw_text=combined_transcript,
        image_context="Batch audio transcription.",
    )
    compressed_data = _safe_parse_json(compressed_raw)

    print("[workflow] Step 3/4 — Gemini generation ...")
    yield 'data: {"status": "Generating deep insights via Gemini..."}\n\n'
    compressed_json_str = json.dumps(compressed_data, ensure_ascii=False)
    gemini_output = generate_from_compressed_json(compressed_json_str, user_prompt=prompt)

    print("[workflow] Step 4/4 — Qwen formatting ...")
    yield 'data: {"status": "Formatting final output exactly to specifications..."}\n\n'
    final_output = format_outputs(gemini_output, desired_outputs)

    response = {
        "audio_analysis": all_audio_data,
        "compressed_data": compressed_data,
        "gemini_output": gemini_output,
        "final_output": final_output,
    }
    _save_output_to_file(", ".join(file_paths), response)
    print("[workflow] === Pipeline complete ===")
    yield f'data: {{"result": {json.dumps(response, ensure_ascii=False)}}}\n\n'


def process_pdf(file_paths: list[str], prompt: str = None, desired_outputs: list = None):
    print(f"[workflow] === Starting PDF pipeline for {len(file_paths)} files ===")
    print("[workflow] Step 1/4 — PDF analysis ...")
    yield 'data: {"status": "Extracting text from PDF files..."}\n\n'
    
    all_pdf_data = []
    all_texts = []
    
    for path in file_paths:
        data = analyze_pdf(path)
        all_pdf_data.append(data)
        all_texts.append(f"--- PDF: {os.path.basename(path)} ---\n" + data["extracted_text"])

    combined_text = "\n\n".join(all_texts)

    moderation = moderate_content(combined_text)
    if not moderation["safe"]:
        print(f"[workflow] BLOCKED: {moderation['reason']}")
        raise ContentViolationError(moderation["reason"])

    print("[workflow] Step 2/4 — Qwen compression ...")
    yield 'data: {"status": "Compressing PDF contents via Qwen..."}\n\n'
    compressed_raw = compress_to_json(
        raw_text=combined_text,
        image_context="Batch PDF extraction.",
    )
    compressed_data = _safe_parse_json(compressed_raw)

    print("[workflow] Step 3/4 — Gemini generation ...")
    yield 'data: {"status": "Generating deep insights via Gemini..."}\n\n'
    compressed_json_str = json.dumps(compressed_data, ensure_ascii=False)
    gemini_output = generate_from_compressed_json(compressed_json_str, user_prompt=prompt)

    print("[workflow] Step 4/4 — Qwen formatting ...")
    yield 'data: {"status": "Formatting final output exactly to specifications..."}\n\n'
    final_output = format_outputs(gemini_output, desired_outputs)

    response = {
        "pdf_analysis": all_pdf_data,
        "compressed_data": compressed_data,
        "gemini_output": gemini_output,
        "final_output": final_output,
    }
    _save_output_to_file(", ".join(file_paths), response)
    print("[workflow] === Pipeline complete ===")
    yield f'data: {{"result": {json.dumps(response, ensure_ascii=False)}}}\n\n'