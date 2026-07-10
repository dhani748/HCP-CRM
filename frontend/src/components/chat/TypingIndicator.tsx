import React from 'react';

const TypingIndicator: React.FC = () => {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'flex-start',
      marginBottom: '0.75rem',
    }}>
      <div style={{
        padding: '0.75rem 1rem',
        borderRadius: 'var(--radius-lg)',
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        display: 'flex',
        gap: '0.25rem',
        alignItems: 'center',
      }}>
        <span style={{
          width: 8, height: 8, borderRadius: '50%',
          background: 'var(--color-text-muted)',
          animation: 'typingBounce 1.4s ease-in-out infinite',
        }} />
        <span style={{
          width: 8, height: 8, borderRadius: '50%',
          background: 'var(--color-text-muted)',
          animation: 'typingBounce 1.4s ease-in-out infinite',
          animationDelay: '0.2s',
        }} />
        <span style={{
          width: 8, height: 8, borderRadius: '50%',
          background: 'var(--color-text-muted)',
          animation: 'typingBounce 1.4s ease-in-out infinite',
          animationDelay: '0.4s',
        }} />
      </div>
      <style>{`
        @keyframes typingBounce {
          0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
          40% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default TypingIndicator;
