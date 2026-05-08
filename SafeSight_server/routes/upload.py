from fastapi import APIRouter, File, HTTPException, UploadFile

from schemas.common import MessageResponse
from schemas.video import VideoUploadResponse
from services.video_service import save_uploaded_video

router = APIRouter(prefix="/upload", tags=["upload"])


@router.get(
    "",
    response_model=MessageResponse,
    summary="Upload route status",
    description="Confirms that the upload route is available.",
)
def upload_root() -> MessageResponse:
    return MessageResponse(message="Upload routes ready")


@router.post(
    "",
    response_model=VideoUploadResponse,
    summary="Upload MP4 video",
    description=(
        "Accepts a multipart form upload with key `file`. "
        "Only `.mp4` files are accepted. The file is saved to `SafeSight_server/uploads/` "
        "and an inspection record is created in `storage/inspections/{video_id}/`."
    ),
    responses={
        400: {"description": "Invalid file type or missing filename"},
        500: {"description": "Could not save uploaded video"},
    },
)
def upload_video(file: UploadFile = File(...)) -> VideoUploadResponse:
    try:
        saved_video = save_uploaded_video(file)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except OSError as exc:
        raise HTTPException(status_code=500, detail="Could not save uploaded video.") from exc

    return VideoUploadResponse(**saved_video)
