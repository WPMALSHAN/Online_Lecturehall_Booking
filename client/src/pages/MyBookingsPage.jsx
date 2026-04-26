import { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
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

function formatSlot(item) {
  if (!item?.date || !item?.startTime || !item?.endTime) {
    return '-';
  }

  return `${item.date} | ${item.startTime} - ${item.endTime}`;
}

export default function MyBookingsPage() {
  const { isAuthenticated, role } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [workingId, setWorkingId] = useState(null);

  useEffect(() => {
    loadBookings();
  }, []);

  async function loadBookings() {
    setIsLoading(true);
    setErrorMessage('');

    try {
      const data = await bookingApi.getUserBookings();
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

  if (role === 'ADMIN') {
    return <Navigate to="/dashboard/bookings/admin" replace />;
  }

  async function onCancelBooking(id) {
    setWorkingId(id);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      await bookingApi.cancelBooking(undefined, id);
      setSuccessMessage('Booking cancelled successfully.');
      await loadBookings();
    } catch (error) {
      setErrorMessage(error.message || 'Failed to cancel booking.');
    } finally {
      setWorkingId(null);
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-blue-50 via-white to-blue-100">
      <AppNavbar />

      <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-blue-100 bg-white p-6 shadow-lg shadow-blue-100/60">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.15em] text-blue-600">Smart Campus</p>
              <h1 className="mt-2 text-2xl font-bold text-blue-950">My Bookings</h1>
              <p className="mt-2 text-sm text-blue-700">Track booking status and cancel when needed.</p>
            </div>
            <Link
              to="/dashboard/bookings/book"
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
            >
              Book Facility
            </Link>
          </div>

          {errorMessage ? (
            <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{errorMessage}</p>
          ) : null}
          {successMessage ? (
            <p className="mt-4 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">{successMessage}</p>
          ) : null}

          {isLoading ? (
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="h-36 animate-pulse rounded-xl border border-blue-100 bg-blue-50" />
              ))}
            </div>
          ) : bookings.length ? (
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {bookings.map((booking) => {
                const status = String(booking?.status || '').toUpperCase();
                const canCancel = status === 'PENDING' || status === 'APPROVED';

                return (
                  <article key={booking.id} className="rounded-xl border border-blue-100 bg-white p-4 shadow-sm">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-blue-600">Booking #{booking.id}</p>
                        <h2 className="mt-1 text-lg font-bold text-blue-900">{booking?.facility?.name || 'Facility'}</h2>
                      </div>
                      <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${statusClasses(status)}`}>
                        {status || 'PENDING'}
                      </span>
                    </div>

                    <dl className="mt-4 grid gap-2 text-sm text-blue-800">
                      <div className="flex items-center justify-between gap-3">
                        <dt className="text-blue-500">Slot</dt>
                        <dd className="font-medium">{formatSlot(booking)}</dd>
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <dt className="text-blue-500">Location</dt>
                        <dd className="font-medium">{booking?.facility?.location || '-'}</dd>
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <dt className="text-blue-500">Attendees</dt>
                        <dd className="font-medium">{booking?.expectedAttendees ?? '-'}</dd>
                      </div>
                    </dl>

                    {booking?.rejectionReason ? (
                      <p className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                        Rejection reason: {booking.rejectionReason}
                      </p>
                    ) : null}

                    {canCancel ? (
                      <button
                        type="button"
                        onClick={() => onCancelBooking(booking.id)}
                        disabled={workingId === booking.id}
                        className="mt-4 rounded-lg border border-blue-200 bg-white px-4 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-50 disabled:cursor-wait disabled:opacity-70"
                      >
                        {workingId === booking.id ? 'Cancelling...' : 'Cancel Booking'}
                      </button>
                    ) : null}
                  </article>
                );
              })}
            </div>
          ) : (
            <p className="mt-6 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700">
              No bookings found.
            </p>
          )}
        </div>
      </section>
    </main>
  );
}