import type { InspectionSummary, InspectionDetail, SafetyEvent, AskResponse } from '@/types';

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://127.0.0.1:8000';

export function frameUrl(videoId: string, frameName: string): string {
  return `${API_BASE_URL}/frames/${videoId}/${frameName}`;
}

/** Converts a raw frame_path like "frames/{id}/{name}.jpg" to a full URL. */
export function framePathToUrl(framePath: string): string {
  const parts = framePath.replace(/\\/g, '/').split('/');
  const frameIndex = parts.indexOf('frames');
  if (frameIndex >= 0 && parts.length > frameIndex + 2) {
    return `${API_BASE_URL}/frames/${parts[frameIndex + 1]}/${parts[frameIndex + 2]}`;
  }
  return `${API_BASE_URL}/${framePath}`;
}

export async function checkHealth(): Promise<{ status: string }> {
  const res = await fetch(`${API_BASE_URL}/health`);
  await throwIfNotOk(res, 'Health check failed');
  return res.json() as Promise<{ status: string }>;
}

export async function getEvents(videoId: string): Promise<SafetyEvent[]> {
  const res = await fetch(`${API_BASE_URL}/events/${videoId}`);
  await throwIfNotOk(res, 'Failed to fetch events');
  const data = await res.json() as { events: SafetyEvent[] };
  return data.events;
}

export async function listInspections(): Promise<InspectionSummary[]> {
  const res = await fetch(`${API_BASE_URL}/inspections`);
  await throwIfNotOk(res, 'Failed to fetch inspections');
  return res.json() as Promise<InspectionSummary[]>;
}

export async function getInspection(videoId: string): Promise<InspectionDetail> {
  const res = await fetch(`${API_BASE_URL}/inspections/${videoId}`);
  await throwIfNotOk(res, 'Failed to fetch inspection');
  return res.json() as Promise<InspectionDetail>;
}

export async function deleteInspection(videoId: string): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/inspections/${videoId}`, {
    method: 'DELETE',
  });
  await throwIfNotOk(res, 'Failed to delete inspection');
}

export async function uploadVideo(file: File): Promise<{ video_id: string; filename: string }> {
  const form = new FormData();
  form.append('file', file);
  const res = await fetch(`${API_BASE_URL}/upload`, { method: 'POST', body: form });
  await throwIfNotOk(res, 'Upload failed');
  return res.json() as Promise<{ video_id: string; filename: string }>;
}

export async function inspectVideo(videoId: string): Promise<InspectionDetail['events']> {
  const res = await fetch(`${API_BASE_URL}/inspect/${videoId}`, { method: 'POST' });
  await throwIfNotOk(res, 'Inspection failed');
  const data = await res.json() as { events: InspectionDetail['events'] };
  return data.events;
}

export async function askQuestion(videoId: string, question: string): Promise<AskResponse> {
  const res = await fetch(`${API_BASE_URL}/ask/${videoId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question }),
  });
  await throwIfNotOk(res, 'Ask failed');
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
        reject(new Error(parseXhrError(xhr, 'Upload failed')));
      }
    };
    xhr.onerror = () => reject(new Error('Network error during upload'));
    xhr.open('POST', `${API_BASE_URL}/upload`);
    xhr.send(form);
  });
}

async function throwIfNotOk(res: Response, fallback: string): Promise<void> {
  if (res.ok) return;

  const detail = await readErrorDetail(res);
  const message = detail ? `${fallback}: ${detail}` : `${fallback}: ${res.status}`;
  throw new Error(message);
}

async function readErrorDetail(res: Response): Promise<string> {
  const contentType = res.headers.get('content-type') ?? '';
  try {
    if (contentType.includes('application/json')) {
      const payload = await res.json() as { detail?: unknown; message?: unknown };
      return formatErrorValue(payload.detail ?? payload.message);
    }
    return (await res.text()).trim();
  } catch {
    return '';
  }
}

function parseXhrError(xhr: XMLHttpRequest, fallback: string): string {
  try {
    const payload = JSON.parse(xhr.responseText) as { detail?: unknown; message?: unknown };
    const detail = formatErrorValue(payload.detail ?? payload.message);
    return detail ? `${fallback}: ${detail}` : `${fallback}: ${xhr.status}`;
  } catch {
    return `${fallback}: ${xhr.status}`;
  }
}

function formatErrorValue(value: unknown): string {
  if (typeof value === 'string') return value;
  if (Array.isArray(value)) return value.map(formatErrorValue).filter(Boolean).join(', ');
  if (value && typeof value === 'object') return JSON.stringify(value);
  return '';
}
