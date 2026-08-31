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

    _qwen_tokenizer = AutoTokenizer.from_pretrained(QWEN_MODEL_NAME, trust_remote_code=True)
    _qwen_model = AutoModelForCausalLM.from_pretrained(
        QWEN_MODEL_NAME,
        device_map="auto",
        trust_remote_code=True,
        quantization_config=BitsAndBytesConfig(
            load_in_4bit=True,
            bnb_4bit_compute_dtype=torch.float16,
            bnb_4bit_use_double_quant=True,
        ),
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


def _patch_florence_environment():
    """
    Applies global class-level patches to transformers classes before loading Florence-2.
    This resolves backwards compatibility issues when loading Florence-2 in transformers>=5.x.
    """
    from transformers import PretrainedConfig, PreTrainedModel, PreTrainedTokenizerBase
    import torch.nn as nn
    
    # 1. Bypass forced_bos_token_id dynamic access blocks
    PretrainedConfig.forced_bos_token_id = None
    
    # 2. Bypass missing SDPA flags in remote code
    old_getattr = nn.Module.__getattr__
    def safe_getattr(self, name):
        if name == "_supports_sdpa": return False
        if name == "_supports_flash_attn_2": return False
        return old_getattr(self, name)
    nn.Module.__getattr__ = safe_getattr
    
    # 3. Bypass RobertaTokenizer missing image token attributes
    PreTrainedTokenizerBase.image_token = '<image>'
    PreTrainedTokenizerBase.image_token_id = 999999
    PreTrainedTokenizerBase.additional_special_tokens = []

    # 4. Make EncoderDecoderCache subscriptable for Florence-2's legacy code
    #    Florence-2 remote code does past_key_values[0][0].shape[2] etc.
    #    Transformers 5.x replaced tuple caches with EncoderDecoderCache objects.
    try:
        from transformers.cache_utils import EncoderDecoderCache, DynamicCache

        class _EmptyCacheProxy:
            """Proxy that makes past_key_values[i][j].shape[k] return 0 for empty caches."""
            shape = (0, 0, 0, 0)
            def __getitem__(self, idx):
                return self

        _empty = _EmptyCacheProxy()

        def _edc_getitem(self, idx):
            """Allow past_key_values[idx] to return the idx-th layer's (key, value) tuple."""
            cache = self.self_attention_cache
            if isinstance(cache, DynamicCache):
                if len(cache.layers) == 0:
                    return (_empty, _empty)
                layer = cache.layers[idx]
                if layer.keys is None:
                    return (_empty, _empty)
                return (layer.keys, layer.values)
            return cache[idx]

        def _edc_len(self):
            cache = self.self_attention_cache
            if isinstance(cache, DynamicCache):
                return len(cache.layers)
            return len(cache)

        EncoderDecoderCache.__getitem__ = _edc_getitem
        EncoderDecoderCache.__len__ = _edc_len
    except (ImportError, AttributeError):
        pass  # Gracefully skip if cache_utils structure differs

def get_florence_model():
    """
    Return (model, processor) for Florence-2.
    Loads it lazily on first access.
    """
    global _florence_model, _florence_processor

    if _florence_model is None or _florence_processor is None:
        print("[load_models] Lazy-loading Florence-2-base ...")
        
        _patch_florence_environment()

        _florence_processor = AutoProcessor.from_pretrained(
            FLORENCE_MODEL_NAME,
            trust_remote_code=True
        )

        _florence_model = AutoModelForCausalLM.from_pretrained(
            FLORENCE_MODEL_NAME,
            torch_dtype=torch.float16,
            device_map="auto",
            trust_remote_code=True
        )

        print("[load_models] Florence-2-base loaded successfully.")

    return _florence_model, _florence_processor


def unload_florence_model():
    """
    Remove Florence-2 from GPU and free VRAM.
    It will be lazy-loaded again on the next image request.
    """
    global _florence_model, _florence_processor

    if _florence_model is not None:
        del _florence_model
        _florence_model = None

    if _florence_processor is not None:
        del _florence_processor
        _florence_processor = None

    import gc
    gc.collect()
    if torch.cuda.is_available():
        torch.cuda.empty_cache()

    print("[load_models] Florence-2 unloaded — VRAM freed.")


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


def unload_ocr_reader():
    """
    Remove EasyOCR from GPU and free VRAM.
    """
    global _ocr_reader

    if _ocr_reader is not None:
        del _ocr_reader
        _ocr_reader = None

    import gc
    gc.collect()
    if torch.cuda.is_available():
        torch.cuda.empty_cache()

    print("[load_models] EasyOCR unloaded — VRAM freed.")
