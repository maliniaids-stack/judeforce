import os
import sys
import logging

sys.path.insert(0, os.path.dirname(__file__))

from fastapi.testclient import TestClient
from app.main import app, init_app_resources
from app.core.database import SessionLocal
from app.models.models import Job, JobStatus, SourceContent

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("test_complete_integration")

init_app_resources()
from app.guardrails.output_guardrails import get_detoxify_model
get_detoxify_model()
client = TestClient(app)

def test_full_pipeline():
    logger.info("=== 1. Testing Upload with Input Guardrails ON (Clean Poster) ===")
    poster_path = "d:/JudeForce-prism ai/Source.png"
    with open(poster_path, "rb") as f:
        file_bytes = f.read()

    res = client.post(
        "/upload",
        files={"file": ("Source.png", file_bytes, "image/png")},
        data={"guardrails_enabled": "true"}
    )
    logger.info("Upload Clean Status: %d", res.status_code)
    assert res.status_code == 201
    data = res.json()
    source_id = data["source_content_id"]
    telemetry = data["backend_telemetry"]
    logger.info("Source Content ID: %s", source_id)
    logger.info("Backend Telemetry: %s", telemetry)
    assert telemetry["guardrails"]["passed"] is True
    assert telemetry["chunking"]["chunks_count"] > 0
    assert "qdrant" in telemetry

    logger.info("=== 2. Testing Upload with Personal Info (PII Flagged) ===")
    pii_content = b"Confidential memo for John Doe. Contact at jdoe@example.com or phone +1-555-0199. SSN: 000-12-3456."
    res_pii_blocked = client.post(
        "/upload",
        files={"file": ("Employee_PII.txt", pii_content, "text/plain")},
        data={"guardrails_enabled": "true"}
    )
    logger.info("PII Blocked Status: %d", res_pii_blocked.status_code)
    assert res_pii_blocked.status_code == 422
    err_detail = res_pii_blocked.json()["detail"]
    logger.info("Blocked Alert Message: %s", err_detail["alert"])
    assert err_detail["status"] == "guardrail_violation"
    assert err_detail["can_bypass"] is True

    logger.info("=== 3. Testing Upload Bypass (Guardrails OFF) ===")
    res_pii_bypass = client.post(
        "/upload",
        files={"file": ("Employee_PII.txt", pii_content, "text/plain")},
        data={"guardrails_enabled": "false"}
    )
    logger.info("PII Bypass Status: %d", res_pii_bypass.status_code)
    assert res_pii_bypass.status_code == 201
    assert res_pii_bypass.json()["backend_telemetry"]["guardrails"]["bypassed"] is True

    logger.info("=== 4. Testing Multi-Deliverable Generation (Video, LinkedIn, Presentation, Advisory, Infographic) ===")
    gen_payload = {
        "prompt": "Analyze the uploaded cybersecurity awareness poster and create content that can be shared with students.",
        "source_content_id": source_id,
        "output_formats": [
            "Video",
            "LinkedIn Post",
            "Presentation",
            "Advisory",
            "Infographic",
            "Twitter/X Post",
            "Executive Summary"
        ],
        "generation_params": {
            "tone": "Educational & Student-Friendly",
            "audience": "Students & Academic Community",
            "language": "English (US)",
            "guardrails_enabled": True
        }
    }

    res_gen = client.post("/generate", json=gen_payload)
    logger.info("Generate Dispatch Status: %d", res_gen.status_code)
    assert res_gen.status_code == 202
    job_id = res_gen.json()["id"]

    import time
    job_data = None
    for attempt in range(45):
        time.sleep(1)
        res_job = client.get(f"/jobs/{job_id}")
        job_data = res_job.json()
        logger.info("Polling Job Status (attempt %d): %s", attempt + 1, job_data.get("status"))
        if job_data.get("status") in ["completed", "failed"]:
            break

    logger.info("=== 5. Testing Job Status & Output Guardrail Audit ===")
    assert job_data is not None
    assert job_data["status"] == "completed"

    res_export = client.get(f"/export/{job_id}")
    assert res_export.status_code == 200
    export_data = res_export.json()
    artefacts = export_data["artefacts"]
    logger.info("Generated Artefacts Count: %d", len(artefacts))
    assert len(artefacts) == 7

    for art in artefacts:
        fmt = art["output_format"]
        g_res = art["guardrail_results"]
        logger.info("Deliverable [%s] Output Guardrails: %s", fmt, g_res)
        assert g_res["grounding"]["passed"] is True
        assert g_res["toxicity"]["passed"] is True
        assert g_res["format"]["passed"] is True

    logger.info("=== ALL END-TO-END WORKFLOW TESTS VERIFIED AND PASSED SUCCESSFULLY! ===")

if __name__ == "__main__":
    test_full_pipeline()
