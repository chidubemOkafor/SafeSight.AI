from fastapi import APIRouter, HTTPException

from services.detection_service import detect_people_in_frames
from services.event_service import save_safety_events
from services.safety_service import build_safety_events
from services.video_service import extract_frames, find_uploaded_video

router = APIRouter(prefix="/inspect", tags=["inspect"])


@router.get("")
def inspect_root() -> dict[str, str]:
    return {"message": "Inspect routes ready"}


@router.post("/{video_id}")
def inspect_video(video_id: str) -> dict:
    video_path = find_uploaded_video(video_id)
    if video_path is None:
        raise HTTPException(status_code=404, detail="Video not found.")

    try:
        frames = extract_frames(video_id, video_path)
        detections = detect_people_in_frames(frames)
        events = build_safety_events(detections)
        return save_safety_events(video_id, events)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except OSError as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc
    except RuntimeError as exc:
        raise HTTPException(status_code=500, detail=f"Detection failed: {exc}") from exc
