import { useState } from 'react';
import { Link } from 'react-router-dom';
import { requestPasswordReset } from '../services/authApi';
import { getApiErrorMessage } from '../services/httpClient';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validate = () => {
    if (!email.trim()) {
      setEmailError('Email is required.');
      return false;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailError('Please enter a valid email address.');
      return false;
    }

    setEmailError('');
    return true;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!validate()) {
      return;
    }

    setIsSubmitting(true);

    try {
      await requestPasswordReset({ email: email.trim() });
      setSuccessMessage('If your account exists, a reset instruction has been sent.');
    } catch (error) {
      if (error?.response?.status === 404) {
        setErrorMessage(
          'Forgot-password API is not available yet in backend. Please contact admin to reset your password.',
        );
      } else {
        setErrorMessage(getApiErrorMessage(error, 'Unable to process password reset request.'));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100 px-4 py-10">
      <section className="mx-auto w-full max-w-md rounded-2xl border border-blue-100 bg-white p-7 shadow-xl shadow-blue-100/60">
        <p className="text-xs font-semibold uppercase tracking-[0.15em] text-blue-600">Smart Campus</p>
        <h1 className="mt-2 text-2xl font-bold text-blue-950">Forgot Password</h1>
        <p className="mt-2 text-sm text-blue-700">Enter your email to request password reset instructions.</p>

        <form className="mt-6 space-y-4" onSubmit={handleSubmit} noValidate>
          <div>
            <label htmlFor="email" className="mb-1 block text-sm font-semibold text-blue-900">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              value={email}
              onChange={(event) => {
                setEmail(event.target.value);
                setEmailError('');
              }}
              placeholder="name@university.edu"
              className="w-full rounded-lg border border-blue-200 px-3 py-2.5 text-sm text-blue-950 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            />
            {emailError ? <p className="mt-1 text-xs font-medium text-red-600">{emailError}</p> : null}
          </div>

          {errorMessage ? (
            <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {errorMessage}
            </p>
          ) : null}

          {successMessage ? (
            <p className="rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
              {successMessage}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-wait disabled:opacity-70"
          >
            {isSubmitting ? 'Sending...' : 'Send Reset Link'}
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-blue-700">
          Already have token?{' '}
          <Link className="font-semibold text-blue-600 hover:text-blue-800" to="/reset-password">
            Reset now
          </Link>
        </p>

        <p className="mt-2 text-center text-sm text-blue-700">
          Back to{' '}
          <Link className="font-semibold text-blue-600 hover:text-blue-800" to="/login">
            Sign in
          </Link>
        </p>
      </section>
    </main>
  );
}
