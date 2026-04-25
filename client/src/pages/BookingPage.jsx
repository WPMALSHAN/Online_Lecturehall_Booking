import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { bookingApi } from '../services/bookingApi';
import { requestJson } from '../services/apiClient';

function formatDateTime(dateStr, timeStr) {
  if (!dateStr || !timeStr) return '-';
  return `${dateStr} at ${timeStr}`;
}

export default function BookingPage() {
  const { role, name, token } = useAuth();
  
  const [bookings, setBookings] = useState([]);
  const [facilities, setFacilities] = useState([]);
  const [selectedBookingId, setSelectedBookingId] = useState(null);
  const [selectedBooking, setSelectedBooking] = useState(null);
  
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const [createForm, setCreateForm] = useState({
    facilityId: '',
    date: '',
    startTime: '',
    endTime: '',
    purpose: '',
    expectedAttendees: 1,
  });
  const [createFormErrors, setCreateFormErrors] = useState({
    facilityId: '',
    date: '',
    startTime: '',
    endTime: '',
    expectedAttendees: '',
    purpose: '',
  });

  const [rejectReason, setRejectReason] = useState('');
  const [rejectReasonError, setRejectReasonError] = useState('');

  const isAdmin = role === 'ADMIN';

  const selectedBookingSummary = useMemo(
    () => bookings.find((b) => b.id === selectedBookingId) || null,
    [bookings, selectedBookingId]
  );

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (selectedBookingId) {
      const b = bookings.find((b) => b.id === selectedBookingId);
      setSelectedBooking(b || null);
    } else {
      setSelectedBooking(null);
    }
  }, [selectedBookingId, bookings]);

  async function loadData() {
    setIsLoading(true);
    setErrorMessage('');
    try {
      // Load facilities for the dropdown
      const facRes = await requestJson('/api/facilities/active', {
          headers: { Authorization: `Bearer ${token}` }
      });
      setFacilities(facRes);

      // Load bookings depending on role
      let data = [];
      if (isAdmin) {
        data = await bookingApi.getAllBookings(token);
      } else {
        data = await bookingApi.getUserBookings(token);
      }
      setBookings(data);

      if (data.length > 0 && !selectedBookingId) {
        setSelectedBookingId(data[0].id);
      }
    } catch (error) {
      setErrorMessage(error.message || 'Failed to load data');
    } finally {
      setIsLoading(false);
    }
  }

  const onCreateFormChange = (e) => {
    const { name, value } = e.target;
    setCreateForm((prev) => ({ ...prev, [name]: value }));
    setCreateFormErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const validateCreateBookingForm = () => {
    const errors = {
      facilityId: '',
      date: '',
      startTime: '',
      endTime: '',
      expectedAttendees: '',
      purpose: '',
    };

    let isValid = true;
    const today = new Date().toISOString().split('T')[0];
    const attendees = Number(createForm.expectedAttendees);

    if (!createForm.facilityId) {
      errors.facilityId = 'Please select a facility.';
      isValid = false;
    }

    if (!createForm.date) {
      errors.date = 'Please select a date.';
      isValid = false;
    } else if (createForm.date < today) {
      errors.date = 'Booking date cannot be in the past.';
      isValid = false;
    }

    if (!createForm.startTime) {
      errors.startTime = 'Please select a start time.';
      isValid = false;
    }

    if (!createForm.endTime) {
      errors.endTime = 'Please select an end time.';
      isValid = false;
    }

    if (createForm.startTime && createForm.endTime && createForm.endTime <= createForm.startTime) {
      errors.endTime = 'End time must be after start time.';
      isValid = false;
    }

    if (!Number.isInteger(attendees) || attendees < 1) {
      errors.expectedAttendees = 'Expected attendees must be at least 1.';
      isValid = false;
    }

    if (!createForm.purpose.trim()) {
      errors.purpose = 'Please enter the booking purpose.';
      isValid = false;
    } else if (createForm.purpose.trim().length < 10) {
      errors.purpose = 'Purpose must be at least 10 characters.';
      isValid = false;
    }

    setCreateFormErrors(errors);
    return isValid;
  };

  const onCreateBooking = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!validateCreateBookingForm()) {
      return;
    }

    try {
      await bookingApi.createBooking(token, createForm);
      setSuccessMessage('Booking requested successfully.');
      setCreateForm({
        facilityId: '',
        date: '',
        startTime: '',
        endTime: '',
        purpose: '',
        expectedAttendees: 1,
      });
      await loadData();
    } catch (error) {
      setErrorMessage(error.response?.data?.message || error.message || 'Failed to create booking');
    }
  };

  const onCancelBooking = async () => {
    if (!selectedBookingId) return;
    setErrorMessage('');
    setSuccessMessage('');
    try {
      await bookingApi.cancelBooking(token, selectedBookingId);
      setSuccessMessage('Booking cancelled.');
      await loadData();
    } catch (error) {
      setErrorMessage(error.response?.data?.message || error.message || 'Failed to cancel');
    }
  };

  const onApproveBooking = async () => {
    if (!selectedBookingId) return;
    setErrorMessage('');
    setSuccessMessage('');
    try {
      await bookingApi.approveBooking(token, selectedBookingId);
      setSuccessMessage('Booking approved.');
      await loadData();
    } catch (error) {
      setErrorMessage(error.response?.data?.message || error.message || 'Failed to approve');
    }
  };

  const onRejectBooking = async (e) => {
    e.preventDefault();
    if (!selectedBookingId) return;

    if (!rejectReason.trim()) {
      setRejectReasonError('Rejection reason is required.');
      return;
    }

    if (rejectReason.trim().length < 5) {
      setRejectReasonError('Rejection reason must be at least 5 characters.');
      return;
    }

    setRejectReasonError('');
    setErrorMessage('');
    setSuccessMessage('');
    try {
      await bookingApi.rejectBooking(token, selectedBookingId, rejectReason.trim());
      setSuccessMessage('Booking rejected.');
      setRejectReason('');
      await loadData();
    } catch (error) {
      setErrorMessage(error.response?.data?.message || error.message || 'Failed to reject');
    }
  };

  return (
    <main className="incident-page">
      <header className="page-topbar">
        <div>
          <p className="topbar-kicker">Smart Campus</p>
          <h1>Booking Dashboard</h1>
          <p className="topbar-sub">Welcome, {name}. Manage your facility bookings.</p>
        </div>
        <Link to={isAdmin ? "/dashboard/admin" : "/dashboard/student"} className="topbar-link">
          Back To Dashboard
        </Link>
      </header>

      {errorMessage && <p className="alert error">{errorMessage}</p>}
      {successMessage && <p className="alert success">{successMessage}</p>}

      {!isAdmin && (
        <section className="panel create-panel">
          <h2>Request New Booking</h2>
          <form className="incident-form" onSubmit={onCreateBooking} noValidate>
            <select
              name="facilityId"
              value={createForm.facilityId}
              onChange={onCreateFormChange}
              required
            >
              <option value="">Select Facility</option>
              {facilities.map((fac) => (
                <option key={fac.id} value={fac.id}>
                  {fac.name} - {fac.location} (Capacity: {fac.capacity})
                </option>
              ))}
            </select>
            {createFormErrors.facilityId ? <p className="form-error">{createFormErrors.facilityId}</p> : null}
            <input
              type="date"
              name="date"
              value={createForm.date}
              onChange={onCreateFormChange}
              required
            />
            {createFormErrors.date ? <p className="form-error">{createFormErrors.date}</p> : null}
            <input
              type="time"
              name="startTime"
              value={createForm.startTime}
              onChange={onCreateFormChange}
              required
            />
            {createFormErrors.startTime ? <p className="form-error">{createFormErrors.startTime}</p> : null}
            <input
              type="time"
              name="endTime"
              value={createForm.endTime}
              onChange={onCreateFormChange}
              required
            />
            {createFormErrors.endTime ? <p className="form-error">{createFormErrors.endTime}</p> : null}
            <input
              type="number"
              name="expectedAttendees"
              value={createForm.expectedAttendees}
              onChange={onCreateFormChange}
              min="1"
              placeholder="Expected Attendees"
              required
            />
            {createFormErrors.expectedAttendees ? <p className="form-error">{createFormErrors.expectedAttendees}</p> : null}
            <textarea
              name="purpose"
              value={createForm.purpose}
              onChange={onCreateFormChange}
              placeholder="Purpose of booking"
              required
            />
            {createFormErrors.purpose ? <p className="form-error">{createFormErrors.purpose}</p> : null}
            <button type="submit">Submit Request</button>
          </form>
        </section>
      )}

      <section className="incident-layout">
        <aside className="panel list-panel">
          <div className="list-head">
            <h2>{isAdmin ? 'All Bookings' : 'My Bookings'}</h2>
          </div>

          {isLoading ? <p>Loading bookings...</p> : null}
          {!isLoading && bookings.length === 0 ? <p>No bookings found.</p> : null}

          <ul className="incident-list">
            {bookings.map((booking) => (
              <li key={booking.id}>
                <button
                  type="button"
                  className={booking.id === selectedBookingId ? 'incident-chip active' : 'incident-chip'}
                  onClick={() => setSelectedBookingId(booking.id)}
                >
                  <span>#{booking.id}</span>
                  <strong>{booking.facilityName}</strong>
                  <small>{booking.status}</small>
                  <small>{booking.date}</small>
                </button>
              </li>
            ))}
          </ul>
        </aside>

        <section className="panel detail-panel">
          {selectedBooking ? (
            <>
              <h2>Booking #{selectedBooking.id} - {selectedBooking.facilityName}</h2>
              <div className="incident-meta-grid">
                <p><strong>Status:</strong> {selectedBooking.status}</p>
                <p><strong>Date & Time:</strong> {formatDateTime(selectedBooking.date, selectedBooking.startTime)} to {selectedBooking.endTime}</p>
                <p><strong>Facility Location:</strong> {selectedBooking.facilityLocation}</p>
                <p><strong>Attendees:</strong> {selectedBooking.expectedAttendees}</p>
                <p><strong>Booked By:</strong> {selectedBooking.userName} ({selectedBooking.userEmail})</p>
                {selectedBooking.rejectionReason && (
                  <p><strong>Rejection Reason:</strong> {selectedBooking.rejectionReason}</p>
                )}
              </div>

              <p className="incident-description">
                <strong>Purpose:</strong> {selectedBooking.purpose}
              </p>

              <div className="comment-actions" style={{ marginTop: '20px' }}>
                {!isAdmin && selectedBooking.status === 'APPROVED' && (
                  <button type="button" onClick={onCancelBooking}>
                    Cancel Booking
                  </button>
                )}
                
                {isAdmin && selectedBooking.status === 'PENDING' && (
                  <div style={{ display: 'flex', gap: '10px', flexDirection: 'column' }}>
                    <button type="button" onClick={onApproveBooking}>
                      Approve Booking
                    </button>
                    <form className="inline-form" onSubmit={onRejectBooking} style={{ marginTop: '10px' }}>
                      <input
                        value={rejectReason}
                        onChange={(e) => {
                          setRejectReason(e.target.value);
                          setRejectReasonError('');
                        }}
                        placeholder="Reason for rejection"
                        required
                      />
                      {rejectReasonError ? <p className="form-error">{rejectReasonError}</p> : null}
                      <button type="submit" style={{ backgroundColor: '#e74c3c' }}>Reject</button>
                    </form>
                  </div>
                )}
              </div>
            </>
          ) : (
            <p>Select a booking to see details.</p>
          )}
        </section>
      </section>

      {selectedBookingSummary ? (
        <footer className="page-footer-note">
          Viewing booking #{selectedBookingSummary.id} for {selectedBookingSummary.facilityName}
        </footer>
      ) : null}
    </main>
  );
}
