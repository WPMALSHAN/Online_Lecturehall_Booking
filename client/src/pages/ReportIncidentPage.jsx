import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import AppNavbar from '../components/AppNavbar';
import { useAuth } from '../context/AuthContext';

const CATEGORIES = [
  'Electrical',
  'Plumbing',
  'HVAC',
  'IT / Network',
  'Safety Hazard',
  'Structural',
  'Cleaning',
  'Pest Control',
  'Other',
];

const PRIORITIES = ['LOW', 'MEDIUM', 'HIGH'];
const API_BASE_URL = 'http://localhost:8070/api';

const PRIORITY_RING = {
  LOW: 'ring-green-400',
  MEDIUM: 'ring-orange-400',
  HIGH: 'ring-red-400',
};

const PRIORITY_ACTIVE = {
  LOW: 'bg-green-100 text-green-700 border-green-300',
  MEDIUM: 'bg-orange-100 text-orange-700 border-orange-300',
  HIGH: 'bg-red-100 text-red-700 border-red-300',
};

export default function ReportIncidentPage() {
  const navigate = useNavigate();
  const { role } = useAuth();

  // Technicians are NOT allowed to report incidents
  if (role === 'TECHNICIAN') return <Navigate to="/dashboard" replace />;

  const [form, setForm] = useState({
    location: '',
    category: '',
    description: '',
    priority: 'MEDIUM',
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const validate = () => {
    const newErrors = {};
    if (!form.location.trim()) newErrors.location = 'Location is required.';
    else if (form.location.trim().length < 3) newErrors.location = 'Location must be at least 3 characters.';
    if (!form.category) newErrors.category = 'Please select a category.';
    if (!form.description.trim()) newErrors.description = 'Description is required.';
    else if (form.description.trim().length < 10) newErrors.description = 'Description must be at least 10 characters.';
    return newErrors;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccessMessage('');
    setErrorMessage('');

    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/incidents`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(form),
      });

      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(payload?.message || 'Failed to submit incident.');
      }

      setSuccessMessage('Incident reported successfully! Redirecting…');
      setForm({ location: '', category: '', description: '', priority: 'MEDIUM' });
      setTimeout(() => navigate('/dashboard/incidents/my'), 1800);
    } catch (err) {
      setErrorMessage(err.message || 'Failed to submit incident. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-red-50">
      <AppNavbar />

      <section className="mx-auto max-w-2xl px-4 py-10 sm:px-6 lg:px-8">
        {/* Page header */}
        <div className="mb-8 text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-red-100 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-red-600">
            🚨 Smart Campus
          </span>
          <h1 className="mt-3 text-3xl font-extrabold text-gray-900">Report an Incident</h1>
          <p className="mt-2 text-sm text-gray-500">
            Fill in the details below to submit a new maintenance or safety incident.
          </p>
        </div>

        {/* Alerts */}
        {errorMessage && (
          <div className="mb-5 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 shadow-sm">
            <span className="mt-0.5 shrink-0">⚠️</span>
            <span>{errorMessage}</span>
          </div>
        )}
        {successMessage && (
          <div className="mb-5 flex items-start gap-3 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700 shadow-sm">
            <span className="mt-0.5 shrink-0">✅</span>
            <span>{successMessage}</span>
          </div>
        )}

        {/* Form card */}
        <div className="rounded-2xl border border-orange-100 bg-white p-6 shadow-lg shadow-orange-100/50">
          <form onSubmit={handleSubmit} noValidate className="space-y-5">

            {/* Location */}
            <div>
              <label htmlFor="inc-location" className="mb-1.5 block text-sm font-semibold text-gray-700">
                Location <span className="text-red-500">*</span>
              </label>
              <input
                id="inc-location"
                name="location"
                type="text"
                value={form.location}
                onChange={handleChange}
                placeholder="e.g. Building A, Room 203"
                className={`w-full rounded-xl border px-4 py-2.5 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:ring-2 ${
                  errors.location
                    ? 'border-red-400 bg-red-50 focus:border-red-400 focus:ring-red-100'
                    : 'border-gray-200 bg-gray-50 focus:border-orange-400 focus:ring-orange-100'
                }`}
              />
              {errors.location && <p className="mt-1 text-xs font-medium text-red-500">{errors.location}</p>}
            </div>

            {/* Category */}
            <div>
              <label htmlFor="inc-category" className="mb-1.5 block text-sm font-semibold text-gray-700">
                Category <span className="text-red-500">*</span>
              </label>
              <select
                id="inc-category"
                name="category"
                value={form.category}
                onChange={handleChange}
                className={`w-full rounded-xl border px-4 py-2.5 text-sm text-gray-900 outline-none transition focus:ring-2 ${
                  errors.category
                    ? 'border-red-400 bg-red-50 focus:border-red-400 focus:ring-red-100'
                    : 'border-gray-200 bg-gray-50 focus:border-orange-400 focus:ring-orange-100'
                }`}
              >
                <option value="">Select a category…</option>
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
              {errors.category && <p className="mt-1 text-xs font-medium text-red-500">{errors.category}</p>}
            </div>

            {/* Priority toggle buttons */}
            <div>
              <p className="mb-2 text-sm font-semibold text-gray-700">
                Priority <span className="text-red-500">*</span>
              </p>
              <div className="flex gap-3">
                {PRIORITIES.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setForm((prev) => ({ ...prev, priority: p }))}
                    className={`flex-1 rounded-xl border px-4 py-2.5 text-xs font-bold uppercase tracking-wider transition ${
                      form.priority === p
                        ? `${PRIORITY_ACTIVE[p]} ring-2 ring-offset-1 ${PRIORITY_RING[p]}`
                        : 'border-gray-200 bg-gray-50 text-gray-500 hover:bg-gray-100'
                    }`}
                  >
                    {p === 'HIGH' ? '🔴 ' : p === 'MEDIUM' ? '🟠 ' : '🟢 '}{p}
                  </button>
                ))}
              </div>
            </div>

            {/* Description */}
            <div>
              <label htmlFor="inc-description" className="mb-1.5 block text-sm font-semibold text-gray-700">
                Description <span className="text-red-500">*</span>
              </label>
              <textarea
                id="inc-description"
                name="description"
                value={form.description}
                onChange={handleChange}
                rows={5}
                placeholder="Describe the issue in detail — what happened, when, and any relevant context…"
                className={`w-full resize-none rounded-xl border px-4 py-2.5 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:ring-2 ${
                  errors.description
                    ? 'border-red-400 bg-red-50 focus:border-red-400 focus:ring-red-100'
                    : 'border-gray-200 bg-gray-50 focus:border-orange-400 focus:ring-orange-100'
                }`}
              />
              <div className="mt-1 flex items-center justify-between">
                {errors.description
                  ? <p className="text-xs font-medium text-red-500">{errors.description}</p>
                  : <span />
                }
                <span className={`text-xs tabular-nums ${form.description.length >= 10 ? 'text-green-600' : 'text-gray-400'}`}>
                  {form.description.length} chars
                </span>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-xl bg-gradient-to-r from-orange-500 to-red-500 px-6 py-3 text-sm font-bold text-white shadow-md shadow-orange-200 transition hover:from-orange-600 hover:to-red-600 disabled:cursor-wait disabled:opacity-70"
            >
              {isSubmitting ? 'Submitting…' : '🚨 Submit Incident Report'}
            </button>
          </form>
        </div>

        <p className="mt-5 text-center text-xs text-gray-400">
          Your report will be reviewed by our facilities team and assigned to a technician shortly.
        </p>
      </section>
    </main>
  );
}
