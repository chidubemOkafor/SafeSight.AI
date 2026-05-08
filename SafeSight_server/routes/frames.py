from pathlib import Path

from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse

from core.config import FRAMES_DIR
from services.inspection_service import get_inspection_frames_dir

router = APIRouter(prefix="/frames", tags=["evidence frames"])


@router.get(
    "/{video_id}/{frame_name}",
    summary="Get evidence frame image",
    description=(
        "Returns an extracted evidence frame image for a video. "
        "The `frame_url` values returned by `/ask/{video_id}` point to this endpoint."
    ),
    responses={
        200: {"content": {"image/jpeg": {}}},
        404: {"description": "Frame not found"},
    },
)
def get_frame(video_id: str, frame_name: str) -> FileResponse:
    if Path(frame_name).name != frame_name or Path(frame_name).suffix.lower() != ".jpg":
        raise HTTPException(status_code=400, detail="Invalid frame path.")

    try:
        inspection_frames_root = get_inspection_frames_dir(video_id).resolve()
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    inspection_frame_path = (inspection_frames_root / frame_name).resolve()
    legacy_frames_root = (FRAMES_DIR / video_id).resolve()
    legacy_frame_path = (legacy_frames_root / frame_name).resolve()

    if _is_safe_frame(inspection_frame_path, inspection_frames_root) and inspection_frame_path.exists():
        return FileResponse(inspection_frame_path, media_type="image/jpeg")

    if _is_safe_frame(legacy_frame_path, legacy_frames_root) and legacy_frame_path.exists():
        return FileResponse(legacy_frame_path, media_type="image/jpeg")

    if not _is_safe_frame(inspection_frame_path, inspection_frames_root):
        raise HTTPException(status_code=400, detail="Invalid frame path.")

    raise HTTPException(status_code=404, detail="Frame not found.")


def _is_safe_frame(frame_path: Path, frames_root: Path) -> bool:
    try:
        frame_path.relative_to(frames_root)
    except ValueError:
        return False
    return frame_path.suffix.lower() == ".jpg"
