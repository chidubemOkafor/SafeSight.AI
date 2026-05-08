"""Persistent JSON-backed inspection history helpers."""

import json
import re
import shutil
from collections import Counter, defaultdict
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from core.config import (
    BASE_DIR,
    EVENTS_DIR,
    FRAMES_DIR,
    INSPECTIONS_DIR,
    INSPECTIONS_INDEX_FILE,
    UPLOAD_DIR,
    ensure_storage_dirs,
)


CONCERN_EVENT_TYPES = {"no_helmet", "no_vest"}


def create_inspection(video_id: str, original_filename: str) -> dict[str, Any]:
    """Create an inspection folder, metadata file, and index entry."""
    ensure_storage_dirs()
    inspection_dir = get_inspection_dir(video_id)
    inspection_dir.mkdir(parents=True, exist_ok=True)
    get_inspection_frames_dir(video_id).mkdir(parents=True, exist_ok=True)

    now = _utc_now()
    existing_metadata = _read_json(get_metadata_path(video_id), default={})
    if not isinstance(existing_metadata, dict):
        existing_metadata = {}
    metadata = {
        "video_id": video_id,
        "original_filename": original_filename,
        "created_at": existing_metadata.get("created_at", now),
        "updated_at": now,
        "status": existing_metadata.get("status", "uploaded"),
    }
    metadata.update(existing_metadata)
    metadata["updated_at"] = now

    _write_json(get_metadata_path(video_id), metadata)
    _upsert_index_entry(_index_entry_from_metadata(metadata))
    return metadata


def save_metadata(video_id: str, metadata: dict[str, Any]) -> dict[str, Any]:
    """Merge metadata into the current metadata.json and update index.json."""
    ensure_storage_dirs()
    inspection_dir = get_inspection_dir(video_id)
    inspection_dir.mkdir(parents=True, exist_ok=True)
    get_inspection_frames_dir(video_id).mkdir(parents=True, exist_ok=True)

    now = _utc_now()
    metadata_path = get_metadata_path(video_id)
    current_metadata = _read_json(metadata_path, default={})
    if not isinstance(current_metadata, dict):
        current_metadata = {}
    merged_metadata = {
        "video_id": video_id,
        "created_at": current_metadata.get("created_at", now),
        "updated_at": now,
        **current_metadata,
        **metadata,
        "video_id": video_id,
        "updated_at": now,
    }

    _write_json(metadata_path, merged_metadata)
    _upsert_index_entry(_index_entry_from_metadata(merged_metadata))
    return merged_metadata


def save_events(video_id: str, events: list[dict[str, Any]] | dict[str, Any]) -> list[dict[str, Any]]:
    """Save clean event records for an inspection."""
    event_list = _event_list(events)
    _write_json(get_events_path(video_id), event_list)

    concern_count = sum(1 for event in event_list if event.get("event_type") in CONCERN_EVENT_TYPES)
    save_metadata(
        video_id,
        {
            "status": "inspected",
            "event_count": len(event_list),
            "concern_count": concern_count,
            "events_path": _relative_path(get_events_path(video_id)),
            "last_inspected_at": _utc_now(),
        },
    )
    return event_list


def save_report(video_id: str, report: dict[str, Any]) -> dict[str, Any]:
    """Save the latest safety report for an inspection."""
    _write_json(get_report_path(video_id), report)
    save_metadata(
        video_id,
        {
            "report_available": True,
            "report_path": _relative_path(get_report_path(video_id)),
            "report_generated_at": report.get("generated_at", _utc_now()),
        },
    )
    return report


def save_qa_entry(video_id: str, question: str, answer: str, model: str) -> dict[str, Any]:
    """Append a question-and-answer pair to qa_history.json."""
    qa_path = get_qa_history_path(video_id)
    history = _read_json(qa_path, default=[])
    if not isinstance(history, list):
        history = []

    entry = {
        "asked_at": _utc_now(),
        "question": question,
        "answer": answer,
        "model": model,
    }
    history.append(entry)
    _write_json(qa_path, history)
    save_metadata(
        video_id,
        {
            "qa_count": len(history),
            "last_question_at": entry["asked_at"],
        },
    )
    return entry


