import io
import os
import socket
import logging
from datetime import timedelta
from typing import BinaryIO, Union
from minio import Minio
from app.core.config import settings

logger = logging.getLogger(__name__)

# Initialize MinIO client
minio_client = Minio(
    endpoint=settings.MINIO_ENDPOINT,
    access_key=settings.MINIO_ACCESS_KEY,
    secret_key=settings.MINIO_SECRET_KEY,
    secure=settings.MINIO_SECURE
)


def is_minio_reachable() -> bool:
    """Fast socket check to see if MinIO server is online."""
    try:
        parts = settings.MINIO_ENDPOINT.split(":")
        host = parts[0]
        port = int(parts[1]) if len(parts) > 1 else 9000
        with socket.create_connection((host, port), timeout=0.5):
            return True
    except Exception:
        return False


def ensure_bucket_exists() -> bool:
    """
    Checks if configured MinIO bucket exists; creates it if absent.
    Uses fast reachability check to prevent connection retries if offline.
    """
    if not is_minio_reachable():
        logger.info("MinIO endpoint %s offline; using local disk storage fallback.", settings.MINIO_ENDPOINT)
        return False
    try:
        if not minio_client.bucket_exists(settings.MINIO_BUCKET):
            minio_client.make_bucket(settings.MINIO_BUCKET)
            logger.info("MinIO bucket '%s' created successfully.", settings.MINIO_BUCKET)
        else:
            logger.info("MinIO bucket '%s' already exists.", settings.MINIO_BUCKET)
        return True
    except Exception as exc:
        logger.warning("Could not verify bucket '%s': %s", settings.MINIO_BUCKET, exc)
        return False


def upload_file(
    file_data: Union[BinaryIO, bytes, io.BytesIO],
    object_name: str,
    content_type: str = "application/octet-stream",
    length: int = -1,
    part_size: int = 10 * 1024 * 1024
) -> str:
    """
    Uploads a file object or bytes to MinIO (or local fallback if offline).
    Returns storage path within bucket.
    """
    if isinstance(file_data, bytes):
        data_bytes = file_data
    elif hasattr(file_data, "read"):
        data_bytes = file_data.read()
    else:
        data_bytes = b""

    if is_minio_reachable():
        try:
            stream = io.BytesIO(data_bytes)
            minio_client.put_object(
                bucket_name=settings.MINIO_BUCKET,
                object_name=object_name,
                data=stream,
                length=len(data_bytes),
                content_type=content_type
            )
            return f"{settings.MINIO_BUCKET}/{object_name}"
        except Exception as exc:
            logger.warning("MinIO upload failed (%s); storing locally...", exc)

    # Local disk fallback
    local_dir = os.path.join("storage_vault", os.path.dirname(object_name))
    os.makedirs(local_dir, exist_ok=True)
    local_path = os.path.join("storage_vault", object_name)
    with open(local_path, "wb") as f:
        f.write(data_bytes)
    return f"{settings.MINIO_BUCKET}/{object_name}"


def download_file(storage_path: str, target_file_path: str) -> str:
    """
    Downloads a file from MinIO to target_file_path (or local fallback).
    """
    bucket_prefix = f"{settings.MINIO_BUCKET}/"
    if storage_path.startswith(bucket_prefix):
        object_name = storage_path[len(bucket_prefix):]
    else:
        object_name = storage_path

    if is_minio_reachable():
        try:
            minio_client.fget_object(
                bucket_name=settings.MINIO_BUCKET,
                object_name=object_name,
                file_path=target_file_path
            )
            return target_file_path
        except Exception as exc:
            logger.warning("MinIO download failed (%s); checking local fallback...", exc)

    local_path = os.path.join("storage_vault", object_name)
    if os.path.exists(local_path):
        import shutil
        os.makedirs(os.path.dirname(target_file_path), exist_ok=True)
        shutil.copyfile(local_path, target_file_path)
    return target_file_path


def get_presigned_url(storage_path: str, expires_seconds: int = 3600) -> str:
    """
    Generates a presigned GET URL for downloading an object from MinIO.
    """
    bucket_prefix = f"{settings.MINIO_BUCKET}/"
    if storage_path.startswith(bucket_prefix):
        object_name = storage_path[len(bucket_prefix):]
    else:
        object_name = storage_path

    if is_minio_reachable():
        try:
            url = minio_client.presigned_get_object(
                bucket_name=settings.MINIO_BUCKET,
                object_name=object_name,
                expires=timedelta(seconds=expires_seconds)
            )
            return url
        except Exception as exc:
            logger.warning("Could not generate presigned URL: %s", exc)

    return f"http://{settings.MINIO_ENDPOINT}/{settings.MINIO_BUCKET}/{object_name}"
