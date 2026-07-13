import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../hooks';
import {
  fetchInteractions,
  deleteInteraction,
  selectAllInteractions,
  selectInteractionLoading,
  selectInteractionSaving,
  setCurrentInteraction,
} from '../../redux/slices/interactionSlice';
import { startCreateSession, startEditSession } from '../../redux/slices/editingSessionSlice';
import { selectAllHCPs, fetchHCPs } from '../../redux/slices/hcpSlice';
import { showToast } from '../../redux/slices/uiSlice';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorMessage from '../../components/ErrorMessage';
import EmptyState from '../../components/EmptyState';
import ConfirmDialog from '../../components/ConfirmDialog';
import type { Interaction } from '../../types';

const typeIcons: Record<string, string> = {
  call: 'C',
  visit: 'V',
  email: 'E',
  meeting: 'M',
};

const typeColors: Record<string, string> = {
  call: 'var(--color-info)',
  visit: 'var(--color-success)',
  email: 'var(--color-warning)',
  meeting: 'var(--color-primary)',
};

const typeBgs: Record<string, string> = {
  call: 'var(--color-info-light)',
  visit: 'var(--color-success-light)',
  email: 'var(--color-warning-light)',
  meeting: 'var(--color-primary-light)',
};

type QuickFilter = 'all' | 'today' | 'pending-followup' | 'completed';

