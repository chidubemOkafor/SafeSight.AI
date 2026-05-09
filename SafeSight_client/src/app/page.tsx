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
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabId>('events');
  const [inspections, setInspections] = useState<InspectionSummary[]>([]);
  const [selectedDetail, setSelectedDetail] = useState<InspectionDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [inspecting, setInspecting] = useState(false);
  const [inspectError, setInspectError] = useState<string | null>(null);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);

  const loadInspections = useCallback(async () => {
    const storedIds = getStoredVideoIds();
    if (storedIds.length === 0) return;
    try {
      const all = await listInspections();
      const ours = all.filter((i) => storedIds.includes(i.video_id));
      setInspections(ours);
    } catch {
      // Server not running; stay empty
    }
  }, []);

  const loadDetail = useCallback(async (id: string) => {
    setDetailLoading(true);
    setSelectedDetail(null);
    try {
      const detail = await getInspection(id);
      setSelectedDetail(detail);
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
    setSidebarOpen(false);
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
    <div className="flex h-screen flex-col overflow-hidden bg-[var(--background)]">
      <Header
        onMenuClick={() => setSidebarOpen(true)}
        onNewScan={() => setUploadModalOpen(true)}
      />

      <div className="flex flex-1 min-h-0">
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-20 bg-black/40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        <Sidebar
          inspections={inspections}
          selectedId={selectedId}
          onSelect={handleSelect}
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
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
