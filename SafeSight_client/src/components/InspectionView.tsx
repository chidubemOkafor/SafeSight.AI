'use client';

import EventsTab from '@/components/EventsTab';
import AskTab from '@/components/AskTab';
import type { InspectionDetail, TabId } from '@/types';

const TABS: { id: TabId; label: string }[] = [
  { id: 'events', label: 'Events' },
  { id: 'report', label: 'AI Report' },
  { id: 'ask', label: 'Ask AI' },
];

interface InspectionViewProps {
  detail: InspectionDetail | null;
  loading: boolean;
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
  onInspect: () => void;
  inspecting: boolean;
  inspectError: string | null;
}

export default function InspectionView({
  detail,
  loading,
  activeTab,
  onTabChange,
  onInspect,
  inspecting,
  inspectError,
}: InspectionViewProps) {
  if (loading) return <LoadingState />;
  if (!detail) return <EmptyState />;

  const status = metaStr(detail.metadata, 'status', 'uploaded');
  const needsInspection = status === 'uploaded';

  return (
    <main className="flex flex-1 min-w-0 flex-col overflow-hidden">
      <InspectionOverview detail={detail} status={status} />

      {needsInspection && (
        <InspectBanner
          onInspect={onInspect}
          inspecting={inspecting}
          error={inspectError}
        />
      )}

      <TabBar activeTab={activeTab} onTabChange={onTabChange} />

      <div className="flex-1 overflow-y-auto bg-[var(--background)] p-5">
        {activeTab === 'events' && (
          <EventsTab
            events={detail.events}
            videoId={detail.video_id}
            needsInspection={needsInspection}
          />
        )}
        {activeTab === 'report' && <ReportPane report={detail.report} />}
        {activeTab === 'ask' && (
          <AskTab videoId={detail.video_id} initialHistory={detail.qa_history} />
        )}
      </div>
    </main>
  );
}

// ── Overview ─────────────────────────────────────────────────────────────────

function InspectionOverview({
  detail,
  status,
}: {
  detail: InspectionDetail;
  status: string;
}) {
  const name =
    metaStr(detail.metadata, 'original_filename') ||
    metaStr(detail.metadata, 'filename') ||
    'Untitled';
  const concernCount = metaNum(detail.metadata, 'concern_count');
  const eventCount = metaNum(detail.metadata, 'event_count');
  const qaCount = metaNum(detail.metadata, 'qa_count');
  const updatedAt = metaStr(detail.metadata, 'updated_at');

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
          <p className="mt-0.5 font-mono text-[11px] text-black/30">{detail.video_id}</p>
        </div>

        <span
          className={[
            'flex-shrink-0 rounded-full px-3 py-1 text-xs font-black uppercase tracking-wide',
            status === 'inspected' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700',
          ].join(' ')}
        >
          {status}
        </span>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <Stat
          label="Safety Concerns"
          value={String(concernCount)}
          highlight={concernCount > 0}
        />
        <Stat label="Total Events" value={String(eventCount)} />
        <Stat label="Q&A Sessions" value={String(qaCount)} />
        {updatedAt && <Stat label="Last Updated" value={formatDate(updatedAt)} />}
      </div>
    </div>
  );
}

// ── Inspect banner (Tasks 5 & 6) ─────────────────────────────────────────────

