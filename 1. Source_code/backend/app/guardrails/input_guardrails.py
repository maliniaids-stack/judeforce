import os
import re
import logging
from typing import List, Tuple, Optional, Dict, Any

from presidio_analyzer import AnalyzerEngine
from presidio_analyzer.nlp_engine import NlpEngineProvider
from presidio_anonymizer import AnonymizerEngine

logger = logging.getLogger("prism_ai.guardrails")

# Allowed extensions and 50MB size limit
ALLOWED_EXTENSIONS = {"pdf", "docx", "doc", "pptx", "ppt", "txt", "md", "csv", "json", "jpg", "jpeg", "png", "webp", "bmp", "mp3", "mp4"}
MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024  # 50 MB

# Rule-based prompt injection phrases (case-insensitive)
PROMPT_INJECTION_PHRASES = [
    "ignore previous instructions",
    "ignore all previous instructions",
    "disregard the above",
    "disregard previous instructions",
    "system prompt",
    "system instructions",
    "bypass instructions",
    "forget your previous instructions",
    "override system prompt",
    "reveal your prompt"
]

# Signatures for virus / malware pattern detection simulation
VIRUS_SIGNATURES = [
    b"X5O!P%@AP[4\\PZX54(P^)7CC)7}$EICAR-STANDARD-ANTIVIRUS-TEST-FILE!$H+H*",
    b"W97M.Downloader",
    b"Trojan.Ransomware.Payload",
    b"eval(base64_decode(",
    b"powershell -nop -w hidden -enc",
    b"cmd.exe /c powershell -ExecutionPolicy Bypass"
]

_analyzer_engine: Optional[AnalyzerEngine] = None
_anonymizer_engine: Optional[AnonymizerEngine] = None


def get_analyzer_engine() -> AnalyzerEngine:
    global _analyzer_engine
    if _analyzer_engine is None:
        try:
            nlp_configuration = {
                "nlp_engine_name": "spacy",
                "models": [{"lang_code": "en", "model_name": "en_core_web_sm"}],
            }
            provider = NlpEngineProvider(nlp_configuration=nlp_configuration)
            nlp_engine = provider.create_engine()
            _analyzer_engine = AnalyzerEngine(nlp_engine=nlp_engine)
            logger.info("Initialized Presidio AnalyzerEngine with 'en_core_web_sm'")
        except Exception as exc:
            logger.warning("Failed to initialize custom NLP engine for Presidio (%s); falling back to default", exc)
            _analyzer_engine = AnalyzerEngine()
    return _analyzer_engine


def get_anonymizer_engine() -> AnonymizerEngine:
    global _anonymizer_engine
    if _anonymizer_engine is None:
        _anonymizer_engine = AnonymizerEngine()
    return _anonymizer_engine


def validate_file(filename: str, content_type: Optional[str] = None, file_size: int = 0) -> None:
    """
    Validates uploaded file against allowed extensions and size limit.
    """
    if not filename:
        logger.warning("File validation rejected: Missing filename")
        raise ValueError("Filename is required for upload.")

    ext = os.path.splitext(filename)[1].lstrip(".").lower()
    if not ext or ext not in ALLOWED_EXTENSIONS:
        logger.warning(
            "File validation rejected: Unauthorized file extension '%s' for '%s'",
            ext,
            filename
        )
        raise ValueError(
            f"File type '{ext}' is not allowed. Allowed types: {', '.join(sorted(ALLOWED_EXTENSIONS))}"
        )

    if file_size > MAX_FILE_SIZE_BYTES:
        size_mb = file_size / (1024 * 1024)
        logger.warning(
            "File validation rejected: File '%s' size (%.2f MB) exceeds 50MB limit",
            filename,
            size_mb
        )
        raise ValueError(
            f"File size exceeds maximum allowed limit of 50MB (received {size_mb:.2f} MB)."
        )

    logger.info("File validation passed for '%s' (ext='%s', size=%d bytes)", filename, ext, file_size)


