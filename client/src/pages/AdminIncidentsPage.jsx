import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import AppNavbar from '../components/AppNavbar';
import { useAuth } from '../context/AuthContext';
import { feedbackApi } from '../services/feedbackApi';

const API_BASE_URL = 'http://localhost:8070/api';

const PRIORITY_BADGE = {
  HIGH:   'bg-red-100 text-red-700 border border-red-300',
  MEDIUM: 'bg-orange-100 text-orange-700 border border-orange-300',
  LOW:    'bg-green-100 text-green-700 border border-green-300',
};
const STATUS_BADGE = {
  OPEN:        'bg-blue-100 text-blue-700 border border-blue-300',
  IN_PROGRESS: 'bg-amber-100 text-amber-700 border border-amber-300',
  RESOLVED:    'bg-green-100 text-green-700 border border-green-300',
  CLOSED:      'bg-gray-100 text-gray-600 border border-gray-300',
  REJECTED:    'bg-red-100 text-red-700 border border-red-300',
};
const STATUS_ICON = { OPEN:'🔵', IN_PROGRESS:'🔄', RESOLVED:'✅', CLOSED:'🔒', REJECTED:'❌' };
const ALL_STATUSES = ['', 'OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED', 'REJECTED'];

function Star({ filled, onClick }) {
  return (
    <button type="button" onClick={onClick}
      className={`text-2xl transition hover:scale-110 ${filled ? 'text-amber-400' : 'text-gray-300 hover:text-amber-300'}`}>
      ★
    </button>
  );
}

function formatDate(val) {
  if (!val) return '—';
  return new Date(val).toLocaleDateString('en-US', { year:'numeric', month:'short', day:'numeric' });
}

