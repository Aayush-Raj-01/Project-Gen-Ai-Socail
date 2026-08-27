"""
Gemini Service Module
=====================

Handles all communication with the Google Gemini API.
Receives ONLY compressed JSON to minimise token usage.
"""

import os

from google import genai
from dotenv import load_dotenv

load_dotenv()

# ---------------------------------------------------------------------------
# Gemini client (initialised at import time)
# ---------------------------------------------------------------------------

_client = genai.Client(
    api_key=os.getenv("GEMINI_API_KEY"),
)

GEMINI_MODEL = "gemini-2.5-flash"

# ---------------------------------------------------------------------------
# Hardcoded prompt — keeps Gemini output minimal
# ---------------------------------------------------------------------------

GEMINI_SYSTEM_PROMPT = """You are a content transformation engine.

Input is structured JSON.

Generate the requested artifact.

Rules:
- Keep only important information.
- No filler.
- No introductions.
- No unnecessary explanations.
- No repeated information.
- Focus on accuracy and relevance.
- Keep output compact."""


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def generate_from_compressed_json(compressed_json: str) -> str:
    """
    Send compressed JSON to Gemini and return the concise output.

    The compressed JSON is the ONLY input — no raw text, no images.
    This minimises token consumption on both input and output sides.

    Args:
        compressed_json: Structured JSON string from Qwen compression.

    Returns:
        Concise text output from Gemini.
    """
    prompt = f"""{GEMINI_SYSTEM_PROMPT}

Input JSON:

{compressed_json}

Generate a comprehensive analysis based on the structured data above. Be concise and factual."""

    print("[gemini_service] Sending compressed JSON to Gemini ...")

    response = _client.models.generate_content(
        model=GEMINI_MODEL,
        contents=prompt,
    )

    print("[gemini_service] Gemini response received.")

    return response.text