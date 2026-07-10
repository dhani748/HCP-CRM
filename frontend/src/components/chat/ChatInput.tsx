import React, { useState, useRef } from 'react';

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled: boolean;
}

const ChatInput: React.FC<ChatInputProps> = ({ onSend, disabled }) => {
  const [text, setText] = useState('');
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setText('');
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInput = () => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      inputRef.current.style.height = Math.min(inputRef.current.scrollHeight, 120) + 'px';
    }
  };

  return (
    <div style={{
      display: 'flex',
      gap: '0.5rem',
      padding: '0.75rem',
      borderTop: '1px solid var(--color-border)',
      background: 'var(--color-surface)',
    }}>
      <textarea
        ref={inputRef}
        value={text}
        onChange={e => { setText(e.target.value); handleInput(); }}
        onKeyDown={handleKeyDown}
        placeholder="Ask about HCPs, interactions, follow-ups…"
        rows={1}
        disabled={disabled}
        style={{
          flex: 1,
          resize: 'none',
          padding: '0.625rem 0.75rem',
          borderRadius: 'var(--radius)',
          border: '1px solid var(--color-border)',
          background: 'var(--color-bg)',
          color: 'var(--color-text)',
          fontSize: '0.875rem',
          lineHeight: 1.5,
          maxHeight: 120,
          outline: 'none',
        }}
      />
      <button
        onClick={handleSend}
        disabled={disabled || !text.trim()}
        style={{
          padding: '0.625rem 1.25rem',
          borderRadius: 'var(--radius)',
          border: 'none',
          background: (!text.trim() || disabled) ? 'var(--color-border)' : 'var(--color-primary)',
          color: (!text.trim() || disabled) ? 'var(--color-text-muted)' : '#fff',
          fontWeight: 600,
          fontSize: '0.875rem',
          cursor: (!text.trim() || disabled) ? 'not-allowed' : 'pointer',
          alignSelf: 'flex-end',
          transition: 'all var(--transition)',
        }}
      >
        Send
      </button>
    </div>
  );
};

export default ChatInput;
