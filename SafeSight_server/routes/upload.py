from fastapi import APIRouter, File, HTTPException, UploadFile

from schemas.video import VideoUploadResponse
from services.video_service import save_uploaded_video

router = APIRouter(prefix="/upload", tags=["upload"])


@router.get("")
def upload_root() -> dict[str, str]:
    return {"message": "Upload routes ready"}


@router.post("", response_model=VideoUploadResponse)
def upload_video(file: UploadFile = File(...)) -> VideoUploadResponse:
    try:
        saved_video = save_uploaded_video(file)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except OSError as exc:
        raise HTTPException(status_code=500, detail="Could not save uploaded video.") from exc

    return VideoUploadResponse(**saved_video)
