import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { registerUser } from '../services/authApi';
import { getApiErrorMessage } from '../services/httpClient';

const ROLES = ['STUDENT', 'LECTURER', 'TECHNICIAN', 'ADMIN'];

export default function RegisterPage() {
  const navigate = useNavigate();
  const { isAuthenticated, signIn } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'STUDENT',
  });
  const [fieldErrors, setFieldErrors] = useState({
    name: '',
    email: '',
    password: '',
    role: '',
  });
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((previous) => ({ ...previous, [name]: value }));
    setFieldErrors((previous) => ({ ...previous, [name]: '' }));
  };

  const validateForm = () => {
    const errors = { name: '', email: '', password: '', role: '' };
    let isValid = true;

    if (!formData.name.trim()) {
      errors.name = 'Name is required.';
      isValid = false;
    } else if (formData.name.trim().length < 2) {
      errors.name = 'Name must be at least 2 characters.';
      isValid = false;
    }

    if (!formData.email.trim()) {
      errors.email = 'Email is required.';
      isValid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Please enter a valid email address.';
      isValid = false;
    }

    if (!formData.password.trim()) {
      errors.password = 'Password is required.';
      isValid = false;
    } else if (formData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters.';
      isValid = false;
    }

    if (!ROLES.includes(formData.role)) {
      errors.role = 'Please select a valid role.';
      isValid = false;
    }

    setFieldErrors(errors);
    return isValid;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setErrorMessage('');

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await registerUser(formData);
      signIn(response);
      navigate('/dashboard', { replace: true });
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error, 'Unable to register. Please try again.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100 px-4 py-10">
      <section className="mx-auto w-full max-w-md rounded-2xl border border-blue-100 bg-white p-7 shadow-xl shadow-blue-100/60">
        <p className="text-xs font-semibold uppercase tracking-[0.15em] text-blue-600">Smart Campus</p>
        <h1 className="mt-2 text-2xl font-bold text-blue-950">Create Account</h1>
        <p className="mt-2 text-sm text-blue-700">Choose your role and join the campus portal.</p>

        <form className="mt-6 space-y-4" onSubmit={handleSubmit} noValidate>
          <div>
            <label htmlFor="name" className="mb-1 block text-sm font-semibold text-blue-900">
              Name
            </label>
            <input
              id="name"
              name="name"
              type="text"
              value={formData.name}
              onChange={handleChange}
              placeholder="Full name"
              className="w-full rounded-lg border border-blue-200 px-3 py-2.5 text-sm text-blue-950 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            />
            {fieldErrors.name ? (
              <p className="mt-1 text-xs font-medium text-red-600">{fieldErrors.name}</p>
            ) : null}
          </div>

          <div>
            <label htmlFor="email" className="mb-1 block text-sm font-semibold text-blue-900">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="name@university.edu"
              className="w-full rounded-lg border border-blue-200 px-3 py-2.5 text-sm text-blue-950 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            />
            {fieldErrors.email ? (
              <p className="mt-1 text-xs font-medium text-red-600">{fieldErrors.email}</p>
            ) : null}
          </div>

          <div>
            <label htmlFor="password" className="mb-1 block text-sm font-semibold text-blue-900">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="At least 6 characters"
              className="w-full rounded-lg border border-blue-200 px-3 py-2.5 text-sm text-blue-950 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            />
            {fieldErrors.password ? (
              <p className="mt-1 text-xs font-medium text-red-600">{fieldErrors.password}</p>
            ) : null}
          </div>

          <div>
            <label htmlFor="role" className="mb-1 block text-sm font-semibold text-blue-900">
              Role
            </label>
            <select
              id="role"
              name="role"
              value={formData.role}
              onChange={handleChange}
              className="w-full rounded-lg border border-blue-200 bg-white px-3 py-2.5 text-sm text-blue-950 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            >
              {ROLES.map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </select>
            {fieldErrors.role ? (
              <p className="mt-1 text-xs font-medium text-red-600">{fieldErrors.role}</p>
            ) : null}
          </div>

          {errorMessage ? (
            <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {errorMessage}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-wait disabled:opacity-70"
          >
            {isSubmitting ? 'Creating Account...' : 'Register'}
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-blue-700">
          Already registered?{' '}
          <Link className="font-semibold text-blue-600 hover:text-blue-800" to="/login">
            Sign in
          </Link>
        </p>
      </section>
    </main>
  );
}
