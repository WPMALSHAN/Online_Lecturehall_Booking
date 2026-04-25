import { useEffect, useMemo, useState } from 'react';
import { Navigate } from 'react-router-dom';
import AppNavbar from '../components/AppNavbar';
import { useAuth } from '../context/AuthContext';
import {
  fetchNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from '../services/notificationApi';
import { getApiErrorMessage } from '../services/httpClient';

function formatDateTime(value) {
  if (!value) {
    return 'No date';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString();
}

export default function NotificationsPage() {
  const { isAuthenticated } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const unreadCount = useMemo(
    () => notifications.filter((notification) => !notification.isRead).length,
    [notifications],
  );

  const loadNotifications = async () => {
    setErrorMessage('');
    setIsLoading(true);

    try {
      const data = await fetchNotifications();
      setNotifications(Array.isArray(data) ? data : []);
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error, 'Failed to load notifications.'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  const handleMarkAsRead = async (notificationId) => {
    setIsUpdating(true);
    setErrorMessage('');

    try {
      await markNotificationRead(notificationId);
      setNotifications((previous) =>
        previous.map((item) =>
          item.id === notificationId
            ? {
                ...item,
                isRead: true,
              }
            : item,
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
      setNotifications((previous) => previous.map((item) => ({ ...item, isRead: true })));
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error, 'Failed to mark all as read.'));
    } finally {
      setIsUpdating(false);
    }
  };

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-blue-50 via-white to-blue-100">
      <AppNavbar unreadCount={unreadCount} />

      <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-blue-100 bg-white p-6 shadow-lg shadow-blue-100/60">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-blue-600">Alerts</p>
            <h1 className="mt-2 text-3xl font-bold text-blue-950">Notifications</h1>
            <p className="mt-2 text-sm text-blue-700">
              Unread notifications: <span className="font-semibold text-blue-900">{unreadCount}</span>
            </p>
          </div>

          <button
            type="button"
            onClick={handleMarkAllAsRead}
            disabled={isUpdating || unreadCount === 0}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Mark All as Read
          </button>
        </div>

        {errorMessage ? (
          <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {errorMessage}
          </p>
        ) : null}

        <section className="mt-6 space-y-3">
          {isLoading ? (
            <div className="rounded-xl border border-blue-100 bg-white p-5 text-sm text-blue-700 shadow-sm shadow-blue-100/60">
              Loading notifications...
            </div>
          ) : null}

          {!isLoading && notifications.length === 0 ? (
            <div className="rounded-xl border border-blue-100 bg-white p-5 text-sm text-blue-700 shadow-sm shadow-blue-100/60">
              No notifications available.
            </div>
          ) : null}

          {!isLoading
            ? notifications.map((notification) => (
                <article
                  key={notification.id}
                  className={`rounded-xl border p-5 shadow-sm transition ${
                    notification.isRead
                      ? 'border-blue-100 bg-white shadow-blue-100/60'
                      : 'border-blue-300 bg-blue-50/70 shadow-blue-200/70'
                  }`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-sm text-blue-900">{notification.message}</p>
                      <p className="mt-1 text-xs text-blue-600">{formatDateTime(notification.createdAt)}</p>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                          notification.isRead
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-blue-600 text-white'
                        }`}
                      >
                        {notification.isRead ? 'Read' : 'Unread'}
                      </span>

                      {!notification.isRead ? (
                        <button
                          type="button"
                          disabled={isUpdating}
                          onClick={() => handleMarkAsRead(notification.id)}
                          className="rounded-md border border-blue-200 bg-white px-3 py-1.5 text-xs font-semibold text-blue-700 transition hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          Mark as Read
                        </button>
                      ) : null}
                    </div>
                  </div>
                </article>
              ))
            : null}
        </section>
      </section>
    </main>
  );
}
