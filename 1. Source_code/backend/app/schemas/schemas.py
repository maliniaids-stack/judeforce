from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, ConfigDict


class UploadResponse(BaseModel):
    source_content_id: str
    original_filename: str
    content_type: Optional[str] = None
    storage_path: str
    backend_telemetry: Optional[Dict[str, Any]] = None

    model_config = ConfigDict(from_attributes=True)


class GenerateRequest(BaseModel):
    prompt: str
    source_content_id: Optional[str] = None
    output_formats: List[str]
    generation_params: Optional[Dict[str, Any]] = None


class ArtefactOut(BaseModel):
    id: str
    output_format: str
    content: Optional[str] = None
    storage_path: Optional[str] = None
    sha256_hash: Optional[str] = None
    guardrail_results: Optional[Dict[str, Any]] = None
    created_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class JobOut(BaseModel):
    id: str
    status: str
    prompt: str
    source_content_id: Optional[str] = None
    output_formats: List[str]
    generation_params: Optional[Dict[str, Any]] = None
    error_message: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    artefacts: Optional[List[ArtefactOut]] = []

    model_config = ConfigDict(from_attributes=True)


class NormalizedContextObject(BaseModel):
    text: str
    entities: List[Any] = []
    source_language: str
    chunks: List[str]
