import React from 'react';
import ButtonLog from './ButtonLog';

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  disabled: boolean;
}

const ChatInput: React.FC<ChatInputProps> = ({ value, onChange, onSend, disabled }) => {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  return (
    <div
      style={{
        padding: '12px 16px',
        borderTop: '1px solid var(--color-border)',
        background: 'var(--color-surface)',
      }}
    >
      <div
        style={{
          display: 'flex',
          gap: 8,
          alignItems: 'flex-end',
        }}
      >
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Describe interaction..."
          rows={2}
          style={{
            flex: 1,
            padding: '8px 10px',
            fontSize: 13,
            lineHeight: 1.5,
            color: 'var(--color-text)',
            border: '1px solid var(--color-border)',
            borderRadius: 6,
            background: 'var(--color-input-bg)',
            resize: 'none',
            outline: 'none',
            fontFamily: 'inherit',
          }}
        />
        <ButtonLog onClick={onSend} disabled={disabled || !value.trim()} />
      </div>
    </div>
  );
};

export default ChatInput;
