import React, { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../hooks';
import {
  fetchInteractions,
  deleteInteraction,
  selectAllInteractions,
  selectInteractionLoading,
  selectInteractionSaving,
} from '../../redux/slices/interactionSlice';
import { selectAllHCPs, fetchHCPs } from '../../redux/slices/hcpSlice';
import { showToast } from '../../redux/slices/uiSlice';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorMessage from '../../components/ErrorMessage';
import EmptyState from '../../components/EmptyState';
import Modal from '../../components/Modal';
import ConfirmDialog from '../../components/ConfirmDialog';
import InteractionForm from './Form';
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

const InteractionList: React.FC = () => {
  const dispatch = useAppDispatch();
  const interactions = useAppSelector(selectAllInteractions);
  const loading = useAppSelector(selectInteractionLoading);
  const saving = useAppSelector(selectInteractionSaving);
  const error = useAppSelector(s => s.interaction.error);
  const hcps = useAppSelector(selectAllHCPs);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Interaction | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Interaction | null>(null);
  const [typeFilter, setTypeFilter] = useState('');

  useEffect(() => {
    dispatch(fetchInteractions());
    dispatch(fetchHCPs());
  }, [dispatch]);

  const getHCPName = (hcpId: string) => {
    const hcp = hcps.find(h => h.id === hcpId);
    return hcp?.name || hcpId;
  };

  const filtered = typeFilter
    ? interactions.filter(i => i.interactionType === typeFilter)
    : interactions;

  const sorted = [...filtered].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const openEdit = (interaction: Interaction) => {
    setEditing(interaction);
    setFormOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await dispatch(deleteInteraction(deleteTarget.id));
    dispatch(showToast({ message: 'Interaction deleted', type: 'success' }));
    setDeleteTarget(null);
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
            {filtered.length} interactions recorded
          </p>
        </div>
        <button
          onClick={openCreate}
          style={{
            padding: '0.5rem 1rem',
            background: 'var(--color-primary)',
            color: '#fff',
            border: 'none',
            borderRadius: 'var(--radius)',
            fontWeight: 500,
            fontSize: '0.875rem',
          }}
        >
          Record Interaction
        </button>
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <select
          value={typeFilter}
          onChange={e => setTypeFilter(e.target.value)}
          style={{
            padding: '0.5rem 0.75rem',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius)',
            background: 'var(--color-surface)',
            color: 'var(--color-text)',
            fontSize: '0.875rem',
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
                color: '#fff',
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
                    {new Date(interaction.date).toLocaleDateString('en-US', {
                      weekday: 'short',
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                    {interaction.time ? ` at ${interaction.time}` : ''}
                  </p>

                  {interaction.discussion && interaction.discussion.length > 0 && (
                    <p style={{ fontSize: '0.85rem', marginTop: '0.25rem' }}>
                      {interaction.discussion.join(', ')}
                    </p>
                  )}

                  {interaction.followUp && (
                    <p style={{
                      fontSize: '0.8rem',
                      marginTop: '0.25rem',
                      color: 'var(--color-warning)',
                    }}>
                      Follow-up: {new Date(interaction.followUp).toLocaleDateString()}
                    </p>
                  )}

                  {interaction.outcomes && interaction.outcomes.length > 0 && (
                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
                      {interaction.outcomes.map((outcome, i) => (
                        <span
                          key={i}
                          style={{
                            fontSize: '0.75rem',
                            padding: '0.125rem 0.5rem',
                            background: 'var(--color-success-light)',
                            color: 'var(--color-success)',
                            borderRadius: '999px',
                          }}
                        >
                          {outcome}
                        </span>
                      ))}
                    </div>
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

      <Modal
        open={formOpen}
        onClose={() => { setFormOpen(false); setEditing(null); }}
        title={editing ? 'Edit Interaction' : 'Record Interaction'}
        width="520px"
      >
        <InteractionForm
          interaction={editing}
          onSuccess={() => { setFormOpen(false); setEditing(null); }}
          onCancel={() => { setFormOpen(false); setEditing(null); }}
        />
      </Modal>

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
