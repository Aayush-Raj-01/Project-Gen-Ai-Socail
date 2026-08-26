from transformers import (
    AutoTokenizer,
    AutoModelForCausalLM,
    BitsAndBytesConfig,
)

import torch
import json

MODEL_NAME = "Qwen/Qwen3-4B-Instruct-2507"

bnb_config = BitsAndBytesConfig(
    load_in_4bit=True,
    bnb_4bit_compute_dtype=torch.float16,
    bnb_4bit_quant_type="nf4",
    bnb_4bit_use_double_quant=True,
)

print("Loading Qwen...")

tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME)

model = AutoModelForCausalLM.from_pretrained(
    MODEL_NAME,
    quantization_config=bnb_config,
    device_map="auto",
)

print("Qwen Ready")


def _generate(prompt: str, max_new_tokens=1024):

    messages = [
        {
            "role": "user",
            "content": prompt
        }
    ]

    text = tokenizer.apply_chat_template(
        messages,
        tokenize=False,
        add_generation_prompt=True
    )

    inputs = tokenizer(
        text,
        return_tensors="pt"
    ).to(model.device)

    outputs = model.generate(
        **inputs,
        max_new_tokens=max_new_tokens,
        do_sample=False,
        temperature=0.1,
        use_cache=True
    )

    return tokenizer.decode(
        outputs[0][inputs.input_ids.shape[1]:],
        skip_special_tokens=True
    )


def compress_text(raw_text: str):

    prompt = f"""
Extract ALL important information.

Return ONLY valid JSON.

{{
    "summary": "",
    "key_entities": [],
    "statistics": [],
    "dates": [],
    "risks": [],
    "recommendations": [],
    "important_facts": []
}}

TEXT:

{raw_text}
"""

    return _generate(prompt, 2048)


def beautify_output(gemini_output: str):

    prompt = f"""
Convert the following information into a
professional, readable response.

Keep all facts.

CONTENT:

{gemini_output}
"""

    return _generate(prompt, 2048)