export default function AdminIncidentsPage() {
  const { token, role, isAuthenticated } = useAuth();

  const [incidents, setIncidents]             = useState([]);
  const [technicians, setTechnicians]         = useState([]);
  const [isLoading, setIsLoading]             = useState(true);
  const [errorMessage, setErrorMessage]       = useState('');
  const [successMessage, setSuccessMessage]   = useState('');
  const [statusFilter, setStatusFilter]       = useState('');
  const [workingId, setWorkingId]             = useState(null);
  const [assignSelections, setAssignSelections] = useState({});
  const [assignErrors, setAssignErrors]       = useState({});
  const [expandedId, setExpandedId]           = useState(null);

  // Feedback state per incident
  const [feedbackRating, setFeedbackRating]   = useState({});   // { incidentId: number }
  const [feedbackComment, setFeedbackComment] = useState({});   // { incidentId: string }
  const [feedbackExisting, setFeedbackExisting] = useState({}); // { incidentId: boolean }
  const [feedbackWorking, setFeedbackWorking] = useState(null);
  const [feedbackErrors, setFeedbackErrors]   = useState({});

  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (role !== 'ADMIN')  return <Navigate to="/dashboard" replace />;

  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    loadIncidents();
    loadTechnicians();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  async function loadIncidents() {
    setIsLoading(true);
    setErrorMessage('');
    try {
      const response = await fetch(`${API_BASE_URL}/incidents`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) throw new Error(payload?.message || 'Failed to load incidents.');
      const items = Array.isArray(payload) ? payload : [];
      setIncidents(statusFilter ? items.filter((i) => i.status === statusFilter) : items);
    } catch (err) {
      setErrorMessage(err.message || 'Failed to load incidents.');
    } finally {
      setIsLoading(false);
    }
  }

  async function loadTechnicians() {
    try {
      const response = await fetch(`${API_BASE_URL}/users`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) throw new Error();
      setTechnicians((Array.isArray(payload) ? payload : []).filter((u) => u.role === 'TECHNICIAN'));
    } catch {
      setTechnicians([]);
    }
  }

  async function checkFeedbackExists(incidentId) {
    if (feedbackExisting[incidentId] !== undefined) return;
    try {
      const exists = await feedbackApi.checkExists(incidentId);
      setFeedbackExisting((prev) => ({ ...prev, [incidentId]: exists }));
    } catch {
      setFeedbackExisting((prev) => ({ ...prev, [incidentId]: false }));
    }
  }

  async function handleExpand(id, status) {
    if (expandedId === id) { setExpandedId(null); return; }
    setExpandedId(id);
    if (status === 'RESOLVED' || status === 'CLOSED') {
      await checkFeedbackExists(id);
    }
  }

  // ── Admin actions ─────────────────────────────────────────────────────────
  async function apiAction(incidentId, path, method = 'PUT', body = null) {
    setWorkingId(incidentId);
    setSuccessMessage('');
    setErrorMessage('');
    try {
      const opts = { method, headers: { Authorization: `Bearer ${token}` } };
      if (body) { opts.headers['Content-Type'] = 'application/json'; opts.body = JSON.stringify(body); }
      const resp = await fetch(`${API_BASE_URL}/incidents/${incidentId}/${path}`, opts);
      const pl   = await resp.json().catch(() => null);
      if (!resp.ok) throw new Error(pl?.message || `Failed to ${path} incident.`);
      return pl;
    } finally {
      setWorkingId(null);
    }
  }

  async function onAssign(incidentId) {
    const techId = assignSelections[incidentId];
    if (!techId) { setAssignErrors((p) => ({ ...p, [incidentId]: 'Please select a technician.' })); return; }
    setAssignErrors((p) => ({ ...p, [incidentId]: '' }));
    try {
      await apiAction(incidentId, 'assign', 'PUT', { technicianId: Number(techId) });
      setSuccessMessage(`Technician assigned to incident #${incidentId}.`);
      await loadIncidents();
    } catch (err) { setErrorMessage(err.message); }
  }

  async function onReject(incidentId) {
    if (!window.confirm(`Reject incident #${incidentId}?`)) return;
    try {
      await apiAction(incidentId, 'reject');
      setSuccessMessage(`Incident #${incidentId} rejected.`);
      await loadIncidents();
    } catch (err) { setErrorMessage(err.message); }
  }

  async function onClose(incidentId) {
    if (!window.confirm(`Close incident #${incidentId}?`)) return;
    try {
      await apiAction(incidentId, 'close');
      setSuccessMessage(`Incident #${incidentId} closed.`);
      await loadIncidents();
    } catch (err) { setErrorMessage(err.message); }
  }

  // ── Feedback submission ───────────────────────────────────────────────────
  async function onSubmitFeedback(incidentId) {
    const rating = feedbackRating[incidentId];
    if (!rating || rating < 1) {
      setFeedbackErrors((p) => ({ ...p, [incidentId]: 'Please select a star rating (1–5).' }));
      return;
    }
    setFeedbackErrors((p) => ({ ...p, [incidentId]: '' }));
    setFeedbackWorking(incidentId);
    try {
      await feedbackApi.submitFeedback(incidentId, rating, feedbackComment[incidentId] || '');
      setFeedbackExisting((p) => ({ ...p, [incidentId]: true }));
      setSuccessMessage(`Feedback submitted for incident #${incidentId}! ⭐`);
    } catch (err) {
      setFeedbackErrors((p) => ({ ...p, [incidentId]: err?.response?.data?.message || err.message || 'Failed to submit feedback.' }));
    } finally {
      setFeedbackWorking(null);
    }
  }

  // ── Stats ─────────────────────────────────────────────────────────────────
  const openCount       = incidents.filter((i) => i.status === 'OPEN').length;
  const inProgressCount = incidents.filter((i) => i.status === 'IN_PROGRESS').length;
  const resolvedCount   = incidents.filter((i) => i.status === 'RESOLVED').length;
  const highCount       = incidents.filter((i) => i.priority === 'HIGH').length;

  return (
    <main className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50">
      <AppNavbar />

      <section className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6">
          <span className="inline-flex items-center gap-2 rounded-full bg-red-100 px-4 py-1 text-xs font-bold uppercase tracking-widest text-red-600">
            🛡️ Admin Console
          </span>
          <h1 className="mt-2 text-2xl font-extrabold text-gray-900">All Incidents</h1>
          <p className="mt-1 text-sm text-gray-500">Review, assign, close incidents and give technician feedback.</p>
        </div>

        {/* Stats */}
        {!isLoading && (
          <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: 'Total',       value: incidents.length, grad: 'from-orange-400 to-red-400' },
              { label: 'Open',        value: openCount,        grad: 'from-blue-400 to-blue-500' },
              { label: 'In Progress', value: inProgressCount,  grad: 'from-amber-400 to-amber-500' },
              { label: '✅ Resolved', value: resolvedCount,    grad: 'from-green-500 to-emerald-500' },
            ].map((s) => (
              <div key={s.label} className={`rounded-xl bg-gradient-to-br ${s.grad} p-4 text-white shadow-sm`}>
                <p className="text-2xl font-extrabold">{s.value}</p>
                <p className="text-xs font-semibold uppercase tracking-wide opacity-80">{s.label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Alerts */}
        {errorMessage && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">⚠️ {errorMessage}</div>
        )}
        {successMessage && (
          <div className="mb-4 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">✅ {successMessage}</div>
        )}

        {/* Status filter */}
        <div className="mb-5 flex flex-wrap items-center gap-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Filter:</p>
          {ALL_STATUSES.map((s) => (
            <button key={s || 'all'} onClick={() => setStatusFilter(s)}
              className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
                statusFilter === s
                  ? 'border-red-400 bg-red-500 text-white'
                  : 'border-gray-200 bg-white text-gray-600 hover:border-red-300 hover:text-red-600'
              }`}>
              {s || 'All'}
            </button>
          ))}
        </div>

        {/* Loading skeletons */}
        {isLoading && (
          <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-28 animate-pulse rounded-2xl border border-red-100 bg-red-50" />
            ))}
          </div>
        )}

        {/* Empty */}
        {!isLoading && incidents.length === 0 && !errorMessage && (
          <div className="rounded-2xl border border-dashed border-red-200 bg-white p-10 text-center shadow-sm">
            <p className="text-3xl">📋</p>
            <p className="mt-3 text-base font-semibold text-gray-700">No incidents found</p>
            <p className="mt-1 text-sm text-gray-400">
              {statusFilter ? `No incidents with status "${statusFilter}".` : 'No incidents have been reported yet.'}
            </p>
          </div>
        )}

        {/* Incident cards */}
        {!isLoading && incidents.length > 0 && (
          <div className="space-y-4">
            {incidents.map((inc) => {
              const isExpanded   = expandedId === inc.id;
              const isWorking    = workingId === inc.id;
              const hasFeedback  = feedbackExisting[inc.id];
              const fbWorking    = feedbackWorking === inc.id;

              return (
                <article key={inc.id}
                  className={`rounded-2xl border bg-white shadow-sm transition ${
                    inc.priority === 'HIGH' ? 'border-red-200' :
                    inc.priority === 'MEDIUM' ? 'border-orange-200' : 'border-gray-200'
                  }`}>

                  {/* Card header */}
                  <div className="flex cursor-pointer flex-wrap items-start justify-between gap-3 p-5"
                    onClick={() => handleExpand(inc.id, inc.status)}>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-bold text-red-400">#{inc.id}</span>
                        <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-500">{inc.category}</span>
                      </div>
                      <p className="mt-1 truncate text-base font-bold text-gray-900">{inc.location}</p>
                      <p className="mt-0.5 text-xs text-gray-400">
                        By <strong className="text-gray-600">{inc.reportedByName || 'Unknown'}</strong> · {formatDate(inc.createdAt)}
                      </p>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-2">
                      <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold ${STATUS_BADGE[inc.status] || STATUS_BADGE.OPEN}`}>
                        {STATUS_ICON[inc.status]} {inc.status?.replace('_', ' ')}
                      </span>
                      <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold ${PRIORITY_BADGE[inc.priority] || PRIORITY_BADGE.LOW}`}>
                        {inc.priority} PRIORITY
                      </span>
                      <span className="text-xs text-gray-400">{isExpanded ? '▲ Collapse' : '▼ Expand'}</span>
                    </div>
                  </div>

                  {/* Expanded panel */}
                  {isExpanded && (
                    <div className="space-y-4 border-t border-gray-100 px-5 pb-6 pt-4">

                      {/* Description */}
                      <p className="rounded-xl bg-gray-50 px-4 py-3 text-sm text-gray-700">{inc.description}</p>

                      {/* Assigned technician */}
                      {inc.assignedTechnicianName && (
                        <p className="text-xs text-gray-500">
                          🔧 Assigned to: <strong className="text-gray-700">{inc.assignedTechnicianName}</strong>
                        </p>
                      )}

                      {/* Assign technician (open/in-progress) */}
                      {(inc.status === 'OPEN' || inc.status === 'IN_PROGRESS') && (
                        <div className="rounded-xl border border-orange-100 bg-orange-50 p-4">
                          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-orange-700">Assign Technician</p>
                          <div className="flex flex-wrap gap-2">
                            <select value={assignSelections[inc.id] || ''}
                              onChange={(e) => {
                                setAssignSelections((p) => ({ ...p, [inc.id]: e.target.value }));
                                setAssignErrors((p) => ({ ...p, [inc.id]: '' }));
                              }}
                              className="min-w-48 flex-1 rounded-lg border border-orange-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100">
                              <option value="">Select a technician…</option>
                              {technicians.map((t) => (
                                <option key={t.id} value={t.id}>{t.name} — {t.email}</option>
                              ))}
                            </select>
                            <button type="button" disabled={isWorking} onClick={() => onAssign(inc.id)}
                              className="rounded-lg bg-orange-500 px-4 py-2 text-xs font-bold text-white transition hover:bg-orange-600 disabled:cursor-wait disabled:opacity-60">
                              {isWorking ? 'Assigning…' : 'Assign'}
                            </button>
                          </div>
                          {assignErrors[inc.id] && (
                            <p className="mt-1 text-xs font-medium text-red-500">{assignErrors[inc.id]}</p>
                          )}
                        </div>
                      )}

                      {/* ── Feedback / Rating (RESOLVED or CLOSED incidents) ── */}
                      {(inc.status === 'RESOLVED' || inc.status === 'CLOSED') && (
                        <div className="rounded-xl border border-green-100 bg-green-50 p-4">
                          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-green-700">
                            ⭐ Technician Performance Feedback
                          </p>

                          {hasFeedback ? (
                            <div className="flex items-center gap-2 text-sm font-semibold text-green-700">
                              <span className="text-lg">✅</span>
                              <span>Feedback already submitted for this incident.</span>
                            </div>
                          ) : (
                            <div className="space-y-3">
                              {/* Star selector */}
                              <div>
                                <p className="mb-1 text-xs font-medium text-gray-600">Rating <span className="text-red-500">*</span></p>
                                <div className="flex gap-0.5">
                                  {[1,2,3,4,5].map((star) => (
                                    <Star key={star}
                                      filled={(feedbackRating[inc.id] ?? 0) >= star}
                                      onClick={() => setFeedbackRating((p) => ({ ...p, [inc.id]: star }))}
                                    />
                                  ))}
                                  {feedbackRating[inc.id] ? (
                                    <span className="ml-2 self-center text-xs font-bold text-amber-600">
                                      {feedbackRating[inc.id]}/5
                                    </span>
                                  ) : null}
                                </div>
                              </div>

                              {/* Comment */}
                              <div>
                                <p className="mb-1 text-xs font-medium text-gray-600">Comment <span className="text-gray-400">(optional)</span></p>
                                <textarea rows={2}
                                  value={feedbackComment[inc.id] || ''}
                                  onChange={(e) => setFeedbackComment((p) => ({ ...p, [inc.id]: e.target.value }))}
                                  placeholder="Describe the technician's performance…"
                                  className="w-full resize-none rounded-lg border border-green-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-green-400 focus:ring-2 focus:ring-green-100 placeholder:text-gray-400"
                                />
                              </div>

                              {feedbackErrors[inc.id] && (
                                <p className="text-xs font-medium text-red-500">⚠️ {feedbackErrors[inc.id]}</p>
                              )}

                              <button type="button" disabled={fbWorking}
                                onClick={() => onSubmitFeedback(inc.id)}
                                className="rounded-lg bg-green-600 px-5 py-2 text-xs font-bold text-white transition hover:bg-green-700 disabled:cursor-wait disabled:opacity-60">
                                {fbWorking ? 'Submitting…' : '⭐ Submit Feedback'}
                              </button>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Admin action buttons */}
                      <div className="flex flex-wrap gap-2">
                        {inc.status !== 'REJECTED' && inc.status !== 'CLOSED' && (
                          <button type="button" disabled={isWorking} onClick={() => onReject(inc.id)}
                            className="rounded-lg border border-red-300 bg-red-50 px-4 py-2 text-xs font-bold text-red-600 transition hover:bg-red-100 disabled:cursor-wait disabled:opacity-60">
                            ❌ Reject
                          </button>
                        )}
                        {inc.status === 'RESOLVED' && (
                          <button type="button" disabled={isWorking} onClick={() => onClose(inc.id)}
                            className="rounded-lg border border-gray-300 bg-gray-100 px-4 py-2 text-xs font-bold text-gray-700 transition hover:bg-gray-200 disabled:cursor-wait disabled:opacity-60">
                            🔒 Close
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}
