import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from './hooks';
import { setTheme } from './redux/slices/uiSlice';
import AppLayout from './layouts/AppLayout';
import Dashboard from './pages/Dashboard';
import HCPList from './pages/hcp/List';
import HCPForm from './pages/hcp/Form';
import InteractionList from './pages/interactions/List';
import InteractionForm from './pages/interactions/Form';
import LogInteractionPage from './pages/LogInteractionPage';

const AppContent: React.FC = () => {
  const dispatch = useAppDispatch();
  const theme = useAppSelector(s => s.ui.theme);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  useEffect(() => {
    const stored = localStorage.getItem('theme');
    if (stored === 'dark' || stored === 'light') {
      dispatch(setTheme(stored));
      document.documentElement.setAttribute('data-theme', stored);
    }
  }, [dispatch]);

  useEffect(() => {
    localStorage.setItem('theme', theme);
  }, [theme]);

  return (
    <Routes>
      <Route path="/" element={<LogInteractionPage />} />
      <Route path="/log-interaction" element={<LogInteractionPage />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/hcp" element={<HCPList />} />
      <Route path="/hcp/new" element={<HCPForm onSuccess={() => window.history.back()} onCancel={() => window.history.back()} />} />
      <Route path="/interactions" element={<InteractionList />} />
      <Route path="/interactions/new" element={<InteractionForm onSuccess={() => window.history.back()} onCancel={() => window.history.back()} />} />
      <Route path="*" element={
        <div style={{ textAlign: 'center', paddingTop: '4rem', color: 'var(--color-text-muted)' }}>
          <h2>404 — Page not found</h2>
        </div>
      } />
    </Routes>
  );
};

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AppLayout>
        <AppContent />
      </AppLayout>
    </BrowserRouter>
  );
};

export default App;
