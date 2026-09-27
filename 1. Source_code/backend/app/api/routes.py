import uuid
import logging
import re
from typing import Any, Dict
from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status, Response
from sqlalchemy.orm import Session
import threading
import tempfile
import os

from app.core.database import get_db
from app.core.minio_client import upload_file, get_presigned_url
from app.models.models import Job, JobStatus, SourceContent, GeneratedArtefact
from app.schemas.schemas import GenerateRequest, JobOut, UploadResponse
from app.tasks import process_generation_job
from app.pipeline.rag_retriever import retrieve_relevant_context, embed_and_store
from app.pipeline.export_formatter import (
    export_to_file,
    generate_pdf,
    generate_docx,
    generate_pptx,
    generate_jpeg,
    generate_structured_package_pdf
)
from app.pipeline import multimodal_parser
from app.guardrails.input_guardrails import validate_file, run_input_guardrail_check, scan_for_virus_or_malware

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post(
    "/upload",
    response_model=UploadResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Upload source document or media, run input guardrails, chunk, vector, and return backend telemetry"
)
async def upload_source(
    file: UploadFile = File(...),
    guardrails_enabled: bool = Form(True),
    db: Session = Depends(get_db)
):
    try:
        # Read file into memory/stream
        file_bytes = await file.read()
        file_size = len(file_bytes)

        # 1. Input guardrail file extension & size validation
        try:
            validate_file(filename=file.filename or "", content_type=file.content_type, file_size=file_size)
        except ValueError as val_err:
            logger.warning("Upload rejected by file validation: %s", val_err)
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=str(val_err)
            )

        # 2. Fast Virus / Malware scan on raw binary bytes
        is_virus, virus_detail = scan_for_virus_or_malware(file_bytes, file.filename or "")
        if guardrails_enabled and is_virus:
            logger.warning("Upload blocked by Virus / Malware scan: %s", virus_detail)
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail={
                    "status": "guardrail_violation",
                    "message": f"Security Alert: {virus_detail}",
                    "alert": f"The file has this virus or personal info check before passing to the model: Security Alert: {virus_detail}",
                    "violations": {
                        "passed": False,
                        "bypassed": False,
                        "virus_check": {"passed": False, "details": virus_detail},
                        "pii_check": {"passed": True, "findings": [], "details": "Skipped due to malware detection"},
                        "injection_check": {"passed": True, "details": "Skipped due to malware detection"},
                        "alert_message": f"Security Alert: {virus_detail}"
                    },
                    "can_bypass": True
                }
            )

        # 3. Store file into MinIO / local vault
        unique_name = f"{uuid.uuid4()}_{file.filename}"
        storage_path = upload_file(
            file_data=file_bytes,
            object_name=unique_name,
            content_type=file.content_type or "application/octet-stream",
            length=file_size
        )

        source_content = SourceContent(
            id=str(uuid.uuid4()),
            original_filename=file.filename,
            storage_path=storage_path,
            content_type=file.content_type
        )
        db.add(source_content)
        db.commit()
        db.refresh(source_content)

        # 4. Parse content using multimodal parser
        orig_ext = os.path.splitext(file.filename or "")[1]
        with tempfile.NamedTemporaryFile(suffix=orig_ext, delete=False) as tmp_file:
            tmp_local_path = tmp_file.name
            tmp_file.write(file_bytes)

        try:
            parsed = multimodal_parser.parse_source(tmp_local_path, file.content_type, original_filename=file.filename)
        finally:
            if os.path.exists(tmp_local_path):
                try:
                    os.remove(tmp_local_path)
                except Exception:
                    pass

        # 5. Run full Input Guardrails check on the parsed text & content
        guardrail_result = run_input_guardrail_check(
            filename=file.filename or "",
            file_bytes=file_bytes,
            text=parsed.text,
            guardrails_enabled=guardrails_enabled
        )

        if not guardrail_result["passed"]:
            logger.warning("Source blocked by Input Guardrail: %s", guardrail_result["alert_message"])
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail={
                    "status": "guardrail_violation",
                    "message": guardrail_result["alert_message"],
                    "alert": f"The file has this virus or personal info check before passing to the model: {guardrail_result['alert_message']}",
                    "violations": guardrail_result,
                    "can_bypass": True
                }
            )

        # 5. Chunking & Qdrant Vectorization
        qdrant_telemetry = embed_and_store(source_content.id, parsed.chunks)

        backend_telemetry = {
            "guardrails": guardrail_result,
            "parsing": {
                "engine": "Multimodal Parser (OCR / PyMuPDF / docx)",
                "source_language": parsed.source_language,
                "char_count": len(parsed.text),
                "word_count": len(parsed.text.split()),
                "preview": (parsed.text[:220] + "...") if len(parsed.text) > 220 else parsed.text
            },
            "chunking": {
                "status": "completed",
                "chunks_count": len(parsed.chunks),
                "sample_chunks": parsed.chunks[:3]
            },
            "vectorization": {
                "status": "completed",
                "model": qdrant_telemetry.get("embedding_model", "BAAI/bge-small-en-v1.5"),
                "vector_dim": qdrant_telemetry.get("vector_dim", 384),
                "vectors_generated": len(parsed.chunks)
            },
            "qdrant": {
                "status": qdrant_telemetry.get("status", "indexed"),
                "collection": qdrant_telemetry.get("collection", "intelliforge_chunks"),
                "qdrant_host": qdrant_telemetry.get("qdrant_host", "localhost"),
                "qdrant_port": qdrant_telemetry.get("qdrant_port", 6333),
                "dashboard_url": qdrant_telemetry.get("dashboard_url", "http://localhost:6333/dashboard"),
                "points_indexed": qdrant_telemetry.get("points_indexed", len(parsed.chunks))
            }
        }

        return UploadResponse(
            source_content_id=source_content.id,
            original_filename=source_content.original_filename,
            content_type=source_content.content_type,
            storage_path=source_content.storage_path,
            backend_telemetry=backend_telemetry
        )
    except HTTPException:
        db.rollback()
        raise
    except Exception as exc:
        logger.exception("Upload failed: %s", exc)
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to upload file: {str(exc)}"
        )


