from fastapi import APIRouter, HTTPException

from schemas.common import MessageResponse
from schemas.events import EventsResponse
from services.event_service import load_safety_events

router = APIRouter(prefix="/events", tags=["events"])


@router.get(
    "",
    response_model=MessageResponse,
    summary="Events route status",
    description="Confirms that the events route is available.",
)
def events_root() -> MessageResponse:
    return MessageResponse(message="Events routes ready")


@router.get(
    "/{video_id}",
    response_model=EventsResponse,
    summary="Get safety events",
    description=(
        "Returns the structured safety events saved for an inspected video. "
        "Run `POST /inspect/{video_id}` before calling this endpoint. "
        "Events are read from `storage/inspections/{video_id}/events.json`."
    ),
    responses={404: {"description": "Events not found"}},
)
def get_events(video_id: str) -> EventsResponse:
    events = load_safety_events(video_id)
    if events is None:
        raise HTTPException(status_code=404, detail="Events not found.")

    return EventsResponse(**events)
