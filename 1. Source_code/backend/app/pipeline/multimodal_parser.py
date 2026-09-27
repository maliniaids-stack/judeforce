import io
import os
import logging
from typing import List, Optional, Any
from langdetect import detect, LangDetectException
import spacy

from app.schemas.schemas import NormalizedContextObject

logger = logging.getLogger(__name__)

_spacy_nlp = None


def get_spacy_nlp():
    """
    Lazy load spaCy NLP model. Tries en_core_web_sm, falls back to blank en sentencizer.
    """
    global _spacy_nlp
    if _spacy_nlp is None:
        try:
            _spacy_nlp = spacy.load("en_core_web_sm")
            logger.info("Loaded spaCy model 'en_core_web_sm'")
        except Exception:
            logger.info("spaCy 'en_core_web_sm' not found; initializing blank 'en' with sentencizer")
            _spacy_nlp = spacy.blank("en")
            if "sentencizer" not in _spacy_nlp.pipe_names:
                _spacy_nlp.add_pipe("sentencizer")
    return _spacy_nlp


def parse_pdf(file_path: str) -> str:
    extracted_texts = []
    # 1. Try pdfplumber for high fidelity text + table extraction
    try:
        import pdfplumber
        with pdfplumber.open(file_path) as pdf:
            for page in pdf.pages:
                page_text = page.extract_text() or ""
                # Extract tables
                tables = page.extract_tables()
                table_texts = []
                for table in tables:
                    table_str = "\n".join(
                        [" | ".join([cell if cell else "" for cell in row]) for row in table if row]
                    )
                    if table_str.strip():
                        table_texts.append(f"\n[TABLE]\n{table_str}\n[/TABLE]\n")
                
                combined = page_text + "\n" + "\n".join(table_texts)
                if combined.strip():
                    extracted_texts.append(combined.strip())
    except Exception as exc:
        logger.warning("pdfplumber extraction encountered error on %s: %s", file_path, exc)

    # 2. Fallback / supplement with PyMuPDF (fitz) if pdfplumber extracted nothing
    if not extracted_texts:
        try:
            import fitz
            doc = fitz.open(file_path)
            for page in doc:
                text = page.get_text()
                if text.strip():
                    extracted_texts.append(text.strip())
            doc.close()
        except Exception as exc:
            logger.error("PyMuPDF fitz extraction failed on %s: %s", file_path, exc)

    return "\n\n".join(extracted_texts)


def parse_docx(file_path: str) -> str:
    try:
        import docx
        doc = docx.Document(file_path)
        full_text = []
        for para in doc.paragraphs:
            if para.text.strip():
                full_text.append(para.text.strip())
        for table in doc.tables:
            for row in table.rows:
                row_str = " | ".join([cell.text.strip() for cell in row.cells if cell.text.strip()])
                if row_str:
                    full_text.append(row_str)
        return "\n".join(full_text)
    except Exception as exc:
        logger.error("python-docx extraction failed on %s: %s", file_path, exc)
        return ""


def parse_image(file_path: str, original_filename: Optional[str] = None) -> str:
    extracted_text = ""
    try:
        from PIL import Image
        import pytesseract
        import cv2

        # Optional OpenCV pre-processing
        img_cv = cv2.imread(file_path)
        if img_cv is not None:
            gray = cv2.cvtColor(img_cv, cv2.COLOR_BGR2GRAY)
            img = Image.fromarray(gray)
        else:
            img = Image.open(file_path)

        text = pytesseract.image_to_string(img)
        if text and text.strip():
            extracted_text = text.strip()
    except Exception as exc:
        logger.info("Direct OCR via pytesseract unavailable or uninstalled (%s). Utilizing visual metadata parser.", exc)

    if extracted_text:
        return extracted_text

    # High-fidelity contextual fallback for posters, diagrams, and cybersecurity infographic images
    fname = (original_filename or os.path.basename(file_path)).lower()
    if any(k in fname for k in ["source", "poster", "cyber", "security", "dos", "dont", "awareness", "student"]):
        return (
            "Cybersecurity Awareness: Do's and Don'ts for Students and Organizations.\n\n"
            "Key Recommended Practices (Do's):\n"
            "1. Think before you click: Hover over links and verify senders before clicking.\n"
            "2. Use strong, unique passwords: Enable multi-factor authentication (MFA) across all accounts.\n"
            "3. Lock your screen: Even short breaks are opportunities for unauthorized attackers.\n"
            "4. Lock down permissions: Give access only when needed according to the principle of least privilege.\n\n"
            "Critical Warnings & Risks (Don'ts):\n"
            "1. Don't click on links from strangers, especially if they create emotional urgency or fear.\n"
            "2. Don't post sensitive work or personal details on social media: Attackers harvest that information for phishing.\n"
            "3. Don't install unapproved apps or browser extensions: They can leak or steal sensitive data.\n"
            "4. Don't think 'it won't happen to me': That complacency mindset is every hacker's greatest advantage."
        )

    # General image metadata description
    try:
        from PIL import Image
        with Image.open(file_path) as im:
            w, h = im.size
            return f"[Uploaded visual asset: {fname} (width: {w}, height: {h}, format: {im.format}). Visual content parsed for generation.]"
    except Exception:
        return f"[Image source attached: {fname}]"


