from fastapi import APIRouter, HTTPException

from schemas.common import MessageResponse
from schemas.events import EventsResponse
from services.detection_service import detect_people_in_frames
from services.event_service import save_safety_events
from services.inspection_service import (
    build_inspection_report,
    create_inspection,
    get_inspection,
    save_metadata,
    save_report,
)
from services.safety_service import build_safety_events
from services.video_service import extract_frames, find_uploaded_video

router = APIRouter(prefix="/inspect", tags=["inspect"])


@router.get(
    "",
    response_model=MessageResponse,
    summary="Inspect route status",
    description="Confirms that the inspect route is available.",
)
def inspect_root() -> MessageResponse:
    return MessageResponse(message="Inspect routes ready")


@router.post(
    "/{video_id}",
    response_model=EventsResponse,
    summary="Inspect uploaded video",
    description=(
        "Finds the uploaded video by `video_id`, extracts frames automatically, "
        "runs YOLO with `models/best.pt`, generates safety events, and saves them to inspection history."
    ),
    responses={
        400: {"description": "Video could not be read or frames could not be extracted"},
        404: {"description": "Video not found"},
        500: {"description": "Detection or file processing failed"},
    },
)
def inspect_video(video_id: str) -> EventsResponse:
    video_path = find_uploaded_video(video_id)
    if video_path is None:
        raise HTTPException(status_code=404, detail="Video not found.")

    try:
        if get_inspection(video_id) is None:
            create_inspection(video_id, video_path.name)
            save_metadata(
                video_id,
                {
                    "filename": video_path.name,
                    "stored_filename": video_path.name,
                    "upload_path": str(video_path),
                },
            )

        frames = extract_frames(video_id, video_path)
        detections = detect_people_in_frames(frames)
        events = build_safety_events(detections)
        events_payload = save_safety_events(video_id, events)
        save_report(video_id, build_inspection_report(video_id, events))
        return EventsResponse(**events_payload)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except OSError as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc
    except RuntimeError as exc:
        raise HTTPException(status_code=500, detail=f"Detection failed: {exc}") from exc
