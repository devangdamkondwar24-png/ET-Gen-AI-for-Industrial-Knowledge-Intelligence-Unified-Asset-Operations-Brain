import { apiClient } from './client';

// Chat / Copilot
export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  citations?: Citation[];
}

export interface Citation {
  doc_id: string;
  page: number;
  score: number;
  text_preview: string;
}

export interface ChatResponse {
  answer: string;
  citations: Citation[];
  confidence: number;
}

export const sendChatMessage = async (query: string): Promise<ChatResponse> => {
  const res = await apiClient.post('/api/chat', { question: query });
  return res.data;
};

// RCA Agent
export interface RCAHypothesis {
  id: string;
  title: string;
  description: string;
  confidence: number;
  confidence_label: 'HIGH' | 'MEDIUM' | 'LOW';
  citations: Citation[];
}

export interface RCAResponse {
  asset_id: string;
  query: string;
  hypotheses: RCAHypothesis[];
  graph_context: Record<string, unknown>;
  error?: string;
}

export const runRcaAnalysis = async (assetId: string, query: string): Promise<RCAResponse> => {
  const res = await apiClient.post('/api/agents/rca', { asset_id: assetId, query });
  return res.data;
};

// Compliance Agent
export interface ComplianceGap {
  regulation_id: string;
  clause: string;
  requirement: string;
  status: 'COMPLIANT' | 'GAP' | 'MISSING';
  evidence_doc?: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  recommended_action: string;
}

export interface ComplianceResponse {
  plant_filter?: string;
  total_gaps: number;
  gap_analysis: ComplianceGap[];
  error?: string;
}

export const runComplianceCheck = async (
  plantFilter?: string,
  regulationIds?: string[]
): Promise<ComplianceResponse> => {
  const res = await apiClient.post('/api/agents/compliance', {
    plant_filter: plantFilter,
    regulation_ids: regulationIds ?? [],
  });
  return res.data;
};

// Graph
export interface AssetGraph {
  asset_id: string;
  equipment: Record<string, unknown>;
  failure_modes: unknown[];
  work_orders: unknown[];
  incidents: unknown[];
}

export const getAssetGraph = async (assetId: string): Promise<AssetGraph> => {
  const res = await apiClient.get(`/api/graph/asset/${assetId}`);
  return res.data;
};

// Document Upload
export const uploadDocument = async (file: File, assetTag?: string): Promise<{ job_id: string }> => {
  const formData = new FormData();
  formData.append('file', file);
  if (assetTag) formData.append('asset_tag', assetTag);
  const res = await apiClient.post('/api/ingestion/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data;
};

// Dashboard
export interface DashboardSummary {
  system_health_pct: number;
  services: { name: string; status: 'up' | 'down'; error?: string }[];
  document_count: number;
  equipment_count: number;
  failure_count: number;
  incident_count: number;
  open_work_order_count: number;
  non_conformance_count: number;
  critical_alerts: { asset_id: string; failure: string; severity: string; failure_id: string }[];
  pending_maintenance: { wo_id: string; title: string; priority: string; status: string; asset_id: string }[];
}

export const getDashboardSummary = async (): Promise<DashboardSummary> => {
  const res = await apiClient.get('/api/dashboard/summary');
  return res.data;
};

// Assets
export interface AssetSummary {
  asset_id: string;
  name: string;
  asset_type: string;
  plant: string;
  failure_count: number;
  work_order_count: number;
  incident_count: number;
}

export const getAssetsList = async (): Promise<{ assets: AssetSummary[]; total: number }> => {
  const res = await apiClient.get('/api/assets');
  return res.data;
};

// Reports
export interface ReportSummary {
  report_types: { id: string; title: string; description: string; icon: string; route: string }[];
  insights: any[];
  compliance_history: any[];
}

export const getReportsSummary = async (): Promise<ReportSummary> => {
  const res = await apiClient.get('/api/reports');
  return res.data;
};
