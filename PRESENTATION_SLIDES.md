# SafeSight AI Presentation Slides

## Slide 1: Title

# SafeSight AI

AI-powered safety inspection for construction, warehouse, and industrial video footage.

Presented by: Your Name / Team Name

---

## Slide 2: Hackathon Context

SafeSight AI was built for the AMD Developer Hackathon by lablab.ai.

Hackathon theme:

- Build AI agents and high-performance AI applications on AMD GPUs in the cloud
- Use AMD Developer Cloud, ROCm, and model APIs
- Ship a real, working AI-native product

SafeSight fits the Vision & Multimodal AI track because it processes video footage, extracts visual evidence, detects safety risks, and uses Qwen to answer natural-language questions about inspection results.

---

## Slide 3: The Problem

Workplace safety violations are easy to miss in video footage.

Manual video review is:

- Slow
- Repetitive
- Error-prone
- Hard to summarize
- Difficult to search after inspection

Safety teams need a faster way to detect PPE violations and understand what happened.

---

## Slide 4: Our Solution

SafeSight AI automatically analyzes uploaded safety footage.

The system:

- Accepts `.mp4` video uploads
- Extracts frames from the video
- Detects people and PPE violations
- Flags missing helmets and safety vests
- Stores inspection events
- Lets users ask natural-language questions about the inspection

---

## Slide 5: How It Works

1. User uploads a video.
2. Backend extracts frames using OpenCV.
3. YOLO detects people and PPE violations.
4. Safety events are generated and saved.
5. The frontend displays violations and evidence frames.
6. Qwen answers questions using the inspection results.

---

## Slide 6: Key Features

- Video upload dashboard
- Automated frame extraction
- YOLO-powered PPE detection
- Event logging with timestamps
- Evidence frame preview
- AI-generated safety report
- Natural-language Q&A
- Frontend hosted on a live domain
- Backend deployed on an AMD GPU droplet

---

## Slide 7: AI Detection Pipeline

SafeSight uses computer vision to identify safety risks.

Detection targets:

- Person
- Hardhat / helmet
- Safety vest
- No hardhat
- No safety vest

Violation examples:

- Worker without helmet
- Worker without safety vest
- Repeated unsafe behavior across multiple timestamps

---

## Slide 8: Ask SafeSight AI

After inspection, users can ask questions like:

- What safety concerns were detected?
- Did anyone fail to wear a helmet?
- What are the highest-risk violations?
- When did the first safety issue happen?
- Should work be paused based on the detected issues?

The AI summarizes the event data in plain language for supervisors.

---

## Slide 9: System Architecture

Frontend:

- Next.js dashboard for upload, inspection history, reports, evidence frames, and Q&A

Backend:

- FastAPI API for uploads, inspections, event storage, frame serving, and AI Q&A

AI layer:

- YOLO handles visual detection
- Qwen handles natural-language answers

Storage:

- JSON files store inspection events, reports, metadata, and Q&A history

Deployment:

- Client and server are hosted on an AMD GPU droplet with Nginx reverse proxy

---

## Slide 10: AMD Developer Cloud Deployment

SafeSight is deployed using:

- AMD GPU droplet
- AMD Developer Cloud
- ROCm software stack
- AMD Instinct MI300X GPU access
- Nginx reverse proxy
- DuckDNS domain
- FastAPI backend under `/api`
- Next.js frontend on the main domain
- Qwen model hosted through an OpenAI-compatible endpoint
- YOLO model stored as `best.pt`

Example public structure:

```text
https://safesight-ai.duckdns.org        -> Frontend
https://safesight-ai.duckdns.org/api    -> Backend
```

---

## Slide 11: Why AMD Matters

SafeSight uses AMD cloud infrastructure to run the full AI workflow without local GPU hardware.

AMD value in the project:

- GPU-backed cloud environment for AI workloads
- ROCm software stack for accelerated model serving and compute
- AMD Instinct MI300X-class infrastructure for high-memory AI and vision workloads
- Single cloud deployment for the client, server, YOLO detection pipeline, and Qwen model endpoint

This aligns with the hackathon goal of building real AI systems on AMD infrastructure.

---

## Slide 12: Impact

SafeSight AI helps safety teams:

