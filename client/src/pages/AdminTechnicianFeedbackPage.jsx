import { useCallback, useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import AppNavbar from '../components/AppNavbar';
import { useAuth } from '../context/AuthContext';
import { feedbackApi } from '../services/feedbackApi';

const API_BASE_URL = 'http://localhost:8070/api';

// ─── helpers ────────────────────────────────────────────────────────────────

function StarPicker({ value, onChange }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          className={`text-3xl transition-transform hover:scale-110 focus:outline-none ${
            star <= value ? 'text-amber-400' : 'text-gray-300 hover:text-amber-300'
          }`}
          aria-label={`${star} star`}
        >
          ★
        </button>
      ))}
    </div>
  );
}

function StarDisplay({ value }) {
  return (
    <span className="inline-flex gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <span key={s} className={`text-sm ${s <= value ? 'text-amber-400' : 'text-gray-300'}`}>★</span>
      ))}
    </span>
  );
}

function initials(name) {
  if (!name) return '?';
  return name.split(' ').slice(0, 2).map((w) => w[0]?.toUpperCase() ?? '').join('');
}

function formatDate(val) {
  if (!val) return '—';
  return new Date(val).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

const LABEL = ['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'];
const LABEL_COLOR = ['', 'text-red-500', 'text-orange-400', 'text-amber-500', 'text-blue-500', 'text-green-600'];

// ─── component ───────────────────────────────────────────────────────────────

export default function AdminTechnicianFeedbackPage() {
  const { token, role, isAuthenticated } = useAuth();

  const [resolvedIncidents, setResolvedIncidents] = useState([]);
  const [isLoading, setIsLoading]                 = useState(true);
  const [errorMsg, setErrorMsg]                   = useState('');
  const [successMsg, setSuccessMsg]               = useState('');
  const [activeTab, setActiveTab]                 = useState('pending'); // 'pending' | 'submitted'

  // Per-incident feedback form state
  const [ratings, setRatings]         = useState({});   // { id: 1-5 }
  const [comments, setComments]       = useState({});   // { id: string }
  const [submitted, setSubmitted]     = useState({});   // { id: boolean }
  const [submitting, setSubmitting]   = useState(null); // incidentId being submitted
  const [formErrors, setFormErrors]   = useState({});   // { id: string }

  // All-technicians summary for the "submitted" tab
  const [techFeedbackMap, setTechFeedbackMap] = useState({}); // { techId: feedbackList }
  const [technicians, setTechnicians]         = useState([]);

  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (role !== 'ADMIN')  return <Navigate to="/dashboard" replace />;

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setErrorMsg('');
    try {
      // Load all incidents
      const resp = await fetch(`${API_BASE_URL}/incidents`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const allIncidents = await resp.json().catch(() => []);
      if (!resp.ok) throw new Error(allIncidents?.message || 'Failed to load incidents.');

      // Only RESOLVED and CLOSED ones that have an assigned technician
      const done = (Array.isArray(allIncidents) ? allIncidents : []).filter(
        (i) => (i.status === 'RESOLVED' || i.status === 'CLOSED') && i.assignedTechnicianName
      );

      // Check which ones already have feedback
      const existChecks = await Promise.all(
        done.map((i) =>
          feedbackApi.checkExists(i.id).then((e) => ({ id: i.id, exists: e })).catch(() => ({ id: i.id, exists: false }))
        )
      );
      const existMap = Object.fromEntries(existChecks.map((e) => [e.id, e.exists]));
      setSubmitted(existMap);
      setResolvedIncidents(done);

      // Load technicians for the summary tab
      const usersResp = await fetch(`${API_BASE_URL}/users`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const allUsers = await usersResp.json().catch(() => []);
      const techs = (Array.isArray(allUsers) ? allUsers : []).filter((u) => u.role === 'TECHNICIAN');
      setTechnicians(techs);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to load data.');
    } finally {
      setIsLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => { loadData(); }, [loadData]);

  // Load feedback for all technicians when Summary tab is opened
  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    if (activeTab !== 'submitted' || technicians.length === 0) return;
    technicians.forEach(async (t) => {
      if (techFeedbackMap[t.id]) return;
      try {
        const list = await feedbackApi.getByTechnician(t.id);
        setTechFeedbackMap((prev) => ({ ...prev, [t.id]: Array.isArray(list) ? list : [] }));
      } catch {
        setTechFeedbackMap((prev) => ({ ...prev, [t.id]: [] }));
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, technicians]);

  async function handleSubmit(incidentId) {
    const rating = ratings[incidentId];
    if (!rating || rating < 1) {
      setFormErrors((p) => ({ ...p, [incidentId]: 'Please select a star rating before submitting.' }));
      return;
    }
    setFormErrors((p) => ({ ...p, [incidentId]: '' }));
    setSubmitting(incidentId);
    setSuccessMsg('');
    setErrorMsg('');

    try {
      await feedbackApi.submitFeedback(incidentId, rating, comments[incidentId] || '');
      setSubmitted((p) => ({ ...p, [incidentId]: true }));
      setSuccessMsg(`⭐ Feedback submitted for incident #${incidentId}!`);
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      setFormErrors((p) => ({
        ...p,
        [incidentId]: err?.response?.data?.message || err.message || 'Failed to submit feedback.',
      }));
    } finally {
      setSubmitting(null);
    }
  }

  const pending   = resolvedIncidents.filter((i) => !submitted[i.id]);
  const doneList  = resolvedIncidents.filter((i) => submitted[i.id]);

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <main className="min-h-screen bg-gradient-to-b from-amber-50 via-white to-orange-50">
      <AppNavbar />

      <section className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-amber-200 bg-white p-6 shadow-md">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-amber-600">Administration</p>
            <h1 className="mt-1 text-3xl font-bold text-slate-900">Technician Feedback</h1>
            <p className="mt-1 text-sm text-slate-500">
              Rate technicians on resolved incidents and view their performance history.
            </p>
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={loadData}
              className="rounded-lg border border-amber-200 bg-white px-4 py-2 text-sm font-semibold text-amber-700 transition hover:bg-amber-50">
              🔄 Refresh
            </button>
            <Link to="/dashboard"
              className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-amber-600">
              ← Dashboard
            </Link>
          </div>
        </div>

        {/* Stat cards */}
        {!isLoading && (
          <div className="mt-5 grid grid-cols-3 gap-3">
            {[
              { label: 'Resolved Incidents', value: resolvedIncidents.length, color: 'bg-green-100 text-green-700 border-green-200' },
              { label: 'Awaiting Feedback',  value: pending.length,           color: 'bg-amber-100 text-amber-700 border-amber-200' },
              { label: 'Feedback Submitted', value: doneList.length,          color: 'bg-blue-100 text-blue-700 border-blue-200' },
            ].map((s) => (
              <div key={s.label} className={`rounded-xl border p-4 shadow-sm ${s.color}`}>
                <p className="text-2xl font-bold">{s.value}</p>
                <p className="mt-1 text-xs font-semibold uppercase tracking-wide opacity-70">{s.label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Tabs */}
        <div className="mt-5 flex gap-2 rounded-xl border border-gray-200 bg-white p-1 shadow-sm">
          {[
            { key: 'pending',   label: `⏳ Pending Feedback (${pending.length})` },
            { key: 'submitted', label: `✅ Submitted & History (${doneList.length})` },
          ].map((t) => (
            <button key={t.key} type="button" onClick={() => setActiveTab(t.key)}
              className={`flex-1 rounded-lg px-4 py-2.5 text-sm font-semibold transition ${
                activeTab === t.key ? 'bg-amber-500 text-white shadow' : 'text-gray-600 hover:bg-gray-50'
              }`}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Alerts */}
        {errorMsg && (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            ❌ {errorMsg}
          </div>
        )}
        {successMsg && (
          <div className="mt-4 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-semibold text-green-700">
            {successMsg}
          </div>
        )}

        {/* Loading */}
        {isLoading && (
          <div className="mt-5 space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-48 animate-pulse rounded-2xl border border-amber-100 bg-amber-50" />
            ))}
          </div>
        )}

        {/* ═══ PENDING FEEDBACK TAB ═══ */}
        {!isLoading && activeTab === 'pending' && (
          <div className="mt-5 space-y-5">
            {pending.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-amber-200 bg-white p-10 text-center shadow-sm">
                <p className="text-5xl">🎉</p>
                <p className="mt-3 text-base font-semibold text-gray-700">All caught up!</p>
                <p className="mt-1 text-sm text-gray-400">All resolved incidents have received feedback.</p>
              </div>
            ) : (
              pending.map((inc) => {
                const isSubmitting = submitting === inc.id;
                const currentRating = ratings[inc.id] ?? 0;

                return (
                  <div key={inc.id}
                    className="rounded-2xl border border-amber-200 bg-white p-6 shadow-md shadow-amber-100/40">

                    {/* Incident info row */}
                    <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-bold text-amber-700">
                            Incident #{inc.id}
                          </span>
                          <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-500">
                            {inc.category}
                          </span>
                          <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                            inc.status === 'RESOLVED'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-gray-100 text-gray-600'
                          }`}>
                            {inc.status === 'RESOLVED' ? '✅ RESOLVED' : '🔒 CLOSED'}
                          </span>
                        </div>
                        <p className="mt-1 text-base font-bold text-slate-800">{inc.location}</p>
                        <p className="text-xs text-slate-400">
                          Reported by <strong>{inc.reportedByName || 'Unknown'}</strong> · {formatDate(inc.createdAt)}
                        </p>
                      </div>

                      {/* Technician avatar */}
                      <div className="flex items-center gap-3 rounded-xl border border-orange-100 bg-orange-50 px-4 py-2">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-orange-200 text-sm font-bold text-orange-700">
                          {initials(inc.assignedTechnicianName)}
                        </span>
                        <div>
                          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Technician</p>
                          <p className="text-sm font-bold text-slate-800">{inc.assignedTechnicianName}</p>
                        </div>
                      </div>
                    </div>

                    {/* Description */}
                    <p className="mb-4 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                      {inc.description}
                    </p>

                    {/* ─── FEEDBACK FORM ─── */}
                    <div className="rounded-xl border border-amber-100 bg-gradient-to-br from-amber-50 to-orange-50 p-5">
                      <p className="mb-4 text-sm font-bold text-amber-800">
                        ⭐ Rate this technician's work
                      </p>

                      {/* Stars */}
                      <div className="mb-2">
                        <StarPicker
                          value={currentRating}
                          onChange={(v) => {
                            setRatings((p) => ({ ...p, [inc.id]: v }));
                            setFormErrors((p) => ({ ...p, [inc.id]: '' }));
                          }}
                        />
                        {currentRating > 0 && (
                          <p className={`mt-1 text-xs font-bold ${LABEL_COLOR[currentRating]}`}>
                            {currentRating}/5 — {LABEL[currentRating]}
                          </p>
                        )}
                      </div>

                      {/* Comment */}
                      <div className="mt-3">
                        <label className="mb-1 block text-xs font-semibold text-slate-600">
                          Comment <span className="text-slate-400 font-normal">(optional)</span>
                        </label>
                        <textarea
                          rows={3}
                          value={comments[inc.id] || ''}
                          onChange={(e) => setComments((p) => ({ ...p, [inc.id]: e.target.value }))}
                          placeholder="e.g. Fixed the issue quickly, very professional…"
                          className="w-full resize-none rounded-xl border border-amber-200 bg-white px-4 py-2.5 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
                        />
                      </div>

                      {/* Error */}
                      {formErrors[inc.id] && (
                        <p className="mt-2 text-xs font-semibold text-red-600">⚠️ {formErrors[inc.id]}</p>
                      )}

                      {/* Submit */}
                      <button
                        type="button"
                        disabled={isSubmitting}
                        onClick={() => handleSubmit(inc.id)}
                        className="mt-4 w-full rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 py-3 text-sm font-bold text-white shadow-md shadow-amber-200 transition hover:from-amber-600 hover:to-orange-600 disabled:cursor-wait disabled:opacity-60"
                      >
                        {isSubmitting ? '⏳ Submitting…' : '⭐ Submit Feedback'}
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* ═══ SUBMITTED / HISTORY TAB ═══ */}
        {!isLoading && activeTab === 'submitted' && (
          <div className="mt-5 space-y-5">
            {technicians.length === 0 ? (
              <p className="text-sm text-gray-400">No technicians found.</p>
            ) : (
              technicians.map((tech) => {
                const feedbackList = techFeedbackMap[tech.id] ?? null;
                const avgRating = feedbackList?.length
                  ? (feedbackList.reduce((s, f) => s + f.rating, 0) / feedbackList.length).toFixed(1)
                  : null;

                return (
                  <div key={tech.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    {/* Tech header */}
                    <div className="mb-4 flex flex-wrap items-center gap-3">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-orange-100 text-sm font-bold text-orange-700">
                        {initials(tech.name)}
                      </span>
                      <div className="flex-1">
                        <p className="font-bold text-slate-800">{tech.name}</p>
                        <p className="text-xs text-slate-500">{tech.email}</p>
                      </div>
                      {avgRating ? (
                        <div className="flex items-center gap-2">
                          <StarDisplay value={Math.round(parseFloat(avgRating))} />
                          <span className="text-sm font-bold text-amber-600">{avgRating} avg</span>
                          <span className="text-xs text-slate-400">({feedbackList.length} review{feedbackList.length !== 1 ? 's' : ''})</span>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400">No feedback yet</span>
                      )}
                    </div>

                    {/* Feedback list */}
                    {feedbackList === null ? (
                      <div className="h-6 animate-pulse rounded bg-slate-100" />
                    ) : feedbackList.length === 0 ? (
                      <p className="rounded-lg border border-dashed border-slate-200 py-4 text-center text-sm text-slate-400">
                        No feedback submitted for this technician yet.
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {feedbackList.map((fb) => (
                          <div key={fb.id}
                            className="flex flex-wrap items-start justify-between gap-3 rounded-xl border border-amber-100 bg-amber-50 px-4 py-3">
                            <div className="flex-1">
                              <p className="text-xs font-semibold text-slate-500">
                                Incident <span className="text-orange-500">#{fb.incidentId ?? fb.incident?.id}</span>
                                {' · '}{formatDate(fb.createdAt)}
                              </p>
                              {fb.comment && (
                                <p className="mt-1 text-sm italic text-slate-700">"{fb.comment}"</p>
                              )}
                            </div>
                            <div className="flex flex-col items-end gap-0.5">
                              <StarDisplay value={fb.rating} />
                              <span className={`text-xs font-bold ${LABEL_COLOR[fb.rating]}`}>
                                {fb.rating}/5 — {LABEL[fb.rating]}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}
      </section>
    </main>
  );
}
