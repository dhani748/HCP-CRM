import React from 'react';
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

interface ToolExecutionBadgeProps {
  toolName: string;
  status: string;
  updatedFields: string[];
}

const ToolExecutionBadge: React.FC<ToolExecutionBadgeProps> = ({ toolName, status, updatedFields }) => {
  if (!toolName && status !== 'thinking') return null;

  const getIcon = () => {
    switch (status) {
      case 'thinking':
      case 'executing':
        return <Loader2 size={14} style={{ animation: 'spin 1s linear infinite', color: 'var(--color-primary)' }} />;
      case 'completed':
        return <CheckCircle2 size={14} style={{ color: 'var(--color-success)' }} />;
      case 'error':
        return <AlertCircle size={14} style={{ color: 'var(--color-error)' }} />;
      default:
        return null;
    }
  };

  const bgColor =
    status === 'completed' ? 'var(--color-success-light)' : status === 'error' ? 'var(--color-error-light)' : 'var(--color-primary-light)';
  const borderColor =
    status === 'completed' ? 'var(--color-success-light)' : status === 'error' ? 'var(--color-error-light)' : 'var(--color-primary-light)';
  const textColor =
    status === 'completed' ? 'var(--color-success)' : status === 'error' ? 'var(--color-error)' : 'var(--color-primary)';

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        padding: '6px 12px',
        margin: '8px 16px',
        borderRadius: 6,
        background: bgColor,
        border: `1px solid ${borderColor}`,
        fontSize: 12,
        color: textColor,
      }}
    >
      {getIcon()}
      <span style={{ fontWeight: 500 }}>
        {status === 'thinking'
          ? 'Thinking...'
          : status === 'executing'
          ? `Executing: ${toolName.replace(/_/g, ' ')}`
          : status === 'completed'
          ? `Tool executed: ${toolName.replace(/_/g, ' ')}`
          : `Error: ${toolName.replace(/_/g, ' ')}`}
      </span>
      {updatedFields.length > 0 && (
        <span style={{ opacity: 0.7 }}>
          · Updated: {updatedFields.join(', ')}
        </span>
      )}
    </div>
  );
};

export default ToolExecutionBadge;
