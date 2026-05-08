# SafeSight AI

SafeSight AI is an MVP video safety inspection backend for construction, warehouse, and industrial footage.

The backend accepts `.mp4` uploads, extracts frames automatically, runs a YOLO safety model, stores structured safety events as JSON, and answers questions about detected concerns using a Hugging Face-hosted LLM.

## Features

- Upload `.mp4` videos.
- Store uploaded videos locally.
- Automatically extract frames based on video duration.
- Detect safety-related objects and violations using `best.pt`.
- Generate structured events for:
  - `person_detected`
  - `no_helmet`
  - `no_vest`
- Add risk, explanation, and recommendation for safety violations.
- Serve evidence frames through HTTP.
- Ask natural-language questions about safety concerns.
- Persist inspection history as JSON so old inspections can be loaded later.

## Project Structure

```text
SafeSight/
  SafeSight_server/
    main.py
    routes/
    services/
    schemas/
    models/
      best.pt
    storage/
      uploads/
      inspections/
        index.json
        {video_id}/
          metadata.json
          events.json
          report.json
          qa_history.json
          frames/
    .env
    requirements.txt
  SafeSight_client/
    src/
    package.json
    .env.example
  download_dataset/
  PROJECT_OVERVIEW.md
```

## Backend Setup

From PowerShell:

```powershell
cd C:\Users\Elitebook\Documents\github\hackathon\SafeSight\SafeSight_server
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

If PowerShell blocks activation, use the venv Python directly:

```powershell
.\venv\Scripts\python.exe -m pip install -r requirements.txt
```

## Environment Variables

Create or edit:

```text
SafeSight_server/.env
```

Example:

```env
HF_TOKEN=your_huggingface_token_here
HF_MODEL=Qwen/Qwen3-Coder-480B-A35B-Instruct
```

`HF_TOKEN` is required for `POST /ask/{video_id}`.

## Run Server

From `SafeSight_server`:

```powershell
.\venv\Scripts\python.exe -m uvicorn main:app --reload
```

The server runs at:

```text
http://127.0.0.1:8000
```

Interactive API docs:

```text
http://127.0.0.1:8000/docs
```

OpenAPI JSON:

```text
http://127.0.0.1:8000/openapi.json
```

Use `/docs` as the Swagger documentation for the frontend developer. It includes request bodies, response schemas, endpoint descriptions, and evidence-frame image URLs.

## Run Backend With Docker

From the project root:

```powershell
docker compose up --build
```

The containerized backend runs at:

```text
http://127.0.0.1:7860
```

Health check:

```powershell
curl.exe http://127.0.0.1:7860/health
```

The compose setup mounts these local folders into the container so test data can survive container restarts:

```text
SafeSight_server/storage/
SafeSight_server/frames/
SafeSight_server/events/
SafeSight_server/models/
```

For Hugging Face Spaces Docker deployment, the backend image listens on port `7860`.
Make sure the custom YOLO model is available at:

```text
SafeSight_server/models/best.pt
```

## Frontend Setup

From PowerShell:

```powershell
cd C:\Users\Elitebook\Documents\github\hackathon\SafeSight\SafeSight_client
npm install
```

Optional frontend environment override:

```env
NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8000
```

Run the Next.js app:

```powershell
npm run dev
```

The frontend runs at:

```text
http://localhost:3000
```

## API Endpoints

```text
GET  /health
POST /upload
POST /inspect/{video_id}
GET  /events/{video_id}
POST /ask/{video_id}
GET  /inspections
GET  /inspections/{video_id}
DELETE /inspections/{video_id}
GET  /frames/{video_id}/{frame_name}.jpg
```

FastAPI also exposes:

```text
GET /docs
GET /redoc
GET /openapi.json
```

## Test Flow

### 1. Health Check

```powershell
curl.exe http://127.0.0.1:8000/health
```

Expected:

```json
{"status":"ok"}
```

### 2. Upload Video

```powershell
curl.exe -F "file=@C:\path\to\video.mp4;type=video/mp4" http://127.0.0.1:8000/upload
```

Response:

```json
{
  "video_id": "abc123",
  "filename": "abc123_video.mp4"
}
```

### 3. Inspect Video

```powershell
curl.exe -X POST http://127.0.0.1:8000/inspect/abc123
```

This extracts frames, runs YOLO, and writes:

```text
SafeSight_server/storage/inspections/abc123/events.json
SafeSight_server/storage/inspections/abc123/report.json
SafeSight_server/storage/inspections/abc123/frames/
```

### 4. Get Events

```powershell
curl.exe http://127.0.0.1:8000/events/abc123
```

Example event:

```json
{
  "event_type": "no_helmet",
  "event": "NO-Hardhat",
  "timestamp": "00:18",
  "confidence": 0.89,
  "risk": "High",
  "what_happened": "A worker was detected without a hardhat.",
  "explanation": "A worker was detected without a hardhat. This increases the risk of head injury from falling objects, overhead equipment, or accidental impact.",
  "recommendation": "Flag this moment for supervisor review and require the worker to wear an approved hardhat before continuing work.",
  "frame_path": "frames/abc123/frame_0001_18s.jpg"
}
```

### 5. Ask About Safety Concerns

```powershell
curl.exe -X POST http://127.0.0.1:8000/ask/abc123 `
  -H "Content-Type: application/json" `
  -d "{\"question\":\"What safety concerns happened in this video?\"}"
```

The response includes:

- a natural-language answer
- concern count
- evidence frame URLs

Evidence frame URLs can be opened directly in a browser:

```text
http://127.0.0.1:8000/frames/abc123/frame_0001_18s.jpg
```

### 6. List Inspection History

```powershell
curl.exe http://127.0.0.1:8000/inspections
```

### 7. Load One Previous Inspection

```powershell
curl.exe http://127.0.0.1:8000/inspections/abc123
```

This returns:

- `metadata`
- `events`
- `report`
- `qa_history`

## Local Storage

The MVP uses local disk storage, not a database.

```text
SafeSight_server/storage/uploads/  uploaded videos
SafeSight_server/storage/inspections/index.json
SafeSight_server/storage/inspections/{video_id}/metadata.json
SafeSight_server/storage/inspections/{video_id}/events.json
SafeSight_server/storage/inspections/{video_id}/report.json
SafeSight_server/storage/inspections/{video_id}/qa_history.json
SafeSight_server/storage/inspections/{video_id}/frames/
```

## Model

The backend uses:

```text
SafeSight_server/models/best.pt
```

Detected classes include PPE-related labels such as:

```text
Person
NO-Hardhat
NO-Safety Vest
Safety Vest
Hardhat
```

`NO-Hardhat` maps to `no_helmet`.

`NO-Safety Vest` maps to `no_vest`.

## Dataset Note

The `download_dataset` folder includes a KaggleHub downloader script. The tested Kaggle dataset currently downloads a webpage artifact rather than actual `.mp4` files, so use a real local `.mp4` video for backend testing.
