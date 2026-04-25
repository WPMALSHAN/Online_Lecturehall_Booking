import { Navigate } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import AppNavbar from '../components/AppNavbar';
import { useAuth } from '../context/AuthContext';
import { fetchNotifications } from '../services/notificationApi';

const ROLE_CARDS = {
  STUDENT: [
    {
      title: 'Book a Room',
      description: 'Submit room booking requests and track approval status from admins.',
      actionLabel: 'Open Booking Module',
      actionPath: '/dashboard/bookings',
    },
    {
      title: 'Report an Issue',
      description: 'Create maintenance incidents with details for faster resolution.',
      actionLabel: 'Open Incident Module',
      actionPath: '/dashboard/incidents',
    },
    {
      title: 'My Notifications',
      description: 'Check updates on your bookings and incidents in one place.',
      actionLabel: 'View Notifications',
      actionPath: '/notifications',
    },
  ],
  LECTURER: [
    {
      title: 'Faculty Booking Requests',
      description: 'Request lecture hall bookings and monitor approvals.',
      actionLabel: 'Open Booking Module',
      actionPath: '/dashboard/bookings',
    },
    {
      title: 'Facility Issues',
      description: 'Report classroom or lab incidents for technician assignment.',
      actionLabel: 'Open Incident Module',
      actionPath: '/dashboard/incidents',
    },
    {
      title: 'Notifications',
      description: 'Stay informed about request updates and campus alerts.',
      actionLabel: 'View Notifications',
      actionPath: '/notifications',
    },
  ],
  TECHNICIAN: [
    {
      title: 'Assigned Incidents',
      description: 'Review assigned tickets and update progress after fixes.',
      actionLabel: 'Open Incident Module',
      actionPath: '/dashboard/incidents',
    },
    {
      title: 'Work Queue Updates',
      description: 'Track incoming maintenance tasks from administrators.',
      actionLabel: 'View Notifications',
      actionPath: '/notifications',
    },
  ],
  ADMIN: [
    {
      title: 'Booking Administration',
      description: 'Approve or reject room booking requests from users.',
      actionLabel: 'Open Booking Module',
      actionPath: '/dashboard/bookings',
    },
    {
      title: 'Incident Management',
      description: 'Assign technicians and monitor issue resolution progress.',
      actionLabel: 'Open Incident Module',
      actionPath: '/dashboard/incidents',
    },
    {
      title: 'System Notifications',
      description: 'Broadcast and review operational updates campus-wide.',
      actionLabel: 'View Notifications',
      actionPath: '/notifications',
    },
  ],
};

export default function DashboardPage() {
  const { isAuthenticated, name, role, signOut } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    let isMounted = true;

    async function loadUnreadCount() {
      try {
        const notifications = await fetchNotifications();
        const unread = notifications.filter((item) => !item.isRead).length;
        if (isMounted) {
          setUnreadCount(unread);
        }
      } catch {
        if (isMounted) {
          setUnreadCount(0);
        }
      }
    }

    loadUnreadCount();

    return () => {
      isMounted = false;
    };
  }, []);

  const cards = useMemo(() => ROLE_CARDS[role] ?? [], [role]);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-blue-50 via-white to-blue-100">
      <AppNavbar unreadCount={unreadCount} />

      <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-blue-100 bg-white p-6 shadow-lg shadow-blue-100/60">
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-blue-600">Control Center</p>
          <h1 className="mt-2 text-3xl font-bold text-blue-950">Welcome, {name}</h1>
          <p className="mt-2 text-sm text-blue-700">
            Signed in as <span className="font-semibold text-blue-900">{role}</span>
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              to="/notifications"
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              Go to Notifications
            </Link>
            <button
              type="button"
              onClick={signOut}
              className="rounded-lg border border-blue-200 bg-white px-4 py-2 text-sm font-semibold text-blue-700 transition hover:bg-blue-50"
            >
              Sign Out
            </button>
          </div>
        </div>

        <section className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {cards.map((item) => (
            <article key={item.title} className="rounded-xl border border-blue-100 bg-white p-5 shadow-sm shadow-blue-100/60">
              <h2 className="text-lg font-bold text-blue-900">{item.title}</h2>
              <p className="mt-2 text-sm text-blue-700">{item.description}</p>
              <Link
                to={item.actionPath}
                className="mt-4 inline-flex rounded-md bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-700 transition hover:bg-blue-100"
              >
                {item.actionLabel}
              </Link>
            </article>
          ))}
        </section>

        {!cards.length ? (
          <p className="mt-6 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700">
            No modules configured for your role yet.
          </p>
        ) : null}
      </section>
    </main>
  );
}
