import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';

const navItems = [
  { to: '/', label: 'Dashboard', icon: 'D' },
  { to: '/hcp', label: 'HCPs', icon: 'H' },
  { to: '/interactions', label: 'Interactions', icon: 'I' },
];

const Sidebar: React.FC = () => {
  const location = useLocation();

  return (
    <aside style={{
      width: 'var(--sidebar-width)',
      background: 'var(--color-surface)',
      borderRight: '1px solid var(--color-border)',
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      flexShrink: 0,
    }}>
      <div style={{
        padding: '1rem 1.25rem',
        borderBottom: '1px solid var(--color-border)',
        fontWeight: 700,
        fontSize: '1.125rem',
        color: 'var(--color-primary)',
      }}>
        HCP CRM
      </div>
      <nav style={{ padding: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
        {navItems.map(item => {
          const isActive = item.to === '/'
            ? location.pathname === '/'
            : location.pathname.startsWith(item.to);
          return (
            <NavLink
              key={item.to}
              to={item.to}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.625rem 0.75rem',
                borderRadius: 'var(--radius)',
                fontWeight: 500,
                fontSize: '0.875rem',
                color: isActive ? 'var(--color-primary)' : 'var(--color-text-muted)',
                background: isActive ? 'var(--color-primary-light)' : 'transparent',
                textDecoration: 'none',
                transition: 'all var(--transition)',
              }}
            >
              <span style={{
                width: 28,
                height: 28,
                borderRadius: 'var(--radius)',
                background: isActive ? 'var(--color-primary)' : 'var(--color-border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.75rem',
                fontWeight: 700,
                color: isActive ? '#fff' : 'var(--color-text-muted)',
              }}>
                {item.icon}
              </span>
              {item.label}
            </NavLink>
          );
        })}
      </nav>
    </aside>
  );
};

export default Sidebar;
