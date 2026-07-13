import React from 'react';
import { useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import Toast from '../components/Toast';
import AIAssistantPanel from '../components/ai/AIAssistantPanel';

interface AppLayoutProps {
  children: React.ReactNode;
}

const HIDE_AI_PANEL_ROUTES = ['/', '/log-interaction'];

const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const location = useLocation();
  const showAIPanel = !HIDE_AI_PANEL_ROUTES.includes(location.pathname);

  return (
    <div style={{
      display: 'flex',
      height: '100vh',
      overflow: 'hidden',
    }}>
      <Sidebar />
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        minWidth: 0,
      }}>
        <Navbar />
        <main style={{
          flex: 1,
          overflow: 'hidden',
          background: 'var(--color-bg)',
        }}>
          {children}
        </main>
      </div>
      {showAIPanel && (
        <div style={{
          width: 420,
          minWidth: 400,
          maxWidth: 450,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          flexShrink: 0,
          borderLeft: '1px solid var(--color-border)',
        }}>
          <AIAssistantPanel />
        </div>
      )}
      <Toast />
    </div>
  );
};

export default AppLayout;
