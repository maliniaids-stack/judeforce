from app.worker import celery_app
from app.core.database import SessionLocal
from app.models.models import Job, JobStatus, GeneratedArtefact, SourceContent
from app.pipeline import multimodal_parser, rag_retriever, llm_generator
from app.guardrails import input_guardrails, output_guardrails
from app.core.integrity import hash_artefact


@celery_app.task(name="process_generation_job")
def process_generation_job(job_id: str):
    """
    Phase 5 process_generation_job:
    parse source -> input guardrails -> RAG retrieval -> generate artefacts ->
    SHA256 hash -> run output guardrails -> store guardrail_results -> complete/fail.
    """
    db = SessionLocal()
    try:
        job = db.query(Job).filter(Job.id == job_id).first()
        if not job:
            return {"status": "not_found"}

        job.status = JobStatus.processing
        db.commit()

        guardrails_enabled = (job.generation_params or {}).get("guardrails_enabled", True)

        # Check prompt itself for potential injection
        if job.prompt and guardrails_enabled:
            is_prompt_inj, _phrase = input_guardrails.detect_prompt_injection(job.prompt)
            if is_prompt_inj:
                job.status = JobStatus.failed
                job.error_message = "Prompt injection detected in user request."
                db.commit()
                return {"status": "failed", "reason": job.error_message}

        # --- Parse the source content (Phase 2) ---
        source_text = job.prompt or ""
        source_chunks = []

        if job.source_content_id:
            source = db.query(SourceContent).filter(
                SourceContent.id == job.source_content_id
            ).first()
            if source:
                import tempfile
                import os
                from app.core.minio_client import download_file

                orig_ext = os.path.splitext(source.original_filename or source.storage_path)[1]
                with tempfile.NamedTemporaryFile(suffix=orig_ext, delete=False) as tmp_file:
                    tmp_local_path = tmp_file.name

                try:
                    download_file(source.storage_path, tmp_local_path)
                    parsed = multimodal_parser.parse_source(
                        tmp_local_path, source.content_type, original_filename=source.original_filename
                    )
                finally:
                    if os.path.exists(tmp_local_path):
                        try:
                            os.remove(tmp_local_path)
                        except Exception:
                            pass

                # Input guardrails (Phase 3) on the parsed source text
                if guardrails_enabled:
                    redacted_text, _findings = input_guardrails.detect_and_redact_pii(parsed.text)
                    is_injection, _phrase = input_guardrails.detect_prompt_injection(redacted_text)
                    if is_injection:
                        job.status = JobStatus.failed
                        job.error_message = "Source content flagged for potential prompt injection."
                        db.commit()
                        return {"status": "failed", "reason": job.error_message}
                    source_text = redacted_text
                else:
                    source_text = parsed.text

                source_chunks = parsed.chunks
                rag_retriever.embed_and_store(job.id, parsed.chunks)


        failed_check_messages = []

        # --- Generate one artefact per selected output format ---
        for output_format in job.output_formats:
            generated_text = llm_generator.generate(
                source_text=source_text,
                output_format=output_format,
                generation_params=job.generation_params,
            )

            content_hash = hash_artefact(generated_text)
            artefact = GeneratedArtefact(
                job_id=job.id,
                output_format=output_format,
                content=generated_text,
                sha256_hash=content_hash,
            )
            db.add(artefact)
            db.commit()

            # Run output guardrails check
            check_results = output_guardrails.run_all_checks(
                generated_text=generated_text,
                output_format=output_format,
                generation_params=job.generation_params,
                source_chunks=source_chunks
            )
            artefact.guardrail_results = check_results
            db.commit()

            # Flag job failure only if grounding or toxicity fails
            g_check = check_results.get("grounding", {})
            t_check = check_results.get("toxicity", {})
            if not g_check.get("passed", True):
                failed_check_messages.append(
                    f"'{output_format}' grounding check failed (score: {g_check.get('score')})"
                )
            if not t_check.get("passed", True):
                failed_check_messages.append(
                    f"'{output_format}' toxicity check failed (score: {t_check.get('score')})"
                )

        if failed_check_messages:
            job.status = JobStatus.failed
            job.error_message = f"Output guardrail failure: {'; '.join(failed_check_messages)}"
            db.commit()
            return {"status": "failed", "reason": job.error_message}
        else:
            job.status = JobStatus.completed
            db.commit()
            return {"status": "completed"}

    except Exception as e:
        job = db.query(Job).filter(Job.id == job_id).first()
        if job:
            job.status = JobStatus.failed
            job.error_message = str(e)
            db.commit()
        return {"status": "failed", "reason": str(e)}
    finally:
        db.close()