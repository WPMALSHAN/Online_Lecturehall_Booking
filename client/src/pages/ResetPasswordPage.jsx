import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { resetPassword } from '../services/authApi';
import { getApiErrorMessage } from '../services/httpClient';

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [formData, setFormData] = useState({
    token: searchParams.get('token') || '',
    newPassword: '',
    confirmPassword: '',
  });
  const [fieldErrors, setFieldErrors] = useState({
    token: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((previous) => ({ ...previous, [name]: value }));
    setFieldErrors((previous) => ({ ...previous, [name]: '' }));
  };

  const validate = () => {
    const errors = { token: '', newPassword: '', confirmPassword: '' };
    let isValid = true;

    if (!formData.token.trim()) {
      errors.token = 'Reset token is required.';
      isValid = false;
    }

    if (!formData.newPassword.trim()) {
      errors.newPassword = 'New password is required.';
      isValid = false;
    } else if (formData.newPassword.length < 6) {
      errors.newPassword = 'New password must be at least 6 characters.';
      isValid = false;
    }

    if (!formData.confirmPassword.trim()) {
      errors.confirmPassword = 'Please confirm your password.';
      isValid = false;
    } else if (formData.confirmPassword !== formData.newPassword) {
      errors.confirmPassword = 'Passwords do not match.';
      isValid = false;
    }

    setFieldErrors(errors);
    return isValid;
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
      const response = await resetPassword({
        token: formData.token.trim(),
        newPassword: formData.newPassword,
      });

      setSuccessMessage(response?.message || 'Password has been reset successfully.');
      setTimeout(() => {
        navigate('/login', { replace: true });
      }, 1200);
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error, 'Unable to reset password.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100 px-4 py-10">
      <section className="mx-auto w-full max-w-md rounded-2xl border border-blue-100 bg-white p-7 shadow-xl shadow-blue-100/60">
        <p className="text-xs font-semibold uppercase tracking-[0.15em] text-blue-600">Smart Campus</p>
        <h1 className="mt-2 text-2xl font-bold text-blue-950">Reset Password</h1>
        <p className="mt-2 text-sm text-blue-700">Enter token and set your new password.</p>

        <form className="mt-6 space-y-4" onSubmit={handleSubmit} noValidate>
          <div>
            <label htmlFor="token" className="mb-1 block text-sm font-semibold text-blue-900">
              Reset Token
            </label>
            <input
              id="token"
              name="token"
              type="text"
              value={formData.token}
              onChange={handleChange}
              placeholder="Paste token from email or server log"
              className="w-full rounded-lg border border-blue-200 px-3 py-2.5 text-sm text-blue-950 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            />
            {fieldErrors.token ? (
              <p className="mt-1 text-xs font-medium text-red-600">{fieldErrors.token}</p>
            ) : null}
          </div>

          <div>
            <label htmlFor="newPassword" className="mb-1 block text-sm font-semibold text-blue-900">
              New Password
            </label>
            <div className="flex gap-2">
              <input
                id="newPassword"
                name="newPassword"
                type={showPassword ? 'text' : 'password'}
                value={formData.newPassword}
                onChange={handleChange}
                placeholder="Enter new password"
                className="w-full rounded-lg border border-blue-200 px-3 py-2.5 text-sm text-blue-950 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              />
              <button
                type="button"
                onClick={() => setShowPassword((previous) => !previous)}
                className="rounded-lg border border-blue-200 bg-white px-3 py-2.5 text-xs font-semibold text-blue-700 hover:bg-blue-50"
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
            {fieldErrors.newPassword ? (
              <p className="mt-1 text-xs font-medium text-red-600">{fieldErrors.newPassword}</p>
            ) : null}
          </div>

          <div>
            <label htmlFor="confirmPassword" className="mb-1 block text-sm font-semibold text-blue-900">
              Confirm Password
            </label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type={showPassword ? 'text' : 'password'}
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="Re-enter new password"
              className="w-full rounded-lg border border-blue-200 px-3 py-2.5 text-sm text-blue-950 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            />
            {fieldErrors.confirmPassword ? (
              <p className="mt-1 text-xs font-medium text-red-600">{fieldErrors.confirmPassword}</p>
            ) : null}
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
            {isSubmitting ? 'Resetting...' : 'Reset Password'}
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-blue-700">
          Back to{' '}
          <Link className="font-semibold text-blue-600 hover:text-blue-800" to="/login">
            Sign in
          </Link>
        </p>
      </section>
    </main>
  );
}
