import { useCallback, useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import AppNavbar from '../components/AppNavbar';
import { useAuth } from '../context/AuthContext';
import { userApi } from '../services/userApi';

// ─── helpers ────────────────────────────────────────────────────────────────

const ALL_ROLES = ['ALL', 'STUDENT', 'LECTURER', 'TECHNICIAN', 'ADMIN'];

const ROLE_COLORS = {
  STUDENT:    'bg-blue-100 text-blue-700',
  LECTURER:   'bg-purple-100 text-purple-700',
  TECHNICIAN: 'bg-amber-100 text-amber-700',
  ADMIN:      'bg-rose-100 text-rose-700',
};

function roleBadge(role) {
  return ROLE_COLORS[String(role).toUpperCase()] ?? 'bg-slate-100 text-slate-700';
}

function initials(name) {
  if (!name) return '?';
  return name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('');
}

// ─── component ───────────────────────────────────────────────────────────────

export default function AdminUsersPage() {
  const { isAuthenticated, role: myRole } = useAuth();

  const [users, setUsers]               = useState([]);
  const [filterRole, setFilterRole]     = useState('ALL');
  const [searchQuery, setSearchQuery]   = useState('');
  const [isLoading, setIsLoading]       = useState(true);
  const [workingId, setWorkingId]       = useState(null);
  const [successMsg, setSuccessMsg]     = useState('');
  const [errorMsg, setErrorMsg]         = useState('');
  // per-row role editing
  const [editingRoleId, setEditingRoleId]   = useState(null);
  const [pendingRole, setPendingRole]       = useState('');

  // ── load ──────────────────────────────────────────────────────────────────
  const loadUsers = useCallback(async () => {
    setIsLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const data = await userApi.getAllUsers();
      setUsers(Array.isArray(data) ? data : []);
    } catch (err) {
      setErrorMsg(err?.response?.data?.message || err.message || 'Failed to load users.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  // ── auth guards ───────────────────────────────────────────────────────────
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (myRole !== 'ADMIN')  return <Navigate to="/dashboard" replace />;

  // ── derived list ──────────────────────────────────────────────────────────
  const visible = users.filter((u) => {
    const matchRole   = filterRole === 'ALL' || String(u.role).toUpperCase() === filterRole;
    const query       = searchQuery.trim().toLowerCase();
    const matchSearch = !query ||
      String(u.name ?? '').toLowerCase().includes(query) ||
      String(u.email ?? '').toLowerCase().includes(query);
    return matchRole && matchSearch;
  });

  // ── actions ───────────────────────────────────────────────────────────────
  function flash(msg, isError) {
    if (isError) setErrorMsg(msg);
    else         setSuccessMsg(msg);
    setTimeout(() => { setErrorMsg(''); setSuccessMsg(''); }, 4000);
  }

  async function handleBlock(id) {
    setWorkingId(id);
    try {
      const updated = await userApi.blockUser(id);
      setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
      flash(`User #${id} has been blocked.`);
    } catch (err) {
      flash(err?.response?.data?.message || 'Failed to block user.', true);
    } finally {
      setWorkingId(null);
    }
  }

  async function handleUnblock(id) {
    setWorkingId(id);
    try {
      const updated = await userApi.unblockUser(id);
      setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
      flash(`User #${id} has been unblocked.`);
    } catch (err) {
      flash(err?.response?.data?.message || 'Failed to unblock user.', true);
    } finally {
      setWorkingId(null);
    }
  }

  async function handleRoleChange(id) {
    if (!pendingRole) return;
    setWorkingId(id);
    try {
      const updated = await userApi.updateRole(id, pendingRole);
      setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
      flash(`Role updated to ${pendingRole} for User #${id}.`);
    } catch (err) {
      flash(err?.response?.data?.message || 'Failed to update role.', true);
    } finally {
      setWorkingId(null);
      setEditingRoleId(null);
      setPendingRole('');
    }
  }

  // ── stats ────────────────────────────────────────────────────────────────
  const counts = users.reduce(
    (acc, u) => {
      const r = String(u.role).toUpperCase();
      acc[r] = (acc[r] ?? 0) + 1;
      if (u.blocked) acc.BLOCKED = (acc.BLOCKED ?? 0) + 1;
      return acc;
    },
    {},
  );

  // ─── render ───────────────────────────────────────────────────────────────
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-blue-50">
      <AppNavbar />

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">

        {/* ── Header ── */}
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-md">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-blue-600">Administration</p>
            <h1 className="mt-1 text-3xl font-bold text-slate-900">User Management</h1>
            <p className="mt-1 text-sm text-slate-500">
              View, filter, change roles, and block or unblock campus users.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={loadUsers}
              disabled={isLoading}
              className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
            >
              🔄 Refresh
            </button>
            <Link
              to="/dashboard"
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              ← Dashboard
            </Link>
          </div>
        </div>

        {/* ── Stat cards ── */}
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-5">
          {[
            { label: 'Total',       value: users.length,              color: 'border-blue-200 bg-blue-50 text-blue-700' },
            { label: 'Students',    value: counts.STUDENT ?? 0,       color: 'border-indigo-200 bg-indigo-50 text-indigo-700' },
            { label: 'Lecturers',   value: counts.LECTURER ?? 0,      color: 'border-purple-200 bg-purple-50 text-purple-700' },
            { label: 'Technicians', value: counts.TECHNICIAN ?? 0,    color: 'border-amber-200 bg-amber-50 text-amber-700' },
            { label: 'Blocked',     value: counts.BLOCKED ?? 0,       color: 'border-red-200 bg-red-50 text-red-700' },
          ].map((s) => (
            <div key={s.label} className={`rounded-xl border p-4 shadow-sm ${s.color}`}>
              <p className="text-xs font-semibold uppercase tracking-wide opacity-70">{s.label}</p>
              <p className="mt-1 text-3xl font-bold">{s.value}</p>
            </div>
          ))}
        </div>

        {/* ── Filters ── */}
        <div className="mt-5 flex flex-wrap gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          {/* Role pills */}
          <div className="flex flex-wrap gap-2">
            {ALL_ROLES.map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setFilterRole(r)}
                className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                  filterRole === r
                    ? 'bg-blue-600 text-white shadow'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {r}
              </button>
            ))}
          </div>

          {/* Search */}
          <input
            type="search"
            placeholder="Search by name or email…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="ml-auto w-64 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
          />
        </div>

        {/* ── Messages ── */}
        {errorMsg && (
          <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            ❌ {errorMsg}
          </p>
        )}
        {successMsg && (
          <p className="mt-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
            ✅ {successMsg}
          </p>
        )}

        {/* ── User list ── */}
        <div className="mt-5">
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className="h-20 animate-pulse rounded-xl border border-slate-100 bg-slate-50"
                />
              ))}
            </div>
          ) : visible.length === 0 ? (
            <div className="rounded-xl border border-slate-100 bg-white p-8 text-center text-sm text-slate-500 shadow-sm">
              No users match the current filter.
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    <th className="px-4 py-3">User</th>
                    <th className="px-4 py-3">Email</th>
                    <th className="px-4 py-3">Role</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {visible.map((u) => {
                    const busy = workingId === u.id;
                    const isMe = false; // we don't have our own id here, safety fallback

                    return (
                      <tr
                        key={u.id}
                        className={`transition hover:bg-slate-50 ${u.blocked ? 'opacity-60' : ''}`}
                      >
                        {/* Avatar + name */}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-700">
                              {initials(u.name)}
                            </span>
                            <div>
                              <p className="font-semibold text-slate-800">{u.name || '—'}</p>
                              <p className="text-xs text-slate-400">#{u.id}</p>
                            </div>
                          </div>
                        </td>

                        {/* Email */}
                        <td className="px-4 py-3 text-slate-600">{u.email}</td>

                        {/* Role */}
                        <td className="px-4 py-3">
                          {editingRoleId === u.id ? (
                            <div className="flex items-center gap-2">
                              <select
                                value={pendingRole}
                                onChange={(e) => setPendingRole(e.target.value)}
                                className="rounded-md border border-blue-300 bg-white px-2 py-1 text-xs text-slate-800 outline-none focus:ring-2 focus:ring-blue-200"
                              >
                                <option value="">Pick role…</option>
                                {['STUDENT', 'LECTURER', 'TECHNICIAN'].map((r) => (
                                  <option key={r} value={r}>{r}</option>
                                ))}
                              </select>
                              <button
                                type="button"
                                disabled={!pendingRole || busy}
                                onClick={() => handleRoleChange(u.id)}
                                className="rounded-md bg-blue-600 px-2 py-1 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                              >
                                Save
                              </button>
                              <button
                                type="button"
                                onClick={() => { setEditingRoleId(null); setPendingRole(''); }}
                                className="rounded-md border border-slate-200 px-2 py-1 text-xs text-slate-600 hover:bg-slate-50"
                              >
                                ✕
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => { setEditingRoleId(u.id); setPendingRole(u.role); }}
                              title="Click to change role"
                              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold transition hover:opacity-80 ${roleBadge(u.role)}`}
                            >
                              {u.role}
                              <span className="ml-0.5 opacity-60">✏️</span>
                            </button>
                          )}
                        </td>

                        {/* Status */}
                        <td className="px-4 py-3">
                          {u.blocked ? (
                            <span className="rounded-full bg-red-100 px-2.5 py-1 text-xs font-semibold text-red-700">
                              🔒 Blocked
                            </span>
                          ) : (
                            <span className="rounded-full bg-green-100 px-2.5 py-1 text-xs font-semibold text-green-700">
                              ✅ Active
                            </span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="px-4 py-3 text-right">
                          <div className="inline-flex gap-2">
                            {u.role !== 'ADMIN' && (
                              u.blocked ? (
                                <button
                                  type="button"
                                  disabled={busy}
                                  onClick={() => handleUnblock(u.id)}
                                  className="rounded-lg border border-green-200 bg-white px-3 py-1.5 text-xs font-semibold text-green-700 transition hover:bg-green-50 disabled:cursor-wait disabled:opacity-60"
                                >
                                  {busy ? '…' : '🔓 Unblock'}
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  disabled={busy}
                                  onClick={() => handleBlock(u.id)}
                                  className="rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-semibold text-red-700 transition hover:bg-red-50 disabled:cursor-wait disabled:opacity-60"
                                >
                                  {busy ? '…' : '🔒 Block'}
                                </button>
                              )
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              <div className="border-t border-slate-100 px-4 py-2 text-xs text-slate-400">
                Showing {visible.length} of {users.length} users
              </div>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
