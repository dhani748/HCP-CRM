import React, { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../../hooks';
import {
  createInteraction,
  updateInteraction,
  selectInteractionSaving,
} from '../../redux/slices/interactionSlice';
import { selectAllHCPs, fetchHCPs } from '../../redux/slices/hcpSlice';
import { showToast } from '../../redux/slices/uiSlice';
import { clearExtraction } from '../../redux/slices/aiExtractSlice';
import type { Interaction } from '../../types';
import type { ExtractedInteraction } from '../../services/aiService';

interface InteractionFormProps {
  interaction?: Interaction | null;
  onSuccess: () => void;
  onCancel: () => void;
}

const interactionTypes = ['call', 'visit', 'email', 'meeting'];

const InteractionForm: React.FC<InteractionFormProps> = ({ interaction, onSuccess, onCancel }) => {
  const dispatch = useAppDispatch();
  const saving = useAppSelector(selectInteractionSaving);
  const hcps = useAppSelector(selectAllHCPs);
  const extracted = useAppSelector(state => state.aiExtract?.extractedInteraction);

  const [hcpId, setHcpId] = useState(interaction?.hcpId || '');
  const [interactionType, setInteractionType] = useState(interaction?.interactionType || 'call');
  const [interactionDate, setInteractionDate] = useState(interaction?.interactionDate || new Date().toISOString().split('T')[0]);
  const [interactionTime, setInteractionTime] = useState(interaction?.interactionTime || '');
  const [discussionNotes, setDiscussionNotes] = useState(interaction?.discussionNotes || '');
  const [followUpDate, setFollowUpDate] = useState(interaction?.followUpDate || '');
  const [sentiment, setSentiment] = useState(interaction?.sentiment || 'neutral');
  const [interactionSummary, setInteractionSummary] = useState(interaction?.interactionSummary || '');
  const [interactionStatus, setInteractionStatus] = useState(interaction?.interactionStatus || 'draft');
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (hcps.length === 0) {
      dispatch(fetchHCPs());
    }
  }, [dispatch, hcps.length]);

  useEffect(() => {
    if (!extracted || interaction) return;

    if (extracted.hcpName) {
      const match = hcps.find(h =>
        h.name.toLowerCase().includes(extracted.hcpName.toLowerCase().replace(/^dr\.?\s*/i, ''))
        || extracted.hcpName.toLowerCase().includes(h.name.toLowerCase())
      );
      if (match) {
        setHcpId(match.id);
      }
    }

    if (extracted.interactionType && interactionTypes.includes(extracted.interactionType)) {
      setInteractionType(extracted.interactionType);
    }

    if (extracted.date) {
      setInteractionDate(extracted.date);
    }

    if (extracted.time) {
      setInteractionTime(extracted.time);
    }

    if (extracted.sentiment && ['positive', 'neutral', 'negative'].includes(extracted.sentiment)) {
      setSentiment(extracted.sentiment);
    }

    if (extracted.summary) {
      setInteractionSummary(prev => prev || extracted.summary);
    }

    if (extracted.discussion && extracted.discussion.length > 0) {
      setDiscussionNotes(prev => prev || extracted.discussion.join('\n'));
    }

    if (extracted.followUp) {
      setFollowUpDate(prev => prev || extracted.followUp);
    }
  }, [extracted, interaction, hcps]);

  const validate = (): boolean => {
    const next: Record<string, string> = {};
    if (!hcpId) {
      next.hcpId = 'Please select an HCP';
    }
    if (!interactionDate) {
      next.interactionDate = 'Date is required';
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const data: Record<string, unknown> = {
      hcpId,
      interactionType,
      interactionDate,
      interactionTime: interactionTime || undefined,
      discussionNotes,
      followUpDate: followUpDate || undefined,
      sentiment,
      interactionSummary: interactionSummary || undefined,
      interactionStatus,
    };

    try {
      if (interaction) {
        await dispatch(updateInteraction({ id: interaction.id, data })).unwrap();
        dispatch(showToast({ message: 'Interaction updated', type: 'success' }));
      } else {
        await dispatch(createInteraction(data as Partial<Interaction>)).unwrap();
        dispatch(showToast({ message: 'Interaction recorded', type: 'success' }));
      }
      dispatch(clearExtraction());
      onSuccess();
    } catch {
      dispatch(showToast({ message: 'Failed to save interaction', type: 'error' }));
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div>
        <label style={labelStyle}>
          HCP <span style={{ color: 'var(--color-error)' }}>*</span>
        </label>
        <select
          value={hcpId}
          onChange={e => setHcpId(e.target.value)}
          required
          style={{ ...inputStyle, borderColor: errors.hcpId ? 'var(--color-error)' : undefined }}
        >
          <option value="">Select an HCP</option>
          {hcps.map(h => (
            <option key={h.id} value={h.id}>{h.name}</option>
          ))}
        </select>
        {errors.hcpId && <span style={errorStyle}>{errors.hcpId}</span>}
      </div>

      <div>
        <label style={labelStyle}>Type</label>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {interactionTypes.map(type => (
            <button
              key={type}
              type="button"
              onClick={() => setInteractionType(type)}
              style={{
                padding: '0.375rem 0.75rem',
                borderRadius: '999px',
                border: '1px solid var(--color-border)',
                background: interactionType === type ? 'var(--color-primary)' : 'transparent',
                color: interactionType === type ? 'var(--color-text-inverse)' : 'var(--color-text-muted)',
                fontSize: '0.8rem',
                fontWeight: 500,
                textTransform: 'capitalize',
              }}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
        <div>
          <label style={labelStyle}>Date</label>
          <input
            type="date"
            value={interactionDate}
            onChange={e => setInteractionDate(e.target.value)}
            style={inputStyle}
          />
        </div>
        <div>
          <label style={labelStyle}>Time</label>
          <input
            type="time"
            value={interactionTime}
            onChange={e => setInteractionTime(e.target.value)}
            style={inputStyle}
          />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
        <div>
          <label style={labelStyle}>Status</label>
          <select
            value={interactionStatus}
            onChange={e => setInteractionStatus(e.target.value)}
            style={inputStyle}
          >
            <option value="completed">Completed</option>
            <option value="draft">Draft</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
        <div>
          <label style={labelStyle}>Sentiment</label>
          <select
            value={sentiment}
            onChange={e => setSentiment(e.target.value)}
            style={inputStyle}
          >
            <option value="positive">Positive</option>
            <option value="neutral">Neutral</option>
            <option value="negative">Negative</option>
          </select>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
        <div>
          <label style={labelStyle}>Follow-up Date</label>
          <input
            type="date"
            value={followUpDate}
            onChange={e => setFollowUpDate(e.target.value)}
            style={inputStyle}
          />
        </div>
        <div>
          <label style={labelStyle}>Summary</label>
          <input
            value={interactionSummary}
            onChange={e => setInteractionSummary(e.target.value)}
            style={inputStyle}
            placeholder="Brief summary"
          />
        </div>
      </div>

      <div>
        <label style={labelStyle}>Discussion Notes</label>
        <textarea
          value={discussionNotes}
          onChange={e => setDiscussionNotes(e.target.value)}
          style={{ ...inputStyle, minHeight: 60, resize: 'vertical' }}
          placeholder="Discussed treatment options..."
        />
      </div>

      <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
        <button
          type="button"
          onClick={onCancel}
          disabled={saving}
          style={{
            padding: '0.5rem 1rem',
            background: 'transparent',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius)',
            color: 'var(--color-text)',
            fontSize: '0.875rem',
          }}
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={saving || !hcpId}
          style={{
            padding: '0.5rem 1rem',
            background: 'var(--color-primary)',
            border: 'none',
            borderRadius: 'var(--radius)',
            color: 'var(--color-text-inverse)',
            fontSize: '0.875rem',
            fontWeight: 500,
            opacity: saving || !hcpId ? 0.6 : 1,
          }}
        >
          {saving ? 'Saving...' : interaction ? 'Update' : 'Record'}
        </button>
      </div>
    </form>
  );
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '0.8rem',
  fontWeight: 500,
  marginBottom: '0.375rem',
  color: 'var(--color-text-muted)',
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '0.5rem 0.75rem',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius)',
  background: 'var(--color-bg)',
  color: 'var(--color-text)',
  fontSize: '0.875rem',
};

const errorStyle: React.CSSProperties = {
  color: 'var(--color-error)',
  fontSize: '0.75rem',
  marginTop: '0.25rem',
};

export default InteractionForm;
