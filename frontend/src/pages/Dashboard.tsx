import React, { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../hooks';
import { fetchHCPs, selectAllHCPs, selectHCPLoading } from '../redux/slices/hcpSlice';
import { fetchInteractions, selectAllInteractions, selectInteractionLoading } from '../redux/slices/interactionSlice';
import StatCard from '../components/StatCard';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import EmptyState from '../components/EmptyState';

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

  const today = new Date().toISOString().split('T')[0];

  const totalHCPs = hcps.length;
  const totalInteractions = interactions.length;
  const todayInteractions = interactions.filter(i => i.interactionDate && i.interactionDate.startsWith(today)).length;

  const hcpsNeedingFollowUp = new Set(
    interactions
      .filter(i => i.followUpDate && i.followUpDate.length > 0)
      .map(i => i.hcpId)
  ).size;

  const recentInteractions = [...interactions]
    .sort((a, b) => {
      const da = a.interactionDate || a.createdAt;
      const db = b.interactionDate || b.createdAt;
      return new Date(db).getTime() - new Date(da).getTime();
    })
    .slice(0, 5);

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
        <>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
            gap: '1rem',
            marginBottom: '2rem',
          }}>
            <StatCard
              label="Total HCPs"
              value={totalHCPs}
              icon={<span style={{ fontSize: '1.1rem' }}>H</span>}
            />
            <StatCard
              label="Total Interactions"
              value={totalInteractions}
              icon={<span style={{ fontSize: '1.1rem' }}>I</span>}
              color="var(--color-info)"
              bg="var(--color-info-light)"
            />
            <StatCard
              label="Today's Interactions"
              value={todayInteractions}
              icon={<span style={{ fontSize: '1.1rem' }}>T</span>}
              color="var(--color-success)"
              bg="var(--color-success-light)"
            />
            <StatCard
              label="HCPs Needing Follow-up"
              value={hcpsNeedingFollowUp}
              icon={<span style={{ fontSize: '1.1rem' }}>F</span>}
              color="var(--color-warning)"
              bg="var(--color-warning-light)"
            />
          </div>

          <div style={{
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-lg)',
            padding: '1.25rem',
          }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1rem' }}>
              Recent Interactions
            </h2>
            {recentInteractions.length === 0 ? (
              <EmptyState
                title="No interactions yet"
                description="Record your first interaction to see it here"
              />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {recentInteractions.map(interaction => {
                  const hcp = hcps.find(h => h.id === interaction.hcpId);
                  return (
                    <div
                      key={interaction.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '0.75rem',
                        borderRadius: 'var(--radius)',
                        background: 'var(--color-bg)',
                        gap: '1rem',
                      }}
                    >
                      <div>
                        <span style={{ fontWeight: 500, fontSize: '0.9rem' }}>
                          {hcp?.name || interaction.hcpId}
                        </span>
                        <span style={{
                          marginLeft: '0.5rem',
                          padding: '0.125rem 0.375rem',
                          borderRadius: '999px',
                          fontSize: '0.7rem',
                          fontWeight: 500,
                          background: 'var(--color-primary-light)',
                          color: 'var(--color-primary)',
                          textTransform: 'capitalize',
                        }}>
                          {interaction.interactionType}
                        </span>
                      </div>
                      <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                        {new Date(interaction.interactionDate || interaction.createdAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default Dashboard;
