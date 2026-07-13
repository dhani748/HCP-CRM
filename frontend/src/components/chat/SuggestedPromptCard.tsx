import React from 'react';

const SuggestedPromptCard: React.FC = () => (
  <div
    style={{
      margin: '12px 16px',
      padding: '12px 14px',
      background: 'var(--color-primary-light)',
      border: '1px solid var(--color-primary-light)',
      borderRadius: 8,
    }}
  >
    <p style={{ margin: 0, fontSize: 12, fontWeight: 500, color: 'var(--color-primary)', marginBottom: 4 }}>
      Log interaction details here
    </p>
    <p style={{ margin: 0, fontSize: 11, color: 'var(--color-primary)', lineHeight: 1.5 }}>
      Examples:
      <br />
      &quot;Met Dr. Smith, discussed Product X.
      <br />
      Positive response. Requested brochure. Follow-up next week.&quot;
    </p>
  </div>
);

export default SuggestedPromptCard;
