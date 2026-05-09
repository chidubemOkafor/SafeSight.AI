'use client';

interface HeaderProps {
  onMenuClick: () => void;
  onNewScan: () => void;
}

export default function Header({ onMenuClick, onNewScan }: HeaderProps) {
  return (
    <header className="flex h-16 flex-shrink-0 items-center justify-between border-b border-white/10 bg-[var(--ink)] px-4 sm:px-6">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="grid h-9 w-9 place-items-center rounded-lg text-white/60 transition hover:bg-white/10 lg:hidden"
          aria-label="Open inspection history"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>

        <div className="flex items-center gap-2.5">
          <div className="grid h-9 w-9 flex-shrink-0 place-items-center rounded-full bg-[var(--signal)] text-xs font-black text-[var(--ink)]">
            SS
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-black uppercase tracking-[0.22em] text-white leading-none">SafeSight</p>
            <p className="text-[10px] text-white/45 mt-0.5">AI safety inspector</p>
          </div>
          <p className="text-sm font-black uppercase tracking-[0.22em] text-white sm:hidden">SafeSight</p>
        </div>
      </div>

      <button
        onClick={onNewScan}
        className="flex items-center gap-1.5 rounded-xl bg-[var(--signal)] px-4 py-2 text-sm font-bold text-[var(--ink)] shadow-[0_4px_0_rgba(0,0,0,0.2)] transition hover:-translate-y-0.5 active:translate-y-0 active:shadow-none"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
        New Scan
      </button>
    </header>
  );
}
