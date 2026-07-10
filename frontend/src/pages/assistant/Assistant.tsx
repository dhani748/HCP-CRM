import React from 'react';
import ChatMessage from '../../components/chat/ChatMessage';
import ChatInput from '../../components/chat/ChatInput';
import TypingIndicator from '../../components/chat/TypingIndicator';
import ErrorMessage from '../../components/ErrorMessage';
import { useChat } from '../../hooks/chat/useChat';

const Assistant: React.FC = () => {
  const {
    messages,
    isTyping,
    loading,
    error,
    containerRef,
    handleSend,
    handleRetry,
    handleClear,
  } = useChat();

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      maxWidth: 800,
      margin: '0 auto',
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '1rem 1.25rem',
        borderBottom: '1px solid var(--color-border)',
      }}>
        <h2 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--color-text)' }}>
          AI Assistant
        </h2>
        {messages.length > 0 && (
          <button
            onClick={handleClear}
            style={{
              padding: '0.375rem 0.75rem',
              borderRadius: 'var(--radius)',
              border: '1px solid var(--color-border)',
              background: 'transparent',
              color: 'var(--color-text-muted)',
              fontSize: '0.8125rem',
              fontWeight: 500,
            }}
          >
            Clear chat
          </button>
        )}
      </div>

      <div
        ref={containerRef}
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '1rem 1.25rem',
        }}
      >
        {messages.length === 0 && !error && (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            color: 'var(--color-text-muted)',
            textAlign: 'center',
            gap: '0.5rem',
          }}>
            <div style={{
              width: 48,
              height: 48,
              borderRadius: 'var(--radius-lg)',
              background: 'var(--color-primary-light)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.25rem',
              color: 'var(--color-primary)',
              fontWeight: 700,
            }}>
              AI
            </div>
            <p style={{ fontSize: '0.9375rem', fontWeight: 600 }}>
              How can I help you?
            </p>
            <p style={{ fontSize: '0.8125rem', maxWidth: 360 }}>
              Ask about HCPs, interactions, summaries, or follow-ups.
            </p>
          </div>
        )}

        {messages.map((msg, i) => (
          <ChatMessage
            key={i}
            role={msg.role}
            content={msg.content}
            timestamp={msg.timestamp}
          />
        ))}

        {isTyping && <TypingIndicator />}

        {error && (
          <ErrorMessage message={error} onRetry={handleRetry} />
        )}
      </div>

      <ChatInput onSend={handleSend} disabled={loading} />
    </div>
  );
};

export default Assistant;
