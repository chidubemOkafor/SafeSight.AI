"""Event creation, persistence, and retrieval helpers."""

import json
from pathlib import Path

from core.config import EVENTS_DIR, ensure_storage_dirs
from services.safety_service import SUPPORTED_EVENT_TYPES


def save_safety_events(video_id: str, events: list[dict[str, str | float]]) -> dict:
    ensure_storage_dirs()
    payload = {
        "video_id": video_id,
        "supported_event_types": list(SUPPORTED_EVENT_TYPES),
        "events": events,
    }

    event_path = get_event_path(video_id)
    event_path.write_text(json.dumps(payload, indent=2), encoding="utf-8")

    return payload


def load_safety_events(video_id: str) -> dict | None:
    event_path = get_event_path(video_id)
    if not event_path.exists():
        return None

    return json.loads(event_path.read_text(encoding="utf-8"))


def get_event_path(video_id: str) -> Path:
    return EVENTS_DIR / f"{video_id}.json"
