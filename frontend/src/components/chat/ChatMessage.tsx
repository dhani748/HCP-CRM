import React from 'react';

interface ChatMessageProps {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ role, content, timestamp }) => {
  const isUser = role === 'user';

  return (
    <div style={{
      display: 'flex',
      justifyContent: isUser ? 'flex-end' : 'flex-start',
      marginBottom: '0.75rem',
    }}>
      <div style={{
        maxWidth: '75%',
        padding: '0.75rem 1rem',
        borderRadius: 'var(--radius-lg)',
        background: isUser ? 'var(--color-primary)' : 'var(--color-surface)',
        color: isUser ? '#fff' : 'var(--color-text)',
        border: isUser ? 'none' : '1px solid var(--color-border)',
        boxShadow: 'var(--shadow-sm)',
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
        lineHeight: 1.5,
        fontSize: '0.875rem',
      }}>
        <div>{content}</div>
        <div style={{
          fontSize: '0.6875rem',
          marginTop: '0.375rem',
          opacity: 0.6,
          textAlign: isUser ? 'right' : 'left',
        }}>
          {new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>
    </div>
  );
};

export default ChatMessage;
