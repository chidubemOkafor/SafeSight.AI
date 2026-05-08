from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routes.ask import router as ask_router
from routes.events import router as events_router
from routes.frames import router as frames_router
from routes.inspections import router as inspections_router
from routes.inspect import router as inspect_router
from routes.upload import router as upload_router
from core.config import ensure_storage_dirs, load_env_file
from schemas.common import HealthResponse


load_env_file()
ensure_storage_dirs()


app = FastAPI(
    title="SafeSight API",
    description=(
        "Backend API for uploading construction-site videos, inspecting them with YOLO, "
        "storing safety events, serving evidence frames, and asking questions about detected concerns."
    ),
    version="0.1.0",
    openapi_tags=[
        {"name": "system", "description": "Health and service status endpoints."},
        {"name": "upload", "description": "Upload `.mp4` videos for inspection."},
        {"name": "inspect", "description": "Extract frames and run safety detection."},
        {"name": "events", "description": "Read structured safety events for inspected videos."},
        {"name": "inspections", "description": "List and load persisted inspection history."},
        {"name": "ask", "description": "Ask natural-language questions about safety concerns."},
        {"name": "evidence frames", "description": "Retrieve extracted frame images used as evidence."},
    ],
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(upload_router)
app.include_router(inspect_router)
app.include_router(events_router)
app.include_router(inspections_router)
app.include_router(ask_router)
app.include_router(frames_router)


@app.get(
    "/health",
    response_model=HealthResponse,
    tags=["system"],
    summary="Health check",
    description="Returns a simple status response so the frontend can verify the API is running.",
)
def health_check() -> HealthResponse:
    return HealthResponse(status="ok")


@app.on_event("startup")
def startup() -> None:
    ensure_storage_dirs()
