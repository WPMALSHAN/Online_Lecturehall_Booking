import { useEffect, useMemo, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import AppNavbar from '../components/AppNavbar';
import { useAuth } from '../context/AuthContext';
import { bookingApi } from '../services/bookingApi';
import { fetchFacilities } from '../services/facilityApi';

const initialForm = {
  facilityId: '',
  date: '',
  startTime: '',
  endTime: '',
  purpose: '',
  expectedAttendees: '1',
};

const initialErrors = {
  facilityId: '',
  date: '',
  startTime: '',
  endTime: '',
  purpose: '',
  expectedAttendees: '',
};

export default function BookFacilityPage() {
  const navigate = useNavigate();
  const { isAuthenticated, role } = useAuth();
  const [facilities, setFacilities] = useState([]);
  const [formData, setFormData] = useState(initialForm);
  const [fieldErrors, setFieldErrors] = useState(initialErrors);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isLoadingFacilities, setIsLoadingFacilities] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const today = useMemo(() => new Date().toISOString().split('T')[0], []);

  useEffect(() => {
    let isMounted = true;

    async function loadFacilities() {
      setIsLoadingFacilities(true);
      setErrorMessage('');

      try {
        const data = await fetchFacilities();
        if (!isMounted) {
          return;
        }

        const available = (Array.isArray(data) ? data : []).filter(
          (item) => String(item?.status).toUpperCase() === 'ACTIVE',
        );
        setFacilities(available);
      } catch (error) {
        if (isMounted) {
          setErrorMessage(error.message || 'Failed to load facilities.');
        }
      } finally {
        if (isMounted) {
          setIsLoadingFacilities(false);
        }
      }
    }

    loadFacilities();

    return () => {
      isMounted = false;
    };
  }, []);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (role === 'ADMIN') {
    return <Navigate to="/dashboard/bookings/admin" replace />;
  }

  function onFieldChange(event) {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setFieldErrors((prev) => ({ ...prev, [name]: '' }));
    setErrorMessage('');
  }

  function validateForm() {
    const errors = { ...initialErrors };
    let valid = true;

    if (!formData.facilityId) {
      errors.facilityId = 'Facility is required.';
      valid = false;
    }

    if (!formData.date) {
      errors.date = 'Date is required.';
      valid = false;
    } else if (formData.date <= today) {
      errors.date = 'Booking date must be in the future.';
      valid = false;
    }

    if (!formData.startTime) {
      errors.startTime = 'Start time is required.';
      valid = false;
    }

    if (!formData.endTime) {
      errors.endTime = 'End time is required.';
      valid = false;
    } else if (formData.startTime && formData.endTime <= formData.startTime) {
      errors.endTime = 'End time must be after start time.';
      valid = false;
    }

    if (!formData.purpose.trim()) {
      errors.purpose = 'Purpose is required.';
      valid = false;
    } else if (formData.purpose.trim().length < 10) {
      errors.purpose = 'Purpose must be at least 10 characters.';
      valid = false;
    }

    const attendees = Number(formData.expectedAttendees);
    if (!Number.isInteger(attendees) || attendees < 1) {
      errors.expectedAttendees = 'Expected attendees must be at least 1.';
      valid = false;
    }

    setFieldErrors(errors);
    return valid;
  }

  async function onSubmit(event) {
    event.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!validateForm()) {
      return;
    }

    const payload = {
      facilityId: Number(formData.facilityId),
      date: formData.date,
      startTime: formData.startTime,
      endTime: formData.endTime,
      purpose: formData.purpose.trim(),
      expectedAttendees: Number(formData.expectedAttendees),
    };

    setIsSubmitting(true);
    try {
      await bookingApi.createBooking(payload);
      setSuccessMessage('Facility booked successfully. Waiting for approval.');
      setFormData(initialForm);
      setFieldErrors(initialErrors);
    } catch (error) {
      const message = error.message || 'Failed to create booking.';

      if (/already booked|time slot|conflict/i.test(message)) {
        setFieldErrors((prev) => ({
          ...prev,
          startTime: prev.startTime || 'Time conflict detected for this facility.',
          endTime: 'Time conflict detected for this facility.',
        }));
      }

      setErrorMessage(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-blue-50 via-white to-blue-100">
      <AppNavbar />

      <section className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-blue-100 bg-white p-6 shadow-lg shadow-blue-100/60">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.15em] text-blue-600">Smart Campus</p>
              <h1 className="mt-2 text-2xl font-bold text-blue-950">Book Facility</h1>
              <p className="mt-2 text-sm text-blue-700">Submit your booking request with preferred date and time.</p>
            </div>
            <Link
              to="/dashboard/bookings/my"
              className="rounded-lg border border-blue-200 bg-white px-4 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-50"
            >
              My Bookings
            </Link>
          </div>

          {errorMessage ? (
            <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {errorMessage}
            </p>
          ) : null}

          {successMessage ? (
            <p className="mt-4 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
              {successMessage}
            </p>
          ) : null}

          <form onSubmit={onSubmit} noValidate className="mt-6 grid gap-4">
            <div>
              <label htmlFor="facilityId" className="mb-1 block text-sm font-semibold text-blue-900">
                Facility
              </label>
              <select
                id="facilityId"
                name="facilityId"
                value={formData.facilityId}
                onChange={onFieldChange}
                disabled={isLoadingFacilities}
                className="w-full rounded-lg border border-blue-200 bg-white px-3 py-2.5 text-sm text-blue-950 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200 disabled:cursor-not-allowed"
              >
                <option value="">{isLoadingFacilities ? 'Loading facilities...' : 'Select facility'}</option>
                {facilities.map((facility) => (
                  <option key={facility.id} value={facility.id}>
                    {facility.name} - {facility.location}
                  </option>
                ))}
              </select>
              {fieldErrors.facilityId ? <p className="mt-1 text-xs font-medium text-red-600">{fieldErrors.facilityId}</p> : null}
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label htmlFor="date" className="mb-1 block text-sm font-semibold text-blue-900">
                  Date
                </label>
                <input
                  id="date"
                  name="date"
                  type="date"
                  value={formData.date}
                  onChange={onFieldChange}
                  min={today}
                  className="w-full rounded-lg border border-blue-200 px-3 py-2.5 text-sm text-blue-950 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                />
                {fieldErrors.date ? <p className="mt-1 text-xs font-medium text-red-600">{fieldErrors.date}</p> : null}
              </div>

              <div>
                <label htmlFor="startTime" className="mb-1 block text-sm font-semibold text-blue-900">
                  Start Time
                </label>
                <input
                  id="startTime"
                  name="startTime"
                  type="time"
                  value={formData.startTime}
                  onChange={onFieldChange}
                  className="w-full rounded-lg border border-blue-200 px-3 py-2.5 text-sm text-blue-950 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                />
                {fieldErrors.startTime ? <p className="mt-1 text-xs font-medium text-red-600">{fieldErrors.startTime}</p> : null}
              </div>

              <div>
                <label htmlFor="endTime" className="mb-1 block text-sm font-semibold text-blue-900">
                  End Time
                </label>
                <input
                  id="endTime"
                  name="endTime"
                  type="time"
                  value={formData.endTime}
                  onChange={onFieldChange}
                  className="w-full rounded-lg border border-blue-200 px-3 py-2.5 text-sm text-blue-950 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                />
                {fieldErrors.endTime ? <p className="mt-1 text-xs font-medium text-red-600">{fieldErrors.endTime}</p> : null}
              </div>
            </div>

            <div>
              <label htmlFor="purpose" className="mb-1 block text-sm font-semibold text-blue-900">
                Purpose
              </label>
              <textarea
                id="purpose"
                name="purpose"
                value={formData.purpose}
                onChange={onFieldChange}
                rows={4}
                className="w-full rounded-lg border border-blue-200 px-3 py-2.5 text-sm text-blue-950 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                placeholder="Describe why you need the facility"
              />
              {fieldErrors.purpose ? <p className="mt-1 text-xs font-medium text-red-600">{fieldErrors.purpose}</p> : null}
            </div>

            <div>
              <label htmlFor="expectedAttendees" className="mb-1 block text-sm font-semibold text-blue-900">
                Expected Attendees
              </label>
              <input
                id="expectedAttendees"
                name="expectedAttendees"
                type="number"
                min="1"
                value={formData.expectedAttendees}
                onChange={onFieldChange}
                className="w-full rounded-lg border border-blue-200 px-3 py-2.5 text-sm text-blue-950 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              />
              {fieldErrors.expectedAttendees ? <p className="mt-1 text-xs font-medium text-red-600">{fieldErrors.expectedAttendees}</p> : null}
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="submit"
                disabled={isSubmitting}
                className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-wait disabled:opacity-70"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Booking'}
              </button>
              <button
                type="button"
                onClick={() => navigate('/dashboard/bookings/my')}
                className="rounded-lg border border-blue-200 bg-white px-5 py-2.5 text-sm font-semibold text-blue-700 transition hover:bg-blue-50"
              >
                View My Bookings
              </button>
            </div>
          </form>
        </div>
      </section>
    </main>
  );
}