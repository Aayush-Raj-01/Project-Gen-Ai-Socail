"""
Local LLM Module
================

Uses the resident Qwen3-4B model for two pipeline stages:
1. COMPRESSION  —  Extract structured JSON from raw text.
2. BEAUTIFICATION  —  Reformat Gemini output into polished prose.
"""

import json

from load_models import get_qwen_model, get_qwen_tokenizer


# ---------------------------------------------------------------------------
# Hardcoded system prompts
# ---------------------------------------------------------------------------

COMPRESSION_SYSTEM_PROMPT = """You are an information extraction engine.

Extract every important fact.

Remove:
- greetings
- filler text
- repeated content
- decorative language
- unnecessary explanations

Preserve:
- names
- organizations
- dates
- numbers
- statistics
- risks
- recommendations
- entities
- locations
- cybersecurity indicators
- technical details

Return ONLY valid JSON."""

BEAUTIFICATION_SYSTEM_PROMPT = """Rewrite professionally.

Preserve every fact.

Improve:
- readability
- structure
- grammar
- formatting

Do not invent information.
Do not remove facts.
Do not add assumptions."""

# ---------------------------------------------------------------------------
# Target JSON schema for compression output
# ---------------------------------------------------------------------------

COMPRESSION_SCHEMA = {
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


# ---------------------------------------------------------------------------
# Internal generation helper
# ---------------------------------------------------------------------------

def _generate(
    system_prompt: str,
    user_prompt: str,
    max_new_tokens: int = 1024,
) -> str:
    """
    Run Qwen inference with a system + user message pair.

    Uses greedy decoding (do_sample=False) for deterministic output.
    """
    model = get_qwen_model()
    tokenizer = get_qwen_tokenizer()

    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": user_prompt},
    ]

    text = tokenizer.apply_chat_template(
        messages,
        tokenize=False,
        add_generation_prompt=True,
    )

    inputs = tokenizer(
        text,
        return_tensors="pt",
    ).to(model.device)

    outputs = model.generate(
        **inputs,
        max_new_tokens=max_new_tokens,
        do_sample=False,
        temperature=0.1,
        use_cache=True,
    )

    # Strip the input tokens from the output
    generated = tokenizer.decode(
        outputs[0][inputs.input_ids.shape[1]:],
        skip_special_tokens=True,
    )

    return generated.strip()


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def compress_to_json(raw_text: str, image_context: str = "") -> str:
    """
    STAGE 1: Compress raw text into structured JSON.

    Extracts all important information while minimising token count.
    Returns a JSON string matching COMPRESSION_SCHEMA.

    Args:
        raw_text:      Combined image description + OCR text.
        image_context: Optional additional context about the image.

    Returns:
        JSON string with compressed, structured data.
    """
    schema_str = json.dumps(COMPRESSION_SCHEMA, indent=2)

    user_prompt = f"""Extract all important information from the following text into this exact JSON schema:

{schema_str}

Fill "image_context" with: {image_context if image_context else "N/A"}

TEXT:

{raw_text}"""

    print("[llm] Running Qwen compression ...")
    result = _generate(COMPRESSION_SYSTEM_PROMPT, user_prompt, max_new_tokens=2048)
    print("[llm] Compression complete.")

    return result


def beautify_output(gemini_output: str) -> str:
    """
    STAGE 3: Reformat Gemini's raw output into polished, readable prose.

    Preserves all facts while improving structure, grammar, and readability.

    Args:
        gemini_output: Raw text returned by Gemini.

    Returns:
        Professionally formatted text.
    """
    user_prompt = f"""Rewrite the following content into a professional, well-structured response.

Keep all facts intact. Improve readability and formatting.

CONTENT:

{gemini_output}"""

    print("[llm] Running Qwen beautification ...")
    result = _generate(BEAUTIFICATION_SYSTEM_PROMPT, user_prompt, max_new_tokens=2048)
    print("[llm] Beautification complete.")

    return result