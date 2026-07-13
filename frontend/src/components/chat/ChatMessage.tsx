import React from 'react';

interface ChatMessageProps {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

function renderMarkdown(text: string): React.ReactNode[] {
  const lines = text.split('\n');
  const elements: React.ReactNode[] = [];
  let key = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line === '') {
      elements.push(<br key={key++} />);
      continue;
    }

    const trimmed = line.trim();

    if (trimmed.startsWith('**') && trimmed.endsWith('**')) {
      elements.push(
        <div key={key++} style={{ fontWeight: 700, marginTop: '0.5rem', marginBottom: '0.25rem' }}>
          {trimmed.slice(2, -2)}
        </div>
      );
      continue;
    }

    if (trimmed.startsWith('\u2022 ') || trimmed.startsWith('- ')) {
      const bullet = trimmed.startsWith('\u2022 ') ? trimmed.slice(2) : trimmed.slice(2);
      elements.push(
        <div key={key++} style={{ display: 'flex', gap: '0.375rem', paddingLeft: '0.25rem', marginBottom: '0.125rem' }}>
          <span>\u2022</span>
          <span>{renderInline(bullet)}</span>
        </div>
      );
      continue;
    }

    elements.push(
      <div key={key++} style={{ marginBottom: '0.25rem' }}>
        {renderInline(line)}
      </div>
    );
  }

  return elements;
}

function renderInline(text: string): React.ReactNode[] {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    }
    return <span key={i}>{part}</span>;
  });
}

const ChatMessage: React.FC<ChatMessageProps> = ({ role, content, timestamp }) => {
  const isUser = role === 'user';

  return (
    <div style={{
      display: 'flex',
      justifyContent: isUser ? 'flex-end' : 'flex-start',
      marginBottom: '1rem',
    }}>
      <div style={{
        maxWidth: '85%',
        padding: '0.75rem 1rem',
        borderRadius: isUser ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
        background: isUser ? 'var(--color-primary)' : 'var(--color-surface)',
        color: isUser ? 'var(--color-chat-user-text)' : 'var(--color-text)',
        border: isUser ? 'none' : '1px solid var(--color-border)',
        boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
        lineHeight: 1.6,
        fontSize: '0.85rem',
      }}>
        <div>{renderMarkdown(content)}</div>
        <div style={{
          fontSize: '0.65rem',
          marginTop: '0.5rem',
          opacity: 0.5,
          textAlign: isUser ? 'right' : 'left',
        }}>
          {new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>
    </div>
  );
};

export default ChatMessage;