function InspectBanner({
  onInspect,
  inspecting,
  error,
}: {
  onInspect: () => void;
  inspecting: boolean;
  error: string | null;
}) {
  return (
    <div className="flex-shrink-0 border-b border-amber-200 bg-amber-50 px-5 py-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-bold text-amber-800">Video uploaded — ready to inspect</p>
          <p className="text-xs text-amber-700/70">Run the AI safety analysis to detect PPE violations.</p>
        </div>
        <button
          onClick={onInspect}
          disabled={inspecting}
          className="flex items-center gap-2 rounded-xl bg-[var(--ink)] px-4 py-2 text-sm font-bold text-white shadow-[0_3px_0_rgba(0,0,0,0.2)] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50 active:translate-y-0 active:shadow-none"
        >
          {inspecting ? (
            <>
              <Spinner />
              Inspecting…
            </>
          ) : (
            <>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
              </svg>
              Run Inspection
            </>
          )}
        </button>
      </div>
      {error && (
        <p className="mt-2 rounded-xl bg-red-100 px-3 py-2 text-xs font-medium text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}

// ── Tabs ─────────────────────────────────────────────────────────────────────

function TabBar({ activeTab, onTabChange }: { activeTab: TabId; onTabChange: (t: TabId) => void }) {
  return (
    <div className="flex flex-shrink-0 gap-1 border-b border-black/8 bg-white px-4">
      {TABS.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={[
            'relative px-3 py-3 text-sm font-bold transition',
            activeTab === tab.id ? 'text-[var(--teal)]' : 'text-black/40 hover:text-black/65',
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

// ── Tab panes ─────────────────────────────────────────────────────────────────

function ReportPane({ report }: { report: InspectionDetail['report'] }) {
  if (!report) {
    return (
      <EmptyPane text="Run an inspection to generate the AI safety report." />
    );
  }
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <ReportStat label="Total Events" value={String(report.summary.total_events)} />
        <ReportStat
          label="Concerns"
          value={String(report.summary.total_safety_concerns)}
          alert={report.summary.total_safety_concerns > 0}
        />
        {Object.entries(report.summary.risk_counts).map(([risk, count]) => (
          <ReportStat key={risk} label={`${risk} Risk`} value={String(count)} alert={risk === 'High'} />
        ))}
      </div>

      {report.findings.map((finding, i) => (
        <div key={i} className="rounded-2xl border border-black/8 bg-white p-4">
          <div className="flex items-center gap-2">
            <RiskBadge risk={finding.risk} />
            <p className="font-bold text-[var(--ink)]">{finding.event}</p>
            <p className="ml-auto text-xs text-black/40">{finding.count}× detected</p>
          </div>
          <p className="mt-2 text-sm text-black/65 leading-relaxed">{finding.explanation}</p>
          <p className="mt-2 rounded-xl bg-[var(--background)] px-3 py-2 text-xs font-medium text-black/60">
            {finding.recommendation}
          </p>
          <p className="mt-2 text-xs text-black/35">
            {finding.first_seen} – {finding.last_seen}
          </p>
        </div>
      ))}
    </div>
  );
}

function ReportStat({ label, value, alert }: { label: string; value: string; alert?: boolean }) {
  return (
    <div className="rounded-2xl border border-black/8 bg-[var(--background)] px-3 py-2.5">
      <p className="text-[9px] font-black uppercase tracking-[0.18em] text-black/35">{label}</p>
      <p className={['mt-0.5 text-xl font-black', alert ? 'text-red-500' : 'text-[var(--ink)]'].join(' ')}>
        {value}
      </p>
    </div>
  );
}

// ── Shared helpers ─────────────────────────────────────────────────────────────

export function RiskBadge({ risk }: { risk: string | undefined }) {
  const styles: Record<string, string> = {
    High: 'bg-red-100 text-red-700',
    Medium: 'bg-amber-100 text-amber-700',
    Low: 'bg-yellow-100 text-yellow-700',
  };
  const cls = styles[risk ?? ''] ?? 'bg-gray-100 text-gray-600';
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wide ${cls}`}>
      {risk ?? 'Unknown'}
    </span>
  );
}

function EmptyPane({ text }: { text: string }) {
  return (
    <div className="flex h-full min-h-40 flex-col items-center justify-center rounded-3xl border-2 border-dashed border-black/10 py-16 text-center">
      <div className="mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-black/5">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-black/30">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="8" y1="13" x2="16" y2="13" />
          <line x1="8" y1="17" x2="16" y2="17" />
        </svg>
      </div>
      <p className="max-w-xs text-sm text-black/35 leading-relaxed">{text}</p>
    </div>
  );
}

function LoadingState() {
  return (
    <main className="flex flex-1 min-w-0 flex-col items-center justify-center gap-3 p-8">
      <Spinner size={32} />
      <p className="text-sm text-black/40">Loading inspection…</p>
    </main>
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
      <h2 className="text-xl font-black tracking-tight text-[var(--ink)]">No inspection selected</h2>
      <p className="mt-2 max-w-xs text-sm leading-relaxed text-black/40">
        Select an inspection from the sidebar, or click{' '}
        <span className="font-bold text-[var(--ink)]">New Scan</span> to upload a video.
      </p>
    </main>
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

export function Spinner({ size = 16 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      className="animate-spin"
    >
      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
    </svg>
  );
}

function metaNum(metadata: Record<string, unknown>, key: string): number {
  const v = metadata[key];
  return typeof v === 'number' ? v : 0;
}

function metaStr(metadata: Record<string, unknown>, key: string, fallback = ''): string {
  const v = metadata[key];
  return typeof v === 'string' ? v : fallback;
}

function formatDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(iso));
  } catch {
    return iso;
  }
}
