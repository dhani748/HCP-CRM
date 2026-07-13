import React from 'react';
import Modal from './Modal';

interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  loading?: boolean;
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Delete',
  loading,
}) => {
  return (
    <Modal open={open} onClose={onClose} title={title} width="400px">
      <p style={{ color: 'var(--color-text-muted)', marginBottom: '1.5rem' }}>
        {message}
      </p>
      <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
        <button
          onClick={onClose}
          disabled={loading}
          style={{
            padding: '0.5rem 1rem',
            background: 'transparent',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius)',
            color: 'var(--color-text)',
            fontSize: '0.875rem',
          }}
        >
          Cancel
        </button>
        <button
          onClick={onConfirm}
          disabled={loading}
          style={{
            padding: '0.5rem 1rem',
            background: 'var(--color-error)',
            border: 'none',
            borderRadius: 'var(--radius)',
            color: 'var(--color-text-inverse)',
            fontSize: '0.875rem',
            fontWeight: 500,
            opacity: loading ? 0.6 : 1,
          }}
        >
          {loading ? 'Deleting...' : confirmLabel}
        </button>
      </div>
    </Modal>
  );
};

export default ConfirmDialog;
