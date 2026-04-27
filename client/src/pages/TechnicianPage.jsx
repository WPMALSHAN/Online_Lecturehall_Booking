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

function StarDisplay({ value }) {
  return (
    <span className="inline-flex gap-0.5">
      {[1,2,3,4,5].map((s) => (
        <span key={s} className={`text-lg ${s <= value ? 'text-amber-400' : 'text-gray-300'}`}>★</span>
      ))}
    </span>
  );
}

function formatDate(val) {
  if (!val) return '—';
  return new Date(val).toLocaleDateString('en-US', { year:'numeric', month:'short', day:'numeric' });
}
function formatDateTime(val) {
  if (!val) return '—';
  return new Date(val).toLocaleString('en-US', { dateStyle:'medium', timeStyle:'short' });
}

export default function TechnicianPage() {
  const { token, role, isAuthenticated } = useAuth();

  const [activeTab, setActiveTab]             = useState('incidents'); // 'incidents' | 'feedback'
  const [incidents, setIncidents]             = useState([]);
  const [isLoading, setIsLoading]             = useState(true);
  const [errorMessage, setErrorMessage]       = useState('');
  const [successMessage, setSuccessMessage]   = useState('');
  const [workingId, setWorkingId]             = useState(null);
  const [updateNotes, setUpdateNotes]         = useState({});
  const [noteErrors, setNoteErrors]           = useState({});
  const [expandedId, setExpandedId]           = useState(null);
  const [incidentUpdates, setIncidentUpdates] = useState({});

  // Feedback tab
  const [feedback, setFeedback]     = useState([]);
  const [summary, setSummary]       = useState(null);
  const [fbLoading, setFbLoading]   = useState(false);

  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (role !== 'TECHNICIAN') return <Navigate to="/dashboard" replace />;

  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => { loadIncidents(); }, []);

  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    if (activeTab === 'feedback' && feedback.length === 0) {
      loadFeedback();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  async function loadIncidents() {
    setIsLoading(true);
    setErrorMessage('');
    try {
      const response = await fetch(`${API_BASE_URL}/incidents/assigned`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) throw new Error(payload?.message || 'Failed to load assigned incidents.');
      setIncidents(Array.isArray(payload) ? payload : []);
    } catch (err) {
      setErrorMessage(err.message || 'Failed to load assigned incidents.');
    } finally {
      setIsLoading(false);
    }
  }

  async function loadFeedback() {
    setFbLoading(true);
    try {
      const [list, sum] = await Promise.all([
        feedbackApi.getMyFeedback(),
        feedbackApi.getMySummary(),
      ]);
      setFeedback(Array.isArray(list) ? list : []);
      setSummary(sum);
    } catch {
      setFeedback([]);
    } finally {
      setFbLoading(false);
    }
  }

  async function loadUpdates(incidentId) {
    try {
      const response = await fetch(`${API_BASE_URL}/incidents/${incidentId}/updates`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) throw new Error();
      setIncidentUpdates((prev) => ({ ...prev, [incidentId]: Array.isArray(payload) ? payload : [] }));
    } catch {
      setIncidentUpdates((prev) => ({ ...prev, [incidentId]: [] }));
    }
  }

  async function handleExpand(incidentId) {
    if (expandedId === incidentId) { setExpandedId(null); return; }
    setExpandedId(incidentId);
    if (!incidentUpdates[incidentId]) await loadUpdates(incidentId);
  }

  async function onAddNote(incidentId) {
    const note = String(updateNotes[incidentId] || '').trim();
    if (!note) { setNoteErrors((p) => ({ ...p, [incidentId]: 'Update note cannot be empty.' })); return; }
    if (note.length < 5) { setNoteErrors((p) => ({ ...p, [incidentId]: 'Note must be at least 5 characters.' })); return; }
    setNoteErrors((p) => ({ ...p, [incidentId]: '' }));
    setWorkingId(incidentId);
    setSuccessMessage('');
    setErrorMessage('');
    try {
      const response = await fetch(`${API_BASE_URL}/incidents/${incidentId}/updates`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ updateText: note }),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) throw new Error(payload?.message || 'Failed to post update.');
      setUpdateNotes((p) => ({ ...p, [incidentId]: '' }));
      setSuccessMessage('Progress update posted successfully!');
      await loadUpdates(incidentId);
    } catch (err) {
      setErrorMessage(err.message);
    } finally {
      setWorkingId(null);
    }
  }

  async function onResolve(incidentId) {
    if (!window.confirm(`Mark incident #${incidentId} as RESOLVED?`)) return;
    setWorkingId(incidentId);
    setSuccessMessage('');
    setErrorMessage('');
    try {
      const response = await fetch(`${API_BASE_URL}/incidents/${incidentId}/resolve`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) throw new Error(payload?.message || 'Failed to resolve incident.');
      setSuccessMessage(`Incident #${incidentId} marked as RESOLVED! 🎉 Great work!`);
      await loadIncidents();
    } catch (err) {
      setErrorMessage(err.message);
    } finally {
      setWorkingId(null);
    }
  }

  const pendingCount  = incidents.filter((i) => i.status === 'IN_PROGRESS' || i.status === 'OPEN').length;
  const resolvedCount = incidents.filter((i) => i.status === 'RESOLVED').length;
  const highCount     = incidents.filter((i) => i.priority === 'HIGH').length;

  return (
    <main className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-red-50">
      <AppNavbar />

      <section className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-orange-100 px-4 py-1 text-xs font-bold uppercase tracking-widest text-orange-600">
              🔧 Technician Dashboard
            </span>
            <h1 className="mt-2 text-2xl font-extrabold text-gray-900">My Work Board</h1>
            <p className="mt-1 text-sm text-gray-500">
              Manage assigned incidents and review performance feedback from admins.
            </p>
          </div>
          <button type="button" onClick={loadIncidents}
            className="rounded-lg border border-orange-200 bg-white px-3 py-2 text-xs font-semibold text-orange-700 transition hover:bg-orange-50">
            🔄 Refresh
          </button>
        </div>

        {/* Stats */}
        {!isLoading && (
          <div className="mb-6 grid grid-cols-3 gap-3">
            {[
              { label: 'Total Assigned', value: incidents.length,  grad: 'from-orange-400 to-red-400' },
              { label: 'Pending',        value: pendingCount,       grad: 'from-amber-400 to-orange-500' },
              { label: '✅ Resolved',    value: resolvedCount,      grad: 'from-green-500 to-emerald-500' },
            ].map((s) => (
              <div key={s.label} className={`rounded-xl bg-gradient-to-br ${s.grad} p-4 text-white shadow-sm`}>
                <p className="text-2xl font-extrabold">{s.value}</p>
                <p className="text-xs font-semibold uppercase tracking-wide opacity-80">{s.label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Tab bar */}
        <div className="mb-5 flex gap-2 rounded-xl border border-gray-200 bg-white p-1 shadow-sm">
          {[
            { key: 'incidents', label: '🔧 My Incidents' },
            { key: 'feedback',  label: '⭐ My Feedback & Ratings' },
          ].map((t) => (
            <button key={t.key} type="button" onClick={() => setActiveTab(t.key)}
              className={`flex-1 rounded-lg px-4 py-2 text-sm font-semibold transition ${
                activeTab === t.key
                  ? 'bg-orange-500 text-white shadow'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Alerts */}
        {errorMessage && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">⚠️ {errorMessage}</div>
        )}
        {successMessage && (
          <div className="mb-4 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">✅ {successMessage}</div>
        )}

        {/* ════ INCIDENTS TAB ════ */}
        {activeTab === 'incidents' && (
          <>
            {isLoading && (
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-28 animate-pulse rounded-2xl border border-orange-100 bg-orange-50" />
                ))}
              </div>
            )}

            {!isLoading && incidents.length === 0 && !errorMessage && (
              <div className="rounded-2xl border border-dashed border-orange-200 bg-white p-10 text-center shadow-sm">
                <p className="text-4xl">🛠️</p>
                <p className="mt-3 text-base font-semibold text-gray-700">No incidents assigned</p>
                <p className="mt-1 text-sm text-gray-400">You have no active incident assignments. Check back later.</p>
              </div>
            )}

            {resolvedCount > 0 && !isLoading && (
              <p className="mb-4 text-xs font-semibold text-green-600">
                ✅ You have resolved {resolvedCount} incident{resolvedCount > 1 ? 's' : ''} so far. Great work!
              </p>
            )}

            {!isLoading && incidents.length > 0 && (
              <div className="space-y-4">
                {incidents.map((inc) => {
                  const isExpanded = expandedId === inc.id;
                  const isWorking  = workingId === inc.id;
                  const updates    = incidentUpdates[inc.id] || [];
                  const canResolve = inc.status === 'OPEN' || inc.status === 'IN_PROGRESS';

                  return (
                    <article key={inc.id}
                      className={`rounded-2xl border bg-white shadow-sm transition-shadow ${
                        inc.priority === 'HIGH' ? 'border-red-200 hover:shadow-md hover:shadow-red-100/50' :
                        inc.priority === 'MEDIUM' ? 'border-orange-200 hover:shadow-md hover:shadow-orange-100/50' :
                        'border-gray-200 hover:shadow-md'
                      }`}>

                      {/* Header */}
                      <div className="flex cursor-pointer flex-wrap items-start justify-between gap-3 p-5"
                        onClick={() => handleExpand(inc.id)}>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-xs font-bold text-orange-500">#{inc.id}</span>
                            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-500">{inc.category}</span>
                          </div>
                          <p className="mt-1 truncate text-base font-bold text-gray-900">{inc.location}</p>
                          <p className="mt-0.5 text-xs text-gray-400">
                            Reported by <strong className="text-gray-600">{inc.reportedByName || 'Unknown'}</strong> · {formatDate(inc.createdAt)}
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

                      {/* Expanded */}
                      {isExpanded && (
                        <div className="space-y-4 border-t border-gray-100 px-5 pb-5 pt-4">
                          <div>
                            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-400">Description</p>
                            <p className="rounded-xl bg-gray-50 px-4 py-3 text-sm text-gray-700">{inc.description}</p>
                          </div>

                          {/* Add note */}
                          {canResolve && (
                            <div className="rounded-xl border border-orange-100 bg-orange-50 p-4">
                              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-orange-700">Add Progress Update</p>
                              <textarea rows={3}
                                value={updateNotes[inc.id] || ''}
                                onChange={(e) => {
                                  setUpdateNotes((p) => ({ ...p, [inc.id]: e.target.value }));
                                  setNoteErrors((p) => ({ ...p, [inc.id]: '' }));
                                }}
                                placeholder="Describe what work has been done or observations…"
                                className="w-full resize-none rounded-lg border border-orange-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                              />
                              {noteErrors[inc.id] && (
                                <p className="mt-1 text-xs font-medium text-red-500">{noteErrors[inc.id]}</p>
                              )}
                              <button type="button" disabled={isWorking} onClick={() => onAddNote(inc.id)}
                                className="mt-2 rounded-lg bg-orange-500 px-4 py-2 text-xs font-bold text-white transition hover:bg-orange-600 disabled:cursor-wait disabled:opacity-60">
                                {isWorking ? 'Posting…' : '📝 Post Update'}
                              </button>
                            </div>
                          )}

                          {/* Update history */}
                          {updates.length > 0 && (
                            <div>
                              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
                                Update History ({updates.length})
                              </p>
                              <div className="space-y-2">
                                {updates.map((upd, idx) => (
                                  <div key={upd.id ?? idx} className="rounded-lg border border-gray-100 bg-gray-50 px-4 py-3">
                                    <p className="text-sm text-gray-700">{upd.updateText ?? upd.note ?? upd.text}</p>
                                    <p className="mt-1 text-xs text-gray-400">
                                      {upd.technicianName ?? 'Technician'} · {formatDateTime(upd.createdAt ?? upd.date ?? upd.timestamp)}
                                    </p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Resolve button */}
                          {canResolve && (
                            <button type="button" disabled={isWorking} onClick={() => onResolve(inc.id)}
                              className="w-full rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 px-6 py-3 text-sm font-bold text-white shadow-md shadow-green-200 transition hover:from-green-600 hover:to-emerald-600 disabled:cursor-wait disabled:opacity-60">
                              {isWorking ? 'Processing…' : '✅ Mark as Resolved'}
                            </button>
                          )}

                          {inc.status === 'RESOLVED' && (
                            <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-center text-sm font-semibold text-green-700">
                              ✅ This incident has been resolved. Waiting for admin feedback.
                            </div>
                          )}
                        </div>
                      )}
                    </article>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* ════ FEEDBACK TAB ════ */}
        {activeTab === 'feedback' && (
          <>
            {fbLoading && (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-20 animate-pulse rounded-xl border border-orange-100 bg-orange-50" />
                ))}
              </div>
            )}

            {!fbLoading && summary && (
              <div className="mb-5 rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 p-5 shadow-sm">
                <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-amber-700">My Performance Summary</p>
                <div className="mt-2 flex flex-wrap items-center gap-6">
                  <div>
                    <p className="text-3xl font-extrabold text-amber-600">
                      {summary.averageRating > 0 ? summary.averageRating.toFixed(1) : '—'}
                    </p>
                    <StarDisplay value={Math.round(summary.averageRating)} />
                    <p className="mt-1 text-xs text-gray-500">Average Rating</p>
                  </div>
                  <div>
                    <p className="text-3xl font-extrabold text-orange-600">{summary.totalFeedback}</p>
                    <p className="text-xs text-gray-500">Total Reviews</p>
                  </div>
                </div>
              </div>
            )}

            {!fbLoading && feedback.length === 0 && (
              <div className="rounded-2xl border border-dashed border-amber-200 bg-white p-10 text-center shadow-sm">
                <p className="text-4xl">⭐</p>
                <p className="mt-3 text-base font-semibold text-gray-700">No feedback yet</p>
                <p className="mt-1 text-sm text-gray-400">
                  Complete assigned incidents and admins will rate your performance here.
                </p>
              </div>
            )}

            {!fbLoading && feedback.length > 0 && (
              <div className="space-y-3">
                {feedback.map((fb) => (
                  <div key={fb.id} className="rounded-xl border border-amber-100 bg-white p-4 shadow-sm">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold text-gray-800">
                          Incident <span className="text-orange-500">#{fb.incidentId ?? fb.incident?.id}</span>
                          {(fb.incidentLocation ?? fb.incident?.location) && (
                            <span className="ml-1 text-xs font-normal text-gray-500">
                              — {fb.incidentLocation ?? fb.incident?.location}
                            </span>
                          )}
                        </p>
                        <p className="mt-0.5 text-xs text-gray-400">
                          Reviewed by Admin · {formatDate(fb.createdAt)}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <StarDisplay value={fb.rating} />
                        <span className="text-xs font-bold text-amber-600">{fb.rating}/5</span>
                      </div>
                    </div>
                    {fb.comment && (
                      <p className="mt-3 rounded-lg border border-amber-100 bg-amber-50 px-3 py-2 text-sm italic text-gray-600">
                        "{fb.comment}"
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </section>
    </main>
  );
}
