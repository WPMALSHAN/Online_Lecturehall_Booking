import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import AppNavbar from '../components/AppNavbar';
import { useAuth } from '../context/AuthContext';
import { requestJson } from '../services/apiClient';

const PRIORITY_BADGE = {
  HIGH: 'bg-red-100 text-red-700 border border-red-300',
  MEDIUM: 'bg-orange-100 text-orange-700 border border-orange-300',
  LOW: 'bg-green-100 text-green-700 border border-green-300',
};

const STATUS_BADGE = {
  OPEN: 'bg-blue-100 text-blue-700 border border-blue-300',
  IN_PROGRESS: 'bg-amber-100 text-amber-700 border border-amber-300',
  RESOLVED: 'bg-green-100 text-green-700 border border-green-300',
  CLOSED: 'bg-gray-100 text-gray-600 border border-gray-300',
  REJECTED: 'bg-red-100 text-red-700 border border-red-300',
};

const STATUS_ICON = {
  OPEN: '🔵',
  IN_PROGRESS: '🔄',
  RESOLVED: '✅',
  CLOSED: '🔒',
  REJECTED: '❌',
};

const ALL_STATUSES = ['', 'OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED', 'REJECTED'];

function formatDate(val) {
  if (!val) return '—';
  return new Date(val).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

export default function MyIncidentsPage() {
  const { token } = useAuth();
  const [incidents, setIncidents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    loadIncidents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  async function loadIncidents() {
    setIsLoading(true);
    setErrorMessage('');
    try {
      const query = statusFilter ? `?status=${encodeURIComponent(statusFilter)}` : '';
      // Uses existing apiClient → requestJson which properly attaches headers via incidentApi pattern
      const data = await requestJson(`/api/incidents/my${query}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setIncidents(Array.isArray(data) ? data : []);
    } catch (err) {
      setErrorMessage(err.message || 'Failed to load incidents.');
    } finally {
      setIsLoading(false);
    }
  }

  const counts = incidents.reduce((acc, inc) => {
    acc[inc.status] = (acc[inc.status] || 0) + 1;
    return acc;
  }, {});

  return (
    <main className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-red-50">
      <AppNavbar />

      <section className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
        {/* Header row */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-red-100 px-4 py-1 text-xs font-bold uppercase tracking-widest text-red-600">
              🚨 Smart Campus
            </span>
            <h1 className="mt-2 text-2xl font-extrabold text-gray-900">My Incidents</h1>
            <p className="mt-1 text-sm text-gray-500">Track the status of your submitted incident reports.</p>
          </div>
          <Link
            to="/dashboard/incidents/report"
            className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-red-500 px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-orange-200 transition hover:from-orange-600 hover:to-red-600"
          >
            + Report New Incident
          </Link>
        </div>

        {/* Summary stat cards */}
        {!isLoading && incidents.length > 0 && (
          <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: 'Total', value: incidents.length, grad: 'from-orange-400 to-red-400' },
              { label: 'Open', value: counts.OPEN || 0, grad: 'from-blue-400 to-blue-500' },
              { label: 'In Progress', value: counts.IN_PROGRESS || 0, grad: 'from-amber-400 to-amber-500' },
              { label: 'Resolved', value: counts.RESOLVED || 0, grad: 'from-green-400 to-green-500' },
            ].map((stat) => (
              <div key={stat.label} className={`rounded-xl bg-gradient-to-br ${stat.grad} p-4 text-white shadow-sm`}>
                <p className="text-2xl font-extrabold">{stat.value}</p>
                <p className="text-xs font-semibold uppercase tracking-wide opacity-80">{stat.label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Status filter chips */}
        <div className="mb-5 flex flex-wrap items-center gap-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Filter:</p>
          {ALL_STATUSES.map((s) => (
            <button
              key={s || 'all'}
              onClick={() => setStatusFilter(s)}
              className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
                statusFilter === s
                  ? 'border-orange-400 bg-orange-500 text-white'
                  : 'border-gray-200 bg-white text-gray-600 hover:border-orange-300 hover:text-orange-600'
              }`}
            >
              {s || 'All'}
            </button>
          ))}
        </div>

        {/* Error */}
        {errorMessage && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            ⚠️ {errorMessage}
          </div>
        )}

        {/* Skeleton */}
        {isLoading && (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-28 animate-pulse rounded-2xl border border-orange-100 bg-orange-50" />
            ))}
          </div>
        )}

        {/* Empty state */}
        {!isLoading && incidents.length === 0 && !errorMessage && (
          <div className="rounded-2xl border border-dashed border-orange-200 bg-white p-10 text-center shadow-sm">
            <p className="text-3xl">📋</p>
            <p className="mt-3 text-base font-semibold text-gray-700">No incidents yet</p>
            <p className="mt-1 text-sm text-gray-400">
              {statusFilter ? `No incidents with status "${statusFilter}".` : 'You have not reported any incidents.'}
            </p>
            <Link
              to="/dashboard/incidents/report"
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-red-500 px-5 py-2.5 text-sm font-bold text-white"
            >
              Report First Incident
            </Link>
          </div>
        )}

        {/* Incident list */}
        {!isLoading && incidents.length > 0 && (
          <div className="space-y-4">
            {incidents.map((inc) => (
              <article
                key={inc.id}
                className="group rounded-2xl border border-orange-100 bg-white p-5 shadow-sm transition hover:shadow-md hover:shadow-orange-100/50"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-bold text-orange-400">#{inc.id}</span>
                      <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">{inc.category}</span>
                    </div>
                    <p className="mt-1 truncate text-base font-bold text-gray-900">{inc.location}</p>
                    <p className="mt-1 line-clamp-2 text-sm text-gray-500">{inc.description}</p>
                  </div>

                  <div className="flex shrink-0 flex-col items-end gap-2">
                    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold ${STATUS_BADGE[inc.status] || STATUS_BADGE.OPEN}`}>
                      {STATUS_ICON[inc.status]} {inc.status?.replace('_', ' ')}
                    </span>
                    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold ${PRIORITY_BADGE[inc.priority] || PRIORITY_BADGE.LOW}`}>
                      {inc.priority} PRIORITY
                    </span>
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-gray-100 pt-3">
                  <div className="flex flex-wrap gap-4 text-xs text-gray-400">
                    <span>📅 {formatDate(inc.createdAt)}</span>
                    {inc.assignedTechnicianName && (
                      <span>🔧 <strong className="text-gray-600">{inc.assignedTechnicianName}</strong></span>
                    )}
                  </div>
                  {inc.status === 'REJECTED' && inc.rejectionReason && (
                    <p className="text-xs italic text-red-500">Rejected: {inc.rejectionReason}</p>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
