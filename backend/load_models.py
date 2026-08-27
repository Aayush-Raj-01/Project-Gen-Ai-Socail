"""
Model Loading Module
====================

Manages lifecycle of all ML models:
- Qwen3-4B: Loaded eagerly at import time (stays resident).
- Florence-2: Lazy-loaded on first image request, cached.
- EasyOCR: Lazy-loaded on first image request, cached.
"""

import torch
from transformers import (
    AutoTokenizer,
    AutoModelForCausalLM,
    AutoProcessor,
    BitsAndBytesConfig,
)

# ---------------------------------------------------------------------------
# Global model caches
# ---------------------------------------------------------------------------

_qwen_model = None
_qwen_tokenizer = None

_florence_model = None
_florence_processor = None

_ocr_reader = None

# ---------------------------------------------------------------------------
# Qwen3-4B  —  Eager load at import time
# ---------------------------------------------------------------------------

QWEN_MODEL_NAME = "Qwen/Qwen3-4B-Instruct-2507"

_bnb_config = BitsAndBytesConfig(
    load_in_4bit=True,
    bnb_4bit_compute_dtype=torch.float16,
    bnb_4bit_quant_type="nf4",
    bnb_4bit_use_double_quant=True,
)


def _load_qwen():
    """Load Qwen model and tokenizer. Called once at module import."""
    global _qwen_model, _qwen_tokenizer

    print("[load_models] Loading Qwen3-4B-Instruct-2507 (4-bit) ...")

    _qwen_tokenizer = AutoTokenizer.from_pretrained(QWEN_MODEL_NAME)

    _qwen_model = AutoModelForCausalLM.from_pretrained(
        QWEN_MODEL_NAME,
        quantization_config=_bnb_config,
        device_map="auto",
        torch_dtype=torch.float16,
    )

    print("[load_models] Qwen loaded successfully.")


# Run immediately on first import so Qwen is resident for the server lifetime.
_load_qwen()


def get_qwen_model():
    """Return the resident Qwen model instance."""
    return _qwen_model


def get_qwen_tokenizer():
    """Return the resident Qwen tokenizer."""
    return _qwen_tokenizer


# ---------------------------------------------------------------------------
# Florence-2  —  Lazy load on first image request
# ---------------------------------------------------------------------------

FLORENCE_MODEL_NAME = "microsoft/Florence-2-base"


def _patch_forced_bos(config_obj):
    """Set forced_bos_token_id on a config if missing."""
    if not hasattr(config_obj, "forced_bos_token_id"):
        object.__setattr__(config_obj, "forced_bos_token_id", None)


def get_florence_model():
    """
    Return (model, processor) for Florence-2.
    Loads on first call, reuses cached instance afterwards.
    """
    global _florence_model, _florence_processor

    if _florence_model is None:
        print("[load_models] Lazy-loading Florence-2-base ...")

        _florence_processor = AutoProcessor.from_pretrained(
            FLORENCE_MODEL_NAME,
            trust_remote_code=True,
        )

        _florence_model = AutoModelForCausalLM.from_pretrained(
            FLORENCE_MODEL_NAME,
            torch_dtype=torch.float16,
            device_map="auto",
            trust_remote_code=True,
        )

        # ── Patch forced_bos_token_id (removed in transformers 5.x) ──
        # Florence-2's generate() still reads it from various config objects.

        # 1. Top-level model config
        _patch_forced_bos(_florence_model.config)

        # 2. text_config (Florence2LanguageConfig — the one causing the crash)
        if hasattr(_florence_model.config, "text_config"):
            _patch_forced_bos(_florence_model.config.text_config)

        # 3. vision_config
        if hasattr(_florence_model.config, "vision_config"):
            _patch_forced_bos(_florence_model.config.vision_config)

        # 4. Walk ALL nn.Module submodules (language_model, vision_tower, etc.)
        #    nn.Module stores children in _modules, not __dict__,
        #    so vars() misses them — named_modules() does not.
        for _name, module in _florence_model.named_modules():
            if hasattr(module, "config"):
                _patch_forced_bos(module.config)
                # Also patch any nested configs
                for attr in ("text_config", "decoder", "encoder"):
                    if hasattr(module.config, attr):
                        sub = getattr(module.config, attr)
                        if sub is not None:
                            _patch_forced_bos(sub)

        # 5. generation_config
        if hasattr(_florence_model, "generation_config"):
            _patch_forced_bos(_florence_model.generation_config)

        print("[load_models] Florence-2-base loaded successfully.")

    return _florence_model, _florence_processor


# ---------------------------------------------------------------------------
# EasyOCR  —  Lazy load on first image request
# ---------------------------------------------------------------------------

def get_ocr_reader():
    """
    Return an EasyOCR Reader instance.
    Loads on first call, reuses cached instance afterwards.
    """
    global _ocr_reader

    if _ocr_reader is None:
        import easyocr

        print("[load_models] Lazy-loading EasyOCR (English) ...")

        _ocr_reader = easyocr.Reader(
            ["en"],
            gpu=torch.cuda.is_available(),
        )

        print("[load_models] EasyOCR loaded successfully.")

    return _ocr_reader
