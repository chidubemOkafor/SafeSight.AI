from pydantic import BaseModel


class AskRequest(BaseModel):
    question: str


class EvidenceFrame(BaseModel):
    timestamp: str
    event_type: str
    event: str
    risk: str
    explanation: str
    recommendation: str
    confidence: float
    frame_path: str
    frame_url: str


class AskResponse(BaseModel):
    video_id: str
    question: str
    answer: str
    model: str
    event_count: int
    evidence: list[EvidenceFrame]
