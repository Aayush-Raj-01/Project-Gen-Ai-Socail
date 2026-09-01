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
    Split text into chunks of at most max_tokens using the Qwen tokenizer.
    Ensures that we don't exceed model context size or cause OOM errors.
    """
    tokenizer = get_qwen_tokenizer()
    tokens = tokenizer.encode(text)
    
    if len(tokens) <= max_tokens:
        return [text]
        
    chunks = []
    for i in range(0, len(tokens), max_tokens):
        chunk_tokens = tokens[i:i + max_tokens]
        chunk_text = tokenizer.decode(chunk_tokens, skip_special_tokens=True)
        chunks.append(chunk_text)
        
    return chunks


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

    chunks = _chunk_text(raw_text, max_tokens=2048)

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

    if len(chunks) == 1:
        user_prompt = f"""{formatting_instructions}

Keep all facts intact. Improve readability and structure.

CONTENT:

{gemini_output}"""

        print("[llm] Running Qwen formatting ...")
        result = _generate(FORMATTING_SYSTEM_PROMPT, user_prompt, max_new_tokens=2048)
        print("[llm] Formatting complete.")
        return result

    print(f"[llm] Output is large. Splitting into {len(chunks)} chunks for formatting.")
    results = []
    for i, chunk in enumerate(chunks):
        print(f"[llm] Formatting chunk {i+1}/{len(chunks)} ...")
        user_prompt = f"""{formatting_instructions}

Keep all facts intact. Improve readability and structure.

CONTENT:

{chunk}"""
        res = _generate(FORMATTING_SYSTEM_PROMPT, user_prompt, max_new_tokens=2048)
        results.append(res)
        
    print("[llm] Chunk formatting complete.")
    return "\n\n---\n\n".join(results)


def moderate_content(text: str) -> dict:
    """
    Check if user input contains adult, abusive, violent, or policy-violating content.

    Uses a short Qwen inference (max 128 tokens) to classify the input.

    Args:
        text: The user's input text (prompt or OCR-extracted text).

    Returns:
        {"safe": True, "reason": ""} if content is clean.
        {"safe": False, "reason": "..."} if content is flagged.
    """
    chunks = _chunk_text(text, max_tokens=2000)

    print(f"[llm] Running content moderation (Chunks: {len(chunks)}) ...")

    for i, chunk in enumerate(chunks):
        user_prompt = f"""Classify the following user input:

{chunk}"""

        result = _generate(MODERATION_SYSTEM_PROMPT, user_prompt, max_new_tokens=128)
        
        try:
            cleaned = result.strip()
            if cleaned.startswith("```"):
                lines = cleaned.split("\n")
                lines = [l for l in lines if not l.strip().startswith("```")]
                cleaned = "\n".join(lines).strip()

            parsed = json.loads(cleaned)
            is_safe = bool(parsed.get("safe", True))
            
            # If any chunk is unsafe, immediately return false
            if not is_safe:
                print(f"[llm] Moderation flagged unsafe content in chunk {i+1}: {parsed.get('reason', '')}")
                return {
                    "safe": False,
                    "reason": str(parsed.get("reason", "")),
                }
                
        except (json.JSONDecodeError, KeyError):
            print(f"[llm] WARNING: Could not parse moderation response for chunk {i+1}. Defaulting to safe.")
            
    print("[llm] Moderation complete. Content is safe.")
    return {"safe": True, "reason": ""}