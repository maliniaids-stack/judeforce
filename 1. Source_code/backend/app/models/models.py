import enum
import uuid
from sqlalchemy import (
    Column,
    String,
    Text,
    DateTime,
    ForeignKey,
    JSON,
    Enum as SQLEnum,
    func
)
from sqlalchemy.orm import relationship
from app.core.database import Base


class JobStatus(str, enum.Enum):
    created = "created"
    queued = "queued"
    processing = "processing"
    completed = "completed"
    failed = "failed"


def generate_uuid() -> str:
    return str(uuid.uuid4())


class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=generate_uuid)
    name = Column(String, nullable=True)
    email = Column(String, unique=True, index=True, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    jobs = relationship("Job", back_populates="user", cascade="all, delete-orphan")


class SourceContent(Base):
    __tablename__ = "source_contents"

    id = Column(String, primary_key=True, default=generate_uuid)
    original_filename = Column(String, nullable=False)
    storage_path = Column(String, nullable=False)
    content_type = Column(String, nullable=True)
    uploaded_at = Column(DateTime(timezone=True), server_default=func.now())

    jobs = relationship("Job", back_populates="source_content")


class Job(Base):
    __tablename__ = "jobs"

    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(String, ForeignKey("users.id"), nullable=True)
    source_content_id = Column(String, ForeignKey("source_contents.id"), nullable=True)
    prompt = Column(Text, nullable=False)
    output_formats = Column(JSON, nullable=False)
    generation_params = Column(JSON, nullable=True)
    status = Column(
        SQLEnum(JobStatus, name="job_status", values_callable=lambda obj: [e.value for e in obj]),
        default=JobStatus.created,
        nullable=False
    )
    error_message = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    user = relationship("User", back_populates="jobs")
    source_content = relationship("SourceContent", back_populates="jobs")
    artefacts = relationship("GeneratedArtefact", back_populates="job", cascade="all, delete-orphan")


class GeneratedArtefact(Base):
    __tablename__ = "generated_artefacts"

    id = Column(String, primary_key=True, default=generate_uuid)
    job_id = Column(String, ForeignKey("jobs.id"), nullable=False)
    output_format = Column(String, nullable=False)
    content = Column(Text, nullable=True)
    storage_path = Column(String, nullable=True)
    sha256_hash = Column(String, nullable=True)
    guardrail_results = Column(JSON, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    job = relationship("Job", back_populates="artefacts")
