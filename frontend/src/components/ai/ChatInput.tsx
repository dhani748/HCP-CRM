import React, { useRef, useEffect } from 'react';

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  disabled: boolean;
  placeholder?: string;
}

const ChatInput: React.FC<ChatInputProps> = ({
  value,
  onChange,
  onSend,
  disabled,
  placeholder = 'Ask or describe an interaction...',
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [value]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  return (
    <div style={{
      display: 'flex',
      gap: '0.5rem',
      padding: '0.625rem',
      borderTop: '1px solid var(--color-border)',
      flexShrink: 0,
    }}>
      <textarea
        ref={textareaRef}
        value={value}
        onChange={e => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        rows={1}
        style={{
          flex: 1,
          resize: 'none',
          padding: '0.5rem 0.625rem',
          borderRadius: 'var(--radius)',
          border: '1px solid var(--color-border)',
          background: 'var(--color-bg)',
          color: 'var(--color-text)',
          fontSize: '0.8rem',
          lineHeight: 1.4,
          outline: 'none',
          fontFamily: 'inherit',
          maxHeight: 120,
        }}
      />
      <button
        onClick={onSend}
        disabled={disabled || !value.trim()}
        style={{
          padding: '0.5rem 0.75rem',
          borderRadius: 'var(--radius)',
          border: 'none',
          background: (!value.trim() || disabled) ? 'var(--color-border)' : 'var(--color-primary)',
          color: (!value.trim() || disabled) ? 'var(--color-text-muted)' : 'var(--color-text-inverse)',
          fontWeight: 600,
          fontSize: '0.8rem',
          cursor: (!value.trim() || disabled) ? 'not-allowed' : 'pointer',
          alignSelf: 'flex-end',
          whiteSpace: 'nowrap',
        }}
      >
        Send
      </button>
    </div>
  );
};

export default ChatInput;