def scan_for_virus_or_malware(file_bytes: bytes, filename: str = "") -> Tuple[bool, str]:
    """
    Scans file content against virus signatures, malware payloads, and malicious script macros.
    Returns (is_infected, threat_details).
    """
    if not file_bytes:
        return False, "File is clean (empty content)"

    lower_bytes = file_bytes.lower()

    # Check known malware signatures
    for sig in VIRUS_SIGNATURES:
        if sig.lower() in lower_bytes:
            threat_name = sig.decode("latin1", errors="ignore")[:30]
            logger.warning("VIRUS/MALWARE DETECTED in '%s': signature match '%s'", filename, threat_name)
            return True, f"Malicious signature detected: {threat_name}"

    # Check for executable header masquerading as document
    if file_bytes.startswith(b"MZ") and not filename.lower().endswith((".exe", ".dll")):
        # Could be an executable disguised as image or pdf
        if any(filename.lower().endswith(ext) for ext in [".pdf", ".png", ".jpg", ".txt"]):
            return True, "Executable binary header (MZ) disguised as document/image"

    # Check text representation for suspicious malicious keywords
    try:
        sample_str = file_bytes[:10000].decode("utf-8", errors="ignore").lower()
        if "virus_test_payload" in sample_str or "malicious_script_trojan" in sample_str:
            return True, "Test virus payload detected in source content"
    except Exception:
        pass

    return False, "Virus scan clean: No malware signatures detected"


COMMON_NON_PERSON_WORDS = {
    "dimensions", "format", "mode", "visual", "source", "cybersecurity",
    "awareness", "asset", "system", "status", "report", "incident", "incidents",
    "password", "passwords", "security", "threat", "threats", "phishing",
    "student", "students", "width", "height", "rgb", "rgba", "png", "jpg",
    "jpeg", "pdf", "docx", "organization", "organizations", "permission", "permissions"
}


def detect_and_redact_pii(text: str) -> Tuple[str, List[Dict[str, Any]]]:
    """
    Uses Presidio + Regex heuristics to detect PII (names, emails, phone numbers, credit cards, SSNs).
    Returns (redacted_text, list_of_findings).
    """
    if not text or not text.strip():
        return text, []

    findings = []
    redacted_text = text

    # Fast heuristic regex detection for emails, phones, and SSNs
    email_pattern = re.compile(r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,7}\b')
    phone_pattern = re.compile(r'\b(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b')
    ssn_pattern = re.compile(r'\b\d{3}-\d{2}-\d{4}\b')

    for match in email_pattern.finditer(text):
        findings.append({
            "entity_type": "EMAIL_ADDRESS",
            "matched_text": match.group(0),
            "start": match.start(),
            "end": match.end(),
            "score": 0.95
        })

    for match in phone_pattern.finditer(text):
        val = match.group(0)
        # Avoid matching simple version strings like 1.0.0
        if val.count('.') < 2 and len(val.replace("-", "").replace(" ", "").replace("(", "").replace(")", "")) >= 10:
            findings.append({
                "entity_type": "PHONE_NUMBER",
                "matched_text": val,
                "start": match.start(),
                "end": match.end(),
                "score": 0.85
            })

    for match in ssn_pattern.finditer(text):
        findings.append({
            "entity_type": "US_SSN",
            "matched_text": match.group(0),
            "start": match.start(),
            "end": match.end(),
            "score": 0.99
        })

    # Try Presidio for deeper entity recognition (e.g. PERSON, CREDIT_CARD)
    try:
        analyzer = get_analyzer_engine()
        results = analyzer.analyze(
            text=text[:5000],  # analyze first 5k chars for speed
            entities=["PERSON", "CREDIT_CARD", "IBAN_CODE"],
            language="en",
            score_threshold=0.60
        )
        for r in results:
            val = text[r.start:r.end].strip()
            # Ignore common nouns/metadata words falsely flagged as PERSON
            if r.entity_type == "PERSON":
                if val.lower() in COMMON_NON_PERSON_WORDS or len(val) < 3:
                    continue
            findings.append({
                "entity_type": r.entity_type,
                "matched_text": val,
                "start": r.start,
                "end": r.end,
                "score": round(r.score, 2)
            })
    except Exception as exc:
        logger.debug("Presidio advanced analyze skipped: %s", exc)

    # Redact found entities
    for f in findings:
        redacted_text = redacted_text.replace(f["matched_text"], f"[{f['entity_type']}_REDACTED]")

    if findings:
        logger.info("PII Audit: Detected %d personal info item(s): %s", len(findings), [f['entity_type'] for f in findings])

    return redacted_text, findings


