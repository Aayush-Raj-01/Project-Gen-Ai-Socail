"""
Image Analyzer Module
=====================

Processes images through two independent analysis paths:
1. Florence-2  —  Detailed caption + object detection.
2. EasyOCR     —  Text extraction with confidence scores.

Both models are lazy-loaded via load_models and stay cached.
"""

from PIL import Image
import os
import torch
from transformers import GenerationConfig,AutoProcessor, AutoModelForCausalLM

from load_models import get_florence_model, get_ocr_reader


# ---------------------------------------------------------------------------
# Florence-2 helpers
# ---------------------------------------------------------------------------

from PIL import Image
from load_models import get_florence_model


def _run_florence_task(image: Image.Image, task_prompt: str) -> dict:
    """
    Run a Florence-2 inference task and return the parsed result.

    Supported task prompts:
        <MORE_DETAILED_CAPTION>
        <OD>
    """

    model, processor = get_florence_model()

    # Store original size for post-processing
    original_size = (image.width, image.height)
    
    # Florence-2 DaViT vision tower requires square feature maps.
    # Transformers 5.x CLIPImageProcessor fails to resize to square if do_center_crop=False.
    # So we forcefully resize to a square here.
    square_image = image.resize((768, 768), Image.Resampling.LANCZOS)

    inputs = processor(
        text=task_prompt,
        images=square_image,
        return_tensors="pt",
    )

    inputs = {
        k: (v.to(dtype=torch.float16, device=model.device) if v.is_floating_point() else v.to(model.device))
        for k, v in inputs.items()
    }

    generated_ids = model.generate(
        input_ids=inputs["input_ids"],
        pixel_values=inputs["pixel_values"],
        max_new_tokens=512,
        do_sample=False,
        num_beams=1,  # Greedy decoding — beam search OOMs without KV cache
        use_cache=False,  # Disable KV cache — Florence-2's remote code is incompatible with transformers 5.x cache API
    )

    generated_text = processor.batch_decode(
        generated_ids,
        skip_special_tokens=False,
    )[0]

    parsed = processor.post_process_generation(
        generated_text,
        task=task_prompt,
        image_size=(image.width, image.height),
    )

    return parsed


def _get_detailed_caption(image: Image.Image) -> str:
    """Generate a detailed natural-language description of the image."""
    result = _run_florence_task(image, "<MORE_DETAILED_CAPTION>")
    return result.get("<MORE_DETAILED_CAPTION>", "")


def _get_detected_objects(image: Image.Image) -> list[str]:
    """Return a deduplicated list of object labels found in the image."""
    result = _run_florence_task(image, "<OD>")

    od_data = result.get("<OD>", {})
    labels = od_data.get("labels", [])

    # Deduplicate while preserving order
    seen = set()
    unique = []
    for label in labels:
        if label not in seen:
            seen.add(label)
            unique.append(label)

    return unique


# ---------------------------------------------------------------------------
# EasyOCR helper
# ---------------------------------------------------------------------------

def _extract_text_ocr(image_path: str) -> tuple[str, list[float]]:
    """
    Extract visible text from the image using EasyOCR.

    Returns:
        (joined_text, confidence_scores)
    """
    reader = get_ocr_reader()
    results = reader.readtext(image_path)

    texts = []
    scores = []

    for (_bbox, text, confidence) in results:
        texts.append(text)
        scores.append(round(confidence, 4))

    joined = " ".join(texts)

    return joined, scores


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def analyze_image(image_path: str) -> dict:
    """
    Full image analysis pipeline.

    Steps:
        1. Florence-2  —  detailed caption.
        2. Florence-2  —  object detection.
        3. EasyOCR     —  text extraction.

    Args:
        image_path: Absolute or relative path to the image file.

    Returns:
        {
            "image_description": str,
            "ocr_text": str,
            "detected_objects": list[str],
            "confidence_scores": list[float],
        }
    """
    print(f"[image_analyzer] Analyzing: {image_path}")

    image = Image.open(image_path).convert("RGB")

    # Florence tasks
    description = _get_detailed_caption(image)
    detected_objects = _get_detected_objects(image)

    # OCR
    ocr_text, confidence_scores = _extract_text_ocr(image_path)

    result = {
        "image_description": description,
        "ocr_text": ocr_text,
        "detected_objects": detected_objects,
        "confidence_scores": confidence_scores,
    }

    print(f"[image_analyzer] Done. OCR chars={len(ocr_text)}, objects={len(detected_objects)}")

    # Cleanup — delete the uploaded image file
    try:
        os.remove(image_path)
        print(f"[image_analyzer] Cleaned up: {image_path}")
    except OSError as e:
        print(f"[image_analyzer] Cleanup warning: {e}")

    return result