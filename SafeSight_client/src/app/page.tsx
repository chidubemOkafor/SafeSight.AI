'use client';

import { useCallback, useEffect, useState } from 'react';
import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import InspectionView from '@/components/InspectionView';
import { listInspections } from '@/lib/api';
import { getStoredVideoIds } from '@/lib/storage';
import type { InspectionSummary, TabId } from '@/types';

export default function Dashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabId>('events');
  const [inspections, setInspections] = useState<InspectionSummary[]>([]);

  const selectedInspection = inspections.find((i) => i.video_id === selectedId) ?? null;

  const loadInspections = useCallback(async () => {
    const storedIds = getStoredVideoIds();
    if (storedIds.length === 0) return;
    try {
      const all = await listInspections();
      const ours = all.filter((i) => storedIds.includes(i.video_id));
      setInspections(ours);
    } catch {
      // Server may not be running; silently stay empty
    }
  }, []);

  useEffect(() => {
    loadInspections();
  }, [loadInspections]);

  function handleSelect(id: string) {
    setSelectedId(id);
    setActiveTab('events');
    setSidebarOpen(false);
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-[var(--background)]">
      <Header
        onMenuClick={() => setSidebarOpen(true)}
        onNewScan={() => {
          /* TODO: open upload modal — Task 2 */
        }}
      />

      <div className="flex flex-1 min-h-0">
        {/* Mobile overlay */}
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
          inspection={selectedInspection}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />
      </div>
    </div>
  );
}
