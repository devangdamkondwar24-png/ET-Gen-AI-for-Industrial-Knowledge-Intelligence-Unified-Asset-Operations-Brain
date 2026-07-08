"""
Document Extractor — Handles text extraction from various formats.
Supports plain text, searchable PDFs, and scanned PDFs (via OCR).
"""
import os
import io

def extract_text(file_path: str, mime_type: str) -> tuple[str, list[str]]:
    """
    Extract text from a file.
    Returns (extracted_text, warnings_list)
    """
    warnings = []
    text = ""
    
    # Try basic text extraction first (txt, csv, md, etc)
    if not file_path.lower().endswith('.pdf') and 'pdf' not in mime_type:
        try:
            with open(file_path, "r", encoding="utf-8") as f:
                return f.read(), warnings
        except UnicodeDecodeError:
            try:
                # Try latin-1 fallback
                with open(file_path, "r", encoding="latin-1") as f:
                    return f.read(), ["File read with latin-1 encoding due to utf-8 decode error."]
            except Exception as e:
                return "", [f"Failed to read text file: {str(e)}"]

    # PDF extraction
    try:
        import pdfplumber
        with pdfplumber.open(file_path) as pdf:
            pages_text = []
            for i, page in enumerate(pdf.pages):
                page_text = page.extract_text()
                if page_text:
                    pages_text.append(page_text)
            
            text = "\n".join(pages_text).strip()
            
            if text:
                return text, warnings
            
            # If pdfplumber returned no text, it might be a scanned PDF.
            # Fall back to OCR.
            warnings.append("No searchable text found in PDF. Attempting OCR...")
            
    except ImportError:
        warnings.append("pdfplumber not installed. Skipping direct PDF text extraction.")
    except Exception as e:
        warnings.append(f"PDF text extraction failed: {str(e)}")

    # OCR Fallback
    try:
        import pytesseract
        from pdf2image import convert_from_path
        
        # This requires poppler to be installed on Windows
        images = convert_from_path(file_path)
        
        ocr_text = []
        for i, image in enumerate(images):
            # We can do some basic image enhancement here if needed
            page_text = pytesseract.image_to_string(image)
            ocr_text.append(page_text)
            
        text = "\n".join(ocr_text).strip()
        
        if not text:
            warnings.append("OCR completed but yielded no text.")
            
        return text, warnings
        
    except ImportError:
        warnings.append("pytesseract or pdf2image not installed. OCR skipped.")
        return "", warnings
    except Exception as e:
        warnings.append(f"OCR processing failed: {str(e)}. (Ensure Tesseract and Poppler are installed on Windows).")
        return "", warnings
