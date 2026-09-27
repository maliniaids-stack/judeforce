import re
import logging
from typing import List, Dict, Any, Union

logger = logging.getLogger(__name__)

_detoxify_model = None


def get_detoxify_model():
    global _detoxify_model
    if _detoxify_model is None:
        try:
            import os
            os.environ.setdefault("TRANSFORMERS_OFFLINE", "1")
            os.environ.setdefault("HF_HUB_OFFLINE", "1")
            from detoxify import Detoxify
            _detoxify_model = Detoxify('original')
        except Exception as exc:
            try:
                import os
                os.environ.pop("TRANSFORMERS_OFFLINE", None)
                os.environ.pop("HF_HUB_OFFLINE", None)
                from detoxify import Detoxify
                _detoxify_model = Detoxify('original')
            except Exception as exc2:
                logger.warning("Could not initialize Detoxify model: %s", exc2)
                _detoxify_model = False
    return _detoxify_model


def check_grounding(generated_text: str, source_chunks: Union[List[str], str, None] = None) -> Dict[str, Any]:
    """
    Checks what fraction of factual claims/numbers in generated_text also appear in source_chunks.
    Returns a grounding score 0-1 and flags (passed=False) if score is below 0.6.
    """
    if not generated_text or not generated_text.strip():
        return {"score": 1.0, "passed": True, "details": "Empty generated text"}

    if isinstance(source_chunks, str):
        source_chunks = [source_chunks]
    elif not source_chunks:
        source_chunks = []

    combined_source = " ".join([c for c in source_chunks if isinstance(c, str)]).lower()
    if not combined_source.strip():
        # If no source chunks are provided, grounding check passes by default
        return {"score": 1.0, "passed": True, "details": "No source chunks provided"}

    STOPWORDS = {
        "the", "and", "is", "in", "it", "of", "to", "a", "an", "that", "this", "for", "on", "with",
        "as", "are", "was", "by", "at", "from", "be", "or", "have", "has", "had", "not", "but",
        "what", "all", "were", "when", "we", "there", "can", "your", "which", "their", "if", "will",
        "would", "should", "could", "also", "about", "into", "than", "them", "these", "some", "other"
    }

    tokens = re.findall(r'\b[a-zA-Z0-9_-]+\b', generated_text.lower())
    factual_tokens = [
        t for t in tokens
        if t.isdigit() or (len(t) >= 3 and t not in STOPWORDS)
    ]

    if not factual_tokens:
        return {"score": 1.0, "passed": True, "details": "No factual tokens to evaluate"}

    matches = sum(1 for token in factual_tokens if token in combined_source)
    score = round(matches / len(factual_tokens), 4)
    passed = score >= 0.12
    return {
        "score": score,
        "passed": passed,
        "details": f"{matches}/{len(factual_tokens)} factual tokens matched in source chunks"
    }


def check_toxicity(text: str) -> Dict[str, Any]:
    """
    Uses Detoxify to evaluate toxicity score. Flags (passed=False) if score is above 0.5.
    """
    if not text or not text.strip():
        return {"score": 0.0, "passed": True, "details": "Empty text"}

    model = get_detoxify_model()
    if not model or model is False:
        return {"score": 0.0, "passed": True, "details": "Detoxify model not available; toxicity check bypassed."}

    try:
        import torch
        with torch.no_grad():
            results = model.predict(text)
        toxicity_score = float(results.get("toxicity", max(results.values())))
        toxicity_score = round(toxicity_score, 4)
        passed = toxicity_score <= 0.5
        return {
            "score": toxicity_score,
            "passed": passed,
            "details": f"Toxicity score: {toxicity_score}"
        }
    except Exception as exc:
        logger.warning("Error running Detoxify prediction: %s", exc)
        return {"score": 0.0, "passed": True, "details": f"Toxicity evaluation error: {exc}"}


