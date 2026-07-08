import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForgotPasswordMutation } from '../app/api/apiSlice';

/** Figma "Forget password?" screen — wired to POST /auth/forgot-password. */
export default function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [forgotPassword, { isLoading }] = useForgotPasswordMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await forgotPassword({ email }).unwrap();
      navigate(`/reset-password?email=${encodeURIComponent(email)}`);
    } catch (err) {
      setError((err as { data?: { message?: string } })?.data?.message ?? 'No account found with this email');
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-page px-4">
      <div className="w-full max-w-md">
        <div className="rounded-2xl bg-card p-8 shadow-sm">
          <div className="mb-6 text-center">
            <h1 className="font-heading text-2xl font-bold text-login-ink">Forgot password?</h1>
            <p className="mt-1 text-sm text-login-muted">
              Enter your email address to reset your password.
            </p>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            {error && (
              <div className="rounded-lg bg-danger-bg px-3.5 py-2.5 text-sm font-medium text-danger-text">
                {error}
              </div>
            )}

            <div>
              <label className="mb-1.5 block text-sm font-semibold text-login-ink" htmlFor="email">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@contenthub.io"
                className="w-full rounded-lg border border-line px-3.5 py-2.5 text-sm text-login-ink outline-none focus:border-primary"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full rounded-lg bg-primary py-2.5 text-sm font-bold text-white transition-colors hover:bg-primary-dark disabled:opacity-60"
            >
              {isLoading ? 'Sending…' : 'Send Reset Code'}
            </button>
          </form>
        </div>

        <p className="mt-5 text-center text-sm text-login-muted">
          Remembered your password?{' '}
          <Link to="/login" className="font-semibold text-primary hover:underline">
            Back to Login
          </Link>
        </p>
      </div>
    </div>
  );
}