- Review footage faster
- Identify violations earlier
- Reduce missed safety issues
- Create evidence-backed reports
- Ask questions without manually searching logs
- Improve safety accountability on job sites

---

## Slide 13: Demo Flow

Demo steps:

1. Open SafeSight AI dashboard.
2. Upload a construction or warehouse video.
3. Run inspection.
4. View detected violations.
5. Open evidence frames.
6. Read the generated report.
7. Ask SafeSight AI a safety question.

---

## Slide 14: Judging Criteria Alignment

Application of Technology:

- Integrates YOLO, OpenCV, Qwen, FastAPI, and AMD GPU-hosted infrastructure into one working safety inspection system

Presentation:

- Demonstrates a clear upload-to-insight flow with visible evidence frames and AI-generated summaries

Business Value:

- Targets industrial safety teams, construction sites, warehouses, and compliance workflows

Originality:

- Combines video-based PPE detection with natural-language Q&A over inspection evidence

---

## Slide 15: Submission Checklist

For lablab.ai submission:

- Project title: SafeSight AI
- Short description: AI-powered video safety inspection for PPE violations
- Long description: End-to-end system for uploading worksite footage, detecting safety violations, reviewing evidence frames, and asking Qwen-powered questions about inspection results
- Technology tags: AMD Developer Cloud, AMD ROCm, AMD Instinct MI300X, Qwen, Hugging Face, YOLO, OpenCV, FastAPI, Next.js
- Cover image
- Video presentation
- Slide presentation
- Public GitHub repository
- Demo application URL

---

## Slide 16: Future Improvements

Potential next steps:

- Real-time camera stream monitoring
- User authentication
- PDF safety reports
- Cloud object storage for videos and frames
- Multi-site dashboards
- Email or Slack alerts
- More PPE classes
- Severity scoring over time

---

# Technology Stack Used

## Frontend

- Next.js
- React
- TypeScript
- Tailwind CSS
- Browser `fetch` / `XMLHttpRequest`
- Local storage for remembered inspection IDs

## Backend

- Python
- FastAPI
- Uvicorn
- OpenCV
- Ultralytics YOLO
- JSON file storage
- Pydantic schemas

## Computer Vision

- Ultralytics YOLO
- Custom YOLO weights: `best.pt`
- OpenCV frame extraction
- PPE detection classes:
- Person
- Helmet / hardhat
- Safety vest
- No helmet / no hardhat
- No safety vest

## AI / LLM

- Qwen model
- `Qwen/Qwen2.5-VL-7B-Instruct`
- OpenAI-compatible client
- Hugging Face Router support for local testing
- Self-hosted Qwen endpoint support on droplet

## Deployment / Infrastructure

- AMD GPU droplet
- `rocm-7-2-software-gpu-mi300x1-192gb-devcloud-atl1`
- AMD Developer Cloud
- AMD ROCm environment
- AMD MI300X GPU instance based on the droplet name
- Nginx reverse proxy
- DuckDNS domain: `safesight-ai.duckdns.org`
- Backend served under `/api`
- Client and server hosted on the same droplet
- Git/GitHub for source control

## Project Storage

- Uploaded videos
- Extracted frames
- Inspection metadata
- Event JSON
- AI report JSON
- Q&A history JSON

## Core Models

- YOLO for PPE/object detection
- Qwen for natural-language safety analysis and Q&A

---

# Hackathon Alignment

Event:

- AMD Developer Hackathon by lablab.ai
- Project track: Vision & Multimodal AI
- Relevant partner technology: Qwen
- Relevant infrastructure: AMD Developer Cloud, ROCm, AMD Instinct MI300X GPUs

Why SafeSight fits:

- It processes video, a multimodal input source
- It performs visual safety detection using YOLO
- It uses Qwen to turn event data into natural-language safety answers
- It is deployed as a working end-to-end application on AMD cloud infrastructure

Submission focus:

- Show the live app working from upload to inspection to Q&A
- Emphasize the AMD GPU droplet and ROCm-powered deployment
- Explain how Qwen contributes meaningful intelligence to the product
- Highlight business value for industrial safety, compliance, and supervisor workflows

Reference:

- https://lablab.ai/ai-hackathons/amd-developer
