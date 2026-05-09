'use client';

import type { InspectionSummary } from '@/types';

interface SidebarProps {
  inspections: InspectionSummary[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  open: boolean;
  onClose: () => void;
}

export default function Sidebar({ inspections, selectedId, onSelect, open, onClose }: SidebarProps) {
  return (
    <aside
      className={[
        'fixed left-0 top-16 bottom-0 z-30 flex w-72 flex-col border-r border-black/10 bg-white',
        'transition-transform duration-200 ease-in-out',
        'lg:static lg:top-auto lg:bottom-auto lg:z-auto lg:translate-x-0',
        open ? 'translate-x-0' : '-translate-x-full',
      ].join(' ')}
    >
      <div className="flex h-12 flex-shrink-0 items-center justify-between border-b border-black/8 px-4">
        <p className="text-[10px] font-black uppercase tracking-[0.25em] text-black/35">
          Inspection History
        </p>
        <button
          onClick={onClose}
          className="grid h-7 w-7 place-items-center rounded-lg text-black/35 transition hover:bg-black/6 lg:hidden"
          aria-label="Close sidebar"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto py-1">
        {inspections.length === 0 ? (
          <EmptyHistory />
        ) : (
          <ul>
            {inspections.map((inspection) => (
              <InspectionItem
                key={inspection.video_id}
                inspection={inspection}
                selected={selectedId === inspection.video_id}
                onSelect={onSelect}
              />
            ))}
          </ul>
        )}
      </div>
    </aside>
  );
}

function InspectionItem({
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
        <p className="truncate text-sm font-semibold text-[var(--ink)] leading-snug">{name}</p>

        <div className="mt-1.5 flex flex-wrap items-center gap-2">
          <StatusBadge status={inspection.status} />
          {inspection.concern_count > 0 && (
            <span className="text-[11px] font-bold text-red-500">
              {inspection.concern_count} concern{inspection.concern_count !== 1 ? 's' : ''}
            </span>
          )}
        </div>

        {inspection.updated_at && (
          <p className="mt-1 text-[11px] text-black/30">{formatDate(inspection.updated_at)}</p>
        )}
      </button>
    </li>
  );
}

function StatusBadge({ status }: { status: string }) {
  const inspected = status === 'inspected';
  return (
    <span
      className={[
        'rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-wide',
        inspected ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700',
      ].join(' ')}
    >
      {status}
    </span>
  );
}

function EmptyHistory() {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
      <div className="mb-4 grid h-12 w-12 place-items-center rounded-2xl bg-black/5">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-black/30">
          <rect x="2" y="3" width="20" height="14" rx="2" />
          <path d="M8 21h8M12 17v4" />
        </svg>
      </div>
      <p className="text-sm font-bold text-black/35">No inspections yet</p>
      <p className="mt-1 text-xs text-black/25 leading-relaxed">Upload a video to start your first safety inspection.</p>
    </div>
  );
}

function formatDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat('en', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}
