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
GROQ_MODEL = "llama3-70b-8192"

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

def generate_from_compressed_json(compressed_json: str, desired_outputs: list = None) -> str:
    """
    Send compressed JSON to Gemini and return the concise output.

    The compressed JSON is the ONLY input — no raw text, no images.
    This minimises token consumption on both input and output sides.

    Args:
        compressed_json: Structured JSON string from Qwen compression.
        desired_outputs: List of specific output formats requested by the user.

    Returns:
        Concise text output from Gemini.
    """
    output_instructions = ""
    if desired_outputs and len(desired_outputs) > 0:
        formats = ", ".join(desired_outputs)
        output_instructions = f"\nCRITICAL INSTRUCTION: You MUST generate the output EXACTLY in these formats: {formats}.\nGenerate EACH format as a separate distinct section. DO NOT use conversational filler like 'Here is your post'."
    else:
        output_instructions = "\nGenerate a comprehensive analysis based on the structured data above. Be concise and factual."

    prompt = f"""{GEMINI_SYSTEM_PROMPT}

Input JSON:

{compressed_json}
{output_instructions}"""

    print("[gemini_service] Sending compressed JSON to Gemini ...")

    try:
        response = _client.models.generate_content(
            model=GEMINI_MODEL,
            contents=prompt,
        )
        print("[gemini_service] Gemini response received.")
        return response.text
        
    except Exception as e:
        print(f"[gemini_service] Gemini failed: {e}. Falling back to Groq API...")
        
        chat_completion = _groq_client.chat.completions.create(
            messages=[
                {"role": "user", "content": prompt}
            ],
            model=GROQ_MODEL,
        )
        
        print("[gemini_service] Groq response received.")
        return chat_completion.choices[0].message.content