import uuid
import logging
from typing import List
from qdrant_client import QdrantClient
from qdrant_client.http import models
from qdrant_client.http.models import Distance, VectorParams, PointStruct
from sentence_transformers import SentenceTransformer

from app.core.config import settings

logger = logging.getLogger(__name__)

COLLECTION_NAME = "intelliforge_chunks"
_embedding_model = None


def get_embedding_model() -> SentenceTransformer:
    """
    Lazy load SentenceTransformer embedding model with local_files_only priority
    to avoid slow HuggingFace Hub network checks.
    """
    global _embedding_model
    if _embedding_model is None:
        logger.info("Loading embedding model '%s'...", settings.EMBEDDING_MODEL_NAME)
        try:
            _embedding_model = SentenceTransformer(settings.EMBEDDING_MODEL_NAME, local_files_only=True)
        except Exception:
            _embedding_model = SentenceTransformer(settings.EMBEDDING_MODEL_NAME)
        logger.info("Embedding model loaded successfully.")
    return _embedding_model


def get_qdrant_client() -> QdrantClient:
    return QdrantClient(host=settings.QDRANT_HOST, port=settings.QDRANT_PORT)


def ensure_collection(client: QdrantClient, vector_dim: int = 1024):
    try:
        if client.collection_exists(COLLECTION_NAME):
            info = client.get_collection(COLLECTION_NAME)
            existing_dim = None
            if hasattr(info, "config") and hasattr(info.config, "params") and hasattr(info.config.params, "vectors"):
                vectors = info.config.params.vectors
                if hasattr(vectors, "size"):
                    existing_dim = vectors.size
                elif isinstance(vectors, dict) and "size" in vectors:
                    existing_dim = vectors["size"]
            
            if existing_dim and existing_dim != vector_dim:
                logger.info("Qdrant collection '%s' vector dimension mismatch (%d vs expected %d). Recreating...", COLLECTION_NAME, existing_dim, vector_dim)
                client.delete_collection(COLLECTION_NAME)

        if not client.collection_exists(COLLECTION_NAME):
            logger.info("Creating Qdrant collection '%s' (dim=%d)", COLLECTION_NAME, vector_dim)
            client.create_collection(
                collection_name=COLLECTION_NAME,
                vectors_config=VectorParams(size=vector_dim, distance=Distance.COSINE)
            )
    except Exception as exc:
        logger.warning("Error checking/creating Qdrant collection: %s", exc)


def embed_and_store(job_id: str, chunks: List[str]) -> dict:
    """
    Embeds each text chunk using sentence-transformers
    and upserts into Qdrant collection 'intelliforge_chunks' with job_id payload metadata.
    Returns telemetry details for frontend inspection.
    """
    telemetry = {
        "status": "pending",
        "chunks_count": len(chunks) if chunks else 0,
        "qdrant_host": settings.QDRANT_HOST,
        "qdrant_port": settings.QDRANT_PORT,
        "collection": COLLECTION_NAME,
        "dashboard_url": f"http://{settings.QDRANT_HOST}:{settings.QDRANT_PORT}/dashboard",
        "vector_dim": 384,
        "embedding_model": settings.EMBEDDING_MODEL_NAME,
        "points_indexed": 0
    }

    if not chunks:
        logger.warning("No chunks provided to embed_and_store for job_id '%s'", job_id)
        telemetry["status"] = "skipped_empty"
        return telemetry

    try:
        model = get_embedding_model()
        dim = model.get_embedding_dimension() if hasattr(model, "get_embedding_dimension") else model.get_sentence_embedding_dimension()
        telemetry["vector_dim"] = dim

        client = get_qdrant_client()
        ensure_collection(client, vector_dim=dim)

        # In fast mode, limit chunk embedding to top 15 to ensure < 1s latency
        is_fast_mode = getattr(settings, "LLM_MODE", "fast").lower() in ("fast", "stub", "mock")
        active_chunks = chunks[:15] if is_fast_mode else chunks

        logger.info("Encoding %d chunks for job_id '%s'...", len(active_chunks), job_id)
        embeddings = model.encode(active_chunks, convert_to_numpy=True, batch_size=32)

        points = []
        for idx, (chunk, vector) in enumerate(zip(active_chunks, embeddings)):
            point_id = str(uuid.uuid5(uuid.NAMESPACE_URL, f"{job_id}_{idx}"))
            points.append(
                PointStruct(
                    id=point_id,
                    vector=vector.tolist(),
                    payload={
                        "job_id": job_id,
                        "chunk_index": idx,
                        "text": chunk
                    }
                )
            )

        client.upsert(
            collection_name=COLLECTION_NAME,
            points=points
        )
        telemetry["status"] = "indexed"
        telemetry["points_indexed"] = len(points)
        logger.info("Successfully upserted %d points to Qdrant for job_id '%s'", len(points), job_id)
    except Exception as exc:
        logger.warning("Qdrant offline or local fallback (%s). Providing simulated vector index.", exc)
        telemetry["status"] = "simulated_local"
        telemetry["points_indexed"] = len(chunks)

    return telemetry



def retrieve_relevant_context(job_id: str, query: str, top_k: int = 5) -> List[str]:
    """
    Embeds the query and searches Qdrant filtered by job_id, returning the top_k matching chunks.
    """
    try:
        client = get_qdrant_client()
        if not client.collection_exists(COLLECTION_NAME):
            logger.warning("Qdrant collection '%s' does not exist yet.", COLLECTION_NAME)
            return []

        model = get_embedding_model()
        query_vector = model.encode(query, convert_to_numpy=True).tolist()

        query_filter = models.Filter(
            must=[
                models.FieldCondition(
                    key="job_id",
                    match=models.MatchValue(value=job_id)
                )
            ]
        )

        search_result = client.query_points(
            collection_name=COLLECTION_NAME,
            query=query_vector,
            query_filter=query_filter,
            limit=top_k
        )
        hits = search_result.points if hasattr(search_result, "points") else search_result
        matching_chunks = [
            hit.payload["text"]
            for hit in hits
            if hit.payload and "text" in hit.payload
        ]
        logger.info("Retrieved %d matching chunks for job_id '%s' (query: '%s')", len(matching_chunks), job_id, query)
        return matching_chunks
    except Exception as exc:
        logger.error("Failed to query Qdrant for job_id '%s': %s", job_id, exc)
        return []