const InteractionList: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const interactions = useAppSelector(selectAllInteractions);
  const loading = useAppSelector(selectInteractionLoading);
  const saving = useAppSelector(selectInteractionSaving);
  const error = useAppSelector(s => s.interaction.error);
  const hcps = useAppSelector(selectAllHCPs);

  const [deleteTarget, setDeleteTarget] = useState<Interaction | null>(null);
  const [typeFilter, setTypeFilter] = useState('');
  const [quickFilter, setQuickFilter] = useState<QuickFilter>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    const params: Record<string, string> = {};
    if (quickFilter === 'today') {
      params.startDate = new Date().toISOString().split('T')[0];
    }
    if (startDate && endDate) {
      params.startDate = startDate;
      params.endDate = endDate;
    }
    if (typeFilter) {
      params.interactionType = typeFilter;
    }
    dispatch(fetchInteractions(params));
    dispatch(fetchHCPs());
  }, [dispatch, quickFilter, startDate, endDate, typeFilter]);

  const getHCPName = (hcpId: string | number) => {
    const id = String(hcpId);
    const hcp = hcps.find(h => String(h.id) === id);
    return hcp?.name || id;
  };

  const filtered = interactions.filter(i => {
    if (quickFilter === 'pending-followup' && !i.followUpDate) return false;
    if (quickFilter === 'completed' && i.interactionStatus !== 'completed') return false;
    return true;
  });

  const sorted = [...filtered].sort(
    (a, b) => new Date(b.interactionDate || b.createdAt).getTime() - new Date(a.interactionDate || a.createdAt).getTime()
  );

  const openCreate = () => {
    dispatch(setCurrentInteraction(null));
    dispatch(startCreateSession());
    navigate('/');
  };

  const openEdit = (interaction: Interaction) => {
    dispatch(setCurrentInteraction(interaction));
    dispatch(startEditSession(Number(interaction.id)));
    navigate('/');
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await dispatch(deleteInteraction(deleteTarget.id)).unwrap();
      dispatch(showToast({ message: 'Interaction deleted', type: 'success' }));
      setDeleteTarget(null);
    } catch {
      dispatch(showToast({ message: 'Failed to delete interaction', type: 'error' }));
    }
  };

  if (loading && interactions.length === 0) return <LoadingSpinner />;
  if (error && interactions.length === 0) {
    return <ErrorMessage message={error} onRetry={() => dispatch(fetchInteractions())} />;
  }

  return (
    <div>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '1.5rem',
      }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.25rem' }}>
            Interactions
          </h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
            {sorted.length} interactions recorded
          </p>
        </div>
        <button
          onClick={openCreate}
          style={{
            padding: '0.5rem 1rem',
            background: 'var(--color-primary)',
            color: 'var(--color-text-inverse)',
            border: 'none',
            borderRadius: 'var(--radius)',
            fontWeight: 500,
            fontSize: '0.875rem',
          }}
        >
          Record Interaction
        </button>
      </div>

      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap' }}>
          {(['all', 'today', 'pending-followup', 'completed'] as QuickFilter[]).map(f => (
            <button
              key={f}
              onClick={() => { setQuickFilter(f); setStartDate(''); setEndDate(''); }}
              style={{
                padding: '0.375rem 0.75rem',
                borderRadius: '999px',
                border: '1px solid var(--color-border)',
                background: quickFilter === f ? 'var(--color-primary)' : 'transparent',
                color: quickFilter === f ? 'var(--color-text-inverse)' : 'var(--color-text-muted)',
                fontSize: '0.8rem',
                fontWeight: 500,
                cursor: 'pointer',
              }}
            >
              {f === 'all' ? 'All' : f === 'today' ? 'Today' : f === 'pending-followup' ? 'Pending Follow-up' : 'Completed'}
            </button>
          ))}
        </div>
        <input
          type="date"
          value={startDate}
          onChange={e => { setStartDate(e.target.value); setQuickFilter('all'); }}
          style={{
            padding: '0.375rem 0.5rem',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius)',
            background: 'var(--color-surface)',
            color: 'var(--color-text)',
            fontSize: '0.8rem',
          }}
          placeholder="Start date"
        />
        <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>to</span>
        <input
          type="date"
          value={endDate}
          onChange={e => { setEndDate(e.target.value); setQuickFilter('all'); }}
          style={{
            padding: '0.375rem 0.5rem',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius)',
            background: 'var(--color-surface)',
            color: 'var(--color-text)',
            fontSize: '0.8rem',
          }}
          placeholder="End date"
        />
        <select
          value={typeFilter}
          onChange={e => setTypeFilter(e.target.value)}
          style={{
            padding: '0.375rem 0.5rem',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius)',
            background: 'var(--color-surface)',
            color: 'var(--color-text)',
            fontSize: '0.8rem',
          }}
        >
          <option value="">All Types</option>
          <option value="call">Call</option>
          <option value="visit">Visit</option>
          <option value="email">Email</option>
          <option value="meeting">Meeting</option>
        </select>
      </div>

      {sorted.length === 0 ? (
        <EmptyState
          title="No interactions yet"
          description="Record your first call, visit, email, or meeting"
          action={
            <button
              onClick={openCreate}
              style={{
                padding: '0.5rem 1rem',
                background: 'var(--color-primary)',
                color: 'var(--color-text-inverse)',
                border: 'none',
                borderRadius: 'var(--radius)',
                fontWeight: 500,
                fontSize: '0.875rem',
                marginTop: '0.5rem',
              }}
            >
              Record Interaction
            </button>
          }
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {sorted.map(interaction => {
            const type = interaction.interactionType;
            return (
              <div
                key={interaction.id}
                style={{
                  background: 'var(--color-surface)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '1rem 1.25rem',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '1rem',
                }}
              >
                <div style={{
                  width: 40,
                  height: 40,
                  borderRadius: 'var(--radius)',
                  background: typeBgs[type] || 'var(--color-border)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: '0.8rem',
                  color: typeColors[type] || 'var(--color-text-muted)',
                  flexShrink: 0,
                  textTransform: 'uppercase',
                }}>
                  {typeIcons[type] || '?'}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    marginBottom: '0.25rem',
                    flexWrap: 'wrap',
                  }}>
                    <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>
                      {getHCPName(interaction.hcpId)}
                    </span>
                    <span style={{
                      padding: '0.125rem 0.5rem',
                      borderRadius: '999px',
                      fontSize: '0.7rem',
                      fontWeight: 500,
                      background: typeBgs[type] || 'var(--color-border)',
                      color: typeColors[type] || 'var(--color-text-muted)',
                      textTransform: 'capitalize',
                    }}>
                      {type}
                    </span>
                    <span style={{
                      padding: '0.125rem 0.5rem',
                      borderRadius: '999px',
                      fontSize: '0.7rem',
                      fontWeight: 500,
                      background: (interaction.interactionStatus || 'draft') === 'completed' ? 'var(--color-success-light)' : 'var(--color-warning-light)',
                      color: (interaction.interactionStatus || 'draft') === 'completed' ? 'var(--color-success)' : 'var(--color-warning)',
                      textTransform: 'capitalize',
                    }}>
                      {interaction.interactionStatus || 'draft'}
                    </span>
                    {interaction.sentiment && (
                      <span style={{
                        fontSize: '0.75rem',
                        color: 'var(--color-text-muted)',
                      }}>
                        {interaction.sentiment}
                      </span>
                    )}
                  </div>

                  <p style={{
                    fontSize: '0.85rem',
                    color: 'var(--color-text-muted)',
                    marginBottom: '0.25rem',
                  }}>
                    {new Date(interaction.interactionDate || interaction.createdAt).toLocaleDateString('en-US', {
                      weekday: 'short',
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                    {interaction.interactionTime ? ` at ${interaction.interactionTime}` : ''}
                  </p>

                  {interaction.discussionNotes && (
                    <p style={{ fontSize: '0.85rem', marginTop: '0.25rem' }}>
                      {interaction.discussionNotes}
                    </p>
                  )}

                  {interaction.followUpDate && (
                    <p style={{
                      fontSize: '0.8rem',
                      marginTop: '0.25rem',
                      color: 'var(--color-warning)',
                    }}>
                      Follow-up: {new Date(interaction.followUpDate).toLocaleDateString()}
                    </p>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '0.25rem', flexShrink: 0 }}>
                  <button
                    onClick={() => openEdit(interaction)}
                    style={actionBtnStyle}
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => setDeleteTarget(interaction)}
                    style={{ ...actionBtnStyle, color: 'var(--color-error)' }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Interaction"
        message="Are you sure you want to delete this interaction?"
        loading={saving}
      />
    </div>
  );
};

const actionBtnStyle: React.CSSProperties = {
  background: 'none',
  border: 'none',
  color: 'var(--color-primary)',
  fontSize: '0.8rem',
  fontWeight: 500,
  padding: '0.25rem 0.5rem',
};

export default InteractionList;
