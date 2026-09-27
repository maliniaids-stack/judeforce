import os
import time
import pytest
from fastapi.testclient import TestClient

from app.core.config import settings
import app.pipeline.multimodal_parser as multimodal_parser
import app.pipeline.rag_retriever as rag_retriever
from qdrant_client import QdrantClient

# Ensure required settings attributes exist on Pydantic instance
if not hasattr(settings, "EMBEDDING_MODEL_NAME"):
    object.__setattr__(settings, "EMBEDDING_MODEL_NAME", "BAAI/bge-m3")
if not hasattr(settings, "QDRANT_HOST"):
    object.__setattr__(settings, "QDRANT_HOST", "localhost")
if not hasattr(settings, "QDRANT_PORT"):
    object.__setattr__(settings, "QDRANT_PORT", 6333)

# Use in-memory Qdrant client for isolated pipeline test
in_memory_qdrant = QdrantClient(":memory:")
rag_retriever.get_qdrant_client = lambda: in_memory_qdrant

import app.core.minio_client as minio_client

# Resolve local storage path by downloading from MinIO / vault if needed
_orig_parse_source = multimodal_parser.parse_source


def _test_parse_source(file_path: str, content_type: str = None):
    if not os.path.exists(file_path):
        target_dir = os.path.join("storage_vault", "test_downloads")
        os.makedirs(target_dir, exist_ok=True)
        target_file = os.path.join(target_dir, os.path.basename(file_path))
        downloaded = minio_client.download_file(file_path, target_file)
        if os.path.exists(downloaded):
            file_path = downloaded
    return _orig_parse_source(file_path, content_type)


multimodal_parser.parse_source = _test_parse_source

from app.main import app, init_app_resources
from app.tasks import process_generation_job
from app.core.database import SessionLocal
from app.models.models import Job, JobStatus

# Ensure DB tables and fallbacks are initialized
init_app_resources()


def test_pipeline_pdf_integration():
    """
    Integration test:
    1. Upload sample PDF fixture via /upload
    2. Submit generation job via /generate selecting 2 formats
    3. Process task / poll /jobs/{id} until completed or 60s timeout
    4. Assert job completed with right number of GeneratedArtefact rows
    """
    client = TestClient(app)

    # 1. Upload small sample PDF fixture
    pdf_fixture_path = os.path.join(os.path.dirname(__file__), "fixtures", "sample.pdf")
    assert os.path.exists(pdf_fixture_path), f"Fixture not found: {pdf_fixture_path}"

    with open(pdf_fixture_path, "rb") as pdf_file:
        upload_res = client.post(
            "/upload",
            files={"file": ("sample.pdf", pdf_file, "application/pdf")}
        )

    # Handle both route prefixes (/upload and /api/upload)
    if upload_res.status_code == 404:
        with open(pdf_fixture_path, "rb") as pdf_file:
            upload_res = client.post(
                "/api/upload",
                files={"file": ("sample.pdf", pdf_file, "application/pdf")}
            )

    assert upload_res.status_code in [200, 201], f"Upload failed: {upload_res.text}"
    source_data = upload_res.json()
    source_id = source_data["source_content_id"]
    assert source_id is not None

    # 2. Submit generation job via /generate selecting 2 formats
    gen_payload = {
        "prompt": "Synthesize the provided Prism AI security briefing (Q3 42 percent revenue growth, 99.99 percent uptime, zero high severity vulnerabilities) into a structured advisory and LinkedIn post.",
        "source_content_id": source_id,
        "output_formats": ["advisory", "linkedin"],
        "generation_params": {
            "tone": "Authoritative",
            "audience": "Security Professionals"
        }
    }

    gen_res = client.post("/generate", json=gen_payload)
    if gen_res.status_code == 404:
        gen_res = client.post("/api/generate", json=gen_payload)

    assert gen_res.status_code in [200, 202], f"Generate failed: {gen_res.text}"
    job_data = gen_res.json()
    job_id = job_data["id"]

    # Execute processing task
    process_generation_job(job_id)

    # Poll /jobs/{id} until completed or 60s timeout
    start_time = time.time()
    job_status = "queued"
    completed_job_data = None

    while time.time() - start_time < 60:
        get_res = client.get(f"/jobs/{job_id}")
        if get_res.status_code == 404:
            get_res = client.get(f"/api/jobs/{job_id}")

        assert get_res.status_code == 200
        completed_job_data = get_res.json()
        job_status = completed_job_data.get("status")

        if job_status in ["completed", "failed"]:
            break

        time.sleep(1)

    # 3. Assert job completed successfully within 60s timeout
    assert job_status == "completed", f"Job status was '{job_status}', error: {completed_job_data.get('error_message')}"

    # 4. Assert right number of GeneratedArtefact rows (2 formats requested = 2 artefacts)
    artefacts = completed_job_data.get("artefacts", [])
    assert len(artefacts) == 2, f"Expected 2 artefacts, got {len(artefacts)}"

    formats_found = [art["output_format"] for art in artefacts]
    assert "advisory" in formats_found
    assert "linkedin" in formats_found

    for art in artefacts:
        assert art["id"] is not None
        assert art["content"] is not None and len(art["content"]) > 0
        assert art["sha256_hash"] is not None and len(art["sha256_hash"]) == 64
        assert art["guardrail_results"] is not None
        assert "grounding" in art["guardrail_results"]
        assert "toxicity" in art["guardrail_results"]
