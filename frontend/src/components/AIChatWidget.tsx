import React, { useRef, useEffect, useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '../hooks';
import { closeAIWidget } from '../redux/slices/uiSlice';
import { sendAgentMessage, addMessage, clearChat, resetUnread } from '../redux/slices/chatSlice';
import ChatMessage from './chat/ChatMessage';
import ChatInput from './ai/ChatInput';
import TypingIndicator from './chat/TypingIndicator';

const AIChatWidget: React.FC = () => {
  const dispatch = useAppDispatch();
  const messages = useAppSelector(s => s.chat.messages);
  const isTyping = useAppSelector(s => s.chat.isTyping);
  const loading = useAppSelector(s => s.chat.loading);
  const error = useAppSelector(s => s.chat.error);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    dispatch(resetUnread());
  }, [dispatch]);

  const [chatInput, setChatInput] = React.useState('');

  const handleSend = useCallback(() => {
    const content = chatInput.trim();
    if (!content) return;
    dispatch(addMessage({ role: 'user', content, timestamp: new Date().toISOString() }));
    dispatch(sendAgentMessage(content));
    setChatInput('');
  }, [chatInput, dispatch]);

  const handleRetry = useCallback(() => {
    const lastUserMsg = [...messages].reverse().find(m => m.role === 'user');
    if (lastUserMsg) {
      dispatch(sendAgentMessage(lastUserMsg.content));
    }
  }, [dispatch, messages]);

  const handleClear = useCallback(() => {
    dispatch(clearChat());
  }, [dispatch]);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '1.5rem',
        left: 'calc(1.5rem + 56px + 0.75rem)',
        zIndex: 999,
        width: 380,
        height: 580,
        maxHeight: 'calc(100vh - 3rem)',
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-lg)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        animation: 'widgetSlideIn 0.25s ease-out',
      }}
    >
      <style>{`
        @keyframes widgetSlideIn {
          from { opacity: 0; transform: translateY(16px) scale(0.96); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>

      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0.75rem 1rem',
        borderBottom: '1px solid var(--color-border)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{
            width: 28,
            height: 28,
            borderRadius: 'var(--radius)',
            background: 'var(--color-primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--color-text-inverse)',
            fontSize: '0.7rem',
            fontWeight: 700,
          }}>
            AI
          </div>
          <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>AI Assistant</span>
        </div>
        <div style={{ display: 'flex', gap: '0.25rem' }}>
          {messages.length > 0 && (
            <button
              onClick={handleClear}
              title="Clear conversation"
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--color-text-muted)',
                fontSize: '0.75rem',
                padding: '0.25rem 0.5rem',
                cursor: 'pointer',
                borderRadius: 'var(--radius)',
              }}
            >
              Clear
            </button>
          )}
          <button
            onClick={() => dispatch(closeAIWidget())}
            title="Close"
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--color-text-muted)',
              fontSize: '1.25rem',
              cursor: 'pointer',
              lineHeight: 1,
              padding: '0.25rem',
            }}
          >
            &times;
          </button>
        </div>
      </div>

      <div
        ref={containerRef}
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '0.75rem',
        }}
      >
        {messages.length === 0 && (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            color: 'var(--color-text-muted)',
            textAlign: 'center',
            padding: '1rem',
            gap: '0.5rem',
          }}>
            <div style={{
              width: 40,
              height: 40,
              borderRadius: 'var(--radius-lg)',
              background: 'var(--color-primary-light)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1rem',
              color: 'var(--color-primary)',
              fontWeight: 700,
            }}>
              AI
            </div>
            <p style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-text)' }}>
              How can I help you?
            </p>
            <p style={{ fontSize: '0.75rem' }}>
              Ask about HCPs, interactions, follow-ups, or manage records.
            </p>
          </div>
        )}

        {messages.map((msg, i) => (
          <ChatMessage key={i} role={msg.role} content={msg.content} timestamp={msg.timestamp} />
        ))}

        {isTyping && <TypingIndicator />}

        {error && (
          <div style={{ textAlign: 'center', padding: '0.5rem' }}>
            <span style={{ color: 'var(--color-error)', fontSize: '0.8rem' }}>{error}</span>
            <button
              onClick={handleRetry}
              style={{
                marginLeft: '0.5rem',
                background: 'none',
                border: 'none',
                color: 'var(--color-primary)',
                fontSize: '0.8rem',
                cursor: 'pointer',
                textDecoration: 'underline',
              }}
            >
              Retry
            </button>
          </div>
        )}
      </div>

      <ChatInput value={chatInput} onChange={setChatInput} onSend={handleSend} disabled={loading} />
    </div>
  );
};

export default AIChatWidget;
