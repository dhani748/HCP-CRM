import React from 'react';
import { SendHorizonal } from 'lucide-react';

interface ButtonLogProps {
  onClick: () => void;
  disabled: boolean;
}

const ButtonLog: React.FC<ButtonLogProps> = ({ onClick, disabled }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: 6,
      padding: '8px 18px',
      borderRadius: 6,
      border: 'none',
      background: disabled ? 'var(--color-primary-light)' : 'var(--color-primary)',
      color: 'var(--color-text-inverse)',
      fontSize: 13,
      fontWeight: 500,
      cursor: disabled ? 'not-allowed' : 'pointer',
      whiteSpace: 'nowrap',
      transition: 'background 0.15s',
    }}
  >
    <SendHorizonal size={15} />
    Log
  </button>
);

export default ButtonLog;
