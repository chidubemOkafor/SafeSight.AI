"""Object detection and safety-violation inference helpers."""

import os
from functools import lru_cache
from pathlib import Path
from typing import Any

from core.config import BASE_DIR, ULTRALYTICS_CONFIG_DIR, ensure_storage_dirs


MODEL_PATH = BASE_DIR / "models" / "best.pt"
TARGET_CLASS_NAMES = ("person", "no-hardhat", "no-safety vest")


@lru_cache(maxsize=1)
def get_yolo_model() -> Any:
    ensure_storage_dirs()
    os.environ.setdefault("YOLO_CONFIG_DIR", str(ULTRALYTICS_CONFIG_DIR))

    from ultralytics import YOLO

    if not MODEL_PATH.exists():
        raise FileNotFoundError(f"YOLO model not found at {MODEL_PATH}")

    return YOLO(str(MODEL_PATH))


def detect_people_in_frames(frames: list[dict[str, str | float]]) -> list[dict[str, str | float]]:
    model = get_yolo_model()
    target_class_ids = _get_class_ids(model.names, TARGET_CLASS_NAMES)
    detections: list[dict[str, str | float]] = []

    for frame in frames:
        frame_path = str(frame["frame_path"])
        absolute_frame_path = _resolve_frame_source_path(str(frame.get("source_path", frame_path)))
        if not absolute_frame_path.exists():
            raise FileNotFoundError(f"Extracted frame not found at {absolute_frame_path}")

        results = model.predict(
            source=str(absolute_frame_path),
            classes=target_class_ids,
            verbose=False,
        )

        for result in results:
            if result.boxes is None:
                continue

            for box in result.boxes:
                class_id = int(box.cls[0].item())
                class_name = model.names.get(class_id, str(class_id))
                confidence = float(box.conf[0].item())

                detections.append(
                    {
                        "timestamp": str(frame["timestamp"]),
                        "timestamp_seconds": float(frame["timestamp_seconds"]),
                        "class": class_name,
                        "confidence": round(confidence, 4),
                        "frame_path": frame_path,
                    }
                )

    return detections


def _resolve_frame_source_path(frame_path: str) -> Path:
    path = Path(frame_path)
    if path.is_absolute():
        return path
    return BASE_DIR / path


def _get_class_ids(names: dict[int, str], class_names: tuple[str, ...]) -> list[int]:
    class_ids: list[int] = []

    for class_name in class_names:
        class_ids.append(_get_class_id(names, class_name))

    return class_ids


def _get_class_id(names: dict[int, str], class_name: str) -> int:
    expected_name = _normalize_class_name(class_name)

    for class_id, name in names.items():
        if _normalize_class_name(name) == expected_name:
            return int(class_id)

    raise ValueError(f"Model does not include a '{class_name}' class.")


def _normalize_class_name(name: str) -> str:
    return name.lower().replace("_", " ").strip()
