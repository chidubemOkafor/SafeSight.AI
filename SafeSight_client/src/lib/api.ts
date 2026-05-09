import type { InspectionSummary, InspectionDetail, SafetyEvent, AskResponse } from '@/types';

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://127.0.0.1:8000';

export function frameUrl(videoId: string, frameName: string): string {
  return `${API_BASE_URL}/frames/${videoId}/${frameName}`;
}

/** Converts a raw frame_path like "frames/{id}/{name}.jpg" to a full URL. */
export function framePathToUrl(framePath: string): string {
  const parts = framePath.replace(/\\/g, '/').split('/');
  if (parts.length >= 3 && parts[0] === 'frames') {
    return `${API_BASE_URL}/frames/${parts[1]}/${parts[2]}`;
  }
  return `${API_BASE_URL}/${framePath}`;
}

export async function checkHealth(): Promise<{ status: string }> {
  const res = await fetch(`${API_BASE_URL}/health`);
  if (!res.ok) throw new Error(`Health check failed: ${res.status}`);
  return res.json() as Promise<{ status: string }>;
}

export async function getEvents(videoId: string): Promise<SafetyEvent[]> {
  const res = await fetch(`${API_BASE_URL}/events/${videoId}`);
  if (!res.ok) throw new Error(`Failed to fetch events: ${res.status}`);
  const data = await res.json() as { events: SafetyEvent[] };
  return data.events;
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

export async function askQuestion(videoId: string, question: string): Promise<AskResponse> {
  const res = await fetch(`${API_BASE_URL}/ask/${videoId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question }),
  });
  if (!res.ok) throw new Error(`Ask failed: ${res.status}`);
  return res.json() as Promise<AskResponse>;
}

export function uploadVideoWithProgress(
  file: File,
  onProgress: (percent: number) => void,
): Promise<{ video_id: string; filename: string }> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const form = new FormData();
    form.append('file', file);
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          resolve(JSON.parse(xhr.responseText) as { video_id: string; filename: string });
        } catch {
          reject(new Error('Invalid response from server'));
        }
      } else {
        reject(new Error(`Upload failed: ${xhr.status}`));
      }
    };
    xhr.onerror = () => reject(new Error('Network error during upload'));
    xhr.open('POST', `${API_BASE_URL}/upload`);
    xhr.send(form);
  });
}
