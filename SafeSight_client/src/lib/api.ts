export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:8000";

export const apiEndpoints = [
  {
    method: "POST",
    path: "/upload",
    title: "Upload Video",
    description: "Send an MP4 file and receive a video_id for inspection.",
  },
  {
    method: "POST",
    path: "/inspect/{video_id}",
    title: "Inspect Video",
    description: "Extract frames, run YOLO detection, and persist events.",
  },
  {
    method: "GET",
    path: "/inspections",
    title: "Inspection History",
    description: "Load previous inspections for the dashboard history view.",
  },
  {
    method: "GET",
    path: "/inspections/{video_id}",
    title: "Inspection Detail",
    description: "Fetch metadata, events, report, and Q&A history.",
  },
  {
    method: "POST",
    path: "/ask/{video_id}",
    title: "Ask SafeSight AI",
    description: "Ask natural-language questions about safety concerns.",
  },
  {
    method: "GET",
    path: "/frames/{video_id}/{frame_name}",
    title: "Evidence Frame",
    description: "Display visual proof for a detected safety concern.",
  },
] as const;