def list_inspections() -> list[dict[str, Any]]:
    """Return inspection index entries, newest first."""
    _sync_legacy_inspections()
    index = _read_index()
    inspections = index.get("inspections", [])
    if not isinstance(inspections, list):
        inspections = []
    inspections = [item for item in inspections if isinstance(item, dict)]

    return sorted(
        inspections,
        key=lambda item: str(item.get("updated_at") or item.get("created_at") or ""),
        reverse=True,
    )


def get_inspection(video_id: str) -> dict[str, Any] | None:
    """Load a persisted inspection and safely default optional files."""
    _sync_legacy_inspection(video_id)
    metadata_path = get_metadata_path(video_id)
    if not metadata_path.exists():
        return None

    metadata = _read_json(metadata_path, default={})
    events = _read_json(get_events_path(video_id), default=[])
    report = _read_json(get_report_path(video_id), default=None)
    qa_history = _read_json(get_qa_history_path(video_id), default=[])

    return {
        "video_id": video_id,
        "metadata": metadata if isinstance(metadata, dict) else {},
        "events": _event_list(events),
        "report": report if isinstance(report, dict) else None,
        "qa_history": qa_history if isinstance(qa_history, list) else [],
    }


def delete_inspection(video_id: str) -> bool:
    """Delete an inspection folder and remove it from index.json."""
    inspection_dir = get_inspection_dir(video_id)
    if not inspection_dir.exists():
        return False

    shutil.rmtree(inspection_dir)
    index = _read_index()
    inspections = [
        item
        for item in index.get("inspections", [])
        if isinstance(item, dict) and item.get("video_id") != video_id
    ]
    _write_json(INSPECTIONS_INDEX_FILE, {"inspections": inspections})
    return True


def build_inspection_report(video_id: str, events: list[dict[str, Any]] | dict[str, Any]) -> dict[str, Any]:
    """Build a simple MVP safety report from stored event data."""
    event_list = _event_list(events)
    concern_events = [
        event
        for event in event_list
        if event.get("event_type") in CONCERN_EVENT_TYPES
    ]
    event_counts = Counter(str(event.get("event_type", "unknown")) for event in event_list)
    risk_counts = Counter(str(event.get("risk", "Unspecified")) for event in concern_events)
    grouped_concerns: dict[str, list[dict[str, Any]]] = defaultdict(list)

    for event in concern_events:
        grouped_concerns[str(event.get("event_type", "unknown"))].append(event)

    findings: list[dict[str, Any]] = []
    for event_type, grouped in grouped_concerns.items():
        grouped.sort(key=lambda event: float(event.get("timestamp_seconds", 0.0)))
        first_event = grouped[0]
        last_event = grouped[-1]
        findings.append(
            {
                "event_type": event_type,
                "event": first_event.get("event"),
                "risk": first_event.get("risk"),
                "count": len(grouped),
                "first_seen": first_event.get("timestamp"),
                "last_seen": last_event.get("timestamp"),
                "what_happened": first_event.get("what_happened"),
                "explanation": first_event.get("explanation"),
                "recommendation": first_event.get("recommendation"),
                "evidence_frames": [
                    {
                        "timestamp": event.get("timestamp"),
                        "frame_path": event.get("frame_path"),
                        "confidence": event.get("confidence"),
                    }
                    for event in grouped[:5]
                ],
            }
        )

    return {
        "video_id": video_id,
        "generated_at": _utc_now(),
        "summary": {
            "total_events": len(event_list),
            "total_safety_concerns": len(concern_events),
            "event_counts": dict(event_counts),
            "risk_counts": dict(risk_counts),
        },
        "findings": findings,
    }


def get_inspection_dir(video_id: str) -> Path:
    return INSPECTIONS_DIR / _safe_video_id(video_id)


def get_inspection_frames_dir(video_id: str) -> Path:
    return get_inspection_dir(video_id) / "frames"


def get_metadata_path(video_id: str) -> Path:
    return get_inspection_dir(video_id) / "metadata.json"


def get_events_path(video_id: str) -> Path:
    return get_inspection_dir(video_id) / "events.json"


def get_report_path(video_id: str) -> Path:
    return get_inspection_dir(video_id) / "report.json"


def get_qa_history_path(video_id: str) -> Path:
    return get_inspection_dir(video_id) / "qa_history.json"


def _sync_legacy_inspections() -> None:
    ensure_storage_dirs()
    video_ids: set[str] = set()
    video_ids.update(_video_id_from_upload(upload_path) for upload_path in UPLOAD_DIR.glob("*.mp4"))
    video_ids.update(event_path.stem for event_path in EVENTS_DIR.glob("*.json"))

    for video_id in video_ids:
        if video_id:
            try:
                _sync_legacy_inspection(video_id)
            except ValueError:
                continue