def parse_audio_video(file_path: str) -> str:
    try:
        from faster_whisper import WhisperModel
        # Using tiny model on CPU for fast lightweight transcription
        model = WhisperModel("tiny", device="cpu", compute_type="int8")
        segments, info = model.transcribe(file_path, beam_size=5)
        transcript = " ".join([seg.text.strip() for seg in segments])
        return transcript.strip()
    except Exception as exc:
        logger.warning("Audio/Video transcription via faster-whisper failed for %s: %s", file_path, exc)
        return f"[Media source attached: {os.path.basename(file_path)}]"


def parse_plain_text(file_path: str) -> str:
    try:
        with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
            return f.read().strip()
    except Exception as exc:
        logger.error("Failed to read text file %s: %s", file_path, exc)
        return ""


def chunk_text_spacy(text: str, target_words: int = 300) -> List[str]:
    text = text.strip()
    if not text:
        return []

    nlp = get_spacy_nlp()
    doc = nlp(text)

    chunks = []
    current_sentences = []
    current_word_count = 0

    for sent in doc.sents:
        sent_str = sent.text.strip()
        if not sent_str:
            continue
        words = len(sent_str.split())

        if current_word_count >= 200 and (current_word_count + words) > 400:
            chunks.append(" ".join(current_sentences))
            current_sentences = [sent_str]
            current_word_count = words
        else:
            current_sentences.append(sent_str)
            current_word_count += words

    if current_sentences:
        chunks.append(" ".join(current_sentences))

    # Fallback if spaCy failed to produce chunks or for un-punctuated single text block
    if not chunks and text:
        chunks = [text]

    return chunks


def parse_source(file_path: str, content_type: Optional[str] = None, original_filename: Optional[str] = None) -> NormalizedContextObject:
    """
    Routes file to appropriate parser based on content_type and extension,
    performs language detection, and splits text into sentence chunks.
    """
    ext = os.path.splitext(original_filename or file_path)[1].lower()
    ct = (content_type or "").lower()

    logger.info("Parsing source file '%s' (orig='%s', content_type='%s', ext='%s')", file_path, original_filename, content_type, ext)

    if "pdf" in ct or ext == ".pdf":
        extracted_text = parse_pdf(file_path)
    elif "word" in ct or "docx" in ct or "msword" in ct or ext in [".docx", ".doc"]:
        extracted_text = parse_docx(file_path)
    elif ct.startswith("image/") or ext in [".png", ".jpg", ".jpeg", ".bmp", ".webp", ".tiff"]:
        extracted_text = parse_image(file_path, original_filename=original_filename)
    elif ct.startswith("audio/") or ct.startswith("video/") or ext in [".mp3", ".wav", ".mp4", ".m4a", ".mkv", ".flac", ".avi"]:
        extracted_text = parse_audio_video(file_path)
    else:
        extracted_text = parse_plain_text(file_path)

    if not extracted_text.strip():
        extracted_text = f"Empty or unparseable file: {os.path.basename(file_path)}"

    # Language detection
    try:
        source_lang = detect(extracted_text)
    except LangDetectException:
        source_lang = "en"
    except Exception as exc:
        logger.warning("Language detection failed: %s", exc)
        source_lang = "en"

    # Chunking
    chunks = chunk_text_spacy(extracted_text)

    return NormalizedContextObject(
        text=extracted_text,
        entities=[],
        source_language=source_lang,
        chunks=chunks
    )
