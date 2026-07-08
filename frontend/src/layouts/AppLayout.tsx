import React from 'react';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import Toast from '../components/Toast';

interface AppLayoutProps {
  children: React.ReactNode;
}

const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
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
      }}>
        <Navbar />
        <main style={{
          flex: 1,
          overflow: 'auto',
          padding: '1.5rem',
          background: 'var(--color-bg)',
        }}>
          {children}
        </main>
      </div>
      <Toast />
    </div>
  );
};

export default AppLayout;
