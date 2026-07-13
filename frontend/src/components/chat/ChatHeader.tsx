import React from 'react';
import { RotateCcw } from 'lucide-react';

interface ChatHeaderProps {
  onClear: () => void;
}

const ChatHeader: React.FC<ChatHeaderProps> = ({ onClear }) => (
  <div
    style={{
      padding: '16px 16px 12px',
      borderBottom: '1px solid var(--color-border)',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
    }}
  >
    <div>
      <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: 'var(--color-text)' }}>
        ✨ AI Assistant
      </h3>
      <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--color-text-muted)' }}>
        Log interaction via chat
      </p>
    </div>
    <button
      onClick={onClear}
      title="Clear conversation"
      style={{
        padding: 6,
        borderRadius: 6,
        border: 'none',
        background: 'transparent',
        color: 'var(--color-text-muted)',
        cursor: 'pointer',
        display: 'flex',
      }}
    >
      <RotateCcw size={15} />
    </button>
  </div>
);

export default ChatHeader;
