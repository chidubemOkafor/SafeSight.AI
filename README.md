# SafeSight AI

AI-powered safety inspection for construction, warehouse, and industrial footage.

Upload an `.mp4` video, run the YOLO-based PPE detector, browse detected violations and evidence frames in the web dashboard, and ask natural-language questions about what the model found.

---

## Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 15 · TypeScript · Tailwind CSS v4 |
| Backend | FastAPI · Uvicorn · Python 3.11 |
| Detection | Ultralytics YOLO (`models/best.pt`) |
| Q&A | HuggingFace LLM via OpenAI-compatible API |
| Containers | Docker · Docker Compose |

---

## Prerequisites

- **Python 3.11+**
- **Node.js 18+** and **npm**
- **YOLO model** — place your trained weights at `SafeSight_server/models/best.pt`
- **HuggingFace token** — required for the Q&A feature (`POST /ask/{video_id}`)
- **Docker + Docker Compose** — only needed for the containerised workflow

---

## Quick Start

### 1. Install

```bash
make install
```

This will:
- Copy `.env.example` files to `.env` / `.env.local` if they don't exist yet
- Create a Python virtualenv at `SafeSight_server/venv` and install all packages
- Run `npm install` for the frontend
- Create required data directories

### 2. Configure

Edit `SafeSight_server/.env` and point the Q&A client at the endpoint you want:

```env
# Local machine: Hugging Face router
QWEN_URL=https://router.huggingface.co/v1
QWEN_KEY=your_huggingface_token_here
QWEN_MODEL=Qwen/Qwen2.5-VL-7B-Instruct

# AMD droplet: your deployed OpenAI-compatible Qwen server
# QWEN_URL=http://localhost:8000/v1
# QWEN_KEY=dummy
# QWEN_MODEL=Qwen/Qwen2.5-VL-7B-Instruct
```

Place your YOLO model:

```
SafeSight_server/models/best.pt
```

### 3. Start

```bash
make start
```

This starts the FastAPI backend on port **8000**, waits for it to pass a health check, then launches the Next.js dev server on port **3000**.

| Service | URL |
|---|---|
| Frontend | http://localhost:3000 |
| Backend | http://127.0.0.1:8000 |
| API docs | http://127.0.0.1:8000/docs |

Press **Ctrl+C** to stop both services.

---

## Docker

Build and start both services:

```bash
make docker-start
```

| Service | URL |
|---|---|
| Frontend | http://localhost:3000 |
| Backend | http://localhost:7860 |
| API docs | http://localhost:7860/docs |

```bash
make docker-logs    # follow combined logs
make docker-stop    # stop and remove containers
make docker-build   # force rebuild without cache
```

> **Note:** `NEXT_PUBLIC_API_BASE_URL` is baked into the frontend bundle at Docker build time.
> If your backend is on a different host or port, override it before building:
> ```bash
> NEXT_PUBLIC_API_BASE_URL=http://192.168.1.10:7860 docker compose up --build
> ```

---

## All Make Targets

```
make install        Install all dependencies and initialise env files
make start          Start the full application (backend + frontend)

make backend-start  Start the FastAPI backend only (port 8000, hot-reload)
make frontend-start Start the Next.js frontend only (port 3000)

make docker-start   Build images and start all services via Docker Compose
make docker-stop    Stop and remove Docker Compose services
make docker-build   Rebuild Docker images without cache
make docker-logs    Tail logs from all Docker services

make lint           Run ESLint on the frontend
make type-check     Run TypeScript type-checking on the frontend
```

---

## Configuration

### Backend — `SafeSight_server/.env`

| Variable | Required | Description |
|---|---|---|
| `QWEN_URL` | No | OpenAI-compatible base URL for Qwen. Default: Hugging Face router |
| `QWEN_KEY` | No* | API key for the selected endpoint |
| `QWEN_MODEL` | No | Model ID used for Q&A |
| `HF_TOKEN` | Yes* | Backward-compatible alias for `QWEN_KEY` |
| `HF_MODEL` | No* | Backward-compatible alias for `QWEN_MODEL` |

`*` Required only when you are using the Hugging Face router and not a local server that ignores auth.

### Frontend — `SafeSight_client/.env.local`

| Variable | Default | Description |
|---|---|---|
| `NEXT_PUBLIC_API_BASE_URL` | `http://127.0.0.1:8000` | Backend base URL (local dev) |

---

## Project Structure

```
SafeSight.AI/
├── SafeSight_server/          FastAPI backend
│   ├── main.py
│   ├── routes/                upload, inspect, events, ask, frames, inspections
│   ├── services/              detection, video, inspection, qa, safety, event
│   ├── schemas/
│   ├── models/
│   │   └── best.pt            YOLO weights (not committed)
│   ├── storage/
│   │   ├── uploads/           uploaded videos
│   │   └── inspections/       per-video JSON + frames
│   ├── requirements.txt
│   ├── Dockerfile
│   └── .env.example
├── SafeSight_client/          Next.js 15 frontend
│   ├── src/
│   │   ├── app/               page.tsx — dashboard orchestrator
│   │   ├── components/        InspectionView, Sidebar, UploadModal, AskTab…
│   │   ├── lib/               api.ts, storage.ts (localStorage helpers)
│   │   └── types/             shared TypeScript interfaces
│   ├── Dockerfile
│   └── .env.example
├── scripts/
│   ├── install.sh             dependency setup
│   └── start.sh               start backend + frontend with health-check
├── docker-compose.yml
└── Makefile
```

---

## API Reference

```
GET    /health
POST   /upload                          body: multipart/form-data  file=<mp4>
POST   /inspect/{video_id}
GET    /events/{video_id}
GET    /inspections
GET    /inspections/{video_id}
DELETE /inspections/{video_id}
POST   /ask/{video_id}                  body: {"question": "..."}
GET    /frames/{video_id}/{frame}.jpg
```

Full interactive docs (request schemas, response examples, try-it-out):
**http://127.0.0.1:8000/docs**

---

## How It Works

1. **Upload** — POST an `.mp4`; the server saves it and returns a `video_id`.
2. **Inspect** — POST to `/inspect/{video_id}`; frames are extracted proportional to video length, YOLO runs on each frame, and structured safety events are written to disk.
3. **Browse** — The frontend dashboard shows per-event cards with risk levels, evidence frames, and AI-generated explanations and recommendations.
4. **Ask** — POST a natural-language question to `/ask/{video_id}`; the backend builds a context from the stored events and calls the HuggingFace LLM.
5. **Persist** — All inspection data is stored as JSON under `storage/inspections/{video_id}/`; the frontend tracks uploaded IDs in `localStorage`.

---

## Detected Classes

The YOLO model is trained on PPE labels. Violations map as follows:

| YOLO class | Event type |
|---|---|
| `NO-Hardhat` | `no_helmet` |
| `NO-Safety Vest` | `no_vest` |
| `Person` | `person_detected` |
