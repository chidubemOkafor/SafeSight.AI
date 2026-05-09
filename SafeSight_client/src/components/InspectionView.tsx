'use client';

import type { InspectionSummary, TabId } from '@/types';

const TABS: { id: TabId; label: string }[] = [
  { id: 'events', label: 'Events' },
  { id: 'report', label: 'AI Report' },
  { id: 'ask', label: 'Ask AI' },
];

interface InspectionViewProps {
  inspection: InspectionSummary | null;
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
}

export default function InspectionView({ inspection, activeTab, onTabChange }: InspectionViewProps) {
  if (!inspection) {
    return <EmptyState />;
  }

  return (
    <main className="flex flex-1 min-w-0 flex-col overflow-hidden">
      <InspectionOverview inspection={inspection} />
      <TabBar activeTab={activeTab} onTabChange={onTabChange} />
      <TabContent activeTab={activeTab} />
    </main>
  );
}

function InspectionOverview({ inspection }: { inspection: InspectionSummary }) {
  const name = inspection.original_filename ?? inspection.filename ?? 'Untitled';

  return (
    <div className="flex-shrink-0 border-b border-black/8 bg-white px-5 py-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[var(--teal)]">
            Inspection
          </p>
          <h1 className="mt-0.5 truncate text-lg font-black tracking-tight text-[var(--ink)] sm:text-xl">
            {name}
          </h1>
          <p className="mt-0.5 font-mono text-[11px] text-black/30">{inspection.video_id}</p>
        </div>

        <span
          className={[
            'flex-shrink-0 rounded-full px-3 py-1 text-xs font-black uppercase tracking-wide',
            inspection.status === 'inspected'
              ? 'bg-emerald-100 text-emerald-700'
              : 'bg-amber-100 text-amber-700',
          ].join(' ')}
        >
          {inspection.status}
        </span>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <Stat
          label="Safety Concerns"
          value={String(inspection.concern_count)}
          highlight={inspection.concern_count > 0}
        />
        <Stat label="Total Events" value={String(inspection.event_count)} />
        <Stat label="Q&A Sessions" value={String(inspection.qa_count)} />
        {inspection.updated_at && (
          <Stat label="Last Updated" value={formatDate(inspection.updated_at)} />
        )}
      </div>
    </div>
  );
}

function Stat({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="rounded-2xl border border-black/8 bg-[var(--background)] px-3 py-2">
      <p className="text-[9px] font-black uppercase tracking-[0.18em] text-black/35">{label}</p>
      <p className={['text-base font-black leading-tight mt-0.5', highlight ? 'text-red-500' : 'text-[var(--ink)]'].join(' ')}>
        {value}
      </p>
    </div>
  );
}

function TabBar({ activeTab, onTabChange }: { activeTab: TabId; onTabChange: (t: TabId) => void }) {
  return (
    <div className="flex flex-shrink-0 gap-1 border-b border-black/8 bg-white px-4">
      {TABS.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={[
            'relative px-3 py-3 text-sm font-bold transition',
            activeTab === tab.id
              ? 'text-[var(--teal)]'
              : 'text-black/40 hover:text-black/65',
          ].join(' ')}
        >
          {tab.label}
          {activeTab === tab.id && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 rounded-t-full bg-[var(--teal)]" />
          )}
        </button>
      ))}
    </div>
  );
}

function TabContent({ activeTab }: { activeTab: TabId }) {
  return (
    <div className="flex-1 overflow-y-auto bg-[var(--background)] p-5">
      {activeTab === 'events' && <PlaceholderPane icon="events" text="Safety events will appear here after the video is inspected." />}
      {activeTab === 'report' && <PlaceholderPane icon="report" text="The AI-generated safety report will appear here." />}
      {activeTab === 'ask' && <PlaceholderPane icon="ask" text="Ask questions about this inspection in natural language." />}
    </div>
  );
}

function PlaceholderPane({ icon, text }: { icon: 'events' | 'report' | 'ask'; text: string }) {
  return (
    <div className="flex h-full min-h-40 flex-col items-center justify-center rounded-3xl border-2 border-dashed border-black/10 py-16 text-center">
      <div className="mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-black/5">
        {icon === 'events' && (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-black/30">
            <path d="M9 12l2 2 4-4" />
            <path d="M21 12c0 4.97-4.03 9-9 9S3 16.97 3 12 7.03 3 12 3s9 4.03 9 9z" />
          </svg>
        )}
        {icon === 'report' && (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-black/30">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="8" y1="13" x2="16" y2="13" />
            <line x1="8" y1="17" x2="16" y2="17" />
          </svg>
        )}
        {icon === 'ask' && (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-black/30">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        )}
      </div>
      <p className="max-w-xs text-sm text-black/35 leading-relaxed">{text}</p>
    </div>
  );
}

function EmptyState() {
  return (
    <main className="flex flex-1 min-w-0 flex-col items-center justify-center p-8 text-center">
      <div className="mb-5 grid h-20 w-20 place-items-center rounded-3xl bg-black/5">
        <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.25" className="text-black/20">
          <path d="M15.5 15.5L19 19" strokeLinecap="round" />
          <circle cx="11" cy="11" r="7" />
          <path d="M11 8v3M11 14h.01" strokeLinecap="round" />
        </svg>
      </div>
      <h2 className="text-xl font-black tracking-tight text-[var(--ink)]">
        No inspection selected
      </h2>
      <p className="mt-2 max-w-xs text-sm leading-relaxed text-black/40">
        Select an inspection from the history sidebar, or click{' '}
        <span className="font-bold text-[var(--ink)]">New Scan</span> to upload a video.
      </p>
    </main>
  );
}

function formatDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat('en', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}
