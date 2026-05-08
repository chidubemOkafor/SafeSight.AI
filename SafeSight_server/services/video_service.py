"""Video upload, storage, and frame extraction helpers."""

import re
import shutil
from pathlib import Path
from uuid import uuid4

import cv2
from fastapi import UploadFile

from core.config import BASE_DIR, LEGACY_UPLOAD_DIR, UPLOAD_DIR, ensure_storage_dirs
from services.inspection_service import create_inspection, get_inspection_frames_dir, save_metadata


ALLOWED_VIDEO_EXTENSIONS = {".mp4"}


def save_uploaded_video(file: UploadFile) -> dict[str, str]:
    if not file.filename:
        raise ValueError("Uploaded file must include a filename.")

    original_name = Path(file.filename).name
    extension = Path(original_name).suffix.lower()

    if extension not in ALLOWED_VIDEO_EXTENSIONS:
        raise ValueError("Only .mp4 video files are supported.")

    ensure_storage_dirs()

    video_id = uuid4().hex
    safe_name = _safe_filename(original_name)
    stored_filename = f"{video_id}_{safe_name}"
    destination = UPLOAD_DIR / stored_filename

    try:
        with destination.open("wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    finally:
        file.file.close()

    create_inspection(video_id, original_name)
    save_metadata(
        video_id,
        {
            "filename": stored_filename,
            "stored_filename": stored_filename,
            "upload_path": _relative_path(destination),
            "status": "uploaded",
        },
    )

    return {
        "video_id": video_id,
        "filename": stored_filename,
    }


def find_uploaded_video(video_id: str) -> Path | None:
    ensure_storage_dirs()
    matches = sorted(UPLOAD_DIR.glob(f"{video_id}_*.mp4"))
    if not matches:
        matches = sorted(LEGACY_UPLOAD_DIR.glob(f"{video_id}_*.mp4"))
    return matches[0] if matches else None


def extract_frames(video_id: str, video_path: Path) -> list[dict[str, str | float]]:
    video_frames_dir = get_inspection_frames_dir(video_id)
    metadata = extract_frames_auto(video_path, video_frames_dir)
    save_metadata(
        video_id,
        {
            "duration_seconds": metadata["duration_seconds"],
            "fps": metadata["fps"],
            "total_frame_count": metadata["total_frame_count"],
            "sample_interval_seconds": metadata["sample_interval_seconds"],
            "frames_extracted": metadata["frames_extracted"],
            "frames_path": _relative_path(video_frames_dir),
        },
    )

    return [
        {
            "timestamp": _format_timestamp(float(frame["timestamp_seconds"])),
            "timestamp_seconds": float(frame["timestamp_seconds"]),
            "frame_path": f"frames/{video_id}/{Path(str(frame['path'])).name}",
        }
        for frame in metadata["frames"]
    ]


def extract_frames_auto(video_path: str | Path, output_dir: str | Path) -> dict:
    ensure_storage_dirs()
    video_path = Path(video_path)
    output_dir = Path(output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)

    capture = cv2.VideoCapture(str(video_path))
    if not capture.isOpened():
        raise ValueError("Could not read uploaded video.")

    fps = float(capture.get(cv2.CAP_PROP_FPS) or 0)
    total_frame_count = int(capture.get(cv2.CAP_PROP_FRAME_COUNT) or 0)
    if fps <= 0:
        capture.release()
        raise ValueError("Could not determine video FPS.")

    duration_seconds = total_frame_count / fps if total_frame_count else 0.0
    sample_interval_seconds = _choose_sample_interval(duration_seconds)
    frame_interval = max(int(round(fps * sample_interval_seconds)), 1)

    frames: list[dict[str, str | float]] = []
    current_frame_index = 0
    extracted_frame_index = 1

    try:
        while True:
            success, frame = capture.read()
            if not success:
                break

            if current_frame_index % frame_interval == 0:
                timestamp_seconds = current_frame_index / fps
                frame_name = f"frame_{extracted_frame_index:04d}_{int(round(timestamp_seconds))}s.jpg"
                frame_path = output_dir / frame_name

                if not cv2.imwrite(str(frame_path), frame):
                    raise OSError("Could not write extracted frame.")

                frames.append(
                    {
                        "path": _relative_path(frame_path),
                        "timestamp_seconds": round(timestamp_seconds, 3),
                    }
                )
                extracted_frame_index += 1

            current_frame_index += 1
    finally:
        capture.release()

    if not frames:
        raise ValueError("No frames could be extracted from uploaded video.")

    return {
        "duration_seconds": round(duration_seconds, 3),
        "fps": round(fps, 3),
        "total_frame_count": total_frame_count,
        "sample_interval_seconds": sample_interval_seconds,
        "frames_extracted": len(frames),
        "frames": frames,
    }


def _safe_filename(filename: str) -> str:
    filename = Path(filename).name.strip()
    filename = re.sub(r"[^A-Za-z0-9_.-]", "_", filename)
    return filename or "uploaded_video.mp4"


def _format_timestamp(seconds: float) -> str:
    minutes = int(seconds // 60)
    remaining_seconds = int(seconds % 60)
    return f"{minutes:02d}:{remaining_seconds:02d}"


def _choose_sample_interval(duration_seconds: float) -> int:
    if duration_seconds <= 120:
        return 1
    if duration_seconds <= 600:
        return 3
    if duration_seconds <= 1800:
        return 5
    return 10


def _relative_path(path: Path) -> str:
    return path.resolve().relative_to(BASE_DIR.resolve()).as_posix()
