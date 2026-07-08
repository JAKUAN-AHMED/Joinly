import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import {
  Bell,
  Calendar,
  LayoutDashboard,
  LogOut,
  Settings,
  User,
  Users,
  Waypoints,
} from 'lucide-react';
import { logout } from '../app/authSlice';

/** Figma sidebar nav — Dashboard, Users, Activities, Categories | Notifications, Settings | Profile, Logout */
const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/users', label: 'Users', icon: Users },
  { to: '/activities', label: 'Activities', icon: Calendar },
  { to: '/categories', label: 'Categories', icon: Waypoints },
];

const navItemsBelowDivider = [
  { to: '/notifications', label: 'Notifications', icon: Bell },
  { to: '/settings', label: 'Settings', icon: Settings },
];

export default function AdminLayout() {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
      isActive ? 'bg-primary-soft text-primary' : 'text-muted hover:text-ink'
    }`;

  return (
    <div className="flex min-h-screen bg-page">
      {/* Aside — NavigationDrawer */}
      <aside className="fixed inset-y-0 left-0 flex w-64 flex-col bg-card">
        <div className="px-6 py-6">
          <img src="/Logo 1 (1) 1.png" alt="Joinly" className="h-8 w-auto" />
        </div>

        <nav className="flex-1 space-y-1 px-4">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} className={linkClass}>
              <Icon size={19} />
              {label}
            </NavLink>
          ))}

          <div className="my-3 border-t border-line" />

          {navItemsBelowDivider.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} className={linkClass}>
              <Icon size={19} />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="space-y-1 px-4 pb-6">
          <NavLink to="/profile" className={linkClass}>
            <User size={19} />
            Profile
          </NavLink>
          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted hover:text-ink"
          >
            <LogOut size={19} />
            Logout
          </button>
        </div>
      </aside>

      {/* Main column — fluid, fills remaining viewport width beside the fixed sidebar */}
      <div className="ml-64 flex-1 px-5 py-6 sm:px-8">
        <Outlet />
      </div>
    </div>
  );
}
