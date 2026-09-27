import logging
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from app.core.config import settings

logger = logging.getLogger(__name__)

try:
    engine = create_engine(
        settings.DATABASE_URL,
        pool_pre_ping=True
    )
    with engine.connect() as conn:
        pass
except Exception as exc:
    logger.warning("PostgreSQL connection failed (%s). Falling back to SQLite prism_ai.db", exc)
    engine = create_engine(
        "sqlite:///./prism_ai.db",
        connect_args={"check_same_thread": False}
    )

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
