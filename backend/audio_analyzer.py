"""
Audio Analyzer Module
=====================

Extracts text from audio files using OpenAI Whisper.
The Whisper model is lazy-loaded and unloaded after each use to free VRAM.

Supports: .mp3, .wav, .m4a, .ogg, .flac, .aac
"""

import os
import whisper

# ---------------------------------------------------------------------------
# Whisper model cache
# ---------------------------------------------------------------------------

_whisper_model = None


def _get_whisper_model():
    """Lazy-load the Whisper 'base' model."""
    global _whisper_model
    if _whisper_model is None:
        print("[audio_analyzer] Loading Whisper model (base) ...")
        _whisper_model = whisper.load_model("base")
        print("[audio_analyzer] Whisper loaded successfully.")
    return _whisper_model


def _unload_whisper_model():
    """Remove Whisper model from memory."""
    global _whisper_model
    if _whisper_model is not None:
        del _whisper_model
        _whisper_model = None

        import gc
        import torch
        gc.collect()
        if torch.cuda.is_available():
            torch.cuda.empty_cache()

        print("[audio_analyzer] Whisper unloaded — VRAM freed.")


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def analyze_audio(audio_path: str) -> dict:
    """
    Transcribe an audio file to text using Whisper.

    Args:
        audio_path: Absolute path to the audio file.

    Returns:
        {
            "transcription": str,
            "language": str,
        }
    """
    print(f"[audio_analyzer] Transcribing: {audio_path}")

    model = _get_whisper_model()
    result = model.transcribe(audio_path, fp16=False)

    transcription = result.get("text", "").strip()
    language = result.get("language", "unknown")

    print(f"[audio_analyzer] Done. Language={language}, chars={len(transcription)}")

    # Unload model to free VRAM
    _unload_whisper_model()

    # Cleanup — delete the uploaded audio file
    try:
        os.remove(audio_path)
        print(f"[audio_analyzer] Cleaned up: {audio_path}")
    except OSError as e:
        print(f"[audio_analyzer] Cleanup warning: {e}")

    return {
        "transcription": transcription,
        "language": language,
    }