@router.post(
    "/generate",
    response_model=JobOut,
    status_code=status.HTTP_202_ACCEPTED,
    summary="Create generation job and dispatch to worker pool or fast background thread"
)
def generate_content(
    payload: GenerateRequest,
    db: Session = Depends(get_db)
):
    if not payload.output_formats:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="At least one output format must be selected."
        )

    # If source_content_id provided, verify existence
    if payload.source_content_id:
        source_exists = db.query(SourceContent).filter(SourceContent.id == payload.source_content_id).first()
        if not source_exists:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Source content {payload.source_content_id} does not exist."
            )

    job = Job(
        id=str(uuid.uuid4()),
        source_content_id=payload.source_content_id,
        prompt=payload.prompt,
        output_formats=payload.output_formats,
        generation_params=payload.generation_params or {},
        status=JobStatus.queued
    )
    db.add(job)
    db.commit()
    db.refresh(job)

    # Always spawn background worker thread for instant high-speed execution (~0.5s)
    # Also notify Celery if configured in environment
    try:
        t = threading.Thread(target=process_generation_job, args=(job.id,), daemon=True)
        t.start()
        logger.info("Launched high-speed generation thread for job %s", job.id)
    except Exception as th_err:
        logger.warning("Thread launch failed, falling back to Celery: %s", th_err)
        try:
            process_generation_job.apply_async(args=[job.id])
        except Exception:
            pass

    return JobOut.model_validate(job)



@router.get(
    "/jobs/{job_id}",
    response_model=JobOut,
    summary="Get job details and current execution status"
)
def get_job(
    job_id: str,
    db: Session = Depends(get_db)
):
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Job with id '{job_id}' not found."
        )
    return JobOut.model_validate(job)


@router.get(
    "/export/{job_id}",
    summary="Export generated artefacts for a completed job"
)
def export_job(
    job_id: str,
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Job with id '{job_id}' not found."
        )

    if job.status != JobStatus.completed:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Job '{job_id}' is not completed yet (current status: {job.status.value})."
        )

    export_artefacts = []
    for artefact in job.artefacts:
        if not artefact.storage_path:
            try:
                storage_path = export_to_file(artefact, artefact.output_format)
                db.commit()
            except Exception as exp_err:
                logger.warning("Could not export artefact to file: %s", exp_err)
                storage_path = f"exports/{job_id}/{artefact.id}.txt"
        else:
            storage_path = artefact.storage_path

        try:
            download_url = get_presigned_url(storage_path)
        except Exception:
            download_url = f"/api/download/{artefact.id}/pdf"
        export_artefacts.append({
            "id": artefact.id,
            "output_format": artefact.output_format,
            "content": artefact.content,
            "storage_path": artefact.storage_path,
            "download_url": download_url,
            "sha256_hash": artefact.sha256_hash,
            "guardrail_results": artefact.guardrail_results,
            "created_at": artefact.created_at.isoformat() if artefact.created_at else None
        })

    return {
        "job_id": job.id,
        "status": "ready",
        "export_formats": job.output_formats,
        "artefacts": export_artefacts
    }


