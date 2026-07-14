import React, { useEffect } from 'react';
import { useAppDispatch } from '../hooks';
import { startCreateSession } from '../redux/slices/editingSessionSlice';
import LeftPanel from '../components/layout/LeftPanel';
import RightPanel from '../components/layout/RightPanel';

const LogInteractionPage: React.FC = () => {
  const dispatch = useAppDispatch();

  useEffect(() => {
    dispatch(startCreateSession());
  }, [dispatch]);

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '20px 24px 0' }}>
        <h1 style={{ margin: 0, fontSize: 20, fontWeight: 600, color: 'var(--color-text)' }}>
          Log HCP Interaction
        </h1>
      </div>
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        <LeftPanel />
        <RightPanel />
      </div>
    </div>
  );
};

export default LogInteractionPage;