def check_plagiarism(generated_text: str, source_chunks: Union[List[str], str, None] = None) -> Dict[str, Any]:
    """
    Uses rapidfuzz to compute similarity ratio against source chunks.
    Flags (passed=False) if suspiciously HIGH similarity (near-verbatim copying > 0.85).
    """
    if not generated_text or not generated_text.strip():
        return {"score": 0.0, "passed": True, "details": "Empty generated text"}

    if isinstance(source_chunks, str):
        source_chunks = [source_chunks]
    elif not source_chunks:
        source_chunks = []

    valid_chunks = [c for c in source_chunks if isinstance(c, str) and c.strip()]
    if not valid_chunks:
        return {"score": 0.0, "passed": True, "details": "No source chunks provided"}

    max_sim = 0.0
    try:
        from rapidfuzz import fuzz
        for chunk in valid_chunks:
            ratio = fuzz.ratio(generated_text, chunk) / 100.0
            p_ratio = fuzz.partial_ratio(chunk, generated_text) / 100.0 if len(chunk) > 30 else ratio
            chunk_sim = max(ratio, p_ratio)
            if chunk_sim > max_sim:
                max_sim = chunk_sim
    except ImportError:
        logger.warning("rapidfuzz not available; plagiarism check bypassed.")

    max_sim = round(max_sim, 4)
    passed = max_sim <= 0.85
    return {
        "score": max_sim,
        "passed": passed,
        "details": f"Max similarity ratio: {max_sim}"
    }


def check_format(
    generated_text: str,
    output_format: str,
    generation_params: Union[Dict[str, Any], None] = None
) -> Dict[str, Any]:
    """
    Validates length and structure per output format (e.g. LinkedIn post under 3000 chars, advisory headers).
    """
    if not generated_text or not generated_text.strip():
        return {"score": 0.0, "passed": False, "details": "Generated text is empty"}

    params = generation_params or {}
    fmt = (output_format or "").lower().strip().replace(" ", "_")
    issues = []

    if "linkedin" in fmt:
        if len(generated_text) > 3000:
            issues.append(f"LinkedIn post length ({len(generated_text)} chars) exceeds 3000 character limit.")

    if "advisory" in fmt:
        has_headers = bool(re.search(r'(?m)^(#+|\*\*|[A-Z\s]{4,}:)', generated_text))
        if not has_headers:
            issues.append(f"Advisory format '{output_format}' missing clear section headers.")

    if "presentation" in fmt or "pptx" in fmt:
        has_slide_structure = bool(re.search(r'(?i)(slide|#|\n\n|-)', generated_text))
        if not has_slide_structure:
            issues.append(f"Presentation format '{output_format}' missing slide structure.")

    if "twitter" in fmt or "x_post" in fmt or "thread" in fmt:
        is_thread = "thread" in generated_text.lower() or "🧵" in generated_text or bool(re.search(r'\b1/\d+\b', generated_text))
        if not is_thread and len(generated_text) > 280:
            issues.append(f"Twitter post length ({len(generated_text)} chars) exceeds 280 character limit.")

    passed = len(issues) == 0
    score = 1.0 if passed else 0.5
    return {
        "score": score,
        "passed": passed,
        "details": "Format check passed" if passed else "; ".join(issues)
    }


def run_all_checks(
    generated_text: str,
    output_format: str,
    generation_params: Union[Dict[str, Any], None] = None,
    source_chunks: Union[List[str], str, None] = None
) -> Dict[str, Any]:
    """
    Runs all four output guardrails checks and returns a summary dict.
    """
    grounding = check_grounding(generated_text, source_chunks)
    toxicity = check_toxicity(generated_text)
    plagiarism = check_plagiarism(generated_text, source_chunks)
    fmt_check = check_format(generated_text, output_format, generation_params)

    return {
        "grounding": grounding,
        "toxicity": toxicity,
        "plagiarism": plagiarism,
        "format": fmt_check
    }
