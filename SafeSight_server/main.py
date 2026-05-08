from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from routes.ask import router as ask_router
from routes.events import router as events_router
from routes.inspect import router as inspect_router
from routes.upload import router as upload_router
from core.config import FRAMES_DIR, ensure_storage_dirs, load_env_file


load_env_file()
ensure_storage_dirs()


app = FastAPI(title="SafeSight API")

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
app.include_router(ask_router)
app.mount("/frames", StaticFiles(directory=FRAMES_DIR), name="frames")


@app.get("/health")
def health_check() -> dict[str, str]:
    return {"status": "ok"}


@app.on_event("startup")
def startup() -> None:
    ensure_storage_dirs()
