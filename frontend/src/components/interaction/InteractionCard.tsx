import React from 'react';
import { useAppDispatch, useAppSelector } from '../../hooks';
import {
  selectCurrentInteraction,
  saveCurrentInteraction,
  selectInteractionSaving,
  resetForm,
} from '../../redux/slices/interactionSlice';
import { selectEditingSession, clearSession, startCreateSession } from '../../redux/slices/editingSessionSlice';
import { showToast } from '../../redux/slices/uiSlice';
import InteractionHeader from './InteractionHeader';
import InteractionForm from './InteractionForm';

const InteractionCard: React.FC = () => {
  const dispatch = useAppDispatch();
  const interaction = useAppSelector(selectCurrentInteraction);
  const session = useAppSelector(selectEditingSession);
  const saving = useAppSelector(selectInteractionSaving);

  const isActive = session.mode !== 'idle';

  const handleSave = async () => {
    try {
      await dispatch(saveCurrentInteraction()).unwrap();
      dispatch(showToast({ message: 'Interaction saved successfully', type: 'success' }));
      dispatch(clearSession());
      dispatch(resetForm());
    } catch (err) {
      dispatch(showToast({
        message: typeof err === 'string' ? err : 'Failed to save interaction',
        type: 'error',
      }));
    }
  };

  const handleStartNew = () => {
    dispatch(resetForm());
    dispatch(startCreateSession());
  };

  const footerStyle: React.CSSProperties = {
    padding: '12px 24px',
    borderTop: '1px solid var(--color-border)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    fontSize: 11,
    color: 'var(--color-text-muted)',
  };

  const sessionBarStyle: React.CSSProperties = {
    padding: '8px 16px',
    background: session.mode === 'edit' ? 'var(--color-info-light)' : 'var(--color-success-light)',
    borderBottom: '1px solid ' + (session.mode === 'edit' ? 'var(--color-info-light)' : 'var(--color-success-light)'),
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    fontSize: 13,
    fontWeight: 500,
    color: session.mode === 'edit' ? 'var(--color-primary)' : 'var(--color-success)',
  };

  return (
    <div
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: 8,
        overflow: 'hidden',
      }}
    >
      <InteractionHeader />
      {isActive && (
        <div style={sessionBarStyle}>
          <span>
            {session.mode === 'create'
              ? 'Creating new interaction'
              : `Editing interaction #${session.interactionId}`}
          </span>
          <button
            onClick={() => { dispatch(clearSession()); dispatch(resetForm()); }}
            style={{
              background: 'transparent',
              border: 'none',
              color: session.mode === 'edit' ? 'var(--color-primary)' : 'var(--color-success)',
              fontSize: 12,
              fontWeight: 500,
              cursor: 'pointer',
              textDecoration: 'underline',
            }}
          >
            Cancel
          </button>
        </div>
      )}
      <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
        {isActive ? (
          <InteractionForm />
        ) : (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              padding: 40,
              textAlign: 'center',
            }}
          >
            <p style={{ fontSize: 14, fontWeight: 500, color: 'var(--color-text-muted)', marginBottom: 12 }}>
              No Active Session
            </p>
            <p style={{ fontSize: 12, color: 'var(--color-text-muted)', maxWidth: 300, marginBottom: 20 }}>
              Click below to start a new interaction session. The AI Assistant on the right will guide you through.
            </p>
            <button
              onClick={handleStartNew}
              style={{
                padding: '10px 24px',
                background: 'var(--color-primary)',
                color: 'var(--color-text-inverse)',
                border: 'none',
                borderRadius: 8,
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Record Interaction
            </button>
          </div>
        )}
      </div>
      {isActive && (
        <div style={footerStyle}>
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              padding: '6px 20px',
              background: saving ? 'var(--color-text-muted)' : 'var(--color-primary)',
              color: 'var(--color-text-inverse)',
              border: 'none',
              borderRadius: 6,
              fontSize: 13,
              fontWeight: 600,
              cursor: saving ? 'not-allowed' : 'pointer',
            }}
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
          <span>
            Last Updated:{' '}
            <strong>
              {interaction.lastUpdated
                ? new Date(interaction.lastUpdated).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })
                : '---'}
            </strong>
          </span>
          <span>
            AI Confidence:{' '}
            <strong>
              {interaction.aiConfidenceScore != null
                ? `${Math.round(interaction.aiConfidenceScore * 100)}%`
                : '---'}
            </strong>
          </span>
        </div>
      )}
    </div>
  );
};

export default InteractionCard;
