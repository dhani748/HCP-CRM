import React from 'react';

const InteractionHeader: React.FC = () => (
  <div style={{ padding: '14px 24px', borderBottom: '1px solid var(--color-border)' }}>
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <h2 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: 'var(--color-text)' }}>
        Interaction Details
      </h2>
      <span style={{
        fontSize: 11,
        fontWeight: 600,
        color: 'var(--color-primary)',
        background: 'var(--color-primary-light)',
        padding: '3px 10px',
        borderRadius: 999,
        textTransform: 'uppercase',
        letterSpacing: '0.04em',
      }}>
        Manual + AI Assisted
      </span>
    </div>
  </div>
);

export default InteractionHeader;
