import React from 'react';
import { useAppDispatch, useAppSelector } from '../hooks';
import { toggleAIWidget } from '../redux/slices/uiSlice';

const FloatingAIButton: React.FC = () => {
  const dispatch = useAppDispatch();
  const unread = useAppSelector(s => s.chat.unreadCount);
  const isOpen = useAppSelector(s => s.ui.aiWidgetOpen);

  if (isOpen) return null;

  return (
    <button
      onClick={() => dispatch(toggleAIWidget())}
      title="AI Assistant"
      style={{
        position: 'fixed',
        bottom: '1.5rem',
        left: '1.5rem',
        zIndex: 1000,
        width: 56,
        height: 56,
        borderRadius: '50%',
        border: 'none',
        background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary-hover))',
        color: 'var(--color-text-inverse)',
        fontSize: '1.25rem',
        fontWeight: 700,
        cursor: 'pointer',
        boxShadow: '0 4px 16px color-mix(in srgb, var(--color-primary) 40%, transparent)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'transform 0.2s, box-shadow 0.2s',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = 'scale(1.08)';
        e.currentTarget.style.boxShadow = '0 6px 24px color-mix(in srgb, var(--color-primary) 50%, transparent)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = 'scale(1)';
        e.currentTarget.style.boxShadow = '0 4px 16px color-mix(in srgb, var(--color-primary) 40%, transparent)';
      }}
    >
      AI
      {unread > 0 && (
        <span style={{
          position: 'absolute',
          top: -4,
          right: -4,
          background: 'var(--color-error)',
          color: 'var(--color-text-inverse)',
          fontSize: '0.7rem',
          fontWeight: 700,
          minWidth: 20,
          height: 20,
          borderRadius: 10,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: '2px solid var(--color-surface)',
        }}>
          {unread > 99 ? '99+' : unread}
        </span>
      )}
    </button>
  );
};

export default FloatingAIButton;
