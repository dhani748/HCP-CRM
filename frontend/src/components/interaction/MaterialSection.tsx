import React, { useState } from 'react';

interface MaterialSectionProps {
  materials: string[];
  onChange: (materials: string[]) => void;
}

const MaterialSection: React.FC<MaterialSectionProps> = ({ materials, onChange }) => {
  const [input, setInput] = useState('');

  const addMaterial = () => {
    const val = input.trim();
    if (val) {
      onChange([...materials, val]);
      setInput('');
    }
  };

  const removeMaterial = (index: number) => {
    onChange(materials.filter((_, i) => i !== index));
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
        {materials.length > 0 ? (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {materials.map((m, i) => (
              <span
                key={i}
                style={{
                  fontSize: 12,
                  padding: '2px 8px',
                  borderRadius: 4,
                  background: 'var(--color-success-light)',
                  color: 'var(--color-success)',
                  border: '1px solid var(--color-success-light)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                {m}
                <button
                  onClick={() => removeMaterial(i)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--color-success)',
                    fontSize: 12,
                    cursor: 'pointer',
                    padding: 0,
                    lineHeight: 1,
                    opacity: 0.6,
                  }}
                >
                  x
                </button>
              </span>
            ))}
          </div>
        ) : (
          <span style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>None</span>
        )}
      </div>
      <div style={{ display: 'flex', gap: 6 }}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addMaterial(); } }}
          placeholder="Add material..."
          style={{
            flex: 1,
            padding: '4px 8px',
            fontSize: 12,
            border: '1px solid var(--color-border)',
            borderRadius: 4,
            outline: 'none',
          }}
        />
        <button
          onClick={addMaterial}
          disabled={!input.trim()}
          style={{
            fontSize: 12,
            padding: '4px 12px',
            borderRadius: 6,
            border: '1px solid var(--color-border)',
            background: input.trim() ? 'var(--color-primary)' : 'var(--color-surface)',
            color: input.trim() ? 'var(--color-text-inverse)' : 'var(--color-text-muted)',
            cursor: input.trim() ? 'pointer' : 'not-allowed',
          }}
        >
          + Add
        </button>
      </div>
    </div>
  );
};

export default MaterialSection;
