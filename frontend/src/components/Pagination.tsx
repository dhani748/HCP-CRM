import React from 'react';

interface PaginationProps {
  current: number;
  total: number;
  pageSize: number;
  onChange: (page: number) => void;
}

const Pagination: React.FC<PaginationProps> = ({ current, total, pageSize, onChange }) => {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  if (totalPages <= 1) return null;

  const pages: number[] = [];
  const start = Math.max(1, current - 2);
  const end = Math.min(totalPages, current + 2);

  for (let i = start; i <= end; i++) {
    pages.push(i);
  }

  const buttonStyle = (active: boolean): React.CSSProperties => ({
    padding: '0.375rem 0.75rem',
    border: active ? 'none' : '1px solid var(--color-border)',
    borderRadius: 'var(--radius)',
    background: active ? 'var(--color-primary)' : 'transparent',
    color: active ? 'var(--color-text-inverse)' : 'var(--color-text-muted)',
    fontSize: '0.875rem',
    fontWeight: active ? 500 : 400,
  });

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '0.25rem',
      marginTop: '1rem',
    }}>
      <button
        onClick={() => onChange(current - 1)}
        disabled={current <= 1}
        style={{
          ...buttonStyle(false),
          opacity: current <= 1 ? 0.4 : 1,
        }}
      >
        Prev
      </button>
      {pages.map(p => (
        <button
          key={p}
          onClick={() => onChange(p)}
          style={buttonStyle(p === current)}
        >
          {p}
        </button>
      ))}
      <button
        onClick={() => onChange(current + 1)}
        disabled={current >= totalPages}
        style={{
          ...buttonStyle(false),
          opacity: current >= totalPages ? 0.4 : 1,
        }}
      >
        Next
      </button>
    </div>
  );
};

export default Pagination;
