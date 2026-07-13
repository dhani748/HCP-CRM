import React, { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../../hooks';
import { createHCP, updateHCP, selectHCPSaving } from '../../redux/slices/hcpSlice';
import { showToast } from '../../redux/slices/uiSlice';
import { clearExtraction } from '../../redux/slices/aiExtractSlice';
import type { HCP } from '../../types';

interface HCPFormProps {
  hcp?: HCP | null;
  onSuccess: () => void;
  onCancel: () => void;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const HCPForm: React.FC<HCPFormProps> = ({ hcp, onSuccess, onCancel }) => {
  const dispatch = useAppDispatch();
  const saving = useAppSelector(selectHCPSaving);
  const extractedHCP = useAppSelector(state => state.aiExtract?.extractedHCP);

  const [name, setName] = useState(hcp?.name || '');
  const [specialty, setSpecialty] = useState(hcp?.specialty || '');
  const [hospital, setHospital] = useState(hcp?.hospital || '');
  const [city, setCity] = useState(hcp?.city || '');
  const [email, setEmail] = useState(hcp?.email || '');
  const [phone, setPhone] = useState(hcp?.phone || '');
  const [active, setActive] = useState(hcp?.active !== false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!extractedHCP || hcp) return;

    if (extractedHCP.name) setName(prev => prev || extractedHCP.name);
    if (extractedHCP.specialty) setSpecialty(prev => prev || extractedHCP.specialty);
    if (extractedHCP.hospital) setHospital(prev => prev || extractedHCP.hospital);
    if (extractedHCP.city) setCity(prev => prev || extractedHCP.city);
    if (extractedHCP.email) setEmail(prev => prev || extractedHCP.email);
    if (extractedHCP.phone) setPhone(prev => prev || extractedHCP.phone);
  }, [extractedHCP, hcp]);

  const validate = (): boolean => {
    const next: Record<string, string> = {};
    if (!name.trim()) {
      next.name = 'Name is required';
    }
    if (email && !EMAIL_REGEX.test(email)) {
      next.email = 'Invalid email format';
    }
    if (phone && !/^[\d\s\-+()]{6,20}$/.test(phone)) {
      next.phone = 'Invalid phone number';
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const data = {
      name: name.trim(),
      specialty: specialty.trim() || undefined,
      hospital: hospital.trim() || undefined,
      city: city.trim() || undefined,
      email: email.trim() || undefined,
      phone: phone.trim() || undefined,
      active,
    };

    try {
      if (hcp) {
        await dispatch(updateHCP({ id: hcp.id, data })).unwrap();
        dispatch(showToast({ message: 'HCP updated successfully', type: 'success' }));
      } else {
        await dispatch(createHCP(data)).unwrap();
        dispatch(showToast({ message: 'HCP created successfully', type: 'success' }));
      }
      dispatch(clearExtraction());
      onSuccess();
    } catch {
      dispatch(showToast({ message: 'Failed to save HCP', type: 'error' }));
    }
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
          style={{ ...inputStyle, borderColor: errors.name ? 'var(--color-error)' : undefined }}
          placeholder="Dr. John Doe"
        />
        {errors.name && <span style={errorStyle}>{errors.name}</span>}
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
            style={{ ...inputStyle, borderColor: errors.phone ? 'var(--color-error)' : undefined }}
            placeholder="+1 555-0123"
          />
          {errors.phone && <span style={errorStyle}>{errors.phone}</span>}
        </div>
      </div>

      <div>
        <label style={labelStyle}>Email</label>
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          style={{ ...inputStyle, borderColor: errors.email ? 'var(--color-error)' : undefined }}
          placeholder="john@hospital.com"
        />
        {errors.email && <span style={errorStyle}>{errors.email}</span>}
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
            color: 'var(--color-text-inverse)',
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

const errorStyle: React.CSSProperties = {
  color: 'var(--color-error)',
  fontSize: '0.75rem',
  marginTop: '0.25rem',
};

export default HCPForm;
