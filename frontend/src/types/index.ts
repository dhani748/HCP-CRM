// frontend/src/types/index.ts

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

export interface User {
  id: string;
  name: string;
  email: string;
}

export interface Interaction {
  id: string;
  hcpId: string;
  interactionType: string;
  date: string;
  time: string;
  attendees: string[];
  discussion: string[];
  materials: string[];
  samples: number;
  sentiment: 'positive' | 'neutral' | 'negative';
  outcomes: string[];
  followUp: string;
  summary?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export type ToastType = 'success' | 'error' | 'info' | 'warning';
