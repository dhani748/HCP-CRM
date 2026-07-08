import React from 'react';

interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  color?: string;
  bg?: string;
}

const StatCard: React.FC<StatCardProps> = ({ label, value, icon, color, bg }) => {
  return (
    <div style={{
      background: 'var(--color-surface)',
      border: '1px solid var(--color-border)',
      borderRadius: 'var(--radius-lg)',
      padding: '1.25rem',
      display: 'flex',
      alignItems: 'flex-start',
      gap: '1rem',
      boxShadow: 'var(--shadow-sm)',
    }}>
      <div style={{
        width: 44,
        height: 44,
        borderRadius: 'var(--radius)',
        background: bg || 'var(--color-primary-light)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        color: color || 'var(--color-primary)',
      }}>
        {icon}
      </div>
      <div>
        <p style={{
          fontSize: '0.75rem',
          fontWeight: 500,
          color: 'var(--color-text-muted)',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          marginBottom: '0.25rem',
        }}>
          {label}
        </p>
        <p style={{
          fontSize: '1.5rem',
          fontWeight: 700,
          lineHeight: 1.2,
        }}>
          {value}
        </p>
      </div>
    </div>
  );
};

export default StatCard;
