import io
import time
from fastapi.testclient import TestClient
from app.main import app, init_app_resources
from app.models.models import JobStatus
from app.tasks import process_generation_job

# Ensure DB tables and MinIO bucket are initialized
init_app_resources()

client = TestClient(app)

print("=== 1. Testing GET / (Health Check) ===")
res = client.get("/")
assert res.status_code == 200, f"Health check failed: {res.text}"
data = res.json()
assert data["status"] == "healthy" and data["service"] == "Prism AI", f"Invalid response: {data}"
print("Health check PASSED:", data)

print("\n=== 2. Testing POST /upload (MinIO Vault & DB Row) ===")
test_file_content = b"Prism AI sample source content for multimodal synthesis.\nKey metric: 42% ARR growth."
files = {
    "file": ("q3_financials.txt", io.BytesIO(test_file_content), "text/plain")
}
res = client.post("/upload", files=files)
assert res.status_code == 201, f"Upload failed: {res.text}"
upload_data = res.json()
assert "source_content_id" in upload_data, f"No source_content_id in {upload_data}"
assert upload_data["original_filename"] == "q3_financials.txt"
assert "prism-ai-uploads/" in upload_data["storage_path"]
print("Upload PASSED:", upload_data)
source_id = upload_data["source_content_id"]

print("\n=== 3. Testing POST /generate (Job Creation & Queueing) ===")
gen_payload = {
    "prompt": "Synthesize this Q3 financial statement into an executive summary and LinkedIn post.",
    "source_content_id": source_id,
    "output_formats": ["Executive Summary", "LinkedIn Post"],
    "generation_params": {
        "tone": "Authoritative",
        "audience": "C-Suite / Executives",
        "language": "English (US)",
        "detail": "Balanced / Standard"
    }
}
res = client.post("/generate", json=gen_payload)
assert res.status_code == 202, f"Generate failed: {res.text}"
job_data = res.json()
job_id = job_data["id"]
assert job_data["status"] == "queued"
assert job_data["prompt"] == gen_payload["prompt"]
print("Generate PASSED:", job_data)

print("\n=== 4. Testing GET /jobs/{job_id} before completion ===")
res = client.get(f"/jobs/{job_id}")
assert res.status_code == 200
assert res.json()["id"] == job_id
print("Get Job PASSED:", res.json()["status"])

print("\n=== 5. Testing GET /export/{job_id} before completion (expect 409) ===")
res = client.get(f"/export/{job_id}")
assert res.status_code == 409, f"Expected 409 Conflict, got {res.status_code}"
print("Export 409 check PASSED:", res.json())

print("\n=== 6. Running Celery Task process_generation_job(job_id) ===")
task_result = process_generation_job(job_id)
print("Celery task executed:", task_result)

print("\n=== 7. Testing GET /jobs/{job_id} after task completion ===")
res = client.get(f"/jobs/{job_id}")
assert res.status_code == 200
completed_job = res.json()
assert completed_job["status"] == "completed"
print("Completed Job Status PASSED:", completed_job["status"])

print("\n=== 8. Testing GET /export/{job_id} after completion (expect 200 & Artefacts) ===")
res = client.get(f"/export/{job_id}")
assert res.status_code == 200, f"Export failed: {res.text}"
export_data = res.json()
assert export_data["status"] == "ready"
assert len(export_data["artefacts"]) == 2
print("Export PASSED. Artefacts count:", len(export_data["artefacts"]))
for art in export_data["artefacts"]:
    print(f" - [{art['output_format']}]: hash={art['sha256_hash'][:12]}...")

print("\nALL PHASE 1 BACKEND VERIFICATIONS PASSED SUCCESSFULLY!")
