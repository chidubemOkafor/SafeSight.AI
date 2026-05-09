export interface InspectionSummary {
  video_id: string;
  original_filename: string | null;
  filename: string | null;
  status: string;
  created_at: string | null;
  updated_at: string | null;
  event_count: number;
  concern_count: number;
  qa_count: number;
  report_available: boolean;
}

export interface SafetyEvent {
  event_type: string;
  event?: string;
  timestamp: string;
  timestamp_seconds: number;
  confidence: number;
  risk?: string;
  what_happened?: string;
  explanation?: string;
  recommendation?: string;
  frame_path: string;
}

export interface EvidenceFrame {
  timestamp: string;
  frame_path: string;
  confidence: number;
}

export interface Finding {
  event_type: string;
  event: string;
  risk: string;
  count: number;
  first_seen: string;
  last_seen: string;
  what_happened: string;
  explanation: string;
  recommendation: string;
  evidence_frames: EvidenceFrame[];
}

export interface InspectionReport {
  video_id: string;
  generated_at: string;
  summary: {
    total_events: number;
    total_safety_concerns: number;
    event_counts: Record<string, number>;
    risk_counts: Record<string, number>;
  };
  findings: Finding[];
}

export interface QAEntry {
  asked_at: string;
  question: string;
  answer: string;
  model: string;
}

export interface InspectionDetail {
  video_id: string;
  metadata: Record<string, unknown>;
  events: SafetyEvent[];
  report: InspectionReport | null;
  qa_history: QAEntry[];
}

export type TabId = 'events' | 'report' | 'ask';
