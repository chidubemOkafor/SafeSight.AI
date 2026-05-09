'use client';

import { useCallback, useEffect, useState } from 'react';
import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import InspectionView from '@/components/InspectionView';
import UploadModal from '@/components/UploadModal';
import { listInspections, getInspection, inspectVideo } from '@/lib/api';
import { getStoredVideoIds, addVideoId } from '@/lib/storage';
import type { InspectionSummary, InspectionDetail, TabId } from '@/types';

export default function Dashboard() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabId>('events');

  const [inspections, setInspections] = useState<InspectionSummary[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [backendOffline, setBackendOffline] = useState(false);

  const [selectedDetail, setSelectedDetail] = useState<InspectionDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const [inspecting, setInspecting] = useState(false);
  const [inspectError, setInspectError] = useState<string | null>(null);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);

  const loadInspections = useCallback(async () => {
    const storedIds = getStoredVideoIds();
    setHistoryLoading(true);
    setBackendOffline(false);
    try {
      if (storedIds.length === 0) {
        setInspections([]);
        return;
      }
      const all = await listInspections();
      setInspections(all.filter((i) => storedIds.includes(i.video_id)));
    } catch (err) {
      const isNetwork = err instanceof TypeError && err.message.toLowerCase().includes('fetch');
      setBackendOffline(isNetwork);
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  const loadDetail = useCallback(async (id: string) => {
    setDetailLoading(true);
    setSelectedDetail(null);
    try {
      setSelectedDetail(await getInspection(id));
    } catch {
      setSelectedDetail(null);
    } finally {
      setDetailLoading(false);
    }
  }, []);

  useEffect(() => {
    loadInspections();
  }, [loadInspections]);

  function handleSelect(id: string) {
    setSelectedId(id);
    setActiveTab('events');
    setInspectError(null);
    loadDetail(id);
  }

  async function handleInspect() {
    if (!selectedId) return;
    setInspecting(true);
    setInspectError(null);
    try {
      await inspectVideo(selectedId);
      await loadDetail(selectedId);
      await loadInspections();
    } catch (err) {
      setInspectError(err instanceof Error ? err.message : 'Inspection failed. Please try again.');
    } finally {
      setInspecting(false);
    }
  }

  async function handleUploadSuccess(videoId: string) {
    addVideoId(videoId);
    setUploadModalOpen(false);
    await loadInspections();
    handleSelect(videoId);
  }

  return (
    <div className="flex h-screen flex-col overflow-x-hidden bg-[var(--background)]">
      <Header onNewScan={() => setUploadModalOpen(true)} />

      {/* Backend offline banner */}
      {backendOffline && (
        <div className="flex flex-shrink-0 items-center justify-between gap-3 bg-red-600 px-4 py-2 text-sm text-white">
          <div className="flex items-center gap-2">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <span>Cannot reach the SafeSight server. Make sure the backend is running at the configured URL.</span>
          </div>
          <button
            onClick={loadInspections}
            className="flex-shrink-0 rounded-lg border border-white/30 px-3 py-1 text-xs font-bold transition hover:bg-white/10"
          >
            Retry
          </button>
        </div>
      )}

      {/* Body — flex-col on mobile (strip above), flex-row on desktop (sidebar left) */}
      <div className="flex flex-1 min-h-0 flex-col overflow-hidden lg:flex-row">
        <Sidebar
          inspections={inspections}
          selectedId={selectedId}
          onSelect={handleSelect}
          loading={historyLoading}
        />

        <InspectionView
          detail={selectedDetail}
          loading={detailLoading}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          onInspect={handleInspect}
          inspecting={inspecting}
          inspectError={inspectError}
        />
      </div>

      {uploadModalOpen && (
        <UploadModal
          onClose={() => setUploadModalOpen(false)}
          onSuccess={handleUploadSuccess}
        />
      )}
    </div>
  );
}
