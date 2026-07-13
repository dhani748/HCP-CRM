import React from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAppDispatch } from '../hooks';
import { resetForm } from '../redux/slices/interactionSlice';
import { startCreateSession } from '../redux/slices/editingSessionSlice';
import {
  MessageSquare,
  LayoutDashboard,
  Users,
  List,
  Bot,
  PlusCircle,
} from 'lucide-react';

const navItems = [
  { to: '/', label: 'AI Interaction', icon: Bot },
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/interactions', label: 'All Interactions', icon: List },
  { to: '/hcp', label: 'HCPs', icon: Users },
];

const Sidebar: React.FC = () => {
  const location = useLocation();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const handleRecordInteraction = () => {
    dispatch(resetForm());
    dispatch(startCreateSession());
    navigate('/');
  };

  return (
    <aside
      style={{
        width: 240,
        minWidth: 240,
        background: 'var(--color-sidebar-bg)',
        color: 'var(--color-sidebar-text)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      <div style={{
        padding: '1.25rem 1.25rem',
        borderBottom: '1px solid var(--color-sidebar-hover)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 32,
            height: 32,
            borderRadius: 10,
            background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary-hover))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 16,
            fontWeight: 700,
            color: 'var(--color-text-inverse)',
          }}>
            <Bot size={18} />
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: '-0.01em', color: '#F8FAFC' }}>AI-First CRM</div>
            <div style={{ fontSize: 10, opacity: 0.5, marginTop: 1, color: 'var(--color-sidebar-text)' }}>HCP Interaction Module</div>
          </div>
        </div>
      </div>

      <div style={{ padding: '0.5rem 0.75rem' }}>
        <button
          onClick={handleRecordInteraction}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            width: '100%',
            padding: '0.625rem 0.75rem',
            borderRadius: 8,
            fontSize: 13,
            fontWeight: 600,
            color: 'var(--color-text-inverse)',
            background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary-hover))',
            border: 'none',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
        >
          <PlusCircle size={18} />
          Record Interaction
        </button>
      </div>

      <nav style={{ flex: 1, padding: '0.75rem', display: 'flex', flexDirection: 'column', gap: 2 }}>
        {navItems.map((item) => {
          const isActive = location.pathname === item.to || (item.to !== '/' && location.pathname.startsWith(item.to));
          return (
            <NavLink
              key={item.to}
              to={item.to}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '0.625rem 0.75rem',
                borderRadius: 8,
                fontSize: 13,
                fontWeight: isActive ? 600 : 400,
                color: isActive ? '#F8FAFC' : '#94A3B8',
                background: isActive ? 'var(--color-sidebar-active)' : 'transparent',
                textDecoration: 'none',
                transition: 'all 0.15s ease',
              }}
            >
              <item.icon size={18} />
              {item.label}
            </NavLink>
          );
        })}
      </nav>

      <div style={{
        padding: '0.75rem',
        borderTop: '1px solid var(--color-sidebar-hover)',
        fontSize: 10,
        color: '#64748B',
        textAlign: 'center',
      }}>
        v1.0.0 · LangGraph Powered
      </div>
    </aside>
  );
};

export default Sidebar;
