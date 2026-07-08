import { Navigate, Outlet } from 'react-router-dom';
import { useSelector } from 'react-redux';
import type { RootState } from '../app/store';

/** Redirects to /login when there is no access token. */
export default function ProtectedRoute() {
  const accessToken = useSelector((state: RootState) => state.auth.accessToken);
  if (!accessToken) return <Navigate to="/login" replace />;
  return <Outlet />;
}
