export interface HCP {
  id: string;
  name: string;
  specialty?: string;
  hospital?: string;
  city?: string;
  email?: string;
  phone?: string;
  active?: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface Interaction {
  id: string;
  hcpId: string;
  hcpName: string;
  interactionType: string;
  interactionDate: string;
  interactionTime: string;
  attendees: string;
  hospital: string;
  specialization: string;
  topicsDiscussed: string;
  discussionNotes: string;
  materialsShared: string[];
  samplesDistributed: string[];
  sentiment: string;
  outcomes: string;
  followUpActions: string;
  followUpRequired: boolean;
  followUpDate: string;
  reminderDate: string;
  priority: string;
  tags: string[];
  aiSuggestedFollowUp: string;
  aiGeneratedSummary: string;
  interactionSummary: string;
  interactionStatus: string;
  toolUsed: string;
  lastUpdated: string;
  aiConfidenceScore: number;
  createdAt: string;
  updatedAt: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface ToolExecution {
  toolName: string;
  success: boolean;
  message: string;
  updatedFields: string[];
  interactionState: Partial<Interaction> | null;
}

export type ToastType = 'success' | 'error' | 'info' | 'warning';
