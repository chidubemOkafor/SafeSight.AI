'use client';

import { useEffect, useState } from 'react';
import { RiskBadge } from '@/components/InspectionView';

interface FrameModalProps {
  frameUrl: string;
  timestamp: string;
  eventName: string;
  risk?: string;
  onClose: () => void;
}

export default function FrameModal({ frameUrl, timestamp, eventName, risk, onClose }: FrameModalProps) {
  const [imgError, setImgError] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative flex w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-[var(--ink)] shadow-2xl">
        {/* Header */}
        <div className="flex flex-shrink-0 items-center justify-between gap-3 px-4 py-3">
          <div className="flex min-w-0 items-center gap-3">
            <RiskBadge risk={risk} />
            <p className="truncate text-sm font-bold text-white">{eventName}</p>
          </div>
          <div className="flex flex-shrink-0 items-center gap-2">
            <span className="rounded-lg bg-white/10 px-2.5 py-1 font-mono text-xs text-white/60">
              {timestamp}
            </span>
            <button
              onClick={onClose}
              className="grid h-8 w-8 place-items-center rounded-xl text-white/50 transition hover:bg-white/10 active:bg-white/20"
              aria-label="Close frame"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </div>

        {/* Image area */}
        <div className="relative flex min-h-48 items-center justify-center bg-black">
          {!imgError ? (
            <>
              {!loaded && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-white/20 border-t-white/70" />
                </div>
              )}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={frameUrl}
                alt={`${eventName} at ${timestamp}`}
                className="max-h-[70vh] w-full object-contain"
                style={{ display: loaded ? 'block' : 'none' }}
                onLoad={() => setLoaded(true)}
                onError={() => { setImgError(true); setLoaded(true); }}
              />
            </>
          ) : (
            <div className="flex flex-col items-center gap-3 py-16 text-center">
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-white/8">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-white/30">
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <line x1="3" y1="3" x2="21" y2="21" />
                </svg>
              </div>
              <p className="text-sm text-white/40">Frame not available</p>
              <p className="text-xs text-white/25">The image may have been deleted or the server is offline.</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex flex-shrink-0 items-center justify-between px-4 py-2.5">
          <p className="text-xs text-white/30">Press Esc to close</p>
          <a
            href={frameUrl}
            target="_blank"
            rel="noreferrer"
            className="text-xs font-bold text-white/40 transition hover:text-white/70"
          >
            Open in new tab ↗
          </a>
        </div>
      </div>
    </div>
  );
}
