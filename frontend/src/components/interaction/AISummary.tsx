import React from 'react';

interface AISummaryProps {
  aiSuggestedFollowUp: string;
  aiGeneratedSummary: string;
  onChangeSuggested: (val: string) => void;
  onChangeSummary: (val: string) => void;
}

const AISummary: React.FC<AISummaryProps> = ({
  aiSuggestedFollowUp,
  aiGeneratedSummary,
  onChangeSuggested,
  onChangeSummary,
}) => (
  <>
    <div>
      <label style={labelStyle}>AI Suggested Follow-up</label>
      <textarea
        value={aiSuggestedFollowUp}
        onChange={(e) => onChangeSuggested(e.target.value)}
        rows={2}
        style={textareaStyle}
        placeholder="AI-generated follow-up suggestions..."
      />
    </div>
    <div>
      <label style={labelStyle}>AI Generated Summary</label>
      <textarea
        value={aiGeneratedSummary}
        onChange={(e) => onChangeSummary(e.target.value)}
        rows={3}
        style={textareaStyle}
        placeholder="AI-generated interaction summary..."
      />
    </div>
  </>
);

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 12,
  fontWeight: 500,
  color: 'var(--color-text-muted)',
  marginBottom: 4,
};

const textareaStyle: React.CSSProperties = {
  width: '100%',
  padding: '8px 10px',
  fontSize: 13,
  color: 'var(--color-text)',
  border: '1px solid var(--color-border)',
  borderRadius: 6,
  background: 'var(--color-surface)',
  resize: 'vertical',
  outline: 'none',
  boxSizing: 'border-box',
  fontFamily: 'inherit',
};

export default AISummary;