@router.get(
    "/debug/context/{job_id}",
    summary="Debug endpoint to test RAG retrieval of raw chunks from Qdrant"
)
def debug_context(
    job_id: str,
    query: str = "summary",
    top_k: int = 5,
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Job with id '{job_id}' not found."
        )

    chunks = retrieve_relevant_context(job_id=job_id, query=query, top_k=top_k)
    return {
        "job_id": job_id,
        "query": query,
        "top_k": top_k,
        "count": len(chunks),
        "chunks": chunks
    }


@router.get(
    "/download/{artefact_id}/{export_type}",
    summary="Download individual artefact in native binary PDF, DOCX, PPTX, or TXT"
)
def download_artefact(
    artefact_id: str,
    export_type: str,
    db: Session = Depends(get_db)
):
    artefact = db.query(GeneratedArtefact).filter(GeneratedArtefact.id == artefact_id).first()
    if not artefact:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Artefact '{artefact_id}' not found."
        )

    content = artefact.content or ""
    exp_type = export_type.lower().strip()

    if exp_type == "pdf":
        file_bytes = generate_pdf(content, title=artefact.output_format)
        media_type = "application/pdf"
        file_ext = ".pdf"
    elif exp_type in ["docx", "word"]:
        file_bytes = generate_docx(content)
        media_type = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        file_ext = ".docx"
    elif exp_type in ["pptx", "ppt", "presentation"]:
        file_bytes = generate_pptx(content)
        media_type = "application/vnd.openxmlformats-officedocument.presentationml.presentation"
        file_ext = ".pptx"
    elif exp_type in ["jpeg", "jpg", "image", "img", "png"]:
        file_bytes = generate_jpeg(content)
        media_type = "image/jpeg"
        file_ext = ".jpg"
    else:
        file_bytes = content.encode("utf-8")
        media_type = "text/plain; charset=utf-8"
        file_ext = ".txt"

    clean_name = re.sub(r'[^a-zA-Z0-9_-]', '_', artefact.output_format.lower())
    filename = f"prism-ai-{clean_name}{file_ext}"

    return Response(
        content=file_bytes,
        media_type=media_type,
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"',
            "Access-Control-Expose-Headers": "Content-Disposition"
        }
    )


@router.get(
    "/export/{job_id}/download/{export_type}",
    summary="Download full job package in native binary PDF, DOCX, PPTX, or TXT"
)
def download_job_package(
    job_id: str,
    export_type: str,
    db: Session = Depends(get_db)
):
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Job with id '{job_id}' not found."
        )

    exp_type = export_type.lower().strip()

    if exp_type == "pdf":
        artefacts_payload = [
            {
                "output_format": art.output_format,
                "content": art.content or "",
                "guardrail_results": art.guardrail_results,
                "sha256_hash": art.sha256_hash
            }
            for art in job.artefacts
        ]
        file_bytes = generate_structured_package_pdf(job_id=job_id, artefacts=artefacts_payload)
        media_type = "application/pdf"
        file_ext = ".pdf"
    elif exp_type in ["docx", "word"]:
        combined_sections = [f"# === {art.output_format.upper()} ===\n\n{art.content or ''}" for art in job.artefacts]
        combined_content = "\n\n---\n\n".join(combined_sections) or "Empty Job Package"
        file_bytes = generate_docx(combined_content)
        media_type = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        file_ext = ".docx"
    elif exp_type in ["pptx", "ppt", "presentation"]:
        combined_sections = [f"# === {art.output_format.upper()} ===\n\n{art.content or ''}" for art in job.artefacts]
        combined_content = "\n\n---\n\n".join(combined_sections) or "Empty Job Package"
        file_bytes = generate_pptx(combined_content)
        media_type = "application/vnd.openxmlformats-officedocument.presentationml.presentation"
        file_ext = ".pptx"
    elif exp_type in ["jpeg", "jpg", "image", "img", "png"]:
        combined_sections = [f"# === {art.output_format.upper()} ===\n\n{art.content or ''}" for art in job.artefacts]
        combined_content = "\n\n---\n\n".join(combined_sections) or "Empty Job Package"
        file_bytes = generate_jpeg(combined_content)
        media_type = "image/jpeg"
        file_ext = ".jpg"
    else:
        combined_sections = [f"# === {art.output_format.upper()} ===\n\n{art.content or ''}" for art in job.artefacts]
        combined_content = "\n\n---\n\n".join(combined_sections) or "Empty Job Package"
        file_bytes = combined_content.encode("utf-8")
        media_type = "text/plain; charset=utf-8"
        file_ext = ".txt"

    filename = f"prism-ai-full-package-{job_id[:8]}{file_ext}"
    return Response(
        content=file_bytes,
        media_type=media_type,
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"',
            "Access-Control-Expose-Headers": "Content-Disposition"
        }
    )
