'use client';

import { useRef, useState } from 'react';
import { askQuestion } from '@/lib/api';
import { RiskBadge, Spinner } from '@/components/InspectionView';
import FrameModal from '@/components/FrameModal';
import type { AskEvidenceItem, QAEntry } from '@/types';

interface LocalQAEntry extends QAEntry {
  evidence?: AskEvidenceItem[];
}

interface AskTabProps {
  videoId: string;
  initialHistory: QAEntry[];
}

export default function AskTab({ videoId, initialHistory }: AskTabProps) {
  const [history, setHistory] = useState<LocalQAEntry[]>(() => initialHistory);
  const [question, setQuestion] = useState('');
  const [asking, setAsking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  async function handleAsk() {
    const q = question.trim();
    if (!q || asking) return;
    setQuestion('');
    setAsking(true);
    setError(null);
    try {
      const result = await askQuestion(videoId, q);
      const entry: LocalQAEntry = {
        asked_at: new Date().toISOString(),
        question: q,
        answer: result.answer,
        model: result.model,
        evidence: result.evidence,
      };
      setHistory((prev) => [...prev, entry]);
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get an answer. Please try again.');
    } finally {
      setAsking(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Q&A history */}
      {history.length === 0 && !asking && (
        <div className="flex flex-col items-center py-10 text-center">
          <div className="mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-black/5">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-black/30">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
          </div>
          <p className="text-sm text-black/35">Ask a question about this inspection.</p>
          <p className="mt-1 text-xs text-black/25">Try: "What safety concerns were found?" or "Should work be halted?"</p>
        </div>
      )}

      {history.map((entry, i) => (
        <QACard key={i} entry={entry} />
      ))}

      {asking && (
        <div className="flex items-center gap-3 rounded-2xl border border-black/8 bg-white px-4 py-4">
          <Spinner />
          <p className="text-sm text-black/40">SafeSight AI is analysing the inspection…</p>
        </div>
      )}

      <div ref={bottomRef} />

      {/* Input area */}
      <div className="rounded-2xl border border-black/10 bg-white p-4">
        <p className="mb-2 text-[10px] font-black uppercase tracking-[0.2em] text-black/30">
          Ask SafeSight AI
        </p>
        <textarea
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleAsk();
          }}
          placeholder="What safety concerns were detected in this video?"
          rows={3}
          disabled={asking}
          className="w-full resize-none rounded-xl border border-black/10 bg-[var(--background)] px-3 py-2.5 text-sm text-[var(--ink)] placeholder:text-black/25 focus:border-[var(--teal)] focus:outline-none disabled:opacity-50"
        />
        {error && (
          <div className="mt-2 flex items-start gap-2 rounded-xl bg-red-50 px-3 py-2">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="mt-0.5 flex-shrink-0 text-red-500">
              <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <p className="text-xs text-red-700">{error}</p>
          </div>
        )}
        <div className="mt-3 flex items-center justify-between gap-3">
          <p className="text-xs text-black/25">⌘ Enter to send</p>
          <button
            onClick={handleAsk}
            disabled={!question.trim() || asking}
            className="flex min-h-[44px] items-center gap-2 rounded-xl bg-[var(--ink)] px-5 py-2 text-sm font-bold text-white shadow-[0_3px_0_rgba(0,0,0,0.2)] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-40 disabled:translate-y-0 disabled:shadow-none active:translate-y-0 active:shadow-none"
          >
            {asking ? <><Spinner /><span>Thinking…</span></> : 'Ask'}
          </button>
        </div>
      </div>
    </div>
  );
}

function QACard({ entry }: { entry: LocalQAEntry }) {
  const [frameTarget, setFrameTarget] = useState<AskEvidenceItem | null>(null);

  return (
    <div className="overflow-hidden rounded-2xl border border-black/8 bg-white">
      {/* Question */}
      <div className="border-b border-black/6 bg-[var(--background)] px-4 py-3">
        <p className="text-sm font-bold text-[var(--ink)]">{entry.question}</p>
        {entry.asked_at && (
          <p className="mt-0.5 text-[11px] text-black/30">{formatDate(entry.asked_at)}</p>
        )}
      </div>

      {/* Answer */}
      <div className="px-4 py-3">
        <p className="whitespace-pre-wrap text-sm leading-relaxed text-black/70">{entry.answer}</p>
      </div>

      {/* Evidence links */}
      {entry.evidence && entry.evidence.length > 0 && (
        <div className="border-t border-black/6 px-4 py-3">
          <p className="mb-2 text-[10px] font-black uppercase tracking-[0.18em] text-black/30">
            Evidence frames
          </p>
          <div className="flex flex-wrap gap-2">
            {entry.evidence.map((item, i) => (
              <button
                key={i}
                onClick={() => setFrameTarget(item)}
                className="flex items-center gap-1.5 rounded-xl border border-black/10 bg-[var(--background)] px-3 py-1.5 text-xs font-bold text-[var(--ink)] transition hover:bg-black/8"
              >
                <RiskBadge risk={item.risk} />
                <span>{item.event}</span>
                <span className="font-mono text-black/40">{item.timestamp}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {frameTarget && (
        <FrameModal
          frameUrl={frameTarget.frame_url}
          timestamp={frameTarget.timestamp}
          eventName={frameTarget.event}
          risk={frameTarget.risk}
          onClose={() => setFrameTarget(null)}
        />
      )}
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
    return '';
  }
}
