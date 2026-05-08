from typing import Any

from pydantic import BaseModel, Field


class InspectionIndexItem(BaseModel):
    video_id: str
    original_filename: str | None = None
    filename: str | None = None
    status: str
    created_at: str | None = None
    updated_at: str | None = None
    event_count: int = 0
    concern_count: int = 0
    qa_count: int = 0
    report_available: bool = False


class InspectionDetailResponse(BaseModel):
    video_id: str = Field(examples=["b49646b5f2a94b79be56035a33642e68"])
    metadata: dict[str, Any]
    events: list[dict[str, Any]]
    report: dict[str, Any] | None = None
    qa_history: list[dict[str, Any]]
