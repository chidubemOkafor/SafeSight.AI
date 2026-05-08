from pydantic import BaseModel


class DetectionEvent(BaseModel):
    timestamp: str
    event_type: str
    event: str | None = None
    confidence: float
    risk: str | None = None
    what_happened: str | None = None
    explanation: str | None = None
    recommendation: str | None = None
    frame_path: str