def detect_prompt_injection(text: str) -> Tuple[bool, Optional[str]]:
    """
    Performs case-insensitive substring search for common prompt injection phrases.
    """
    if not text:
        return False, None

    normalized_text = text.lower()
    for phrase in PROMPT_INJECTION_PHRASES:
        if phrase in normalized_text:
            logger.warning("Prompt injection pattern detected: '%s'", phrase)
            return True, phrase

    return False, None


def run_input_guardrail_check(
    filename: str,
    file_bytes: bytes,
    text: str = "",
    guardrails_enabled: bool = True
) -> Dict[str, Any]:
    """
    Executes full input guardrails suite:
    1. Virus / Malware signature scan
    2. Personal Information (PII) check
    3. Prompt injection detection
    Honors guardrails_enabled toggle for user bypass.
    """
    if not guardrails_enabled:
        logger.info("Input guardrails explicitly bypassed by user preference for '%s'", filename)
        return {
            "passed": True,
            "bypassed": True,
            "virus_check": {"passed": True, "details": "Virus scan bypassed by user toggle"},
            "pii_check": {"passed": True, "findings": [], "details": "Personal info check bypassed by user toggle"},
            "injection_check": {"passed": True, "details": "Prompt injection check bypassed by user toggle"},
            "alert_message": None
        }

    # 1. Virus / Malware scan
    is_virus, virus_detail = scan_for_virus_or_malware(file_bytes, filename)

    # 2. PII / Personal information scan
    content_to_check = text
    if not content_to_check:
        ext = os.path.splitext(filename)[1].lstrip('.').lower()
        if ext in {'txt', 'md', 'csv', 'json', 'log', 'xml', 'html', 'yaml', 'yml'}:
            content_to_check = file_bytes[:10000].decode("utf-8", errors="ignore")
        else:
            content_to_check = ""

    pii_findings = []
    if content_to_check.strip():
        _, pii_findings = detect_and_redact_pii(content_to_check)

    # 3. Prompt injection check
    is_injection, injection_phrase = False, None
    if content_to_check.strip():
        is_injection, injection_phrase = detect_prompt_injection(content_to_check)

    has_violation = is_virus or len(pii_findings) > 0 or is_injection
    alert_messages = []

    if is_virus:
        alert_messages.append(f"Security Alert: {virus_detail}")
    if len(pii_findings) > 0:
        entity_types = list({f['entity_type'] for f in pii_findings})
        sample_vals = [f['matched_text'] for f in pii_findings[:2]]
        alert_messages.append(f"Personal Info Detected: {', '.join(entity_types)} ({', '.join(sample_vals)})")
    if is_injection:
        alert_messages.append(f"Prompt Injection Pattern: '{injection_phrase}'")

    alert_summary = "; ".join(alert_messages) if alert_messages else None

    return {
        "passed": not has_violation,
        "bypassed": False,
        "virus_check": {
            "passed": not is_virus,
            "details": virus_detail
        },
        "pii_check": {
            "passed": len(pii_findings) == 0,
            "findings": pii_findings,
            "details": f"{len(pii_findings)} personal info items found" if pii_findings else "Clean - No personal information detected"
        },
        "injection_check": {
            "passed": not is_injection,
            "details": f"Injection pattern '{injection_phrase}'" if is_injection else "Clean - No injection patterns"
        },
        "alert_message": alert_summary
    }

