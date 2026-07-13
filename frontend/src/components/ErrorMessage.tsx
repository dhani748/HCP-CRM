import React from 'react';

interface ErrorMessageProps {
  message: string;
  onRetry?: () => void;
}

const ErrorMessage: React.FC<ErrorMessageProps> = ({ message, onRetry }) => {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '3rem 1rem',
      textAlign: 'center',
      gap: '1rem',
    }}>
      <div style={{
        width: 48,
        height: 48,
        borderRadius: '50%',
        background: 'var(--color-error-light)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '1.25rem',
        color: 'var(--color-error)',
      }}>
        !
      </div>
      <p style={{ color: 'var(--color-text-muted)', maxWidth: 400 }}>
        {message}
      </p>
      {onRetry && (
        <button
          onClick={onRetry}
          style={{
            padding: '0.5rem 1.25rem',
            background: 'var(--color-primary)',
            color: 'var(--color-text-inverse)',
            border: 'none',
            borderRadius: 'var(--radius)',
            fontWeight: 500,
            fontSize: '0.875rem',
          }}
        >
          Retry
        </button>
      )}
    </div>
  );
};

export default ErrorMessage;
