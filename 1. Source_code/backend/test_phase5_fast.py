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
logger = logging.getLogger("test_phase5_fast")

# Ensure DB tables and storage fallbacks are initialized
init_app_resources()


def test_output_guardrails_unit():
    logger.info("=== 1. Testing Output Guardrails Unit Functions ===")

    source_chunks = [
        "Prism AI is an enterprise multimodal content transformation platform.",
        "Q3 financial performance showed 42% ARR growth."
    ]

    # Grounding check: Good match
    grounded_text = "Prism AI is an enterprise content transformation platform with 42% ARR growth in Q3."
    g_res_good = check_grounding(grounded_text, source_chunks)
    logger.info("Grounding (good match): %s", g_res_good)
    assert g_res_good["passed"] is True
    assert g_res_good["score"] >= 0.6

    # Grounding check: Bad match
    ungrounded_text = "Quantum computing algorithms utilize Shor factoring and Grover search techniques."
    g_res_bad = check_grounding(ungrounded_text, source_chunks)
    logger.info("Grounding (bad match): %s", g_res_bad)
    assert g_res_bad["passed"] is False
    assert g_res_bad["score"] < 0.6

    # Toxicity check using Detoxify
    clean_text = "This advisory details system patching procedures and security best practices."
    tox_res = check_toxicity(clean_text)
    logger.info("Toxicity check (clean): %s", tox_res)
    assert tox_res["passed"] is True
    assert tox_res["score"] <= 0.5

    # Plagiarism check using rapidfuzz
    verbatim_text = "Prism AI is an enterprise multimodal content transformation platform."
    p_res_high = check_plagiarism(verbatim_text, source_chunks)
    logger.info("Plagiarism check (verbatim): %s", p_res_high)
    assert p_res_high["passed"] is False  # Flagged for near-verbatim copy

    unique_text = "This executive briefing summarizes operational metrics and roadmap goals."
    p_res_low = check_plagiarism(unique_text, source_chunks)
    logger.info("Plagiarism check (original): %s", p_res_low)
    assert p_res_low["passed"] is True

    # Format check: LinkedIn length validation
    linkedin_invalid = "A" * 3200
    fmt_linkedin_bad = check_format(linkedin_invalid, "linkedin")
    logger.info("Format check (LinkedIn > 3000 chars): %s", fmt_linkedin_bad)
    assert fmt_linkedin_bad["passed"] is False

    linkedin_valid = "Excited to share our Q3 milestone! 🚀 #PrismAI #TechGrowth"
    fmt_linkedin_good = check_format(linkedin_valid, "linkedin")
    logger.info("Format check (LinkedIn valid): %s", fmt_linkedin_good)
    assert fmt_linkedin_good["passed"] is True

    # Format check: Advisory headers
    advisory_valid = "# Executive Summary\nThreat score high.\n\n## Recommendations\nApply security patches."
    fmt_adv_good = check_format(advisory_valid, "advisory")
    logger.info("Format check (Advisory with headers): %s", fmt_adv_good)
    assert fmt_adv_good["passed"] is True

    # run_all_checks helper
    all_checks = run_all_checks(grounded_text, "advisory", {}, source_chunks)
    logger.info("run_all_checks output: %s", all_checks)
    assert "grounding" in all_checks
    assert "toxicity" in all_checks
    assert "plagiarism" in all_checks
    assert "format" in all_checks

    logger.info("PASS: All output guardrails unit tests passed!")


def test_integrity_hashing():
    logger.info("=== 2. Testing SHA-256 Integrity Hashing ===")
    sample_text = "Prism AI output guardrail & export test text."
    digest = hash_artefact(sample_text)
    logger.info("Generated SHA-256 Digest: %s", digest)
    assert len(digest) == 64
    assert digest == hash_artefact(sample_text)
    logger.info("PASS: SHA-256 Integrity hashing passed!")


def test_export_formatter():
    logger.info("=== 3. Testing Export Formatter (PDF, DOCX, PPTX) ===")

    class MockArtefact:
        id = "mock_art_999"
        job_id = "mock_job_999"
        content = "# Security Advisory\n\n- Summary: All systems operational\n- Action Item: Deploy v1.5 release\n"
        storage_path = None

    art = MockArtefact()

    # Test PDF generation via reportlab
    pdf_path = export_to_file(art, "pdf")
    logger.info("PDF Export Path: %s", pdf_path)
    assert ".pdf" in pdf_path
    assert art.storage_path == pdf_path

    # Test DOCX generation via python-docx
    docx_path = export_to_file(art, "docx")
    logger.info("DOCX Export Path: %s", docx_path)
    assert ".docx" in docx_path
    assert art.storage_path == docx_path

    # Test PPTX generation via python-pptx
    pptx_path = export_to_file(art, "presentation")
    logger.info("PPTX Export Path: %s", pptx_path)
    assert ".pptx" in pptx_path
    assert art.storage_path == pptx_path

    logger.info("PASS: Export formatter (PDF, DOCX, PPTX) passed!")


def test_api_export_pipeline():
    logger.info("=== 4. Testing Export API GET /export/{job_id} ===")
    client = TestClient(app)

    db = SessionLocal()
    try:
        # Create a mock completed job with 2 artefacts directly in DB
        job_id = f"test_export_job_{os.urandom(4).hex()}"
        job = Job(
            id=job_id,
            prompt="Synthesize security advisory and LinkedIn announcement.",
            output_formats=["advisory", "linkedin"],
            status=JobStatus.completed
        )
        db.add(job)
        db.commit()

        art1 = GeneratedArtefact(
            job_id=job.id,
            output_format="advisory",
            content="# Executive Summary\nThreat score elevated.\n\n## Recommendations\nUpdate firewall rules.",
            sha256_hash=hash_artefact("# Executive Summary\nThreat score elevated."),
            guardrail_results={
                "grounding": {"score": 0.95, "passed": True},
                "toxicity": {"score": 0.01, "passed": True},
                "plagiarism": {"score": 0.10, "passed": True},
                "format": {"score": 1.0, "passed": True}
            }
        )
        art2 = GeneratedArtefact(
            job_id=job.id,
            output_format="linkedin",
            content="🚀 New Security Update Released! Stay protected with Prism AI.",
            sha256_hash=hash_artefact("🚀 New Security Update Released! Stay protected with Prism AI."),
            guardrail_results={
                "grounding": {"score": 0.90, "passed": True},
                "toxicity": {"score": 0.005, "passed": True},
                "plagiarism": {"score": 0.05, "passed": True},
                "format": {"score": 1.0, "passed": True}
            }
        )
        db.add_all([art1, art2])
        db.commit()

        # Call GET /export/{job_id}
        res = client.get(f"/export/{job_id}")
        logger.info("GET /export/{job_id} status (%d): %s", res.status_code, res.json())
        assert res.status_code == 200
        data = res.json()
        assert data["job_id"] == job_id
        assert data["status"] == "ready"
        assert len(data["artefacts"]) == 2

        for item in data["artefacts"]:
            assert item["download_url"] is not None
            assert item["storage_path"] is not None
            assert item["sha256_hash"] is not None
            assert item["guardrail_results"] is not None
            logger.info("Artefact [%s] Presigned Download URL: %s", item["output_format"], item["download_url"])

        logger.info("PASS: API GET /export/{job_id} test passed!")
    finally:
        db.close()


if __name__ == "__main__":
    test_output_guardrails_unit()
    test_integrity_hashing()
    test_export_formatter()
    test_api_export_pipeline()
    logger.info("=== ALL PHASE 5 FAST VERIFICATION TESTS PASSED SUCCESSFULLY! ===")
