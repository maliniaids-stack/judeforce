import os
import sys
import logging

# Ensure backend root is on sys.path
sys.path.insert(0, os.path.dirname(__file__))

from fastapi.testclient import TestClient
from app.main import app, init_app_resources
from app.guardrails.output_guardrails import (
    check_grounding,
    check_toxicity,
    check_plagiarism,
    check_format,
    run_all_checks
)
from app.core.integrity import hash_artefact
from app.pipeline.export_formatter import export_to_file
from app.tasks import process_generation_job
from app.core.database import SessionLocal
from app.models.models import Job, JobStatus, GeneratedArtefact

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("test_phase5")

# Ensure DB tables and MinIO bucket are initialized
init_app_resources()


def test_output_guardrails_unit():
    logger.info("=== 1. Testing Output Guardrails Unit Functions ===")

    source_chunks = [
        "Prism AI is a secure content transformation platform supporting multi-modal synthesis.",
        "Revenue increased by 42% in Q3 due to enterprise subscription growth."
    ]

    # Grounding check
    grounded_text = "Prism AI is a secure content transformation platform with 42% revenue increase in Q3."
    g_res = check_grounding(grounded_text, source_chunks)
    logger.info("Grounding (good): %s", g_res)
    assert g_res["passed"] is True
    assert g_res["score"] >= 0.6

    ungrounded_text = "Quantum superposition enables faster integer factorization via Shor's algorithm."
    g_res_bad = check_grounding(ungrounded_text, source_chunks)
    logger.info("Grounding (bad): %s", g_res_bad)
    assert g_res_bad["passed"] is False

    # Plagiarism check
    verbatim_text = "Prism AI is a secure content transformation platform supporting multi-modal synthesis."
    p_res_high = check_plagiarism(verbatim_text, source_chunks)
    logger.info("Plagiarism (verbatim): %s", p_res_high)
    assert p_res_high["passed"] is False  # Flagged for near-verbatim copy

    unique_text = "This report summarizes key insights regarding enterprise software performance."
    p_res_low = check_plagiarism(unique_text, source_chunks)
    logger.info("Plagiarism (original): %s", p_res_low)
    assert p_res_low["passed"] is True

    # Format check
    linkedin_over = "A" * 3500
    fmt_res = check_format(linkedin_over, "linkedin")
    logger.info("Format (LinkedIn over limit): %s", fmt_res)
    assert fmt_res["passed"] is False

    advisory_valid = "# Executive Summary\nThreat score is high.\n\n## Recommendations\nPatch immediately."
    fmt_res_adv = check_format(advisory_valid, "advisory")
    logger.info("Format (Advisory valid): %s", fmt_res_adv)
    assert fmt_res_adv["passed"] is True

    # run_all_checks
    all_res = run_all_checks(grounded_text, "advisory", {}, source_chunks)
    logger.info("run_all_checks output: %s", all_res)
    assert "grounding" in all_res and "toxicity" in all_res and "plagiarism" in all_res and "format" in all_res
    logger.info("PASS: Output guardrails unit tests.")


def test_integrity_hashing():
    logger.info("=== 2. Testing SHA-256 Integrity Hashing ===")
    sample = "Prism AI content hash verification string."
    h = hash_artefact(sample)
    logger.info("Hash digest: %s", h)
    assert len(h) == 64
    assert h == hash_artefact(sample)
    logger.info("PASS: Integrity hashing test.")


def test_export_formatter():
    logger.info("=== 3. Testing Export Formatter ===")
    class MockArtefact:
        id = "art_test_123"
        job_id = "job_test_123"
        content = "# Summary Report\n\n- Key Metric 1: 42% ARR Growth\n- Security posture: Verified\n"
        storage_path = None

    art = MockArtefact()

    # Test PDF export
    pdf_path = export_to_file(art, "pdf")
    logger.info("Exported PDF path: %s", pdf_path)
    assert ".pdf" in pdf_path

    # Test DOCX export
    docx_path = export_to_file(art, "docx")
    logger.info("Exported DOCX path: %s", docx_path)
    assert ".docx" in docx_path

    # Test PPTX export
    pptx_path = export_to_file(art, "presentation")
    logger.info("Exported PPTX path: %s", pptx_path)
    assert ".pptx" in pptx_path

    logger.info("PASS: Export formatter test.")


def test_end_to_end_phase5():
    logger.info("=== 4. Testing End-to-End Phase 5 API & Job Pipeline ===")
    import gc
    try:
        import torch
        if torch.cuda.is_available():
            torch.cuda.empty_cache()
    except Exception:
        pass
    gc.collect()

    client = TestClient(app)

    gen_payload = {
        "prompt": "Synthesize the impact of generative AI on software developer productivity.",
        "output_formats": ["advisory", "linkedin", "executive_summary"],
        "generation_params": {
            "tone": "Professional",
            "audience": "CTOs"
        }
    }

    response = client.post("/api/generate", json=gen_payload)
    logger.info("POST /generate status (%d): %s", response.status_code, response.json())
    assert response.status_code == 202
    job_id = response.json()["id"]

    # Run processing task synchronously
    logger.info("Processing job %s ...", job_id)
    task_res = process_generation_job(job_id)
    logger.info("Task result: %s", task_res)
    assert task_res["status"] == "completed"

    # Verify job details via API
    get_res = client.get(f"/api/jobs/{job_id}")
    assert get_res.status_code == 200
    job_data = get_res.json()
    assert job_data["status"] == "completed"
    assert len(job_data["artefacts"]) == 3

    for art in job_data["artefacts"]:
        logger.info("Artefact [%s]:", art["output_format"])
        logger.info(" - Content snippet: %s...", (art["content"] or "")[:80])
        logger.info(" - SHA256: %s", art["sha256_hash"])
        logger.info(" - Guardrail results: %s", art["guardrail_results"])
        assert art["sha256_hash"] is not None
        assert art["guardrail_results"] is not None

    # Test GET /export/{job_id}
    export_res = client.get(f"/api/export/{job_id}")
    logger.info("GET /export/{job_id} status (%d): %s", export_res.status_code, export_res.json())
    assert export_res.status_code == 200
    export_data = export_res.json()
    assert export_data["status"] == "ready"
    assert len(export_data["artefacts"]) == 3

    for art in export_data["artefacts"]:
        assert art["download_url"] is not None
        assert art["storage_path"] is not None
        logger.info(" - Format %s Download URL: %s", art["output_format"], art["download_url"][:60])

    logger.info("PASS: End-to-End Phase 5 API & Job Pipeline test.")


if __name__ == "__main__":
    test_output_guardrails_unit()
    test_integrity_hashing()
    test_export_formatter()
    test_end_to_end_phase5()
    logger.info("=== ALL PHASE 5 OUTPUT GUARDRAILS + EXPORT TESTS PASSED SUCCESSFULLY! ===")
