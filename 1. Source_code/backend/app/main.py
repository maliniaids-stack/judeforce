import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.database import Base, engine
from app.core.minio_client import ensure_bucket_exists
from app.api.routes import router

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("prism_ai")


def init_app_resources():
    logger.info("Initializing Prism AI database tables...")
    try:
        Base.metadata.create_all(bind=engine)
        logger.info("Database tables verified/created successfully.")
    except Exception as exc:
        logger.warning("Could not initialize database tables: %s", exc)

    logger.info("Verifying MinIO bucket configuration...")
    ensure_bucket_exists()


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup sequence
    logger.info("Starting Prism AI API...")
    init_app_resources()
    yield
    # Shutdown sequence
    logger.info("Shutting down Prism AI API...")


app = FastAPI(
    title="Prism AI API",
    description="Offline-capable, multimodal content transformation platform API",
    version="1.0.0",
    lifespan=lifespan
)

# CORS configuration supporting any local dev server port (localhost & 127.0.0.1)
app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"http://(localhost|127\.0\.0\.1)(:\d+)?",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/", summary="Health Check")
def health_check():
    return {
        "status": "healthy",
        "service": "Prism AI"
    }


# Include routes at root and with /api prefix
app.include_router(router)
app.include_router(router, prefix="/api")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
