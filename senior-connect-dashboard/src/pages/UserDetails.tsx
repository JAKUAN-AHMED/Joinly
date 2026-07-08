import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Ban, MoreVertical, PenLine, UserCheck } from 'lucide-react';
import { useGetUserDetailsQuery, useUpdateUserStatusMutation } from '../app/api/apiSlice';
import Avatar from '../components/Avatar';
import Card from '../components/Card';
import PageHeader from '../components/PageHeader';
import StatusBadge from '../components/StatusBadge';

/**
 * Figma "User Details" screen — wired to GET /users/admin/users/:userId.
 * Arthur Henderson | Portland, OR | EMAIL ADDRESS / MEMBER SINCE / PHONE |
 * Account Status (Block user toggle) | Interests |
 * ACTIVITIES JOINED | ACTIVITIES CREATED | Joined Activities | Created Activities tabs
 */
export default function UserDetails() {
  const { userId } = useParams<{ userId: string }>();
  const { data, isLoading } = useGetUserDetailsQuery(userId ?? '', { skip: !userId });
  const [updateUserStatus] = useUpdateUserStatusMutation();
  const [tab, setTab] = useState<'joined' | 'created'>('joined');

  if (isLoading) {
    return (
      <div>
        <PageHeader title="User Details" backTo="/users" showSearch showBell />
        <p className="text-sm text-muted">Loading…</p>
      </div>
    );
  }

  const d = data?.data;
  if (!d || !userId) {
    return (
      <div>
        <PageHeader title="User Details" backTo="/users" showSearch showBell />
        <p className="text-sm text-muted">User not found.</p>
      </div>
    );
  }

  const name = `${d.firstName} ${d.lastName}`;
  const location = [d.city, d.country].filter(Boolean).join(', ') || 'Location not set';
  const isBlocked = d.status === 'Blocked';
  const toggleBlock = () => updateUserStatus({ userId, status: isBlocked ? 'Active' : 'Blocked' });
  const activityHistory = tab === 'joined' ? d.joinedActivities : d.createdActivities;

  return (
    <div>
      <PageHeader title="User Details" backTo="/users" showSearch showBell />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Profile card */}
        <Card className="p-6 lg:col-span-2">
          <div className="flex gap-5">
            <div className="relative shrink-0">
              <div className="overflow-hidden rounded-2xl ring-2 ring-primary">
                <Avatar src={d.profilePhoto} name={name} size={128} className="!rounded-2xl" />
              </div>
              {d.isEmailVerified && (
                <span className="absolute -bottom-2 -right-2 flex h-7 w-7 items-center justify-center rounded-full bg-primary text-white ring-4 ring-card">
                  <UserCheck size={14} />
                </span>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="font-heading text-xl font-bold text-ink">{name}</h2>
                  <p className="mt-1 text-sm text-muted">📍 {location}</p>
                </div>
                <button
                  type="button"
                  onClick={toggleBlock}
                  title={isBlocked ? 'Unblock user' : 'Block user'}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-page text-muted hover:text-danger"
                >
                  <Ban size={16} />
                </button>
              </div>
              <div className="mt-5 grid grid-cols-3 gap-4 border-t border-line pt-4 text-sm">
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-wide text-label">Email Address</p>
                  <p className="mt-1 break-words text-body">{d.email}</p>
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-wide text-label">Member Since</p>
                  <p className="mt-1 break-words text-body">
                    {new Date(d.memberSince).toLocaleDateString('en-US', {
                      month: 'long',
                      day: '2-digit',
                      year: 'numeric',
                    })}
                  </p>
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-wide text-label">Phone</p>
                  <p className="mt-1 break-words text-body">{d.phoneNumber ?? 'Not provided'}</p>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Account status */}
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <h3 className="font-heading text-base font-bold text-ink">Account Status</h3>
            <StatusBadge status={d.status} />
          </div>
          <p className="mt-2 text-sm text-muted">
            Currently {d.status.toLowerCase()}, has joined {d.activityJoined} and created {d.activityCreated}{' '}
            {d.activityCreated === 1 ? 'activity' : 'activities'}.
          </p>
          <div className="mt-4 flex items-center justify-between rounded-xl bg-page px-4 py-3">
            <span className="text-sm font-semibold text-ink">Block user</span>
            <button
              type="button"
              onClick={toggleBlock}
              className={`h-6 w-11 rounded-full p-0.5 transition-colors ${isBlocked ? 'bg-danger' : 'bg-line-strong'}`}
            >
              <span
                className={`block h-5 w-5 rounded-full bg-white shadow transition-transform ${isBlocked ? 'translate-x-5' : ''}`}
              />
            </button>
          </div>
        </Card>

        {/* Stat cards */}
        <Card className="relative overflow-hidden p-6">
          <p className="text-xs font-semibold uppercase tracking-wide text-label">Activities Joined</p>
          <p className="mt-2 font-heading text-3xl font-bold text-success">{d.activityJoined}</p>
        </Card>
        <Card className="relative overflow-hidden p-6">
          <p className="text-xs font-semibold uppercase tracking-wide text-label">Activities Created</p>
          <p className="mt-2 font-heading text-3xl font-bold text-success">{d.activityCreated}</p>
          <PenLine size={26} className="absolute right-5 top-5 text-line-strong" />
        </Card>

        {/* Interests */}
        <Card className="p-6">
          <h3 className="font-heading text-base font-bold text-ink">Interests</h3>
          <div className="mt-3 flex flex-wrap gap-2">
            {d.interests.length === 0 && <p className="text-sm text-muted">No interests selected yet.</p>}
            {d.interests.map((interest) => (
              <span
                key={interest.id}
                className="rounded-full bg-success-bg px-3 py-1 text-xs font-semibold text-success-text"
              >
                {interest.categoryName}
              </span>
            ))}
          </div>
        </Card>

        {/* Activity history */}
        <Card className="lg:col-span-3">
          <div className="flex gap-6 border-b border-line px-6 pt-5">
            <button
              type="button"
              onClick={() => setTab('joined')}
              className={`pb-3 text-sm font-semibold ${tab === 'joined' ? 'border-b-2 border-primary text-primary' : 'text-muted'}`}
            >
              Joined Activities
            </button>
            <button
              type="button"
              onClick={() => setTab('created')}
              className={`pb-3 text-sm font-semibold ${tab === 'created' ? 'border-b-2 border-primary text-primary' : 'text-muted'}`}
            >
              Created Activities
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="text-xs font-bold uppercase tracking-wide text-label">
                  <th className="px-6 py-3 font-bold">Activity Name</th>
                  <th className="px-6 py-3 font-bold">Category</th>
                  <th className="px-6 py-3 font-bold">Date</th>
                  <th className="px-6 py-3 font-bold">Status</th>
                  <th className="px-6 py-3 font-bold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {activityHistory.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-sm text-muted">
                      No {tab} activities yet.
                    </td>
                  </tr>
                )}
                {activityHistory.map((activity) => (
                  <tr key={activity.id} className="border-t border-line">
                    <td className="px-6 py-3.5 font-semibold text-ink">{activity.activityName}</td>
                    <td className="px-6 py-3.5">
                      <span className="rounded-md bg-neutral-bg px-2.5 py-1 text-xs font-semibold text-neutral-text">
                        {activity.categoryName}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-body">{activity.activityDate}</td>
                    <td className="px-6 py-3.5">
                      <StatusBadge status={activity.status} />
                    </td>
                    <td className="px-6 py-3.5">
                      <button type="button" className="text-muted">
                        <MoreVertical size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}
