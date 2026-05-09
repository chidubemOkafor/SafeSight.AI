'use client';

import { useEffect } from 'react';

interface ToastProps {
  message: string;
  onDismiss: () => void;
  duration?: number;
}

export default function Toast({ message, onDismiss, duration = 3500 }: ToastProps) {
  useEffect(() => {
    const t = setTimeout(onDismiss, duration);
    return () => clearTimeout(t);
  }, [onDismiss, duration]);

  return (
    <div className="fixed bottom-5 left-1/2 z-50 -translate-x-1/2">
      <div className="flex items-center gap-3 rounded-2xl bg-[var(--ink)] px-5 py-3.5 shadow-2xl">
        <div className="grid h-6 w-6 flex-shrink-0 place-items-center rounded-full bg-emerald-400/20">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="text-emerald-400">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <p className="whitespace-nowrap text-sm font-bold text-white">{message}</p>
        <button
          onClick={onDismiss}
          className="ml-1 grid h-6 w-6 flex-shrink-0 place-items-center rounded-lg text-white/40 transition hover:text-white/70"
          aria-label="Dismiss"
        >
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>
    </div>
  );
}
