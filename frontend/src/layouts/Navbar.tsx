import React from 'react';
import { useAppSelector, useAppDispatch } from '../hooks';
import { toggleSidebar, setTheme } from '../redux/slices/uiSlice';

const Navbar: React.FC = () => {
  const dispatch = useAppDispatch();
  const theme = useAppSelector(s => s.ui.theme);

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    dispatch(setTheme(next));
    document.documentElement.setAttribute('data-theme', next);
  };

  return (
    <header style={{
      height: 'var(--header-height)',
      background: 'var(--color-surface)',
      borderBottom: '1px solid var(--color-border)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 1.5rem',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <button
          onClick={() => dispatch(toggleSidebar())}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--color-text-muted)',
            fontSize: '1.25rem',
            cursor: 'pointer',
          }}
        >
          =
        </button>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <button
          onClick={toggleTheme}
          title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          style={{
            background: 'transparent',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius)',
            padding: '0.375rem 0.75rem',
            color: 'var(--color-text-muted)',
            fontSize: '0.8rem',
          }}
        >
          {theme === 'dark' ? 'Light' : 'Dark'}
        </button>
      </div>
    </header>
  );
};

export default Navbar;
