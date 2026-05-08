import os
from pathlib import Path


BASE_DIR = Path(__file__).resolve().parent.parent
ENV_FILE = BASE_DIR / ".env"
UPLOAD_DIR = BASE_DIR / "uploads"
FRAMES_DIR = BASE_DIR / "frames"
EVENTS_DIR = BASE_DIR / "events"
STORAGE_DIR = BASE_DIR / "storage"
INSPECTIONS_DIR = STORAGE_DIR / "inspections"
INSPECTIONS_INDEX_FILE = INSPECTIONS_DIR / "index.json"
ULTRALYTICS_CONFIG_DIR = BASE_DIR / ".ultralytics"


def ensure_storage_dirs() -> None:
    for path in (UPLOAD_DIR, FRAMES_DIR, EVENTS_DIR, INSPECTIONS_DIR, ULTRALYTICS_CONFIG_DIR):
        path.mkdir(parents=True, exist_ok=True)


def load_env_file() -> None:
    if not ENV_FILE.exists():
        return

    for line in ENV_FILE.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue

        key, value = line.split("=", 1)
        os.environ.setdefault(key.strip(), value.strip().strip('"').strip("'"))
