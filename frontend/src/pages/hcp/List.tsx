import React, { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../hooks';
import {
  fetchHCPs,
  deleteHCP,
  selectAllHCPs,
  selectHCPLoading,
  selectHCPSaving,
} from '../../redux/slices/hcpSlice';
import { showToast } from '../../redux/slices/uiSlice';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorMessage from '../../components/ErrorMessage';
import EmptyState from '../../components/EmptyState';
import Pagination from '../../components/Pagination';
import ConfirmDialog from '../../components/ConfirmDialog';
import Modal from '../../components/Modal';
import HCPForm from './Form';

const PAGE_SIZE = 10;

const HCPList: React.FC = () => {
  const dispatch = useAppDispatch();
  const hcps = useAppSelector(selectAllHCPs);
  const loading = useAppSelector(selectHCPLoading);
  const saving = useAppSelector(selectHCPSaving);
  const error = useAppSelector(s => s.hcp.error);

  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [specialtyFilter, setSpecialtyFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const [formOpen, setFormOpen] = useState(false);
  const [editingHCP, setEditingHCP] = useState<typeof hcps[0] | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<typeof hcps[0] | null>(null);

  useEffect(() => {
    dispatch(fetchHCPs());
  }, [dispatch]);

  const filtered = hcps.filter(h => {
    const q = search.toLowerCase();
    const matchesSearch = !search ||
      h.name.toLowerCase().includes(q) ||
      (h.specialty?.toLowerCase().includes(q)) ||
      (h.hospital?.toLowerCase().includes(q)) ||
      (h.email?.toLowerCase().includes(q));

    const matchesSpecialty = !specialtyFilter || h.specialty === specialtyFilter;
    const matchesStatus =
      statusFilter === '' ||
      (statusFilter === 'active' && h.active !== false) ||
      (statusFilter === 'inactive' && h.active === false);

    return matchesSearch && matchesSpecialty && matchesStatus;
  });

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const specialties = [...new Set(hcps.map(h => h.specialty).filter(Boolean))] as string[];

  const openCreate = () => {
    setEditingHCP(null);
    setFormOpen(true);
  };

  const openEdit = (hcp: typeof hcps[0]) => {
    setEditingHCP(hcp);
    setFormOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await dispatch(deleteHCP(deleteTarget.id)).unwrap();
      dispatch(showToast({ message: 'HCP deleted successfully', type: 'success' }));
      setDeleteTarget(null);
    } catch {
      dispatch(showToast({ message: 'Failed to delete HCP', type: 'error' }));
    }
  };

  const handleFormSuccess = () => {
    setFormOpen(false);
    setEditingHCP(null);
  };

  if (loading && hcps.length === 0) return <LoadingSpinner />;
  if (error && hcps.length === 0) {
    return <ErrorMessage message={error} onRetry={() => dispatch(fetchHCPs())} />;
  }

  return (
    <div>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '1.5rem',
      }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.25rem' }}>
            Healthcare Professionals
          </h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
            {filtered.length} HCPs found
          </p>
        </div>
        <button
          onClick={openCreate}
          style={{
            padding: '0.5rem 1rem',
            background: 'var(--color-primary)',
            color: 'var(--color-text-inverse)',
            border: 'none',
            borderRadius: 'var(--radius)',
            fontWeight: 500,
            fontSize: '0.875rem',
          }}
        >
          Add HCP
        </button>
      </div>

      <div style={{
        display: 'flex',
        gap: '0.75rem',
        marginBottom: '1rem',
        flexWrap: 'wrap',
      }}>
        <input
          placeholder="Search by name, specialty, hospital..."
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1); }}
          style={{
            flex: 1,
            minWidth: 200,
            padding: '0.5rem 0.75rem',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius)',
            background: 'var(--color-surface)',
            color: 'var(--color-text)',
            fontSize: '0.875rem',
          }}
        />
        <select
          value={specialtyFilter}
          onChange={e => { setSpecialtyFilter(e.target.value); setPage(1); }}
          style={{
            padding: '0.5rem 0.75rem',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius)',
            background: 'var(--color-surface)',
            color: 'var(--color-text)',
            fontSize: '0.875rem',
          }}
        >
          <option value="">All Specialties</option>
          {specialties.map(s => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
          style={{
            padding: '0.5rem 0.75rem',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius)',
            background: 'var(--color-surface)',
            color: 'var(--color-text)',
            fontSize: '0.875rem',
          }}
        >
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title="No HCPs found"
          description={search || specialtyFilter || statusFilter ? 'Try adjusting your filters' : 'Add your first HCP to get started'}
          action={
            !search && !specialtyFilter && !statusFilter ? (
              <button
                onClick={openCreate}
                style={{
                  padding: '0.5rem 1rem',
                  background: 'var(--color-primary)',
                  color: 'var(--color-text-inverse)',
                  border: 'none',
                  borderRadius: 'var(--radius)',
                  fontWeight: 500,
                  fontSize: '0.875rem',
                  marginTop: '0.5rem',
                }}
              >
                Add HCP
              </button>
            ) : undefined
          }
        />
      ) : (
        <div style={{
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-lg)',
          overflow: 'hidden',
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                <Th>Name</Th>
                <Th>Specialty</Th>
                <Th>Hospital</Th>
                <Th>City</Th>
                <Th>Status</Th>
                <Th style={{ textAlign: 'right' }}>Actions</Th>
              </tr>
            </thead>
            <tbody>
              {paginated.map(hcp => (
                <tr
                  key={hcp.id}
                  style={{
                    borderBottom: '1px solid var(--color-border)',
                    transition: 'background var(--transition)',
                  }}
                  onMouseOver={e => (e.currentTarget.style.background = 'var(--color-bg)')}
                  onMouseOut={e => (e.currentTarget.style.background = '')}
                >
                  <Td>
                    <span style={{ fontWeight: 500 }}>{hcp.name}</span>
                    {hcp.email && (
                      <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                        {hcp.email}
                      </span>
                    )}
                  </Td>
                  <Td>{hcp.specialty || '-'}</Td>
                  <Td>{hcp.hospital || '-'}</Td>
                  <Td>{hcp.city || '-'}</Td>
                  <Td>
                    <span style={{
                      display: 'inline-block',
                      padding: '0.125rem 0.5rem',
                      borderRadius: '999px',
                      fontSize: '0.75rem',
                      fontWeight: 500,
                      background: hcp.active !== false ? 'var(--color-success-light)' : 'var(--color-error-light)',
                      color: hcp.active !== false ? 'var(--color-success)' : 'var(--color-error)',
                    }}>
                      {hcp.active !== false ? 'Active' : 'Inactive'}
                    </span>
                  </Td>
                  <Td style={{ textAlign: 'right' }}>
                    <button
                      onClick={() => openEdit(hcp)}
                      style={actionBtnStyle}
                      title="Edit"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => setDeleteTarget(hcp)}
                      style={{ ...actionBtnStyle, color: 'var(--color-error)' }}
                      title="Delete"
                    >
                      Delete
                    </button>
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Pagination
        current={page}
        total={filtered.length}
        pageSize={PAGE_SIZE}
        onChange={setPage}
      />

      <Modal
        open={formOpen}
        onClose={() => { setFormOpen(false); setEditingHCP(null); }}
        title={editingHCP ? 'Edit HCP' : 'Add HCP'}
      >
        <HCPForm
          hcp={editingHCP}
          onSuccess={handleFormSuccess}
          onCancel={() => { setFormOpen(false); setEditingHCP(null); }}
        />
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete HCP"
        message={`Are you sure you want to delete ${deleteTarget?.name}? This action cannot be undone.`}
        loading={saving}
      />
    </div>
  );
};

const Th: React.FC<React.PropsWithChildren<{ style?: React.CSSProperties }>> = ({ children, style }) => (
  <th style={{
    padding: '0.75rem 1rem',
    textAlign: 'left',
    fontSize: '0.75rem',
    fontWeight: 600,
    color: 'var(--color-text-muted)',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    ...style,
  }}>
    {children}
  </th>
);

const Td: React.FC<React.PropsWithChildren<{ style?: React.CSSProperties }>> = ({ children, style }) => (
  <td style={{
    padding: '0.75rem 1rem',
    fontSize: '0.875rem',
    ...style,
  }}>
    {children}
  </td>
);

const actionBtnStyle: React.CSSProperties = {
  background: 'none',
  border: 'none',
  color: 'var(--color-primary)',
  fontSize: '0.8rem',
  fontWeight: 500,
  padding: '0.25rem 0.5rem',
};

export default HCPList;
