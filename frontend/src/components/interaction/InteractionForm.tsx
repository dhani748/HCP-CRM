import React from 'react';
import { useAppDispatch, useAppSelector } from '../../hooks';
import { selectCurrentInteraction, setFormField } from '../../redux/slices/interactionSlice';
import SentimentSelector from './SentimentSelector';
import MaterialSection from './MaterialSection';
import SampleSection from './SampleSection';
import AISummary from './AISummary';

const InteractionForm: React.FC = () => {
  const dispatch = useAppDispatch();
  const interaction = useAppSelector(selectCurrentInteraction);

  const set = (field: string, value: unknown) => dispatch(setFormField({ field, value }));

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '8px 10px',
    fontSize: 13,
    color: 'var(--color-text)',
    border: '1px solid var(--color-border)',
    borderRadius: 6,
    background: 'var(--color-surface)',
    boxSizing: 'border-box',
    fontFamily: 'inherit',
    outline: 'none',
  };

  const textareaStyle: React.CSSProperties = {
    ...inputStyle,
    resize: 'vertical',
  };

  const selectStyle: React.CSSProperties = {
    ...inputStyle,
    appearance: 'none',
    backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%2712%27 height=%2712%27 viewBox=%270 0 12 12%27%3E%3Cpath fill=%27%236b7280%27 d=%27M6 8L1 3h10z%27/%3E%3C/svg%3E")',
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'right 8px center',
    paddingRight: 28,
  };

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: 12,
    fontWeight: 500,
    color: 'var(--color-text-muted)',
    marginBottom: 4,
  };

  const rowStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '12px 16px',
  };

  return (
    <div style={{ padding: '16px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={rowStyle}>
        <div>
          <label style={labelStyle}>HCP Name</label>
          <input
            type="text"
            value={interaction.hcpName || ''}
            onChange={(e) => set('hcpName', e.target.value)}
            style={inputStyle}
            placeholder="e.g. Dr. Sharma"
          />
        </div>
        <div>
          <label style={labelStyle}>Interaction Type</label>
          <select
            value={interaction.interactionType || 'visit'}
            onChange={(e) => set('interactionType', e.target.value)}
            style={selectStyle}
          >
            <option value="call">Call</option>
            <option value="visit">Visit</option>
            <option value="email">Email</option>
            <option value="meeting">Meeting</option>
          </select>
        </div>
      </div>

      <div style={rowStyle}>
        <div>
          <label style={labelStyle}>Date</label>
          <input
            type="date"
            value={interaction.interactionDate ? interaction.interactionDate.split('T')[0] : ''}
            onChange={(e) => set('interactionDate', e.target.value)}
            style={inputStyle}
          />
        </div>
        <div>
          <label style={labelStyle}>Time</label>
          <input
            type="time"
            value={interaction.interactionTime || ''}
            onChange={(e) => set('interactionTime', e.target.value)}
            style={inputStyle}
          />
        </div>
      </div>

      <div>
        <label style={labelStyle}>Attendees</label>
        <input
          type="text"
          value={interaction.attendees || ''}
          onChange={(e) => set('attendees', e.target.value)}
          style={inputStyle}
          placeholder="e.g. Dr. Sharma, Nurse Priya"
        />
      </div>

      <div style={rowStyle}>
        <div>
          <label style={labelStyle}>Hospital / Clinic</label>
          <input
            type="text"
            value={interaction.hospital || ''}
            onChange={(e) => set('hospital', e.target.value)}
            style={inputStyle}
            placeholder="e.g. Apollo Hospital"
          />
        </div>
        <div>
          <label style={labelStyle}>Specialization</label>
          <input
            type="text"
            value={interaction.specialization || ''}
            onChange={(e) => set('specialization', e.target.value)}
            style={inputStyle}
            placeholder="e.g. Cardiology"
          />
        </div>
      </div>

      <div>
        <label style={labelStyle}>Topics Discussed</label>
        <textarea
          value={interaction.topicsDiscussed || ''}
          onChange={(e) => set('topicsDiscussed', e.target.value)}
          rows={2}
          style={textareaStyle}
          placeholder="e.g. New cardiac drug, patient compliance"
        />
      </div>

      <div>
        <label style={labelStyle}>Discussion Notes</label>
        <textarea
          value={interaction.discussionNotes || ''}
          onChange={(e) => set('discussionNotes', e.target.value)}
          rows={3}
          style={textareaStyle}
          placeholder="Detailed notes from the discussion..."
        />
      </div>

      <div>
        <label style={labelStyle}>Materials Shared</label>
        <MaterialSection
          materials={interaction.materialsShared || []}
          onChange={(materials) => set('materialsShared', materials)}
        />
      </div>

      <div>
        <label style={labelStyle}>Samples Distributed</label>
        <SampleSection
          samples={interaction.samplesDistributed || []}
          onChange={(samples) => set('samplesDistributed', samples)}
        />
      </div>

      <div>
        <label style={{ ...labelStyle, marginBottom: 6 }}>Observed HCP Sentiment</label>
        <SentimentSelector
          value={interaction.sentiment || 'neutral'}
          onChange={(val) => set('sentiment', val)}
        />
      </div>

      <div>
        <label style={labelStyle}>Outcomes</label>
        <textarea
          value={interaction.outcomes || ''}
          onChange={(e) => set('outcomes', e.target.value)}
          rows={2}
          style={textareaStyle}
          placeholder="Key outcomes from the interaction..."
        />
      </div>

      <div>
        <label style={labelStyle}>Follow-up Actions</label>
        <textarea
          value={interaction.followUpActions || ''}
          onChange={(e) => set('followUpActions', e.target.value)}
          rows={2}
          style={textareaStyle}
          placeholder="Actions to be taken after this interaction..."
        />
      </div>

      <div>
        <label style={labelStyle}>Follow-up Required</label>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
          <div
            onClick={() => set('followUpRequired', !interaction.followUpRequired)}
            style={{
              width: 36,
              height: 20,
              borderRadius: 10,
              background: interaction.followUpRequired ? 'var(--color-primary)' : 'var(--color-border)',
              position: 'relative',
              transition: 'background 0.2s',
              cursor: 'pointer',
            }}
          >
            <div
              style={{
                width: 16,
                height: 16,
                borderRadius: '50%',
                background: 'var(--color-surface)',
                position: 'absolute',
                top: 2,
                left: interaction.followUpRequired ? 18 : 2,
                transition: 'left 0.2s',
              }}
            />
          </div>
          <span style={{ fontSize: 13, color: 'var(--color-text)' }}>
            {interaction.followUpRequired ? 'Yes' : 'No'}
          </span>
        </div>
      </div>

      <div style={rowStyle}>
        <div>
          <label style={labelStyle}>Follow-up Date</label>
          <input
            type="date"
            value={interaction.followUpDate || ''}
            onChange={(e) => set('followUpDate', e.target.value)}
            style={inputStyle}
          />
        </div>
        <div>
          <label style={labelStyle}>Reminder Date</label>
          <input
            type="date"
            value={interaction.reminderDate || ''}
            onChange={(e) => set('reminderDate', e.target.value)}
            style={inputStyle}
          />
        </div>
      </div>

      <div style={rowStyle}>
        <div>
          <label style={labelStyle}>Priority</label>
          <select
            value={interaction.priority || 'medium'}
            onChange={(e) => set('priority', e.target.value)}
            style={selectStyle}
          >
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>
        <div>
          <label style={labelStyle}>Tags</label>
          <input
            type="text"
            value={(interaction.tags || []).join(', ')}
            onChange={(e) => set('tags', e.target.value.split(',').map((t) => t.trim()).filter(Boolean))}
            style={inputStyle}
            placeholder="e.g. key-account, new-product"
          />
        </div>
      </div>

      <AISummary
        aiSuggestedFollowUp={interaction.aiSuggestedFollowUp || ''}
        aiGeneratedSummary={interaction.aiGeneratedSummary || ''}
        onChangeSuggested={(val) => set('aiSuggestedFollowUp', val)}
        onChangeSummary={(val) => set('aiGeneratedSummary', val)}
      />
    </div>
  );
};

export default InteractionForm;
