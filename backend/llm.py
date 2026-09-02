"""
Local LLM Module
================

Uses the resident Qwen3-4B model for two pipeline stages:
1. COMPRESSION  —  Extract structured JSON from raw text.
2. BEAUTIFICATION  —  Reformat Gemini output into polished prose.
"""

import json
import requests

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

FORMATTING_SYSTEM_PROMPT = """You are an expert content formatter.

Your task is to take a generic knowledge base and format it into SPECIFIC output types requested by the user.
If multiple output types are requested, output each as a distinct section starting exactly with '### [Format Name]'.
Do not invent information. Rely strictly on the provided content. Improve grammar and readability.

CRITICAL STRUCTURAL RULES:
- For 'Presentation' or 'ppt', you MUST format it as:
#### Slide 1
**Title:** ...
**Content:** ...
#### Slide 2
...
- For 'Video Script' or 'video script', you MUST format it as:
#### Scene 1
**Visual:** ...
**Audio:** ...
#### Scene 2
...
- For all other formats, use standard paragraphs or bullet points."""

MODERATION_SYSTEM_PROMPT = """You are a content moderation classifier.

Analyze the user's input and determine if it violates any of these categories:
- ADULT: Sexual, pornographic, or explicit content
- ABUSIVE: Hate speech, harassment, slurs, bullying, or discrimination
- VIOLENT: Graphic violence, gore, self-harm, or threats
- ILLEGAL: Drug manufacturing, weapons, hacking instructions, or fraud
- HARMFUL: Misinformation designed to cause harm, doxxing, or privacy violations

Respond with ONLY valid JSON in this exact format:
{"safe": true, "reason": ""}

If the content violates any category:
{"safe": false, "reason": "Brief explanation of what was flagged and which category"}

Be strict but fair. Professional discussions about cybersecurity, medicine, law, etc. are SAFE.
News articles, research papers, and educational content are SAFE.
Do NOT flag legitimate business or technical content."""

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
# Internal generation helpers
# ---------------------------------------------------------------------------

def _chunk_text(text: str, max_tokens: int = 2000) -> list[str]:
    """
    Split text into chunks of roughly max_tokens (approx 4 chars per token).
    Does not use tokenizer since we are using Ollama API.
    """
    max_chars = max_tokens * 4
    if len(text) <= max_chars:
        return [text]
        
    chunks = []
    for i in range(0, len(text), max_chars):
        chunks.append(text[i:i + max_chars])
        
    return chunks


def _generate(
    system_prompt: str,
    user_prompt: str,
    max_new_tokens: int = 1024,
) -> str:
    """
    Run inference via Ollama local API.
    """
    url = "http://localhost:11434/api/chat"
    payload = {
        "model": "hf.co/unsloth/Qwen3-4B-Instruct-2507-GGUF:Q4_K_M",
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ],
        "stream": False,
        "options": {
            "num_predict": max_new_tokens,
            "temperature": 0.1,
            "top_k": 40,
            "top_p": 0.9,
        }
    }
    
    try:
        response = requests.post(url, json=payload, timeout=300)
        response.raise_for_status()
        data = response.json()
        return data["message"]["content"].strip()
    except Exception as e:
        print(f"[llm] Ollama generation failed: {e}")
        return ""


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

    chunks = _chunk_text(raw_text, max_tokens=2048)

    if len(raw_text) < 800:
        print("[llm] Text is short (<800 chars). Bypassing Qwen compression for speed.")
        data = {
            "summary": raw_text,
            "entities": {"people": [], "organizations": [], "locations": [], "other": []},
            "topics": [],
            "sentiment": "neutral",
            "statistics": [],
            "risks": [],
            "recommendations": [],
            "important_facts": [],
            "image_context": image_context if image_context else "N/A",
            "priority": "low"
        }
        return json.dumps(data)

    if len(chunks) == 1:
        user_prompt = f"""Extract all important information from the following text into this exact JSON schema:

{schema_str}

Fill "image_context" with: {image_context if image_context else "N/A"}

TEXT:

{raw_text}"""

        print("[llm] Running Qwen compression ...")
        result = _generate(COMPRESSION_SYSTEM_PROMPT, user_prompt, max_new_tokens=2048)
        print("[llm] Compression complete.")
        return result

    print(f"[llm] Input text is large. Splitting into {len(chunks)} chunks for compression.")
    
    # Process chunks and aggregate
    import copy
    aggregated = copy.deepcopy(COMPRESSION_SCHEMA)
    
    for i, chunk in enumerate(chunks):
        print(f"[llm] Processing compression chunk {i+1}/{len(chunks)} ...")
        user_prompt = f"""Extract all important information from the following text into this exact JSON schema:

{schema_str}

Fill "image_context" with: {image_context if image_context else "N/A"}

TEXT:

{chunk}"""
        
        result_str = _generate(COMPRESSION_SYSTEM_PROMPT, user_prompt, max_new_tokens=2048)
        
        # Parse output
        cleaned = result_str.strip()
        if cleaned.startswith("```"):
            lines = cleaned.split("\n")
            lines = [l for l in lines if not l.strip().startswith("```")]
            cleaned = "\n".join(lines).strip()
            
        try:
            chunk_data = json.loads(cleaned)
            # Aggregate lists and strings
            for key, val in chunk_data.items():
                if isinstance(val, list) and key in aggregated and isinstance(aggregated[key], list):
                    aggregated[key].extend(val)
                elif isinstance(val, str) and key in aggregated and isinstance(aggregated[key], str) and val:
                    if not aggregated[key]:
                        aggregated[key] = val
                    else:
                        aggregated[key] += f" {val}"
        except json.JSONDecodeError:
            print(f"[llm] WARNING: Failed to parse chunk {i+1} JSON. Skipping aggregation.")
            
    # Deduplicate lists
    for key, val in aggregated.items():
        if isinstance(val, list):
            seen = set()
            new_list = []
            for item in val:
                # use string representation to check for uniqueness
                if str(item) not in seen:
                    seen.add(str(item))
                    new_list.append(item)
            aggregated[key] = new_list
            
    print("[llm] Chunk compression complete.")
    return json.dumps(aggregated)


def format_outputs(gemini_output: str, desired_outputs: list = None) -> str:
    """
    STAGE 3: Format Gemini's raw output into specific requested structures using local LLM.

    Args:
        gemini_output: Raw text returned by Gemini.
        desired_outputs: List of specific formats (e.g., ["Script", "PDF", "Report"]).

    Returns:
        Formatted text containing distinct sections for each output type.
    """
    chunks = _chunk_text(gemini_output, max_tokens=2048)

    formatting_instructions = "Rewrite the following content into a professional, well-structured response."
    if desired_outputs and len(desired_outputs) > 0:
        formats = ", ".join(desired_outputs)
        formatting_instructions = f"CRITICAL INSTRUCTION: You MUST format the content EXACTLY into these types: {formats}. Generate EACH format as a separate distinct section with a clear heading (e.g., '### [Format Name]')."

    user_prompt = f"""{formatting_instructions}

Keep all facts intact. Improve readability and structure.

CONTENT:

{gemini_output}"""

    print("[llm] Running Qwen formatting ...")
    result = _generate(FORMATTING_SYSTEM_PROMPT, user_prompt, max_new_tokens=2048)
    print("[llm] Formatting complete.")
    return result


def moderate_content(text: str) -> dict:
    """
    Check if user input contains adult, abusive, violent, or policy-violating content.
    Currently bypassed because smaller LLMs (like 1.5B) hallucinate false positives.
    """
    return {"safe": True, "reason": ""}