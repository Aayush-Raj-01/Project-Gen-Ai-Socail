"""
PDF Analyzer Module
===================

Extracts text from PDF files.
Uses PyPDF2 for text-based PDFs (fast, no GPU).
Falls back to OCR via pytesseract for scanned/image-based PDFs.

Supports: .pdf
"""

import os


# ---------------------------------------------------------------------------
# Text extraction (PyPDF2 — fast, no GPU needed)
# ---------------------------------------------------------------------------

def _extract_text_pypdf(pdf_path: str) -> str:
    """Extract text from a text-based PDF using PyPDF2."""
    from PyPDF2 import PdfReader

    reader = PdfReader(pdf_path)
    pages_text = []

    for i, page in enumerate(reader.pages):
        text = page.extract_text() or ""
        if text.strip():
            pages_text.append(f"--- Page {i + 1} ---\n{text.strip()}")

    return "\n\n".join(pages_text)


# ---------------------------------------------------------------------------
# OCR fallback (pytesseract — for scanned PDFs)
# ---------------------------------------------------------------------------

def _extract_text_ocr(pdf_path: str) -> str:
    """
    Extract text from a scanned PDF by converting pages to images
    and running OCR via pytesseract.
    Uses PyMuPDF (fitz) instead of pdf2image to avoid Poppler dependency.
    """
    try:
        import pytesseract
        import fitz  # PyMuPDF
        from PIL import Image
        import io

        print("[pdf_analyzer] Running OCR on scanned PDF using PyMuPDF + Tesseract ...")
        
        doc = fitz.open(pdf_path)
        pages_text = []
        
        for i, page in enumerate(doc):
            # Render page to an image (pixmap) with 200 DPI equivalent
            pix = page.get_pixmap(matrix=fitz.Matrix(2, 2))
            
            # Convert to PIL Image
            img_data = pix.tobytes("png")
            img = Image.open(io.BytesIO(img_data))
            
            # Run OCR
            text = pytesseract.image_to_string(img)
            if text.strip():
                pages_text.append(f"--- Page {i + 1} ---\n{text.strip()}")
                
        doc.close()
        return "\n\n".join(pages_text)

    except ImportError:
        print("[pdf_analyzer] WARNING: pytesseract or PyMuPDF not installed. OCR fallback unavailable.")
        return ""
    except Exception as e:
        print(f"[pdf_analyzer] WARNING: OCR fallback failed: {e}")
        return ""


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def analyze_pdf(pdf_path: str) -> dict:
    """
    Extract all text from a PDF file.

    Strategy:
        1. Try PyPDF2 (fast, works for text-based PDFs).
        2. If minimal text found, fall back to OCR.

    Args:
        pdf_path: Absolute path to the PDF file.

    Returns:
        {
            "extracted_text": str,
            "page_count": int,
            "method": "text" | "ocr",
        }
    """
    print(f"[pdf_analyzer] Extracting text from: {pdf_path}")

    from PyPDF2 import PdfReader
    reader = PdfReader(pdf_path)
    page_count = len(reader.pages)

    # Try text extraction first
    text = _extract_text_pypdf(pdf_path)
    method = "text"

    # If text extraction yielded very little, try OCR
    if len(text.strip()) < 50 and page_count > 0:
        print("[pdf_analyzer] Minimal text found — trying OCR fallback ...")
        ocr_text = _extract_text_ocr(pdf_path)
        if len(ocr_text) > len(text):
            text = ocr_text
            method = "ocr"

    print(f"[pdf_analyzer] Done. Pages={page_count}, method={method}, chars={len(text)}")

    # Cleanup — delete the uploaded PDF file
    try:
        os.remove(pdf_path)
        print(f"[pdf_analyzer] Cleaned up: {pdf_path}")
    except OSError as e:
        print(f"[pdf_analyzer] Cleanup warning: {e}")

    return {
        "extracted_text": text,
        "page_count": page_count,
        "method": method,
    }
