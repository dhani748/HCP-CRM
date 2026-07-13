import React from 'react';

interface QuickActionsProps {
  onAction: (prompt: string) => void;
  onNavigate: (path: string) => void;
}

const actions: Array<{ label: string; icon: string; type: 'prompt' | 'navigate'; value: string }> = [
  { label: 'Create HCP', icon: '+', type: 'navigate', value: '/hcp/new' },
  { label: 'Log Interaction', icon: '+', type: 'navigate', value: '/interactions/new' },
  { label: 'Dashboard Summary', icon: '📊', type: 'prompt', value: 'Show me a dashboard summary of all HCPs and interactions' },
  { label: 'Search Doctor', icon: '🔍', type: 'prompt', value: 'Search for Dr.' },
  { label: "Today's Follow-ups", icon: '📅', type: 'prompt', value: 'List HCPs needing follow-up' },
  { label: 'Recent Interactions', icon: '🕐', type: 'prompt', value: 'Show me recent interactions' },
];

const QuickActions: React.FC<QuickActionsProps> = ({ onAction, onNavigate }) => {
  return (
    <div style={{ padding: '0.625rem' }}>
      <p style={{
        fontSize: '0.68rem',
        fontWeight: 600,
        color: 'var(--color-text-muted)',
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        marginBottom: '0.5rem',
      }}>
        Quick Actions
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
        {actions.map((action, i) => (
          <button
            key={i}
            type="button"
            onClick={() => {
              if (action.type === 'navigate') {
                onNavigate(action.value);
              } else {
                onAction(action.value);
              }
            }}
            style={btnStyle}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--color-primary)'; e.currentTarget.style.background = 'var(--color-primary)'; e.currentTarget.style.color = 'var(--color-text-inverse)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--color-border)'; e.currentTarget.style.background = 'var(--color-bg)'; e.currentTarget.style.color = 'var(--color-text)'; }}
          >
            <span style={{ fontWeight: 600, fontSize: '0.85rem', minWidth: 20, textAlign: 'center' }}>{action.icon}</span>
            <span style={{ fontSize: '0.8rem' }}>{action.label}</span>
          </button>
        ))}
      </div>
      <p style={{
        fontSize: '0.68rem',
        color: 'var(--color-text-muted)',
        marginTop: '0.625rem',
        textAlign: 'center',
        lineHeight: 1.4,
      }}>
        Type a message or use a quick action above
      </p>
    </div>
  );
};

const btnStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem',
  width: '100%',
  textAlign: 'left',
  padding: '0.5rem 0.75rem',
  borderRadius: 'var(--radius)',
  border: '1px solid var(--color-border)',
  background: 'var(--color-bg)',
  color: 'var(--color-text)',
  cursor: 'pointer',
  transition: 'all 0.15s',
  fontSize: '0.8rem',
  fontWeight: 500,
};

export default QuickActions;
