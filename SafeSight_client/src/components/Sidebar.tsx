'use client';

import type { InspectionSummary } from '@/types';

interface SidebarProps {
  inspections: InspectionSummary[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  loading: boolean;
}

export default function Sidebar(props: SidebarProps) {
  return (
    <>
      {/* Mobile: horizontal strip stacked above main content */}
      <div className="lg:hidden w-full flex-shrink-0 border-b border-black/10 bg-white">
        <MobileStrip {...props} />
      </div>

      {/* Desktop: vertical sidebar */}
      <aside className="hidden lg:flex lg:w-72 lg:flex-shrink-0 lg:flex-col border-r border-black/10 bg-white">
        <DesktopSidebar {...props} />
      </aside>
    </>
  );
}

// Sidebar sub-components receive the same props shape
type SidebarSubProps = SidebarProps;

// ── Desktop vertical sidebar ─────────────────────────────────────────────────

function DesktopSidebar({ inspections, selectedId, onSelect, loading }: SidebarSubProps) {
  return (
    <>
      <div className="flex h-12 flex-shrink-0 items-center border-b border-black/8 px-4">
        <p className="text-[10px] font-black uppercase tracking-[0.25em] text-black/35">
          Inspection History
        </p>
      </div>

      <div className="flex-1 overflow-y-auto py-1">
        {loading ? (
          <SkeletonList />
        ) : inspections.length === 0 ? (
          <EmptyHistory />
        ) : (
          <ul>
            {inspections.map((inspection) => (
              <DesktopItem
                key={inspection.video_id}
                inspection={inspection}
                selected={selectedId === inspection.video_id}
                onSelect={onSelect}
              />
            ))}
          </ul>
        )}
      </div>
    </>
  );
}

function DesktopItem({
  inspection,
  selected,
  onSelect,
}: {
  inspection: InspectionSummary;
  selected: boolean;
  onSelect: (id: string) => void;
}) {
  const name = inspection.original_filename ?? inspection.filename ?? 'Untitled';
  return (
    <li>
      <button
        onClick={() => onSelect(inspection.video_id)}
        className={[
          'w-full px-4 py-3 text-left transition hover:bg-black/4',
          selected ? 'border-r-[3px] border-[var(--teal)] bg-[var(--teal)]/6' : '',
        ].join(' ')}
      >
        <p className="truncate text-sm font-semibold leading-snug text-[var(--ink)]">{name}</p>
        <div className="mt-1.5 flex flex-wrap items-center gap-2">
          <StatusBadge status={inspection.status} />
          <SafetyStatus inspection={inspection} />
        </div>
        {inspection.updated_at && (
          <p className="mt-1 text-[11px] text-black/30">{formatDate(inspection.updated_at)}</p>
        )}
      </button>
    </li>
  );
}

// ── Mobile horizontal strip ──────────────────────────────────────────────────

function MobileStrip({ inspections, selectedId, onSelect, loading }: SidebarSubProps) {
  if (loading) {
    return (
      <div className="flex gap-2 overflow-x-auto px-4 py-3 scrollbar-none">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-14 w-32 flex-shrink-0 animate-pulse rounded-2xl bg-black/6" />
        ))}
      </div>
    );
  }

  if (inspections.length === 0) {
    return (
      <div className="flex items-center gap-2 px-4 py-3 text-xs text-black/35">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <rect x="2" y="3" width="20" height="14" rx="2" /><path d="M8 21h8M12 17v4" />
        </svg>
        No inspections yet — click <span className="font-bold text-[var(--ink)]">New Scan</span>
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="flex gap-2 overflow-x-auto px-4 py-3" style={{ scrollbarWidth: 'none' }}>
        {inspections.map((inspection) => (
          <MobileChip
            key={inspection.video_id}
            inspection={inspection}
            selected={selectedId === inspection.video_id}
            onSelect={onSelect}
          />
        ))}
      </div>
      <div className="pointer-events-none absolute inset-y-0 right-0 w-12 bg-gradient-to-l from-white" />
    </div>
  );
}

function MobileChip({
  inspection,
  selected,
  onSelect,
}: {
  inspection: InspectionSummary;
  selected: boolean;
  onSelect: (id: string) => void;
}) {
  const name = inspection.original_filename ?? inspection.filename ?? 'Untitled';
  return (
    <button
      onClick={() => onSelect(inspection.video_id)}
      className={[
        'flex min-h-[44px] w-36 flex-shrink-0 flex-col justify-center rounded-2xl border px-3 py-2 text-left transition',
        selected
          ? 'border-[var(--teal)] bg-[var(--teal)]/8'
          : 'border-black/10 bg-white hover:bg-black/4',
      ].join(' ')}
    >
      <p className="truncate text-xs font-bold text-[var(--ink)]">{name}</p>
      <div className="mt-1 flex items-center gap-1.5">
        <StatusDot status={inspection.status} />
        {inspection.concern_count > 0 ? (
          <span className="text-[10px] font-bold text-red-500">{inspection.concern_count} violation{inspection.concern_count !== 1 ? 's' : ''}</span>
        ) : inspection.status === 'inspected' ? (
          <span className="text-[10px] font-bold text-emerald-600">Safe</span>
        ) : (
          <span className="text-[10px] text-black/30">Uploaded</span>
        )}
      </div>
    </button>
  );
}

// ── Shared sub-components ────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={[
      'rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-wide',
      status === 'inspected' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700',
    ].join(' ')}>
      {status}
    </span>
  );
}

function StatusDot({ status }: { status: string }) {
  return (
    <span className={[
      'h-1.5 w-1.5 rounded-full flex-shrink-0',
      status === 'inspected' ? 'bg-emerald-500' : 'bg-amber-400',
    ].join(' ')} />
  );
}

function SafetyStatus({ inspection }: { inspection: InspectionSummary }) {
  if (inspection.status !== 'inspected') return null;
  if (inspection.concern_count === 0) {
    return (
      <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-600">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />Safe
      </span>
    );
  }
  return (
    <span className="flex items-center gap-1 text-[11px] font-bold text-red-500">
      <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
      {inspection.concern_count} violation{inspection.concern_count !== 1 ? 's' : ''}
    </span>
  );
}

function SkeletonList() {
  return (
    <div className="space-y-1 p-2">
      {[1, 2, 3].map((i) => (
        <div key={i} className="rounded-2xl p-3">
          <div className="h-3.5 w-3/4 animate-pulse rounded-full bg-black/6" />
          <div className="mt-2 h-2.5 w-1/2 animate-pulse rounded-full bg-black/4" />
          <div className="mt-1.5 h-2 w-1/3 animate-pulse rounded-full bg-black/4" />
        </div>
      ))}
    </div>
  );
}

function EmptyHistory() {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
      <div className="mb-4 grid h-12 w-12 place-items-center rounded-2xl bg-black/5">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-black/30">
          <rect x="2" y="3" width="20" height="14" rx="2" /><path d="M8 21h8M12 17v4" />
        </svg>
      </div>
      <p className="text-sm font-bold text-black/35">No inspections yet</p>
      <p className="mt-1 text-xs leading-relaxed text-black/25">Upload a video to start your first safety inspection.</p>
    </div>
  );
}

function formatDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(iso));
  } catch {
    return iso;
  }
}
