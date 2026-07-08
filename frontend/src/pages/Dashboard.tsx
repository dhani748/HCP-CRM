import React, { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../hooks';
import { fetchHCPs, selectAllHCPs, selectHCPLoading } from '../redux/slices/hcpSlice';
import { fetchInteractions, selectAllInteractions, selectInteractionLoading } from '../redux/slices/interactionSlice';
import StatCard from '../components/StatCard';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';

const Dashboard: React.FC = () => {
  const dispatch = useAppDispatch();
  const hcps = useAppSelector(selectAllHCPs);
  const hcpLoading = useAppSelector(selectHCPLoading);
  const hcpError = useAppSelector(s => s.hcp.error);
  const interactions = useAppSelector(selectAllInteractions);
  const interactionLoading = useAppSelector(selectInteractionLoading);
  const interactionError = useAppSelector(s => s.interaction.error);

  useEffect(() => {
    dispatch(fetchHCPs());
    dispatch(fetchInteractions());
  }, [dispatch]);

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const totalHCPs = hcps.length;
  const activeHCPs = hcps.filter(h => h.active !== false).length;
  const inactiveHCPs = hcps.filter(h => h.active === false).length;
  const newThisMonth = hcps.filter(h => new Date(h.createdAt) >= monthStart).length;

  const today = now.toISOString().split('T')[0];
  const pendingInteractions = interactions.filter(i => !i.outcomes?.length).length;
  const upcomingFollowUps = interactions.filter(
    i => i.followUp && i.followUp >= today
  ).length;

  const error = hcpError || interactionError;
  const loading = hcpLoading || interactionLoading;

  return (
    <div>
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.25rem' }}>Dashboard</h1>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
          Overview of your HCP CRM
        </p>
      </div>

      {loading && hcps.length === 0 ? (
        <LoadingSpinner />
      ) : error ? (
        <ErrorMessage
          message={error}
          onRetry={() => {
            dispatch(fetchHCPs());
            dispatch(fetchInteractions());
          }}
        />
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
          gap: '1rem',
        }}>
          <StatCard
            label="Total HCPs"
            value={totalHCPs}
            icon={<span style={{ fontSize: '1.1rem' }}>H</span>}
          />
          <StatCard
            label="Active HCPs"
            value={activeHCPs}
            icon={<span style={{ fontSize: '1.1rem' }}>A</span>}
            color="var(--color-success)"
            bg="var(--color-success-light)"
          />
          <StatCard
            label="Inactive HCPs"
            value={inactiveHCPs}
            icon={<span style={{ fontSize: '1.1rem' }}>I</span>}
            color="var(--color-error)"
            bg="var(--color-error-light)"
          />
          <StatCard
            label="New This Month"
            value={newThisMonth}
            icon={<span style={{ fontSize: '1.1rem' }}>N</span>}
            color="var(--color-info)"
            bg="var(--color-info-light)"
          />
          <StatCard
            label="Pending Interactions"
            value={pendingInteractions}
            icon={<span style={{ fontSize: '1.1rem' }}>P</span>}
            color="var(--color-warning)"
            bg="var(--color-warning-light)"
          />
          <StatCard
            label="Upcoming Follow-ups"
            value={upcomingFollowUps}
            icon={<span style={{ fontSize: '1.1rem' }}>F</span>}
            color="var(--color-info)"
            bg="var(--color-info-light)"
          />
        </div>
      )}
    </div>
  );
};

export default Dashboard;
