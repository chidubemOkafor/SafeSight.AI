from fastapi import APIRouter, HTTPException

from services.event_service import load_safety_events

router = APIRouter(prefix="/events", tags=["events"])


@router.get("")
def events_root() -> dict[str, str]:
    return {"message": "Events routes ready"}


@router.get("/{video_id}")
def get_events(video_id: str) -> dict:
    events = load_safety_events(video_id)
    if events is None:
        raise HTTPException(status_code=404, detail="Events not found.")

    return events
