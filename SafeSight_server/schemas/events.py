from pydantic import BaseModel, Field

from schemas.detection import DetectionEvent


class EventsResponse(BaseModel):
    video_id: str = Field(examples=["b49646b5f2a94b79be56035a33642e68"])
    supported_event_types: list[str] = Field(
        examples=[["person_detected", "no_helmet", "no_vest"]]
    )
    events: list[DetectionEvent]
