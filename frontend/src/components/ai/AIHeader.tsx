import React from 'react';

interface AIHeaderProps {
  currentPage: string;
  onClear: () => void;
  hasMessages: boolean;
}

const AIHeader: React.FC<AIHeaderProps> = ({ currentPage, onClear, hasMessages }) => {
  return (
    <div style={{
      padding: '0.875rem 1rem 0.625rem',
      borderBottom: '1px solid var(--color-border)',
      flexShrink: 0,
      background: 'var(--color-surface)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '1.1rem' }}>🤖</span>
          <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>CRM Copilot</span>
        </div>
        {hasMessages && (
          <button
            onClick={onClear}
            style={{
              padding: '0.2rem 0.5rem',
              borderRadius: 'var(--radius)',
              border: '1px solid var(--color-border)',
              background: 'transparent',
              color: 'var(--color-text-muted)',
              fontSize: '0.68rem',
              cursor: 'pointer',
            }}
          >
            Clear
          </button>
        )}
      </div>
      <div style={{
        fontSize: '0.7rem',
        color: 'var(--color-text-muted)',
        background: 'var(--color-bg)',
        borderRadius: 'var(--radius)',
        padding: '0.3rem 0.5rem',
        display: 'inline-block',
      }}>
        Current Page: <strong>{currentPage || 'Dashboard'}</strong>
      </div>
    </div>
  );
};

export default AIHeader;
