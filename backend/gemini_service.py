"""
Gemini Service Module
=====================

Handles all communication with the Google Gemini API.
Receives ONLY compressed JSON to minimise token usage.
"""

import os

from google import genai
from groq import Groq
from dotenv import load_dotenv

load_dotenv()

# ---------------------------------------------------------------------------
# Gemini & Groq clients (initialised at import time)
# ---------------------------------------------------------------------------

_client = None


def _get_client():
    global _client
    if _client is None:
        api_key = os.getenv("GEMINI_API_KEY")
        _client = genai.Client(api_key=api_key) if api_key else genai.Client()
    return _client


GEMINI_MODEL = "gemini-2.5-flash"

# Groq fallback client
_groq_client = Groq(
    api_key=os.getenv("GROQ_API_KEY")
)
GROQ_MODEL = "llama-3.1-70b-versatile"

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
        Concise, factual text output from Gemini.
    """
    output_instructions = "\nGenerate a comprehensive analysis based on the structured data above. Be concise and factual. Do not format for a specific output type; just output the raw knowledge base."

    prompt = f"""{GEMINI_SYSTEM_PROMPT}

Input JSON:

{compressed_json}
{output_instructions}"""

    print("[gemini_service] Sending compressed JSON to Gemini ...")

    client = _get_client()

    try:
        response = client.models.generate_content(
            model=GEMINI_MODEL,
            contents=prompt,
        )
        print("[gemini_service] Gemini response received.")
        return response.text
        
    except Exception as e:
        print(f"[gemini_service] Gemini failed: {e}. Falling back to Groq API...")
        
        try:
            chat_completion = _groq_client.chat.completions.create(
                messages=[
                    {"role": "user", "content": prompt}
                ],
                model="llama-3.3-70b-versatile",
            )
        except Exception as groq_e:
            print(f"[gemini_service] Groq 3.3-70b failed: {groq_e}. Trying llama3-8b-8192...")
            chat_completion = _groq_client.chat.completions.create(
                messages=[
                    {"role": "user", "content": prompt}
                ],
                model="llama3-8b-8192",
            )
        
        print("[gemini_service] Groq response received.")
        return chat_completion.choices[0].message.content