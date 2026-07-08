import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useResetPasswordMutation } from '../app/api/apiSlice';

/** Figma "Reset Password" screen — Password must have 6-8 characters. Wired to POST /auth/reset-password. */
export default function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState(searchParams.get('email') ?? '');
  const [otpCode, setOtpCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [resetPassword, { isLoading }] = useResetPasswordMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (newPassword.length < 6 || newPassword.length > 8) {
      setError('Password must have 6-8 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    try {
      await resetPassword({ email, otpCode, newPassword, confirmPassword }).unwrap();
      setSuccess(true);
    } catch (err) {
      setError((err as { data?: { message?: string } })?.data?.message ?? 'Invalid or expired verification code');
    }
  };

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-page px-4">
        <div className="w-full max-w-md rounded-2xl bg-card p-8 text-center shadow-sm">
          <h1 className="font-heading text-2xl font-bold text-login-ink">Password changed</h1>
          <p className="mt-2 text-sm text-login-muted">Your password has been changed successfully.</p>
          <button
            type="button"
            onClick={() => navigate('/login')}
            className="mt-6 w-full rounded-lg bg-primary py-2.5 text-sm font-bold text-white hover:bg-primary-dark"
          >
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-page px-4">
      <div className="w-full max-w-md">
        <div className="rounded-2xl bg-card p-8 shadow-sm">
          <div className="mb-6 text-center">
            <h1 className="font-heading text-2xl font-bold text-login-ink">Reset Password</h1>
            <p className="mt-1 text-sm text-login-muted">Password must have 6-8 characters.</p>
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
                className="w-full rounded-lg border border-line px-3.5 py-2.5 text-sm text-login-ink outline-none focus:border-primary"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-semibold text-login-ink" htmlFor="otp">
                Verification Code
              </label>
              <input
                id="otp"
                type="text"
                inputMode="numeric"
                maxLength={6}
                required
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                placeholder="6-digit code"
                className="w-full rounded-lg border border-line px-3.5 py-2.5 text-sm tracking-widest text-login-ink outline-none focus:border-primary"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-semibold text-login-ink" htmlFor="newPassword">
                Create New Password
              </label>
              <input
                id="newPassword"
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full rounded-lg border border-line px-3.5 py-2.5 text-sm text-login-ink outline-none focus:border-primary"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-semibold text-login-ink" htmlFor="confirmPassword">
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full rounded-lg border border-line px-3.5 py-2.5 text-sm text-login-ink outline-none focus:border-primary"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full rounded-lg bg-primary py-2.5 text-sm font-bold text-white transition-colors hover:bg-primary-dark disabled:opacity-60"
            >
              {isLoading ? 'Resetting…' : 'Reset Password'}
            </button>
          </form>
        </div>

        <p className="mt-5 text-center text-sm text-login-muted">
          <Link to="/forgot-password" className="font-semibold text-primary hover:underline">
            Didn't get the code? Resend
          </Link>
        </p>
      </div>
    </div>
  );
}
