import React from 'react';

interface SentimentSelectorProps {
  value: string;
  onChange: (value: string) => void;
}

const SENTIMENTS = [
  { value: 'positive', label: 'Positive' },
  { value: 'neutral', label: 'Neutral' },
  { value: 'negative', label: 'Negative' },
];

const SentimentSelector: React.FC<SentimentSelectorProps> = ({ value, onChange }) => (
  <div style={{ display: 'flex', gap: 16 }}>
    {SENTIMENTS.map((s) => (
      <label
        key={s.value}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          fontSize: 13,
          color: 'var(--color-text)',
          cursor: 'pointer',
        }}
      >
        <input
          type="radio"
          name="sentiment"
          value={s.value}
          checked={value === s.value}
          onChange={() => onChange(s.value)}
          style={{ accentColor: 'var(--color-primary)', cursor: 'pointer' }}
        />
        {s.label}
      </label>
    ))}
  </div>
);

export default SentimentSelector;
