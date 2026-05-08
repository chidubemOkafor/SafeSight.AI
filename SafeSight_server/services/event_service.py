"""Event creation, persistence, and retrieval helpers."""

import json
from pathlib import Path

from core.config import EVENTS_DIR, ensure_storage_dirs
from services.inspection_service import get_events_path as get_inspection_events_path
from services.inspection_service import get_inspection, save_events
from services.safety_service import SUPPORTED_EVENT_TYPES


def save_safety_events(video_id: str, events: list[dict[str, str | float]]) -> dict:
    ensure_storage_dirs()
    payload = {
        "video_id": video_id,
        "supported_event_types": list(SUPPORTED_EVENT_TYPES),
        "events": events,
    }

    save_events(video_id, events)

    return payload


def load_safety_events(video_id: str) -> dict | None:
    try:
        inspection = get_inspection(video_id)
        inspection_event_path = get_inspection_events_path(video_id)
    except ValueError:
        return None

    if inspection and inspection_event_path.exists():
        events = inspection.get("events", [])
        if isinstance(events, dict):
            return events
        return {
            "video_id": video_id,
            "supported_event_types": list(SUPPORTED_EVENT_TYPES),
            "events": events if isinstance(events, list) else [],
        }

    event_path = get_event_path(video_id)
    if not event_path.exists():
        return None

    return json.loads(event_path.read_text(encoding="utf-8"))


def get_event_path(video_id: str) -> Path:
    return EVENTS_DIR / f"{video_id}.json"
