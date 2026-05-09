'use client';

import { useRef, useState } from 'react';
import type { DragEvent } from 'react';
import { uploadVideoWithProgress, inspectVideo } from '@/lib/api';
import { Spinner } from '@/components/InspectionView';

interface UploadModalProps {
  onClose: () => void;
  onSuccess: (videoId: string, filename: string) => void;
}

type Step = 'select' | 'uploading' | 'confirm' | 'inspecting';

export default function UploadModal({ onClose, onSuccess }: UploadModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [step, setStep] = useState<Step>('select');
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [uploadedId, setUploadedId] = useState('');
  const [uploadedFilename, setUploadedFilename] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  function handleFile(f: File) {
    setError(null);
    if (!f.name.toLowerCase().endsWith('.mp4')) {
      setError('Only .mp4 files are accepted.');
      return;
    }
    setFile(f);
  }

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  }

  async function handleUpload() {
    if (!file || step !== 'select') return;
    setStep('uploading');
    setProgress(0);
    setError(null);
    try {
      const { video_id, filename } = await uploadVideoWithProgress(file, setProgress);
      setUploadedId(video_id);
      setUploadedFilename(filename);
      setStep('confirm');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed. Please try again.');
      setStep('select');
    }
  }

  async function handleInspectNow() {
    if (!uploadedId) return;
    setStep('inspecting');
    setError(null);
    try {
      await inspectVideo(uploadedId);
      onSuccess(uploadedId, uploadedFilename);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Inspection failed. Please try again.');
      setStep('confirm');
    }
  }

  function handleSkip() {
    onSuccess(uploadedId, uploadedFilename);
  }

  const busy = step === 'uploading' || step === 'inspecting';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={!busy ? onClose : undefined}
      />

      <div className="relative w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
        {/* Header */}
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-black tracking-tight text-[var(--ink)]">
              {step === 'confirm' || step === 'inspecting' ? 'Upload Complete' : 'New Scan'}
            </h2>
            <p className="mt-0.5 text-xs text-black/40">
              {step === 'confirm' || step === 'inspecting'
                ? 'Run the AI inspection now, or come back later.'
                : 'Upload an MP4 to inspect for safety violations'}
            </p>
          </div>
          {!busy && (
            <button
              onClick={onClose}
              className="grid h-8 w-8 place-items-center rounded-xl text-black/35 transition hover:bg-black/6"
              aria-label="Close"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          )}
        </div>

        {/* Step 1: select / uploading */}
        {(step === 'select' || step === 'uploading') && (
          <>
            <div
              onDrop={handleDrop}
              onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onClick={() => step === 'select' && inputRef.current?.click()}
              className={[
                'cursor-pointer rounded-2xl border-2 border-dashed p-8 text-center transition',
                dragging
                  ? 'border-[var(--teal)] bg-[var(--teal)]/5'
                  : file
                  ? 'border-emerald-400 bg-emerald-50'
                  : 'border-black/15 hover:border-black/30 hover:bg-black/2',
                step === 'uploading' ? 'pointer-events-none' : '',
              ].join(' ')}
            >
              <input
                ref={inputRef}
                type="file"
                accept=".mp4,video/mp4"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleFile(f);
                  e.target.value = '';
                }}
              />
              {file ? (
                <div>
                  <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-emerald-100">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-emerald-600">
                      <rect x="2" y="3" width="20" height="14" rx="2" />
                      <path d="M8 21h8M12 17v4" />
                    </svg>
                  </div>
                  <p className="font-bold text-[var(--ink)] truncate px-4">{file.name}</p>
                  <p className="mt-1 text-xs text-black/40">{formatBytes(file.size)}</p>
                  {step === 'select' && (
                    <button
                      onClick={(e) => { e.stopPropagation(); setFile(null); }}
                      className="mt-2 text-xs text-black/35 underline hover:text-black/60"
                    >
                      Choose a different file
                    </button>
                  )}
                </div>
              ) : (
                <div>
                  <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-black/5">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-black/30">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="17 8 12 3 7 8" />
                      <line x1="12" y1="3" x2="12" y2="15" />
                    </svg>
                  </div>
                  <p className="font-bold text-black/50">Drop your MP4 here</p>
                  <p className="mt-1 text-sm text-black/30">or click to browse</p>
                </div>
              )}
            </div>

            {step === 'uploading' && (
              <div className="mt-3">
                <div className="mb-1.5 flex items-center justify-between text-xs text-black/40">
                  <span>Uploading…</span>
                  <span>{progress}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-black/8">
                  <div
                    className="h-full rounded-full bg-[var(--teal)] transition-all duration-200"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}
          </>
        )}

        {/* Step 2: confirm / inspecting */}
        {(step === 'confirm' || step === 'inspecting') && (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
            <div className="flex items-start gap-3">
              <div className="grid h-10 w-10 flex-shrink-0 place-items-center rounded-2xl bg-emerald-100">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="text-emerald-600">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <div className="min-w-0">
                <p className="font-bold text-emerald-800">Video uploaded successfully</p>
                <p className="mt-0.5 truncate text-xs text-emerald-700/70">{uploadedFilename}</p>
              </div>
            </div>
            {step === 'inspecting' && (
              <div className="mt-3 flex items-center gap-2 text-sm text-emerald-700">
                <Spinner />
                <span>Running AI safety inspection…</span>
              </div>
            )}
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mt-3 flex items-start gap-2 rounded-2xl bg-red-50 px-4 py-3">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="mt-0.5 flex-shrink-0 text-red-500">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Actions */}
        <div className="mt-4 flex gap-3">
          {step === 'select' && (
            <>
              <button
                onClick={onClose}
                className="flex-1 rounded-2xl border border-black/12 px-4 py-3 text-sm font-bold text-black/55 transition hover:bg-black/4"
              >
                Cancel
              </button>
              <button
                onClick={handleUpload}
                disabled={!file}
                className="flex flex-[2] items-center justify-center gap-2 rounded-2xl bg-[var(--ink)] px-6 py-3 text-sm font-bold text-white shadow-[0_4px_0_rgba(0,0,0,0.18)] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none disabled:translate-y-0 active:translate-y-0 active:shadow-none"
              >
                Upload Video
              </button>
            </>
          )}

          {step === 'confirm' && (
            <>
              <button
                onClick={handleSkip}
                className="flex-1 rounded-2xl border border-black/12 px-4 py-3 text-sm font-bold text-black/55 transition hover:bg-black/4"
              >
                Skip for now
              </button>
              <button
                onClick={handleInspectNow}
                className="flex flex-[2] items-center justify-center gap-2 rounded-2xl bg-[var(--ink)] px-6 py-3 text-sm font-bold text-white shadow-[0_4px_0_rgba(0,0,0,0.18)] transition hover:-translate-y-0.5 active:translate-y-0 active:shadow-none"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.35-4.35" />
                </svg>
                Inspect Now
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function formatBytes(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
