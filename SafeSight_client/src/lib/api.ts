import type { InspectionSummary, InspectionDetail } from '@/types';

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://127.0.0.1:8000';

export function frameUrl(videoId: string, frameName: string): string {
  return `${API_BASE_URL}/frames/${videoId}/${frameName}`;
}

export async function listInspections(): Promise<InspectionSummary[]> {
  const res = await fetch(`${API_BASE_URL}/inspections`);
  if (!res.ok) throw new Error(`Failed to fetch inspections: ${res.status}`);
  return res.json() as Promise<InspectionSummary[]>;
}

export async function getInspection(videoId: string): Promise<InspectionDetail> {
  const res = await fetch(`${API_BASE_URL}/inspections/${videoId}`);
  if (!res.ok) throw new Error(`Failed to fetch inspection: ${res.status}`);
  return res.json() as Promise<InspectionDetail>;
}

export async function deleteInspection(videoId: string): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/inspections/${videoId}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error(`Failed to delete inspection: ${res.status}`);
}

export async function uploadVideo(file: File): Promise<{ video_id: string; filename: string }> {
  const form = new FormData();
  form.append('file', file);
  const res = await fetch(`${API_BASE_URL}/upload`, { method: 'POST', body: form });
  if (!res.ok) throw new Error(`Upload failed: ${res.status}`);
  return res.json() as Promise<{ video_id: string; filename: string }>;
}

export async function inspectVideo(videoId: string): Promise<InspectionDetail['events']> {
  const res = await fetch(`${API_BASE_URL}/inspect/${videoId}`, { method: 'POST' });
  if (!res.ok) throw new Error(`Inspection failed: ${res.status}`);
  const data = await res.json() as { events: InspectionDetail['events'] };
  return data.events;
}

export async function askQuestion(
  videoId: string,
  question: string,
): Promise<{ answer: string; event_count: number; evidence: unknown[] }> {
  const res = await fetch(`${API_BASE_URL}/ask/${videoId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question }),
  });
  if (!res.ok) throw new Error(`Ask failed: ${res.status}`);
  return res.json() as Promise<{ answer: string; event_count: number; evidence: unknown[] }>;
}
