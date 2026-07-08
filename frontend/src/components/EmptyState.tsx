import React from 'react';

interface EmptyStateProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
}

const EmptyState: React.FC<EmptyStateProps> = ({ title, description, action }) => {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '3rem 1rem',
      textAlign: 'center',
      gap: '0.75rem',
    }}>
      <div style={{
        width: 48,
        height: 48,
        borderRadius: '50%',
        background: 'var(--color-border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '1.25rem',
        color: 'var(--color-text-muted)',
      }}>
        -
      </div>
      <h3 style={{ fontWeight: 600, fontSize: '1rem' }}>{title}</h3>
      {description && (
        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', maxWidth: 400 }}>
          {description}
        </p>
      )}
      {action}
    </div>
  );
};

export default EmptyState;
