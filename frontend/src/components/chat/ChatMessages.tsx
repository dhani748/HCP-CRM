import React from 'react';
import type { ChatMessage as ChatMessageType } from '../../types';
import TypingIndicator from './TypingIndicator';
import { Bot } from 'lucide-react';

interface ChatMessagesProps {
  messages: ChatMessageType[];
  isTyping: boolean;
}

const ChatMessages: React.FC<ChatMessagesProps> = ({ messages, isTyping }) => {
  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  return (
    <div
      style={{
        flex: 1,
        overflowY: 'auto',
        padding: '8px 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
      }}
    >
      {messages.map((msg, i) => (
        <div
          key={i}
          style={{
            display: 'flex',
            justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
          }}
        >
          <div
            style={{
              maxWidth: '90%',
              borderRadius: 8,
              padding: '8px 12px',
              fontSize: 13,
              lineHeight: 1.5,
              ...(msg.role === 'user'
                ? {
                    background: 'var(--color-chat-user)',
                    color: 'var(--color-chat-user-text)',
                    borderBottomRightRadius: 2,
                  }
                : {
                    background: 'var(--color-chat-assistant)',
                    color: 'var(--color-text)',
                    border: '1px solid var(--color-border)',
                    borderBottomLeftRadius: 2,
                  }),
            }}
          >
            {msg.role === 'assistant' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4 }}>
                <Bot size={12} style={{ color: 'var(--color-primary)' }} />
                <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--color-primary)', textTransform: 'uppercase' }}>
                  AI
                </span>
              </div>
            )}
            <p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{msg.content}</p>
          </div>
        </div>
      ))}
      {isTyping && (
        <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
          <div
            style={{
              background: 'var(--color-chat-assistant)',
              border: '1px solid var(--color-border)',
              borderRadius: 8,
              borderBottomLeftRadius: 2,
              padding: '10px 14px',
            }}
          >
            <TypingIndicator />
          </div>
        </div>
      )}
      <div ref={messagesEndRef} />
    </div>
  );
};

export default ChatMessages;
