import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Navigate } from 'react-router-dom';
import AppNavbar from '../components/AppNavbar';
import { useAuth } from '../context/AuthContext';
import {
  fetchNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from '../services/notificationApi';
import { getApiErrorMessage } from '../services/httpClient';

const POLL_INTERVAL_MS = 30_000; // auto-refresh every 30 seconds

function formatDateTime(value) {
  if (!value) return 'No date';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
}

/** Picks a coloured left-border and icon based on message content. */
function notificationStyle(message) {
  const msg = message || '';
  if (/✅|APPROVED|submitted/i.test(msg))
    return { border: 'border-l-4 border-l-green-400', dot: '🟢' };
  if (/❌|REJECTED/i.test(msg))
    return { border: 'border-l-4 border-l-red-400', dot: '🔴' };
  if (/⚠️|conflict/i.test(msg))
    return { border: 'border-l-4 border-l-amber-400', dot: '🟡' };
  if (/🚫|CANCELLED/i.test(msg))
    return { border: 'border-l-4 border-l-slate-400', dot: '⚫' };
  return { border: 'border-l-4 border-l-blue-400', dot: '🔵' };
}

export default function NotificationsPage() {
  const { isAuthenticated } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading]   = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [lastRefreshed, setLastRefreshed] = useState(null);
  const pollRef = useRef(null);

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.isRead).length,
    [notifications],
  );

  // ─── Load / refresh ──────────────────────────────────────────────────────────
  const loadNotifications = useCallback(async (silent) => {
    if (!silent) setIsLoading(true);
    setErrorMessage('');

    try {
      const data = await fetchNotifications();
      setNotifications(Array.isArray(data) ? data : []);
      setLastRefreshed(new Date());
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error, 'Failed to load notifications.'));
    } finally {
      if (!silent) setIsLoading(false);
    }
  }, []);

  // Initial load + start polling
  useEffect(() => {
    loadNotifications(false);

    pollRef.current = setInterval(() => loadNotifications(true), POLL_INTERVAL_MS);

    return () => clearInterval(pollRef.current);
  }, [loadNotifications]);

  // ─── Actions ─────────────────────────────────────────────────────────────────
  const handleMarkAsRead = async (notificationId) => {
    setIsUpdating(true);
    setErrorMessage('');

    try {
      await markNotificationRead(notificationId);
      setNotifications((prev) =>
        prev.map((item) =>
          item.id === notificationId ? { ...item, isRead: true } : item,
        ),
      );
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error, 'Failed to update notification.'));
    } finally {
      setIsUpdating(false);
    }
  };

  const handleMarkAllAsRead = async () => {
    setIsUpdating(true);
    setErrorMessage('');

    try {
      await markAllNotificationsRead();
      setNotifications((prev) => prev.map((item) => ({ ...item, isRead: true })));
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error, 'Failed to mark all as read.'));
    } finally {
      setIsUpdating(false);
    }
  };

  // ─── Auth guard ───────────────────────────────────────────────────────────────
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // ─── Render ───────────────────────────────────────────────────────────────────
  return (
    <main className="min-h-screen bg-gradient-to-b from-blue-50 via-white to-blue-100">
      <AppNavbar unreadCount={unreadCount} />

      <section className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">

        {/* ── Header ── */}
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-blue-100 bg-white p-6 shadow-lg shadow-blue-100/60">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-blue-600">Alerts &amp; Updates</p>
            <h1 className="mt-1 text-3xl font-bold text-blue-950">Notifications</h1>
            {unreadCount > 0 && (
              <p className="mt-1 text-sm text-blue-700">
                You have{' '}
                <span className="font-semibold text-blue-900">{unreadCount} unread</span>{' '}
                notification{unreadCount !== 1 ? 's' : ''}.
              </p>
            )}
            {lastRefreshed && (
              <p className="mt-1 text-xs text-blue-400">
                Last refreshed: {lastRefreshed.toLocaleTimeString()} · auto-updates every 30s
              </p>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => loadNotifications(false)}
              disabled={isLoading}
              className="rounded-lg border border-blue-200 bg-white px-4 py-2 text-sm font-semibold text-blue-700 transition hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              🔄 Refresh
            </button>
            <button
              type="button"
              onClick={handleMarkAllAsRead}
              disabled={isUpdating || unreadCount === 0}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              ✅ Mark All as Read
            </button>
          </div>
        </div>

        {/* ── Error ── */}
        {errorMessage ? (
          <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {errorMessage}
          </p>
        ) : null}

        {/* ── List ── */}
        <section className="mt-5 space-y-3">
          {isLoading && (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="h-20 animate-pulse rounded-xl border border-blue-100 bg-blue-50"
                />
              ))}
            </div>
          )}

          {!isLoading && notifications.length === 0 && (
            <div className="rounded-xl border border-blue-100 bg-white p-6 text-center text-sm text-blue-600 shadow-sm">
              🔔 No notifications yet — you will be notified about booking events here.
            </div>
          )}

          {!isLoading &&
            notifications.map((notification) => {
              const { border, dot } = notificationStyle(notification.message);

              return (
                <article
                  key={notification.id}
                  className={`flex gap-3 rounded-xl border bg-white p-4 shadow-sm transition ${border} ${
                    notification.isRead ? 'opacity-80' : ''
                  }`}
                >
                  {/* Colour dot */}
                  <span className="mt-0.5 select-none text-base leading-none">{dot}</span>

                  {/* Body */}
                  <div className="min-w-0 flex-1">
                    <p
                      className={`text-sm leading-relaxed ${
                        notification.isRead
                          ? 'text-blue-700'
                          : 'font-medium text-blue-950'
                      }`}
                    >
                      {notification.message}
                    </p>
                    <p className="mt-1 text-xs text-blue-400">
                      {formatDateTime(notification.createdAt)}
                    </p>
                  </div>

                  {/* Status + action */}
                  <div className="flex shrink-0 flex-col items-end gap-1.5">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        notification.isRead
                          ? 'bg-blue-100 text-blue-600'
                          : 'bg-blue-600 text-white'
                      }`}
                    >
                      {notification.isRead ? 'Read' : 'Unread'}
                    </span>

                    {!notification.isRead && (
                      <button
                        type="button"
                        disabled={isUpdating}
                        onClick={() => handleMarkAsRead(notification.id)}
                        className="rounded-md border border-blue-200 bg-white px-2.5 py-1 text-xs font-semibold text-blue-700 transition hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        Mark as Read
                      </button>
                    )}
                  </div>
                </article>
              );
            })}
        </section>
      </section>
    </main>
  );
}
