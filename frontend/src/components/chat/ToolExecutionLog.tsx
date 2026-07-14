import React from 'react';
import { CheckCircle2, Loader2, Wrench } from 'lucide-react';

const FIELD_LABELS: Record<string, string> = {
  hcp_name: 'HCP Name',
  interaction_date: 'Date',
  interaction_time: 'Time',
  interaction_type: 'Interaction Type',
  hospital: 'Hospital',
  specialization: 'Specialization',
  products_discussed: 'Topics Discussed',
  discussion_notes: 'Discussion Notes',
  materials_shared: 'Materials Shared',
  samples_provided: 'Samples Distributed',
  sentiment: 'Sentiment',
  priority: 'Priority',
  follow_up_required: 'Follow-up Required',
  follow_up_date: 'Follow-up Date',
  tags: 'Tags',
  attendees: 'Attendees',
  interaction_summary: 'Summary',
  interaction_status: 'Status',
};

interface ToolExecutionLogProps {
  toolName: string;
  status: string;
  updatedFields: string[];
}

const ToolExecutionLog: React.FC<ToolExecutionLogProps> = ({ toolName, status, updatedFields }) => {
  if (!toolName && status !== 'thinking') return null;

  const displayName = toolName.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <div
      style={{
        margin: '8px 16px',
        padding: '10px 12px',
        borderRadius: 8,
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        fontSize: 12,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6, fontWeight: 600, color: 'var(--color-text)' }}>
        <Wrench size={13} style={{ color: 'var(--color-primary)' }} />
        <span>Tool: {displayName}</span>
        {status === 'thinking' && (
          <Loader2 size={12} style={{ animation: 'spin 1s linear infinite', color: 'var(--color-primary)' }} />
        )}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {updatedFields.map((field) => (
          <div
            key={field}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              color: 'var(--color-text-muted)',
              fontSize: 11,
            }}
          >
            <CheckCircle2 size={12} style={{ color: 'var(--color-success)', flexShrink: 0 }} />
            <span>
              {FIELD_LABELS[field] || field} populated
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ToolExecutionLog;
