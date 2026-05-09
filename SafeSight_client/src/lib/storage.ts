const KEY = 'safesight_video_ids';

export function getStoredVideoIds(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

export function addVideoId(videoId: string): void {
  const ids = getStoredVideoIds();
  if (!ids.includes(videoId)) {
    localStorage.setItem(KEY, JSON.stringify([videoId, ...ids]));
  }
}

export function removeVideoId(videoId: string): void {
  const ids = getStoredVideoIds().filter((id) => id !== videoId);
  localStorage.setItem(KEY, JSON.stringify(ids));
}
