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
