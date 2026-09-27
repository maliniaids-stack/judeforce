import socket
from celery import Celery
from app.core.config import settings


def is_redis_reachable() -> bool:
    """Fast socket check to see if Redis server is online."""
    try:
        parts = settings.REDIS_URL.replace("redis://", "").split("/")[0].split(":")
        host = parts[0]
        port = int(parts[1]) if len(parts) > 1 else 6379
        with socket.create_connection((host, port), timeout=0.5):
            return True
    except Exception:
        return False


redis_online = is_redis_reachable()

celery_app = Celery(
    "prism_ai_worker",
    broker=settings.REDIS_URL if redis_online else "memory://",
    backend=settings.REDIS_URL if redis_online else None,
    include=["app.tasks"]
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
    task_ignore_result=not redis_online,
    broker_connection_retry_on_startup=False,
    broker_connection_max_retries=1 if redis_online else 0,
)
