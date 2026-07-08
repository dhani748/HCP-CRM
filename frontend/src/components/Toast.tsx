import React from 'react';
import { useAppSelector, useAppDispatch } from '../hooks';
import { hideToast } from '../redux/slices/uiSlice';

const typeStyles: Record<string, { bg: string; border: string; color: string }> = {
  success: { bg: 'var(--color-success-light)', border: 'var(--color-success)', color: 'var(--color-success)' },
  error: { bg: 'var(--color-error-light)', border: 'var(--color-error)', color: 'var(--color-error)' },
  info: { bg: 'var(--color-info-light)', border: 'var(--color-info)', color: 'var(--color-info)' },
  warning: { bg: 'var(--color-warning-light)', border: 'var(--color-warning)', color: 'var(--color-warning)' },
};

const Toast: React.FC = () => {
  const toast = useAppSelector(s => s.ui.toast);
  const dispatch = useAppDispatch();

  React.useEffect(() => {
    if (toast.visible) {
      const timer = setTimeout(() => dispatch(hideToast()), 4000);
      return () => clearTimeout(timer);
    }
  }, [toast.visible, dispatch]);

  if (!toast.visible) return null;

  const style = typeStyles[toast.type] || typeStyles.info;

  return (
    <div style={{
      position: 'fixed',
      bottom: '1.5rem',
      right: '1.5rem',
      zIndex: 2000,
      background: style.bg,
      border: `1px solid ${style.border}`,
      borderRadius: 'var(--radius)',
      padding: '0.75rem 1rem',
      color: 'var(--color-text)',
      fontSize: '0.875rem',
      boxShadow: 'var(--shadow-md)',
      display: 'flex',
      alignItems: 'center',
      gap: '0.75rem',
      animation: 'toastIn 300ms ease',
      maxWidth: 360,
    }}>
      <span style={{ color: style.color, fontWeight: 700 }}>{toast.type.toUpperCase()}</span>
      <span>{toast.message}</span>
      <button
        onClick={() => dispatch(hideToast())}
        style={{
          background: 'none',
          border: 'none',
          color: 'var(--color-text-muted)',
          fontSize: '1rem',
          marginLeft: 'auto',
          padding: '0 0 0 0.5rem',
          lineHeight: 1,
        }}
      >
        &times;
      </button>
      <style>{`
        @keyframes toastIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default Toast;
