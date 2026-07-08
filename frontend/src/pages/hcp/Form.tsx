import React, { useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../hooks';
import { createHCP, updateHCP, selectHCPSaving } from '../../redux/slices/hcpSlice';
import { showToast } from '../../redux/slices/uiSlice';
import type { HCP } from '../../types';

interface HCPFormProps {
  hcp?: HCP | null;
  onSuccess: () => void;
  onCancel: () => void;
}

const HCPForm: React.FC<HCPFormProps> = ({ hcp, onSuccess, onCancel }) => {
  const dispatch = useAppDispatch();
  const saving = useAppSelector(selectHCPSaving);

  const [name, setName] = useState(hcp?.name || '');
  const [specialty, setSpecialty] = useState(hcp?.specialty || '');
  const [hospital, setHospital] = useState(hcp?.hospital || '');
  const [city, setCity] = useState(hcp?.city || '');
  const [email, setEmail] = useState(hcp?.email || '');
  const [phone, setPhone] = useState(hcp?.phone || '');
  const [active, setActive] = useState(hcp?.active !== false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const data = {
      name: name.trim(),
      specialty: specialty.trim() || undefined,
      hospital: hospital.trim() || undefined,
      city: city.trim() || undefined,
      email: email.trim() || undefined,
      phone: phone.trim() || undefined,
      active,
    };

    if (hcp) {
      await dispatch(updateHCP({ id: hcp.id, data }));
      dispatch(showToast({ message: 'HCP updated successfully', type: 'success' }));
    } else {
      await dispatch(createHCP(data));
      dispatch(showToast({ message: 'HCP created successfully', type: 'success' }));
    }

    onSuccess();
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div>
        <label style={labelStyle}>
          Name <span style={{ color: 'var(--color-error)' }}>*</span>
        </label>
        <input
          value={name}
          onChange={e => setName(e.target.value)}
          required
          style={inputStyle}
          placeholder="Dr. John Doe"
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
        <div>
          <label style={labelStyle}>Specialty</label>
          <input
            value={specialty}
            onChange={e => setSpecialty(e.target.value)}
            style={inputStyle}
            placeholder="Cardiology"
          />
        </div>
        <div>
          <label style={labelStyle}>Hospital</label>
          <input
            value={hospital}
            onChange={e => setHospital(e.target.value)}
            style={inputStyle}
            placeholder="General Hospital"
          />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
        <div>
          <label style={labelStyle}>City</label>
          <input
            value={city}
            onChange={e => setCity(e.target.value)}
            style={inputStyle}
            placeholder="New York"
          />
        </div>
        <div>
          <label style={labelStyle}>Phone</label>
          <input
            value={phone}
            onChange={e => setPhone(e.target.value)}
            style={inputStyle}
            placeholder="+1 555-0123"
          />
        </div>
      </div>

      <div>
        <label style={labelStyle}>Email</label>
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          style={inputStyle}
          placeholder="john@hospital.com"
        />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <input
          type="checkbox"
          id="active"
          checked={active}
          onChange={e => setActive(e.target.checked)}
          style={{ width: 16, height: 16 }}
        />
        <label htmlFor="active" style={{ fontSize: '0.875rem' }}>Active</label>
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
          disabled={saving || !name.trim()}
          style={{
            padding: '0.5rem 1rem',
            background: 'var(--color-primary)',
            border: 'none',
            borderRadius: 'var(--radius)',
            color: '#fff',
            fontSize: '0.875rem',
            fontWeight: 500,
            opacity: saving || !name.trim() ? 0.6 : 1,
          }}
        >
          {saving ? 'Saving...' : hcp ? 'Update HCP' : 'Create HCP'}
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

export default HCPForm;
