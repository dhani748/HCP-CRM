import { useState, useCallback, useRef } from 'react';
import { useAppDispatch } from './useAppDispatch';
import { setExtractedInteraction, setExtractedHCP } from '../redux/slices/aiExtractSlice';
import { extractInteraction, extractHCP, sendChatMessage } from '../services/aiService';
import { parseHCPFromText } from '../utils/hcpParser';
import type { ParsedHCP } from '../utils/hcpParser';
import type { ExtractedHCP } from '../services/aiService';

export interface AIChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
}

const CREATE_HCP = /(?:create|add|new|register)\s+(?:a\s+)?(?:new\s+)?(?:hcp|healthcare\s*(?:professional)?|doctor)/i;
const CREATE_INTERACTION = /(?:create|add|new|log)\s+(?:a\s+)?(?:new\s+)?(?:interaction|call|meeting|visit)/i;

function formatHCPResult(result: ExtractedHCP | ParsedHCP): string {
  const parts: string[] = ['**Extracted HCP details:**'];
  if (result.name) parts.push(`\u2022 Name: ${result.name}`);
  if (result.specialty) parts.push(`\u2022 Specialty: ${result.specialty}`);
  if (result.hospital) parts.push(`\u2022 Hospital: ${result.hospital}`);
  if (result.city) parts.push(`\u2022 City: ${result.city}`);
  if (result.email) parts.push(`\u2022 Email: ${result.email}`);
  if (result.phone) parts.push(`\u2022 Phone: ${result.phone}`);

  const missing: string[] = [];
  if (!result.name) missing.push('Full Name');
  if (!result.specialty) missing.push('Specialty');
  if (!result.hospital) missing.push('Hospital');
  if (!result.city) missing.push('City');
  if (!result.email) missing.push('Email');
  if (!result.phone) missing.push('Phone Number');

  if (missing.length > 0 && missing.length < 6) {
    parts.push('', 'I still need:', ...missing.map(m => `\u2022 ${m}`));
  }

  if (result.name) {
    parts.push('', 'The form has been populated. Please review and click **Create HCP**.');
  }

  return parts.join('\n');
}

export function useAIAssistant(currentPage: string, onNavigate?: (path: string) => void) {
  const dispatch = useAppDispatch();
  const [messages, setMessages] = useState<AIChatMessage[]>([]);
  const [extracting, setExtracting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const addMessage = useCallback((role: AIChatMessage['role'], content: string) => {
    setMessages(prev => [...prev, { role, content, timestamp: new Date().toISOString() }]);
  }, []);

  const sendText = useCallback(async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || extracting) return;

    addMessage('user', trimmed);
    setExtracting(true);
    setError(null);

    const isOnHCPForm = currentPage === 'Add HCP' || currentPage === 'Edit HCP';
    const isOnInteractionForm = currentPage === 'Interaction Form';

    const createHCPIntent = !isOnHCPForm && CREATE_HCP.test(trimmed);
    const createInteractionIntent = !isOnInteractionForm && CREATE_INTERACTION.test(trimmed);

    try {
      if (isOnHCPForm) {
        const result = parseHCPFromText(trimmed);
        dispatch(setExtractedHCP(result));
        addMessage('assistant', formatHCPResult(result));
      } else if (isOnInteractionForm) {
        const result = await extractInteraction(trimmed);
        if (result.hcpName) {
          dispatch(setExtractedInteraction(result));
          const summary = result.summary || result.discussion?.join(', ') || '';
          const materials = result.materialsShared?.length
            ? `\n\nMaterials: ${result.materialsShared.join(', ')}`
            : '';
          const followUp = result.followUp
            ? `\n\nFollow-up: ${result.followUp}`
            : '';
          addMessage('assistant', `**Interaction extracted.**\n\nThe form has been populated. Please review before saving.${summary ? `\n\n**Summary:** ${summary}` : ''}${materials}${followUp}`);
        } else {
          const reply = await sendChatMessage(trimmed, currentPage);
          addMessage('assistant', reply.reply);
        }
      } else if (createHCPIntent) {
        const result = await extractHCP(trimmed);
        if (result.name) {
          dispatch(setExtractedHCP(result));
          if (onNavigate) onNavigate('/hcp/new');
          addMessage('assistant', formatHCPResult(result));
        } else {
          const reply = await sendChatMessage(trimmed, currentPage);
          addMessage('assistant', reply.reply);
        }
      } else if (createInteractionIntent) {
        const result = await extractInteraction(trimmed);
        if (result.hcpName) {
          dispatch(setExtractedInteraction(result));
          if (onNavigate) onNavigate('/interactions/new');
          const summary = result.summary || result.discussion?.join(', ') || '';
          const materials = result.materialsShared?.length
            ? `\n\nMaterials: ${result.materialsShared.join(', ')}`
            : '';
          const followUp = result.followUp
            ? `\n\nFollow-up: ${result.followUp}`
            : '';
          addMessage('assistant', `**Interaction extracted.**\n\nThe form has been populated. Please review before saving.${summary ? `\n\n**Summary:** ${summary}` : ''}${materials}${followUp}`);
        } else {
          const reply = await sendChatMessage(trimmed, currentPage);
          addMessage('assistant', reply.reply);
        }
      } else {
        const reply = await sendChatMessage(trimmed, currentPage);
        addMessage('assistant', reply.reply);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Something went wrong';
      setError(msg);
      addMessage('assistant', msg);
    } finally {
      setExtracting(false);
    }
  }, [extracting, currentPage, dispatch, addMessage, onNavigate]);

  const clearChat = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  return {
    messages,
    extracting,
    error,
    containerRef,
    sendText,
    clearChat,
  };
}
