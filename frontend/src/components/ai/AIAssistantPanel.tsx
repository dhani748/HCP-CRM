import React, { useState, useCallback, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAIAssistant } from '../../hooks/useAIAssistant';
import AIHeader from './AIHeader';
import QuickActions from './QuickActions';
import ChatInput from './ChatInput';
import ChatMessage from '../chat/ChatMessage';
import TypingIndicator from '../chat/TypingIndicator';

function pageName(pathname: string): string {
  if (pathname === '/' || pathname === '/dashboard') return 'Dashboard';
  if (pathname === '/hcp') return 'Healthcare Professionals';
  if (pathname === '/hcp/new') return 'Add HCP';
  if (pathname.startsWith('/hcp/')) return 'Edit HCP';
  if (pathname === '/interactions') return 'Interactions';
  if (pathname === '/interactions/new') return 'Interaction Form';
  if (pathname.startsWith('/interactions/')) return 'Interaction Form';
  return 'Dashboard';
}

const AIAssistantPanel: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const currentPage = pageName(location.pathname);

  const handleNavigate = useCallback((path: string) => {
    navigate(path);
  }, [navigate]);

  const {
    messages,
    extracting,
    error,
    containerRef,
    sendText,
    clearChat,
  } = useAIAssistant(currentPage, handleNavigate);

  const [input, setInput] = useState('');

  const handleSend = useCallback(() => {
    if (!input.trim() || extracting) return;
    sendText(input);
    setInput('');
  }, [input, extracting, sendText]);

  const handlePromptSelect = useCallback((prompt: string) => {
    setInput(prompt);
  }, []);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [messages, extracting, containerRef]);

  return (
    <div style={{
      background: 'var(--color-surface)',
      borderLeft: '1px solid var(--color-border)',
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      overflow: 'hidden',
      width: '100%',
    }}>
      <AIHeader
        currentPage={currentPage}
        onClear={clearChat}
        hasMessages={messages.length > 0}
      />

      <div
        ref={containerRef}
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '0.75rem',
        }}
      >
        {messages.length === 0 && !extracting ? (
          <QuickActions onAction={handlePromptSelect} onNavigate={handleNavigate} />
        ) : (
          messages.map((msg, i) => (
            <ChatMessage
              key={i}
              role={msg.role === 'system' ? 'assistant' : msg.role}
              content={msg.content}
              timestamp={msg.timestamp}
            />
          ))
        )}

        {extracting && <TypingIndicator />}

        {error && !extracting && (
          <div style={{
            textAlign: 'center',
            padding: '0.75rem',
            color: 'var(--color-error)',
            fontSize: '0.8rem',
          }}>
            {error}
          </div>
        )}
      </div>

      <ChatInput
        value={input}
        onChange={setInput}
        onSend={handleSend}
        disabled={extracting}
        placeholder="Ask or describe an interaction..."
      />
    </div>
  );
};

export default AIAssistantPanel;
