import os
import sys
import uuid
import time
import logging

# Ensure backend root is on sys.path
sys.path.insert(0, os.path.dirname(__file__))

from fastapi.testclient import TestClient
from app.main import app
from app.pipeline.multimodal_parser import parse_source, chunk_text_spacy
from app.pipeline.rag_retriever import embed_and_store, retrieve_relevant_context, get_qdrant_client, COLLECTION_NAME
from app.tasks import process_generation_job
from app.core.database import SessionLocal
from app.models.models import Job, SourceContent

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def test_multimodal_parser_direct():
    logger.info("=== 1. Testing Multimodal Parser directly ===")
    sample_text = (
        "Prism AI is a next-generation multimodal content transformation platform. "
        "It supports parsing PDFs, DOCX documents, images via OCR, and audio or video files via transcription. "
        "The system breaks long content down into semantic sentence chunks for retrieval augmented generation (RAG). "
        "By leveraging Qdrant and dense vector embeddings from sentence-transformers, Prism AI retrieves accurate context."
    )
    
    temp_txt_path = "sample_test_doc.txt"
    with open(temp_txt_path, "w", encoding="utf-8") as f:
        f.write(sample_text)

    try:
        norm_obj = parse_source(temp_txt_path, content_type="text/plain")
        logger.info("Detected language: %s", norm_obj.source_language)
        logger.info("Extracted text length: %d chars", len(norm_obj.text))
        logger.info("Chunks generated: %d", len(norm_obj.chunks))
        
        assert norm_obj.source_language == "en"
        assert len(norm_obj.chunks) >= 1
        assert "Prism AI" in norm_obj.text
        logger.info("PASS: Multimodal parser direct test.")
    finally:
        if os.path.exists(temp_txt_path):
            os.remove(temp_txt_path)


def test_rag_retriever_direct():
    logger.info("=== 2. Testing RAG Retriever directly ===")
    test_job_id = f"test_job_{uuid.uuid4().hex[:8]}"
    test_chunks = [
        "Quantum computing relies on qubits, superposition, and quantum entanglement to perform calculations.",
        "Deep learning models require GPUs and massive training datasets to achieve state of the art results.",
        "RAG retrieval fetches relevant context chunks from vector databases such as Qdrant before LLM generation."
    ]

    # Store
    embed_and_store(test_job_id, test_chunks)

    # Retrieve
    quantum_results = retrieve_relevant_context(test_job_id, query="quantum physics qubits", top_k=2)
    logger.info("Query 'quantum physics qubits' retrieved %d results:", len(quantum_results))
    for r in quantum_results:
        logger.info("  - %s", r)

    assert len(quantum_results) >= 1
    assert "qubits" in quantum_results[0].lower() or "quantum" in quantum_results[0].lower()
    logger.info("PASS: RAG retriever direct test.")


def test_api_end_to_end():
    logger.info("=== 3. Testing API End-to-End via TestClient ===")
    client = TestClient(app)

    # 1. Upload sample file
    file_content = b"Artificial Intelligence and Machine Learning are transforming modern software development. Vector search enables semantic retrieval across unstructured data."
    response = client.post(
        "/api/upload",
        files={"file": ("ml_overview.txt", file_content, "text/plain")}
    )
    logger.info("Upload response (%d): %s", response.status_code, response.json())
    assert response.status_code == 201
    source_content_id = response.json()["source_content_id"]

    # 2. Submit generation job
    gen_response = client.post(
        "/api/generate",
        json={
            "prompt": "Summarize the key insights of AI and Machine Learning.",
            "source_content_id": source_content_id,
            "output_formats": ["Executive Brief"],
            "generation_params": {"tone": "Professional", "language": "English"}
        }
    )
    logger.info("Generate response (%d): %s", gen_response.status_code, gen_response.json())
    assert gen_response.status_code == 202
    job_id = gen_response.json()["id"]

    # 3. Manually execute background processing task synchronously
    logger.info("Running process_generation_job synchronously for job %s...", job_id)
    task_res = process_generation_job(job_id)
    logger.info("Task completion result: %s", task_res)
    assert task_res["status"] == "completed"

    # 4. Query debug endpoint GET /api/debug/context/{job_id}
    debug_res = client.get(f"/api/debug/context/{job_id}?query=Machine Learning&top_k=3")
    logger.info("Debug endpoint response (%d): %s", debug_res.status_code, debug_res.json())
    assert debug_res.status_code == 200
    debug_data = debug_res.json()
    assert debug_data["job_id"] == job_id
    assert debug_data["count"] > 0
    assert len(debug_data["chunks"]) > 0
    logger.info("PASS: API End-to-End RAG test.")


if __name__ == "__main__":
    test_multimodal_parser_direct()
    test_rag_retriever_direct()
    test_api_end_to_end()
    logger.info("=== ALL PHASE 2 TESTS PASSED SUCCESSFULLY! ===")
