'use client';

import { useState } from 'react';
import { framePathToUrl } from '@/lib/api';
import { RiskBadge } from '@/components/InspectionView';
import FrameModal from '@/components/FrameModal';
import type { SafetyEvent } from '@/types';

interface FrameTarget {
  url: string;
  timestamp: string;
  eventName: string;
  risk?: string;
}

interface EventsTabProps {
  events: SafetyEvent[];
  videoId: string;
  needsInspection: boolean;
}

export default function EventsTab({ events, videoId, needsInspection }: EventsTabProps) {
  const [activeFrame, setActiveFrame] = useState<FrameTarget | null>(null);
  const violations = events.filter((e) => e.event_type !== 'person_detected');

  if (needsInspection) {
    return <EmptyPane text="Run the inspection to detect safety violations in this video." icon="scan" />;
  }

  if (violations.length === 0) {
    return <EmptyPane text="No PPE violations detected. The site appears safe." icon="safe" />;
  }

  return (
    <>
      <div className="space-y-3">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-black/35">
          {violations.length} violation{violations.length !== 1 ? 's' : ''} detected
        </p>
        {violations.map((event, i) => (
          <EventCard
            key={i}
            event={event}
            videoId={videoId}
            onViewFrame={(target) => setActiveFrame(target)}
          />
        ))}
      </div>

      {activeFrame && (
        <FrameModal
          frameUrl={activeFrame.url}
          timestamp={activeFrame.timestamp}
          eventName={activeFrame.eventName}
          risk={activeFrame.risk}
          onClose={() => setActiveFrame(null)}
        />
      )}
    </>
  );
}

function EventCard({
  event,
  videoId,
  onViewFrame,
}: {
  event: SafetyEvent;
  videoId: string;
  onViewFrame: (target: FrameTarget) => void;
}) {
  const frameUrl = framePathToUrl(event.frame_path);
  const confidencePct = Math.round(event.confidence * 100);
  const eventName = event.event ?? formatEventType(event.event_type);

  return (
    <div className="overflow-hidden rounded-2xl border border-black/8 bg-white">
      {/* Card header */}
      <div className="flex flex-wrap items-start gap-3 p-4">
        <RiskBadge risk={event.risk} />

        <div className="min-w-0 flex-1">
          <p className="font-bold text-[var(--ink)]">{eventName}</p>
          {event.what_happened && (
            <p className="mt-0.5 text-sm leading-relaxed text-black/55">{event.what_happened}</p>
          )}
        </div>

        <div className="flex flex-shrink-0 flex-col items-end gap-1 text-right">
          <span className="rounded-lg bg-[var(--background)] px-2.5 py-1 font-mono text-xs font-bold text-black/50">
            {event.timestamp}
          </span>
          <span className="text-[11px] text-black/35">{confidencePct}% confidence</span>
        </div>
      </div>

      {/* Recommendation */}
      {event.recommendation && (
        <div className="border-t border-black/6 bg-[var(--background)] px-4 py-2.5">
          <p className="text-xs leading-relaxed text-black/55">
            <span className="font-bold text-black/70">Recommendation: </span>
            {event.recommendation}
          </p>
        </div>
      )}

      {/* Evidence button */}
      <div className="border-t border-black/6 px-4 py-2.5">
        <button
          onClick={() =>
            onViewFrame({ url: frameUrl, timestamp: event.timestamp, eventName, risk: event.risk })
          }
          className="flex min-h-[44px] items-center gap-1.5 text-xs font-bold text-[var(--teal)] transition hover:text-[var(--teal)]/75"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <polyline points="21 15 16 10 5 21" />
          </svg>
          View evidence frame
        </button>
      </div>
    </div>
  );
}

function EmptyPane({ text, icon }: { text: string; icon: 'scan' | 'safe' }) {
  return (
    <div className="flex h-full min-h-40 flex-col items-center justify-center rounded-3xl border-2 border-dashed border-black/10 py-16 text-center">
      <div className="mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-black/5">
        {icon === 'scan' ? (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-black/30">
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
          </svg>
        ) : (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-emerald-400">
            <path d="M9 12l2 2 4-4" /><circle cx="12" cy="12" r="9" />
          </svg>
        )}
      </div>
      <p className="max-w-xs text-sm leading-relaxed text-black/35">{text}</p>
    </div>
  );
}

function formatEventType(type: string): string {
  return type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}
