import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { useAdminLoginMutation } from '../app/api/apiSlice';
import { setCredentials } from '../app/authSlice';

/** Figma "Admin Login" screen — wired to POST /auth/admin/login. */
export default function Login() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [adminLogin, { isLoading }] = useAdminLoginMutation();

  const [email, setEmail] = useState('admin@contenthub.io');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      const res = await adminLogin({ email, password, rememberMe }).unwrap();
      dispatch(
        setCredentials({
          accessToken: res.data.accessToken,
          refreshToken: res.data.refreshToken,
          user: res.data.user,
        }),
      );
      navigate('/dashboard');
    } catch (err) {
      const message =
        (err as { data?: { message?: string } })?.data?.message ??
        'Invalid email or password';
      setError(message);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-page px-4">
      <div className="w-full max-w-md">
        <div className="rounded-2xl bg-card p-8 shadow-sm">
          <div className="mb-6 flex flex-col items-center text-center">
            <img src="/Logo 1 (1) 1.png" alt="Joinly" className="mb-4 h-10 w-auto" />
            <h1 className="font-heading text-2xl font-bold text-login-ink">Admin Login</h1>
            <p className="mt-1 text-sm text-login-muted">Sign in to Joinly Admin Panel</p>
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
              <label className="mb-1.5 block text-sm font-semibold text-login-ink" htmlFor="password">
                Password
              </label>
              <div className="flex items-center rounded-lg border border-line px-3.5 py-2.5 focus-within:border-primary">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full bg-transparent text-sm text-login-ink outline-none placeholder:text-login-muted"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="text-login-muted"
                >
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 text-login-muted">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 rounded border-line accent-[color:var(--color-primary)]"
                />
                Remember Me
              </label>
              <Link to="/forgot-password" className="font-semibold text-primary hover:underline">
                Forgot Password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full rounded-lg bg-primary py-2.5 text-sm font-bold text-white transition-colors hover:bg-primary-dark disabled:opacity-60"
            >
              {isLoading ? 'Signing in…' : 'Login'}
            </button>
          </form>
        </div>

        <p className="mt-5 text-center text-xs text-login-muted">· Admin Panel v2.1</p>
      </div>
    </div>
  );
}
