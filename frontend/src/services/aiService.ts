import { apiService } from './apiService';

export interface ExtractedInteraction {
  hcpName: string;
  interactionType: string;
  date: string;
  time: string;
  discussion: string[];
  summary: string;
  sentiment: string;
  materialsShared: string[];
  followUp: string;
  outcomes: string[];
  notes: string;
}

export interface ExtractedHCP {
  name: string;
  specialty: string;
  hospital: string;
  city: string;
  email: string;
  phone: string;
}

export interface AgentChatResponse {
  reply: string;
  tool_executed: string;
  tool_output: Record<string, unknown> | null;
  updated_fields: string[];
  interaction_state: Record<string, unknown>;
  search_results: Record<string, unknown>[];
  history_results: Record<string, unknown>[];
  execution_status: string;
}

export const extractInteraction = async (text: string): Promise<ExtractedInteraction> => {
  const response = await apiService.post<ExtractedInteraction>('/ai/extract-interaction', { text });
  return response.data;
};

export const extractHCP = async (text: string): Promise<ExtractedHCP> => {
  const response = await apiService.post<ExtractedHCP>('/ai/extract-hcp', { text });
  return response.data;
};

export const agentChatService = async (message: string): Promise<AgentChatResponse> => {
  const response = await apiService.post<AgentChatResponse>('/ai/agent/chat', { message });
  return response.data;
};

export const sendChatMessage = async (message: string, currentPage: string = ''): Promise<{ reply: string }> => {
  const response = await apiService.post<{ reply: string }>('/chat', { message, current_page: currentPage });
  return response.data;
};