def _sync_legacy_inspection(video_id: str) -> None:
    upload_path = _find_legacy_upload(video_id)
    old_event_path = EVENTS_DIR / f"{video_id}.json"
    metadata_path = get_metadata_path(video_id)

    if upload_path and not metadata_path.exists():
        create_inspection(video_id, _original_name_from_stored(upload_path.name, video_id))
        save_metadata(
            video_id,
            {
                "filename": upload_path.name,
                "stored_filename": upload_path.name,
                "upload_path": _relative_path(upload_path),
                "status": "uploaded",
            },
        )

    if old_event_path.exists() and not get_events_path(video_id).exists():
        legacy_payload = _read_json(old_event_path, default={})
        legacy_events = _event_list(legacy_payload)
        if not metadata_path.exists():
            create_inspection(video_id, _original_name_from_stored(f"{video_id}.mp4", video_id))
        save_events(video_id, legacy_events)
        report_path = get_report_path(video_id)
        if not report_path.exists():
            save_report(video_id, build_inspection_report(video_id, legacy_events))


def _find_legacy_upload(video_id: str) -> Path | None:
    matches = sorted(UPLOAD_DIR.glob(f"{video_id}_*.mp4"))
    return matches[0] if matches else None


def _video_id_from_upload(upload_path: Path) -> str:
    return upload_path.name.split("_", 1)[0]


def _original_name_from_stored(stored_filename: str, video_id: str) -> str:
    prefix = f"{video_id}_"
    if stored_filename.startswith(prefix):
        return stored_filename.removeprefix(prefix)
    return stored_filename


def _event_list(events: list[dict[str, Any]] | dict[str, Any] | Any) -> list[dict[str, Any]]:
    if isinstance(events, dict):
        events = events.get("events", [])
    if not isinstance(events, list):
        return []
    return [event for event in events if isinstance(event, dict)]


def _index_entry_from_metadata(metadata: dict[str, Any]) -> dict[str, Any]:
    return {
        "video_id": metadata.get("video_id"),
        "original_filename": metadata.get("original_filename"),
        "filename": metadata.get("filename") or metadata.get("stored_filename"),
        "status": metadata.get("status", "uploaded"),
        "created_at": metadata.get("created_at"),
        "updated_at": metadata.get("updated_at"),
        "event_count": int(metadata.get("event_count", 0) or 0),
        "concern_count": int(metadata.get("concern_count", 0) or 0),
        "qa_count": int(metadata.get("qa_count", 0) or 0),
        "report_available": bool(metadata.get("report_available", False)),
    }


def _upsert_index_entry(entry: dict[str, Any]) -> None:
    if not entry.get("video_id"):
        return

    index = _read_index()
    inspections = [
        item
        for item in index.get("inspections", [])
        if isinstance(item, dict) and item.get("video_id") != entry["video_id"]
    ]
    inspections.append(entry)
    inspections.sort(
        key=lambda item: str(item.get("updated_at") or item.get("created_at") or ""),
        reverse=True,
    )
    _write_json(INSPECTIONS_INDEX_FILE, {"inspections": inspections})


def _read_index() -> dict[str, Any]:
    ensure_storage_dirs()
    if not INSPECTIONS_INDEX_FILE.exists():
        _write_json(INSPECTIONS_INDEX_FILE, {"inspections": []})
    index = _read_json(INSPECTIONS_INDEX_FILE, default={"inspections": []})
    if not isinstance(index, dict):
        return {"inspections": []}
    if not isinstance(index.get("inspections"), list):
        index["inspections"] = []
    return index


def _read_json(path: Path, default: Any) -> Any:
    if not path.exists():
        return default
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except (json.JSONDecodeError, OSError):
        return default


def _write_json(path: Path, payload: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, indent=2), encoding="utf-8")


def _safe_video_id(video_id: str) -> str:
    if not re.fullmatch(r"[A-Za-z0-9_-]+", video_id):
        raise ValueError("Invalid video_id.")
    return video_id


def _relative_path(path: Path) -> str:
    return path.resolve().relative_to(BASE_DIR.resolve()).as_posix()


def _utc_now() -> str:
    return datetime.now(timezone.utc).isoformat()
