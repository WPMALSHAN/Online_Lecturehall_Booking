import { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import AppNavbar from '../components/AppNavbar';
import { useAuth } from '../context/AuthContext';
import {
  adminGetAllFacilities,
  adminCreateFacility,
  adminUpdateFacility,
  adminDeleteFacility,
} from '../services/facilityApi';

const EMPTY_FORM = {
  name: '',
  type: '',
  capacity: '',
  location: '',
  status: 'ACTIVE',
};

const FACILITY_TYPES = ['Classroom', 'Lab', 'Seminar Hall', 'Conference Room', 'Auditorium', 'Gymnasium', 'Library', 'Other'];

function StatusBadge({ status }) {
  const upper = String(status).toUpperCase();
  const base = 'inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold';
  if (upper === 'ACTIVE') return <span className={`${base} border-emerald-200 bg-emerald-50 text-emerald-700`}>● Active</span>;
  return <span className={`${base} border-amber-200 bg-amber-50 text-amber-700`}>● Out of Service</span>;
}

export default function AdminFacilitiesPage() {
  const { isAuthenticated, role } = useAuth();

  const [facilities, setFacilities] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pageError, setPageError] = useState('');

  // Add form
  const [addForm, setAddForm] = useState(EMPTY_FORM);
  const [addErrors, setAddErrors] = useState({});
  const [addMsg, setAddMsg] = useState({ type: '', text: '' });
  const [isAdding, setIsAdding] = useState(false);
  const [showAddPanel, setShowAddPanel] = useState(false);

  // Edit form
  const [editId, setEditId] = useState(null);
  const [editForm, setEditForm] = useState(EMPTY_FORM);
  const [editErrors, setEditErrors] = useState({});
  const [editMsg, setEditMsg] = useState({ type: '', text: '' });
  const [isSaving, setIsSaving] = useState(false);

  // Delete
  const [deletingId, setDeletingId] = useState(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  // Global action feedback
  const [actionMsg, setActionMsg] = useState({ type: '', text: '' });

  useEffect(() => {
    loadFacilities();
  }, []);

  async function loadFacilities() {
    setIsLoading(true);
    setPageError('');
    try {
      const data = await adminGetAllFacilities();
      setFacilities(Array.isArray(data) ? data : []);
    } catch (error) {
      setPageError(error.message || 'Failed to load facilities.');
    } finally {
      setIsLoading(false);
    }
  }

  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (role !== 'ADMIN') return <Navigate to="/dashboard" replace />;

  // ─── Add Facility ─────────────────────────────────────────────────────────
  function validateForm(form) {
    const errors = {};
    if (!form.name.trim()) errors.name = 'Name is required.';
    if (!form.type.trim()) errors.type = 'Type is required.';
    const cap = Number(form.capacity);
    if (!form.capacity || !Number.isInteger(cap) || cap < 1)
      errors.capacity = 'Capacity must be a positive integer.';
    if (!form.location.trim()) errors.location = 'Location is required.';
    return errors;
  }

  async function onAddSubmit(event) {
    event.preventDefault();
    setAddMsg({ type: '', text: '' });
    const errors = validateForm(addForm);
    if (Object.keys(errors).length) { setAddErrors(errors); return; }
    setAddErrors({});
    setIsAdding(true);
    try {
      await adminCreateFacility({
        name: addForm.name.trim(),
        type: addForm.type.trim(),
        capacity: Number(addForm.capacity),
        location: addForm.location.trim(),
        status: addForm.status,
      });
      setAddMsg({ type: 'success', text: 'Facility created successfully.' });
      setAddForm(EMPTY_FORM);
      setShowAddPanel(false);
      await loadFacilities();
    } catch (error) {
      setAddMsg({ type: 'error', text: error.message || 'Failed to create facility.' });
    } finally {
      setIsAdding(false);
    }
  }

  // ─── Edit Facility ────────────────────────────────────────────────────────
  function startEdit(facility) {
    setEditId(facility.id);
    setEditForm({
      name: facility.name || '',
      type: facility.type || '',
      capacity: String(facility.capacity ?? ''),
      location: facility.location || '',
      status: facility.status || 'ACTIVE',
    });
    setEditErrors({});
    setEditMsg({ type: '', text: '' });
    setDeleteConfirmId(null);
  }

  function cancelEdit() {
    setEditId(null);
    setEditForm(EMPTY_FORM);
    setEditErrors({});
    setEditMsg({ type: '', text: '' });
  }

  async function onEditSubmit(event) {
    event.preventDefault();
    setEditMsg({ type: '', text: '' });
    const errors = validateForm(editForm);
    if (Object.keys(errors).length) { setEditErrors(errors); return; }
    setEditErrors({});
    setIsSaving(true);
    try {
      await adminUpdateFacility(editId, {
        name: editForm.name.trim(),
        type: editForm.type.trim(),
        capacity: Number(editForm.capacity),
        location: editForm.location.trim(),
        status: editForm.status,
      });
      setEditMsg({ type: 'success', text: 'Facility updated.' });
      await loadFacilities();
      setTimeout(() => cancelEdit(), 800);
    } catch (error) {
      setEditMsg({ type: 'error', text: error.message || 'Failed to update facility.' });
    } finally {
      setIsSaving(false);
    }
  }

  // ─── Delete Facility ──────────────────────────────────────────────────────
  async function onDelete(id) {
    setDeletingId(id);
    setActionMsg({ type: '', text: '' });
    try {
      await adminDeleteFacility(id);
      setActionMsg({ type: 'success', text: `Facility #${id} deleted.` });
      setDeleteConfirmId(null);
      await loadFacilities();
    } catch (error) {
      setActionMsg({ type: 'error', text: error.message || 'Failed to delete facility.' });
    } finally {
      setDeletingId(null);
    }
  }

  // ─── Quick Toggle Status ──────────────────────────────────────────────────
  async function onToggleStatus(facility) {
    const newStatus = facility.status === 'ACTIVE' ? 'OUT_OF_SERVICE' : 'ACTIVE';
    setActionMsg({ type: '', text: '' });
    try {
      await adminUpdateFacility(facility.id, { ...facility, status: newStatus });
      setActionMsg({ type: 'success', text: `${facility.name} set to ${newStatus}.` });
      await loadFacilities();
    } catch (error) {
      setActionMsg({ type: 'error', text: error.message || 'Failed to update status.' });
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900">
      <AppNavbar />

      <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        {/* ── Header ── */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-indigo-400">Admin Panel</p>
            <h1 className="mt-1 text-3xl font-extrabold text-white">Facility Management</h1>
            <p className="mt-1 text-sm text-slate-400">Add, edit, or remove campus facilities. Users can only book active ones.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              to="/dashboard/bookings/admin"
              className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-sm font-semibold text-slate-300 transition hover:bg-slate-700"
            >
              ← Booking Admin
            </Link>
            <button
              type="button"
              id="btn-add-facility"
              onClick={() => { setShowAddPanel((p) => !p); setAddMsg({ type: '', text: '' }); setAddErrors({}); }}
              className="rounded-xl bg-gradient-to-r from-indigo-500 to-violet-500 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-indigo-500/30 transition hover:opacity-90"
            >
              {showAddPanel ? '✕ Close' : '+ Add Facility'}
            </button>
          </div>
        </div>

        {/* ── Global action feedback ── */}
        {actionMsg.text ? (
          <div className={`mb-4 rounded-xl border px-4 py-3 text-sm font-medium ${actionMsg.type === 'success' ? 'border-emerald-700 bg-emerald-950/60 text-emerald-300' : 'border-red-700 bg-red-950/60 text-red-300'}`}>
            {actionMsg.text}
          </div>
        ) : null}

        {/* ── Add Facility Panel ── */}
        {showAddPanel ? (
          <div className="mb-6 rounded-2xl border border-indigo-700/50 bg-slate-800/70 p-6 shadow-xl backdrop-blur">
            <h2 className="text-lg font-bold text-white">Add New Facility</h2>
            <p className="mt-1 text-sm text-slate-400">Fill in all fields. New facilities default to Active status.</p>

            {addMsg.text ? (
              <div className={`mt-3 rounded-xl border px-4 py-2 text-sm ${addMsg.type === 'success' ? 'border-emerald-700 bg-emerald-950/60 text-emerald-300' : 'border-red-700 bg-red-950/60 text-red-300'}`}>
                {addMsg.text}
              </div>
            ) : null}

            <form id="form-add-facility" onSubmit={onAddSubmit} noValidate className="mt-5 grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="add-name" className="mb-1 block text-sm font-semibold text-slate-300">Facility Name</label>
                <input
                  id="add-name"
                  type="text"
                  value={addForm.name}
                  onChange={(e) => { setAddForm((p) => ({ ...p, name: e.target.value })); setAddErrors((p) => ({ ...p, name: '' })); }}
                  placeholder="e.g. Main Lecture Hall A"
                  className="w-full rounded-xl border border-slate-600 bg-slate-700 px-4 py-2.5 text-sm text-white placeholder-slate-400 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30"
                />
                {addErrors.name ? <p className="mt-1 text-xs text-red-400">{addErrors.name}</p> : null}
              </div>

              <div>
                <label htmlFor="add-type" className="mb-1 block text-sm font-semibold text-slate-300">Type</label>
                <select
                  id="add-type"
                  value={addForm.type}
                  onChange={(e) => { setAddForm((p) => ({ ...p, type: e.target.value })); setAddErrors((p) => ({ ...p, type: '' })); }}
                  className="w-full rounded-xl border border-slate-600 bg-slate-700 px-4 py-2.5 text-sm text-white outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30"
                >
                  <option value="">Select type</option>
                  {FACILITY_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
                {addErrors.type ? <p className="mt-1 text-xs text-red-400">{addErrors.type}</p> : null}
              </div>

              <div>
                <label htmlFor="add-capacity" className="mb-1 block text-sm font-semibold text-slate-300">Capacity</label>
                <input
                  id="add-capacity"
                  type="number"
                  min="1"
                  value={addForm.capacity}
                  onChange={(e) => { setAddForm((p) => ({ ...p, capacity: e.target.value })); setAddErrors((p) => ({ ...p, capacity: '' })); }}
                  placeholder="e.g. 120"
                  className="w-full rounded-xl border border-slate-600 bg-slate-700 px-4 py-2.5 text-sm text-white placeholder-slate-400 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30"
                />
                {addErrors.capacity ? <p className="mt-1 text-xs text-red-400">{addErrors.capacity}</p> : null}
              </div>

              <div>
                <label htmlFor="add-location" className="mb-1 block text-sm font-semibold text-slate-300">Location</label>
                <input
                  id="add-location"
                  type="text"
                  value={addForm.location}
                  onChange={(e) => { setAddForm((p) => ({ ...p, location: e.target.value })); setAddErrors((p) => ({ ...p, location: '' })); }}
                  placeholder="e.g. Block C, Floor 2"
                  className="w-full rounded-xl border border-slate-600 bg-slate-700 px-4 py-2.5 text-sm text-white placeholder-slate-400 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30"
                />
                {addErrors.location ? <p className="mt-1 text-xs text-red-400">{addErrors.location}</p> : null}
              </div>

              <div className="sm:col-span-2 flex flex-wrap gap-3 pt-1">
                <button
                  id="btn-submit-add"
                  type="submit"
                  disabled={isAdding}
                  className="rounded-xl bg-gradient-to-r from-indigo-500 to-violet-500 px-6 py-2.5 text-sm font-bold text-white shadow-md shadow-indigo-500/30 transition hover:opacity-90 disabled:cursor-wait disabled:opacity-60"
                >
                  {isAdding ? 'Creating…' : 'Create Facility'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddPanel(false)}
                  className="rounded-xl border border-slate-600 bg-slate-700 px-6 py-2.5 text-sm font-semibold text-slate-300 transition hover:bg-slate-600"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        ) : null}

        {/* ── Page error ── */}
        {pageError ? (
          <div className="mb-4 rounded-xl border border-red-700 bg-red-950/60 px-4 py-3 text-sm text-red-300">{pageError}</div>
        ) : null}

        {/* ── Facilities Table / Cards ── */}
        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-52 animate-pulse rounded-2xl border border-slate-700 bg-slate-800" />
            ))}
          </div>
        ) : facilities.length === 0 ? (
          <div className="rounded-2xl border border-slate-700 bg-slate-800/60 px-6 py-12 text-center">
            <p className="text-4xl">🏛️</p>
            <p className="mt-3 text-lg font-bold text-white">No facilities yet</p>
            <p className="mt-1 text-sm text-slate-400">Click "Add Facility" to create the first one.</p>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {facilities.map((facility) => {
              const isEditOpen = editId === facility.id;
              const isDeleteConfirm = deleteConfirmId === facility.id;

              return (
                <article
                  key={facility.id}
                  className="group flex flex-col rounded-2xl border border-slate-700 bg-slate-800/70 p-5 shadow-lg backdrop-blur transition hover:border-indigo-600/50 hover:shadow-indigo-900/30"
                >
                  {/* Card header */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-xs font-bold uppercase tracking-[0.14em] text-indigo-400">
                        #{facility.id} · {facility.type || 'Facility'}
                      </p>
                      <h2 className="mt-1 truncate text-xl font-extrabold text-white">{facility.name}</h2>
                    </div>
                    <StatusBadge status={facility.status} />
                  </div>

                  {/* Details */}
                  <dl className="mt-4 grid gap-2 text-sm">
                    <div className="flex items-center justify-between rounded-lg bg-slate-700/60 px-3 py-2">
                      <dt className="text-slate-400">Location</dt>
                      <dd className="font-semibold text-slate-100">{facility.location || '—'}</dd>
                    </div>
                    <div className="flex items-center justify-between rounded-lg bg-slate-700/60 px-3 py-2">
                      <dt className="text-slate-400">Capacity</dt>
                      <dd className="font-semibold text-slate-100">{facility.capacity ?? '—'}</dd>
                    </div>
                  </dl>

                  {/* Edit form (inline) */}
                  {isEditOpen ? (
                    <div className="mt-4 rounded-xl border border-indigo-700/50 bg-slate-700/80 p-4">
                      <p className="mb-3 text-sm font-bold text-indigo-300">Edit Facility</p>

                      {editMsg.text ? (
                        <div className={`mb-3 rounded-lg px-3 py-1.5 text-xs font-medium ${editMsg.type === 'success' ? 'bg-emerald-900/60 text-emerald-300' : 'bg-red-900/60 text-red-300'}`}>
                          {editMsg.text}
                        </div>
                      ) : null}

                      <form id={`form-edit-${facility.id}`} onSubmit={onEditSubmit} noValidate className="grid gap-3">
                        <div>
                          <label className="mb-1 block text-xs font-semibold text-slate-300">Name</label>
                          <input
                            type="text"
                            value={editForm.name}
                            onChange={(e) => { setEditForm((p) => ({ ...p, name: e.target.value })); setEditErrors((p) => ({ ...p, name: '' })); }}
                            className="w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-white outline-none focus:border-indigo-500"
                          />
                          {editErrors.name ? <p className="mt-0.5 text-xs text-red-400">{editErrors.name}</p> : null}
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="mb-1 block text-xs font-semibold text-slate-300">Type</label>
                            <select
                              value={editForm.type}
                              onChange={(e) => { setEditForm((p) => ({ ...p, type: e.target.value })); setEditErrors((p) => ({ ...p, type: '' })); }}
                              className="w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-white outline-none focus:border-indigo-500"
                            >
                              <option value="">Select</option>
                              {FACILITY_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                            </select>
                            {editErrors.type ? <p className="mt-0.5 text-xs text-red-400">{editErrors.type}</p> : null}
                          </div>
                          <div>
                            <label className="mb-1 block text-xs font-semibold text-slate-300">Capacity</label>
                            <input
                              type="number"
                              min="1"
                              value={editForm.capacity}
                              onChange={(e) => { setEditForm((p) => ({ ...p, capacity: e.target.value })); setEditErrors((p) => ({ ...p, capacity: '' })); }}
                              className="w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-white outline-none focus:border-indigo-500"
                            />
                            {editErrors.capacity ? <p className="mt-0.5 text-xs text-red-400">{editErrors.capacity}</p> : null}
                          </div>
                        </div>

                        <div>
                          <label className="mb-1 block text-xs font-semibold text-slate-300">Location</label>
                          <input
                            type="text"
                            value={editForm.location}
                            onChange={(e) => { setEditForm((p) => ({ ...p, location: e.target.value })); setEditErrors((p) => ({ ...p, location: '' })); }}
                            className="w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-white outline-none focus:border-indigo-500"
                          />
                          {editErrors.location ? <p className="mt-0.5 text-xs text-red-400">{editErrors.location}</p> : null}
                        </div>

                        <div>
                          <label className="mb-1 block text-xs font-semibold text-slate-300">Status</label>
                          <select
                            value={editForm.status}
                            onChange={(e) => setEditForm((p) => ({ ...p, status: e.target.value }))}
                            className="w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-white outline-none focus:border-indigo-500"
                          >
                            <option value="ACTIVE">ACTIVE</option>
                            <option value="OUT_OF_SERVICE">OUT_OF_SERVICE</option>
                          </select>
                        </div>

                        <div className="flex gap-2 pt-1">
                          <button
                            type="submit"
                            disabled={isSaving}
                            id={`btn-save-edit-${facility.id}`}
                            className="flex-1 rounded-lg bg-indigo-600 py-2 text-sm font-bold text-white transition hover:bg-indigo-500 disabled:cursor-wait disabled:opacity-60"
                          >
                            {isSaving ? 'Saving…' : 'Save Changes'}
                          </button>
                          <button
                            type="button"
                            onClick={cancelEdit}
                            className="flex-1 rounded-lg border border-slate-600 bg-slate-700 py-2 text-sm font-semibold text-slate-300 transition hover:bg-slate-600"
                          >
                            Cancel
                          </button>
                        </div>
                      </form>
                    </div>
                  ) : null}

                  {/* Action buttons */}
                  {!isEditOpen ? (
                    <div className="mt-auto pt-4 flex flex-wrap gap-2">
                      <button
                        type="button"
                        id={`btn-edit-${facility.id}`}
                        onClick={() => startEdit(facility)}
                        className="rounded-lg border border-indigo-700 bg-indigo-900/50 px-3 py-1.5 text-xs font-bold text-indigo-300 transition hover:bg-indigo-800/60"
                      >
                        ✏️ Edit
                      </button>
                      <button
                        type="button"
                        id={`btn-toggle-${facility.id}`}
                        onClick={() => onToggleStatus(facility)}
                        className={`rounded-lg border px-3 py-1.5 text-xs font-bold transition ${
                          facility.status === 'ACTIVE'
                            ? 'border-amber-700 bg-amber-900/40 text-amber-300 hover:bg-amber-800/50'
                            : 'border-emerald-700 bg-emerald-900/40 text-emerald-300 hover:bg-emerald-800/50'
                        }`}
                      >
                        {facility.status === 'ACTIVE' ? '⏸ Disable' : '▶ Enable'}
                      </button>
                      {!isDeleteConfirm ? (
                        <button
                          type="button"
                          id={`btn-delete-${facility.id}`}
                          onClick={() => { setDeleteConfirmId(facility.id); setEditId(null); }}
                          className="rounded-lg border border-red-800 bg-red-900/40 px-3 py-1.5 text-xs font-bold text-red-300 transition hover:bg-red-800/50"
                        >
                          🗑 Delete
                        </button>
                      ) : (
                        <div className="w-full mt-2 rounded-lg border border-red-800 bg-red-950/60 p-3">
                          <p className="text-xs font-semibold text-red-300 mb-2">⚠️ Delete &quot;{facility.name}&quot;? This cannot be undone.</p>
                          <div className="flex gap-2">
                            <button
                              type="button"
                              id={`btn-confirm-delete-${facility.id}`}
                              onClick={() => onDelete(facility.id)}
                              disabled={deletingId === facility.id}
                              className="flex-1 rounded-lg bg-red-700 py-1.5 text-xs font-bold text-white transition hover:bg-red-600 disabled:cursor-wait disabled:opacity-60"
                            >
                              {deletingId === facility.id ? 'Deleting…' : 'Yes, Delete'}
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeleteConfirmId(null)}
                              className="flex-1 rounded-lg border border-slate-600 bg-slate-700 py-1.5 text-xs font-semibold text-slate-300 transition hover:bg-slate-600"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : null}
                </article>
              );
            })}
          </div>
        )}

        <p className="mt-8 text-center text-xs text-slate-600">
          Showing {facilities.length} facilit{facilities.length !== 1 ? 'ies' : 'y'} ·{' '}
          {facilities.filter((f) => f.status === 'ACTIVE').length} active
        </p>
      </section>
    </main>
  );
}
