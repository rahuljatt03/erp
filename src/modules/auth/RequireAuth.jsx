import { useSelector } from 'react-redux';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { selectIsAuthenticated } from './authSlice';

/**
 * Route guard. Renders the protected app (via <Outlet>) only when authenticated;
 * otherwise redirects to /login, stashing the attempted location in router state
 * so the login page can send the user back where they were headed.
 */
export default function RequireAuth() {
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }
  return <Outlet />;
}
