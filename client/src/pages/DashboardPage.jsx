import { Navigate } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import AppNavbar from '../components/AppNavbar';
import { useAuth } from '../context/AuthContext';
import { fetchNotifications } from '../services/notificationApi';
import { requestJson } from '../services/apiClient';

const ROLE_CARDS = {
  STUDENT: [
    {
      title: 'Book a Room',
      description: 'Submit room booking requests and track approval status from admins.',
      actionLabel: 'Book Facility',
      actionPath: '/dashboard/bookings/book',
    },
    {
      title: 'My Booking Requests',
      description: 'View statuses of your pending, approved, and rejected booking requests.',
      actionLabel: 'View My Bookings',
      actionPath: '/dashboard/bookings/my',
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
      actionLabel: 'Book Facility',
      actionPath: '/dashboard/bookings/book',
    },
    {
      title: 'My Booking Requests',
      description: 'Review all your booking statuses in one place.',
      actionLabel: 'View My Bookings',
      actionPath: '/dashboard/bookings/my',
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
      description: 'Review assigned tickets, post progress notes, and mark tasks as resolved.',
      actionLabel: 'Open My Incidents',
      actionPath: '/dashboard/incidents/technician',
    },
    {
      title: 'My Performance Feedback',
      description: 'View admin ratings and comments on your completed incident resolutions.',
      actionLabel: 'View My Feedback',
      actionPath: '/dashboard/incidents/technician',
    },
    {
      title: 'Work Queue Updates',
      description: 'Track incoming maintenance tasks assigned by administrators.',
      actionLabel: 'View Notifications',
      actionPath: '/notifications',
    },
  ],
  ADMIN: [
    {
      title: 'User Management',
      description: 'View all students, lecturers, and technicians. Block or unblock accounts and change roles.',
      actionLabel: 'Manage Users',
      actionPath: '/dashboard/users/admin',
    },
    {
      title: 'Facility Management',
      description: 'Add, edit, enable or disable campus facilities that users can book.',
      actionLabel: 'Manage Facilities',
      actionPath: '/dashboard/facilities/admin',
    },
    {
      title: 'Asset Management',
      description: 'View and manage campus assets inventory.',
      actionLabel: 'Open Assets',
      actionPath: '/dashboard/assets',
    },
    {
      title: 'Technician Feedback',
      description: 'Rate technicians on resolved incidents and review their performance history.',
      actionLabel: '⭐ Give Feedback',
      actionPath: '/dashboard/feedback/admin',
    },
    {
      title: 'Booking Administration',
      description: 'Approve or reject room booking requests from users.',
      actionLabel: 'Open Admin Bookings',
      actionPath: '/dashboard/bookings/admin',
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
  const { isAuthenticated, name, role, signOut, token } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [adminSummary, setAdminSummary] = useState(null);
  const [assetForm, setAssetForm] = useState({
    name: '',
    category: '',
    location: '',
  });
  const [assetError, setAssetError] = useState('');
  const [assetSuccess, setAssetSuccess] = useState('');
  const [isCreatingAsset, setIsCreatingAsset] = useState(false);
  const [assetUpdateForm, setAssetUpdateForm] = useState({
    assetId: '',
    name: '',
    category: '',
    location: '',
    status: 'ACTIVE',
  });
  const [assetUpdateError, setAssetUpdateError] = useState('');
  const [assetUpdateSuccess, setAssetUpdateSuccess] = useState('');
  const [isUpdatingAsset, setIsUpdatingAsset] = useState(false);
  const [isLoadingAssetDetails, setIsLoadingAssetDetails] = useState(false);

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

    async function loadAdminSummary() {
      if (role !== 'ADMIN' || !token) {
        return;
      }

      try {
        const summary = await requestJson('/api/users/admin/dashboard', {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (isMounted) {
          setAdminSummary(summary);
        }
      } catch {
        if (isMounted) {
          setAdminSummary(null);
        }
      }
    }

    loadUnreadCount();
    loadAdminSummary();

    return () => {
      isMounted = false;
    };
  }, [role, token]);

  const cards = useMemo(() => ROLE_CARDS[role] ?? [], [role]);

  const onAssetFieldChange = (event) => {
    const { name: fieldName, value } = event.target;
    setAssetForm((previous) => ({ ...previous, [fieldName]: value }));
  };

  const onCreateAsset = async (event) => {
    event.preventDefault();

    setAssetError('');
    setAssetSuccess('');

    if (!assetForm.name.trim() || !assetForm.category.trim() || !assetForm.location.trim()) {
      setAssetError('Name, category, and location are required.');
      return;
    }

    setIsCreatingAsset(true);

    try {
      await requestJson('/api/assets', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: assetForm.name.trim(),
          category: assetForm.category.trim(),
          location: assetForm.location.trim(),
        }),
      });

      setAssetForm({ name: '', category: '', location: '' });
      setAssetSuccess('Asset created successfully.');
    } catch (error) {
      setAssetError(error.message || 'Failed to create asset.');
    } finally {
      setIsCreatingAsset(false);
    }
  };

  const onAssetUpdateFieldChange = (event) => {
    const { name: fieldName, value } = event.target;
    setAssetUpdateForm((previous) => ({ ...previous, [fieldName]: value }));
  };

  const onLoadAssetForUpdate = async () => {
    setAssetUpdateError('');
    setAssetUpdateSuccess('');

    if (!assetUpdateForm.assetId.trim()) {
      setAssetUpdateError('Please enter an Asset ID first.');
      return;
    }

    setIsLoadingAssetDetails(true);

    try {
      const asset = await requestJson(`/api/assets/${assetUpdateForm.assetId.trim()}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setAssetUpdateForm((previous) => ({
        ...previous,
        name: asset?.name ?? '',
        category: asset?.category ?? '',
        location: asset?.location ?? '',
        status: asset?.status ?? 'ACTIVE',
      }));
      setAssetUpdateSuccess(`Loaded asset #${assetUpdateForm.assetId.trim()} details.`);
    } catch (error) {
      setAssetUpdateError(error.message || 'Failed to load asset details.');
    } finally {
      setIsLoadingAssetDetails(false);
    }
  };

  const onUpdateAsset = async (event) => {
    event.preventDefault();

    setAssetUpdateError('');
    setAssetUpdateSuccess('');

    if (
      !assetUpdateForm.assetId.trim() ||
      !assetUpdateForm.name.trim() ||
      !assetUpdateForm.category.trim() ||
      !assetUpdateForm.location.trim()
    ) {
      setAssetUpdateError('Asset ID, name, category, and location are required.');
      return;
    }

    setIsUpdatingAsset(true);

    try {
      await requestJson(`/api/assets/${assetUpdateForm.assetId.trim()}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: assetUpdateForm.name.trim(),
          category: assetUpdateForm.category.trim(),
          location: assetUpdateForm.location.trim(),
          status: assetUpdateForm.status,
        }),
      });

      setAssetUpdateSuccess(`Asset #${assetUpdateForm.assetId.trim()} updated successfully.`);
    } catch (error) {
      setAssetUpdateError(error.message || 'Failed to update asset.');
    } finally {
      setIsUpdatingAsset(false);
    }
  };

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

        {role === 'ADMIN' && adminSummary ? (
          <section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <article className="rounded-xl border border-blue-100 bg-white p-4 shadow-sm shadow-blue-100/60">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-blue-500">Users</p>
              <p className="mt-2 text-2xl font-bold text-blue-900">{adminSummary.totalUsers ?? 0}</p>
              <p className="mt-1 text-xs text-blue-700">Students: {adminSummary.totalStudents ?? 0}</p>
            </article>

            <article className="rounded-xl border border-blue-100 bg-white p-4 shadow-sm shadow-blue-100/60">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-blue-500">Staff</p>
              <p className="mt-2 text-2xl font-bold text-blue-900">
                {(adminSummary.totalLecturers ?? 0) + (adminSummary.totalTechnicians ?? 0) + (adminSummary.totalAdmins ?? 0)}
              </p>
              <p className="mt-1 text-xs text-blue-700">Techs: {adminSummary.totalTechnicians ?? 0}</p>
            </article>

            <article className="rounded-xl border border-blue-100 bg-white p-4 shadow-sm shadow-blue-100/60">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-blue-500">Incidents</p>
              <p className="mt-2 text-2xl font-bold text-blue-900">{adminSummary.totalIncidents ?? 0}</p>
              <p className="mt-1 text-xs text-blue-700">Open: {adminSummary.openIncidents ?? 0}</p>
            </article>

            <article className="rounded-xl border border-blue-100 bg-white p-4 shadow-sm shadow-blue-100/60">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-blue-500">Bookings</p>
              <p className="mt-2 text-2xl font-bold text-blue-900">{adminSummary.totalBookings ?? 0}</p>
              <p className="mt-1 text-xs text-blue-700">Pending: {adminSummary.pendingBookings ?? 0}</p>
            </article>
          </section>
        ) : null}

        {role === 'ADMIN' ? (
          <section className="mt-6 rounded-2xl border border-blue-100 bg-white p-5 shadow-sm shadow-blue-100/60">
            <h2 className="text-lg font-bold text-blue-900">Quick Add Asset</h2>
            <p className="mt-1 text-sm text-blue-700">Create a campus asset from the admin dashboard.</p>

            {assetError ? (
              <p className="mt-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                {assetError}
              </p>
            ) : null}
            {assetSuccess ? (
              <p className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                {assetSuccess}
              </p>
            ) : null}

            <form className="mt-4 grid gap-3 md:grid-cols-4" onSubmit={onCreateAsset} noValidate>
              <input
                name="name"
                value={assetForm.name}
                onChange={onAssetFieldChange}
                placeholder="Asset name"
                className="rounded-lg border border-blue-200 bg-white px-3 py-2 text-sm text-blue-900 outline-none focus:border-blue-500"
                required
              />
              <input
                name="category"
                value={assetForm.category}
                onChange={onAssetFieldChange}
                placeholder="Category"
                className="rounded-lg border border-blue-200 bg-white px-3 py-2 text-sm text-blue-900 outline-none focus:border-blue-500"
                required
              />
              <input
                name="location"
                value={assetForm.location}
                onChange={onAssetFieldChange}
                placeholder="Location"
                className="rounded-lg border border-blue-200 bg-white px-3 py-2 text-sm text-blue-900 outline-none focus:border-blue-500"
                required
              />
              <button
                type="submit"
                disabled={isCreatingAsset}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isCreatingAsset ? 'Creating...' : 'Create Asset'}
              </button>
            </form>
          </section>
        ) : null}

        {role === 'ADMIN' ? (
          <section className="mt-6 rounded-2xl border border-blue-100 bg-white p-5 shadow-sm shadow-blue-100/60">
            <h2 className="text-lg font-bold text-blue-900">Quick Update Asset</h2>
            <p className="mt-1 text-sm text-blue-700">Update an existing asset by ID.</p>

            {assetUpdateError ? (
              <p className="mt-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                {assetUpdateError}
              </p>
            ) : null}
            {assetUpdateSuccess ? (
              <p className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                {assetUpdateSuccess}
              </p>
            ) : null}

            <form className="mt-4 grid gap-3 md:grid-cols-3" onSubmit={onUpdateAsset} noValidate>
              <div className="flex gap-2 md:col-span-3">
                <input
                  name="assetId"
                  value={assetUpdateForm.assetId}
                  onChange={onAssetUpdateFieldChange}
                  placeholder="Asset ID (e.g. 1)"
                  className="flex-1 rounded-lg border border-blue-200 bg-white px-3 py-2 text-sm text-blue-900 outline-none focus:border-blue-500"
                  required
                />
                <button
                  type="button"
                  onClick={onLoadAssetForUpdate}
                  disabled={isLoadingAssetDetails}
                  className="rounded-lg border border-blue-200 bg-white px-4 py-2 text-sm font-semibold text-blue-700 transition hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isLoadingAssetDetails ? 'Loading...' : 'Load'}
                </button>
              </div>
              <input
                name="name"
                value={assetUpdateForm.name}
                onChange={onAssetUpdateFieldChange}
                placeholder="Asset name"
                className="rounded-lg border border-blue-200 bg-white px-3 py-2 text-sm text-blue-900 outline-none focus:border-blue-500"
                required
              />
              <input
                name="category"
                value={assetUpdateForm.category}
                onChange={onAssetUpdateFieldChange}
                placeholder="Category"
                className="rounded-lg border border-blue-200 bg-white px-3 py-2 text-sm text-blue-900 outline-none focus:border-blue-500"
                required
              />
              <input
                name="location"
                value={assetUpdateForm.location}
                onChange={onAssetUpdateFieldChange}
                placeholder="Location"
                className="rounded-lg border border-blue-200 bg-white px-3 py-2 text-sm text-blue-900 outline-none focus:border-blue-500"
                required
              />
              <select
                name="status"
                value={assetUpdateForm.status}
                onChange={onAssetUpdateFieldChange}
                className="rounded-lg border border-blue-200 bg-white px-3 py-2 text-sm text-blue-900 outline-none focus:border-blue-500"
              >
                <option value="ACTIVE">ACTIVE</option>
                <option value="OUT_OF_SERVICE">OUT_OF_SERVICE</option>
              </select>
              <button
                type="submit"
                disabled={isUpdatingAsset}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isUpdatingAsset ? 'Updating...' : 'Update Asset'}
              </button>
            </form>
          </section>
        ) : null}

        {!cards.length ? (
          <p className="mt-6 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700">
            No modules configured for your role yet.
          </p>
        ) : null}
      </section>
    </main>
  );
}
