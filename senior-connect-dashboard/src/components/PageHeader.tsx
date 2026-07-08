import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Bell, LogOut, Search, Settings, User } from 'lucide-react';
import { useGetNotificationsQuery } from '../app/api/apiSlice';
import { logout } from '../app/authSlice';
import type { RootState } from '../app/store';
import Avatar from './Avatar';
import StatusBadge from './StatusBadge';

interface PageHeaderProps {
  title: string;
  backTo?: string;
  showSearch?: boolean;
  showBell?: boolean;
  action?: ReactNode;
}

/**
 * Figma header (Header - TopAppBar) — content varies per screen:
 * - Dashboard/Users/Activities: search pill + bell + avatar
 * - Activity Details: back arrow + title + search pill + bell + avatar
 * - Categories: "Add Category" action button + avatar (no search/bell)
 * - Notifications/User Details: avatar only (or back arrow + avatar)
 */
export default function PageHeader({ title, backTo, showSearch, showBell, action }: PageHeaderProps) {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const admin = useSelector((state: RootState) => state.auth.user);
  const [bellOpen, setBellOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const bellRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  const { data: notificationsData } = useGetNotificationsQuery({ limit: 3 }, { skip: !bellOpen });
  const recentNotifications = notificationsData?.data ?? [];

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (bellRef.current && !bellRef.current.contains(e.target as Node)) setBellOpen(false);
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setProfileOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setBellOpen(false);
        setProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', onClickOutside);
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onClickOutside);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, []);

  const handleLogout = () => {
    setProfileOpen(false);
    dispatch(logout());
    navigate('/login');
  };

  const adminName = admin ? `${admin.firstName} ${admin.lastName}`.trim() : 'Admin';

  return (
    <header className="mb-6 flex items-center justify-between">
      <div className="flex items-center gap-3">
        {backTo && (
          <button
            type="button"
            onClick={() => navigate(backTo)}
            className="text-primary hover:text-primary-dark"
          >
            <ArrowLeft size={22} />
          </button>
        )}
        <h1 className="font-heading text-2xl font-semibold text-primary">{title}</h1>
      </div>

      <div className="flex items-center gap-4">
        {showSearch && (
          <label className="flex w-64 items-center gap-2 rounded-full bg-white/70 px-4 py-2.5 ring-1 ring-line">
            <Search size={16} className="text-muted" />
            <input
              type="text"
              placeholder="Search data..."
              className="w-full bg-transparent text-sm text-ink outline-none placeholder:text-muted"
            />
          </label>
        )}
        {action}

        {showBell && (
          <div ref={bellRef} className="relative">
            <button
              type="button"
              onClick={() => {
                setBellOpen((v) => !v);
                setProfileOpen(false);
              }}
              className="relative text-muted hover:text-ink"
            >
              <Bell size={20} />
              {recentNotifications.length > 0 && (
                <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-danger" />
              )}
            </button>

            {bellOpen && (
              <div className="absolute right-0 top-full z-40 mt-3 w-80 rounded-2xl border border-line bg-card p-2 shadow-xl">
                <div className="flex items-center justify-between px-3 py-2">
                  <span className="font-heading text-sm font-bold text-ink">Notifications</span>
                </div>
                <div className="max-h-72 overflow-y-auto">
                  {recentNotifications.length === 0 && (
                    <p className="px-3 py-6 text-center text-sm text-muted">No notifications yet.</p>
                  )}
                  {recentNotifications.map((n) => (
                    <div key={n.id} className="rounded-xl px-3 py-2.5 hover:bg-page">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-semibold text-ink">{n.notificationTitle}</p>
                        <StatusBadge status={n.status} />
                      </div>
                      <p className="mt-0.5 line-clamp-1 text-xs text-muted">{n.messageContent}</p>
                      <p className="mt-1 text-xs text-muted">
                        {new Date(n.sentDate).toLocaleDateString('en-US', {
                          month: 'short',
                          day: '2-digit',
                          year: 'numeric',
                        })}
                      </p>
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setBellOpen(false);
                    navigate('/notifications');
                  }}
                  className="mt-1 w-full rounded-xl py-2 text-center text-sm font-semibold text-primary hover:bg-page"
                >
                  View All Notifications
                </button>
              </div>
            )}
          </div>
        )}

        <div ref={profileRef} className="relative">
          <button
            type="button"
            onClick={() => {
              setProfileOpen((v) => !v);
              setBellOpen(false);
            }}
          >
            <Avatar src={admin?.profilePhoto} name={adminName} size={36} />
          </button>

          {profileOpen && (
            <div className="absolute right-0 top-full z-40 mt-3 w-56 rounded-2xl border border-line bg-card p-2 shadow-xl">
              <div className="flex items-center gap-3 px-3 py-2.5">
                <Avatar src={admin?.profilePhoto} name={adminName} size={36} />
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-ink">{adminName}</p>
                  <p className="truncate text-xs text-muted">{admin?.email}</p>
                </div>
              </div>
              <div className="my-1 border-t border-line" />
              <button
                type="button"
                onClick={() => {
                  setProfileOpen(false);
                  navigate('/profile');
                }}
                className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium text-body hover:bg-page"
              >
                <User size={16} />
                Profile
              </button>
              <button
                type="button"
                onClick={() => {
                  setProfileOpen(false);
                  navigate('/settings');
                }}
                className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium text-body hover:bg-page"
              >
                <Settings size={16} />
                Settings
              </button>
              <div className="my-1 border-t border-line" />
              <button
                type="button"
                onClick={handleLogout}
                className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium text-danger hover:bg-page"
              >
                <LogOut size={16} />
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
