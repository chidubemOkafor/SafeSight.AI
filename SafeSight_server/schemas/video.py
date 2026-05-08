from pydantic import BaseModel


class VideoUploadResponse(BaseModel):
    video_id: str
    filename: str
