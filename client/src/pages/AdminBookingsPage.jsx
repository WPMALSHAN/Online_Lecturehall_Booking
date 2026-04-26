import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import AppNavbar from '../components/AppNavbar';
import { useAuth } from '../context/AuthContext';
import { bookingApi } from '../services/bookingApi';

function statusClasses(status) {
  const value = String(status).toUpperCase();

  if (value === 'APPROVED') {
    return 'border-green-200 bg-green-50 text-green-700';
  }

  if (value === 'REJECTED') {
    return 'border-red-200 bg-red-50 text-red-700';
  }

  return 'border-yellow-200 bg-yellow-50 text-yellow-700';
}

export default function AdminBookingsPage() {
  const { isAuthenticated, role } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [rejectReasons, setRejectReasons] = useState({});
  const [rejectErrors, setRejectErrors] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [workingId, setWorkingId] = useState(null);

  useEffect(() => {
    loadBookings();
  }, []);

  async function loadBookings() {
    setIsLoading(true);
    setErrorMessage('');

    try {
      const data = await bookingApi.getAllBookings();
      setBookings(Array.isArray(data) ? data : []);
    } catch (error) {
      setErrorMessage(error.message || 'Failed to load bookings.');
    } finally {
      setIsLoading(false);
    }
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (role !== 'ADMIN') {
    return <Navigate to="/dashboard/bookings/my" replace />;
  }

  async function onApprove(id) {
    setWorkingId(id);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      await bookingApi.approveBooking(undefined, id);
      setSuccessMessage('Booking approved.');
      await loadBookings();
    } catch (error) {
      setErrorMessage(error.message || 'Failed to approve booking.');
    } finally {
      setWorkingId(null);
    }
  }

  async function onReject(id) {
    const reason = String(rejectReasons[id] || '').trim();

    if (!reason) {
      setRejectErrors((prev) => ({ ...prev, [id]: 'Rejection reason is required.' }));
      return;
    }

    if (reason.length < 5) {
      setRejectErrors((prev) => ({ ...prev, [id]: 'Rejection reason must be at least 5 characters.' }));
      return;
    }

    setRejectErrors((prev) => ({ ...prev, [id]: '' }));
    setWorkingId(id);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      await bookingApi.rejectBooking(undefined, id, reason);
      setSuccessMessage('Booking rejected.');
      setRejectReasons((prev) => ({ ...prev, [id]: '' }));
      await loadBookings();
    } catch (error) {
      setErrorMessage(error.message || 'Failed to reject booking.');
    } finally {
      setWorkingId(null);
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-blue-50 via-white to-blue-100">
      <AppNavbar />

      <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-blue-100 bg-white p-6 shadow-lg shadow-blue-100/60">
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-blue-600">Smart Campus</p>
          <h1 className="mt-2 text-2xl font-bold text-blue-950">Admin Bookings</h1>
          <p className="mt-2 text-sm text-blue-700">Review all booking requests and decide approvals.</p>

          {errorMessage ? (
            <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{errorMessage}</p>
          ) : null}

          {successMessage ? (
            <p className="mt-4 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">{successMessage}</p>
          ) : null}

          {isLoading ? (
            <div className="mt-6 space-y-3">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="h-32 animate-pulse rounded-xl border border-blue-100 bg-blue-50" />
              ))}
            </div>
          ) : bookings.length ? (
            <div className="mt-6 space-y-4">
              {bookings.map((booking) => {
                const status = String(booking?.status || '').toUpperCase();
                const actionable = status === 'PENDING';

                return (
                  <article key={booking.id} className="rounded-xl border border-blue-100 bg-white p-4 shadow-sm">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-blue-600">Booking #{booking.id}</p>
                        <h2 className="mt-1 text-lg font-bold text-blue-900">{booking?.facility?.name || 'Facility'}</h2>
                        <p className="mt-1 text-sm text-blue-700">
                          Requested by {booking?.user?.name || booking?.user?.email || 'Unknown user'}
                        </p>
                      </div>
                      <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${statusClasses(status)}`}>
                        {status || 'PENDING'}
                      </span>
                    </div>

                    <dl className="mt-4 grid gap-2 text-sm text-blue-800 sm:grid-cols-2">
                      <div className="flex items-center justify-between gap-3 rounded-lg bg-blue-50 px-3 py-2">
                        <dt className="text-blue-500">Date</dt>
                        <dd className="font-medium">{booking?.date || '-'}</dd>
                      </div>
                      <div className="flex items-center justify-between gap-3 rounded-lg bg-blue-50 px-3 py-2">
                        <dt className="text-blue-500">Time</dt>
                        <dd className="font-medium">{booking?.startTime || '-'} - {booking?.endTime || '-'}</dd>
                      </div>
                      <div className="flex items-center justify-between gap-3 rounded-lg bg-blue-50 px-3 py-2">
                        <dt className="text-blue-500">Location</dt>
                        <dd className="font-medium">{booking?.facility?.location || '-'}</dd>
                      </div>
                      <div className="flex items-center justify-between gap-3 rounded-lg bg-blue-50 px-3 py-2">
                        <dt className="text-blue-500">Attendees</dt>
                        <dd className="font-medium">{booking?.expectedAttendees ?? '-'}</dd>
                      </div>
                    </dl>

                    <p className="mt-3 rounded-lg border border-blue-100 bg-blue-50 px-3 py-2 text-sm text-blue-800">
                      <span className="font-semibold">Purpose:</span> {booking?.purpose || '-'}
                    </p>

                    {booking?.rejectionReason ? (
                      <p className="mt-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                        Rejection reason: {booking.rejectionReason}
                      </p>
                    ) : null}

                    {actionable ? (
                      <div className="mt-4 rounded-lg border border-blue-100 bg-blue-50 p-3">
                        <label htmlFor={`reason-${booking.id}`} className="mb-1 block text-sm font-semibold text-blue-900">
                          Reject reason
                        </label>
                        <input
                          id={`reason-${booking.id}`}
                          type="text"
                          value={rejectReasons[booking.id] || ''}
                          onChange={(event) => {
                            const value = event.target.value;
                            setRejectReasons((prev) => ({ ...prev, [booking.id]: value }));
                            setRejectErrors((prev) => ({ ...prev, [booking.id]: '' }));
                          }}
                          placeholder="Reason for rejection"
                          className="w-full rounded-lg border border-blue-200 bg-white px-3 py-2.5 text-sm text-blue-950 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                        />
                        {rejectErrors[booking.id] ? (
                          <p className="mt-1 text-xs font-medium text-red-600">{rejectErrors[booking.id]}</p>
                        ) : null}

                        <div className="mt-3 flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => onApprove(booking.id)}
                            disabled={workingId === booking.id}
                            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-wait disabled:opacity-70"
                          >
                            Approve
                          </button>
                          <button
                            type="button"
                            onClick={() => onReject(booking.id)}
                            disabled={workingId === booking.id}
                            className="rounded-lg border border-blue-200 bg-white px-4 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-100 disabled:cursor-wait disabled:opacity-70"
                          >
                            Reject
                          </button>
                        </div>
                      </div>
                    ) : null}
                  </article>
                );
              })}
            </div>
          ) : (
            <p className="mt-6 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700">
              No bookings available.
            </p>
          )}
        </div>
      </section>
    </main>
  );
}