import React, { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../../hooks';
import {
  createInteraction,
  updateInteraction,
  selectInteractionSaving,
} from '../../redux/slices/interactionSlice';
import { selectAllHCPs, fetchHCPs } from '../../redux/slices/hcpSlice';
import { showToast } from '../../redux/slices/uiSlice';
import type { Interaction } from '../../types';

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

  const [hcpId, setHcpId] = useState(interaction?.hcpId || '');
  const [interactionType, setInteractionType] = useState(interaction?.interactionType || 'call');
  const [date, setDate] = useState(interaction?.date || new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState(interaction?.time || '');
  const [discussion, setDiscussion] = useState(interaction?.discussion?.join('\n') || '');
  const [outcomes, setOutcomes] = useState(interaction?.outcomes?.join('\n') || '');
  const [followUp, setFollowUp] = useState(interaction?.followUp || '');
  const [sentiment, setSentiment] = useState<Interaction['sentiment']>(interaction?.sentiment || 'neutral');
  const [summary, setSummary] = useState(interaction?.summary || '');

  useEffect(() => {
    if (hcps.length === 0) {
      dispatch(fetchHCPs());
    }
  }, [dispatch, hcps.length]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hcpId) return;

    const data = {
      hcpId,
      interactionType,
      date,
      time: time || undefined,
      discussion: discussion.split('\n').filter(Boolean),
      outcomes: outcomes.split('\n').filter(Boolean),
      followUp: followUp || undefined,
      sentiment: sentiment as Interaction['sentiment'],
      summary: summary || undefined,
    };

    if (interaction) {
      await dispatch(updateInteraction({ id: interaction.id, data }));
      dispatch(showToast({ message: 'Interaction updated', type: 'success' }));
    } else {
      await dispatch(createInteraction(data));
      dispatch(showToast({ message: 'Interaction recorded', type: 'success' }));
    }

    onSuccess();
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
          style={inputStyle}
        >
          <option value="">Select an HCP</option>
          {hcps.map(h => (
            <option key={h.id} value={h.id}>{h.name}</option>
          ))}
        </select>
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
                color: interactionType === type ? '#fff' : 'var(--color-text-muted)',
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
            value={date}
            onChange={e => setDate(e.target.value)}
            style={inputStyle}
          />
        </div>
        <div>
          <label style={labelStyle}>Time</label>
          <input
            type="time"
            value={time}
            onChange={e => setTime(e.target.value)}
            style={inputStyle}
          />
        </div>
      </div>

      <div>
        <label style={labelStyle}>Sentiment</label>
        <select
          value={sentiment}
          onChange={e => setSentiment(e.target.value as Interaction['sentiment'])}
          style={inputStyle}
        >
          <option value="positive">Positive</option>
          <option value="neutral">Neutral</option>
          <option value="negative">Negative</option>
        </select>
      </div>

      <div>
        <label style={labelStyle}>Discussion (one per line)</label>
        <textarea
          value={discussion}
          onChange={e => setDiscussion(e.target.value)}
          style={{ ...inputStyle, minHeight: 60, resize: 'vertical' }}
          placeholder="Discussed treatment options..."
        />
      </div>

      <div>
        <label style={labelStyle}>Outcomes (one per line)</label>
        <textarea
          value={outcomes}
          onChange={e => setOutcomes(e.target.value)}
          style={{ ...inputStyle, minHeight: 60, resize: 'vertical' }}
          placeholder="Sample provided..."
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
        <div>
          <label style={labelStyle}>Follow-up Date</label>
          <input
            type="date"
            value={followUp}
            onChange={e => setFollowUp(e.target.value)}
            style={inputStyle}
          />
        </div>
        <div>
          <label style={labelStyle}>Summary</label>
          <input
            value={summary}
            onChange={e => setSummary(e.target.value)}
            style={inputStyle}
            placeholder="Brief summary"
          />
        </div>
      </div>

      <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
        <button
          type="button"
          onClick={onCancel}
          disabled={saving}
          style={buttonSecondaryStyle}
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={saving || !hcpId}
          style={{
            ...buttonPrimaryStyle,
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

const buttonSecondaryStyle: React.CSSProperties = {
  padding: '0.5rem 1rem',
  background: 'transparent',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius)',
  color: 'var(--color-text)',
  fontSize: '0.875rem',
};

const buttonPrimaryStyle: React.CSSProperties = {
  padding: '0.5rem 1rem',
  background: 'var(--color-primary)',
  border: 'none',
  borderRadius: 'var(--radius)',
  color: '#fff',
  fontSize: '0.875rem',
  fontWeight: 500,
};

export default InteractionForm;
