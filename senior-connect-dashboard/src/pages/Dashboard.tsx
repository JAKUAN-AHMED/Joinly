import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Check, ChevronRight, Clapperboard, ClipboardList, Eye, Users as UsersIcon, X } from 'lucide-react';
import {
  useGetCategoryDistributionQuery,
  useGetRecentActivitiesQuery,
  useGetRecentUsersQuery,
  useGetStatisticsQuery,
  useUpdateActivityStatusMutation,
} from '../app/api/apiSlice';
import ActivityQuickViewModal, { type ActivityQuickViewData } from '../components/ActivityQuickViewModal';
import Avatar from '../components/Avatar';
import Card from '../components/Card';
import PageHeader from '../components/PageHeader';
import StatusBadge from '../components/StatusBadge';

/**
 * Figma "Dashboard" screen:
 * TOTAL USERS | TOTAL ACTIVITIES | PENDING APPROVALS (ACTION REQUIRED)
 * Category Distribution (single-arc donut) | Recent Users | Recent Activities
 * All figures come live from GET /dashboard/*.
 */

/** Distinct, high-contrast palette so each category reads clearly even with a dozen+ rows. */
const CATEGORY_PALETTE = [
  '#1f7a4d', '#2f9e6b', '#c98a1f', '#b5502e', '#3a6bb0',
  '#7a4fb5', '#c14f7c', '#4f9ab5', '#8a9e2f', '#6b6b6b',
  '#1f5c7a', '#a1622f', '#4f7a5c',
];
const colorFor = (index: number): string => CATEGORY_PALETTE[index % CATEGORY_PALETTE.length];

function DistributionDonut({ slices }: { slices: { categoryName: string; percentage: number }[] }) {
  const radius = 15.9155;
  const circumference = 2 * Math.PI * radius;
  let cumulative = 0;
  return (
    <svg viewBox="0 0 36 36" className="h-36 w-36 -rotate-90">
      <circle cx="18" cy="18" r={radius} fill="transparent" stroke="#e6eae6" strokeWidth="4.5" />
      {slices.map((slice, i) => {
        const dash = (slice.percentage / 100) * circumference;
        const offset = -((cumulative / 100) * circumference);
        cumulative += slice.percentage;
        return (
          <circle
            key={slice.categoryName}
            cx="18"
            cy="18"
            r={radius}
            fill="transparent"
            stroke={colorFor(i)}
            strokeWidth="4.5"
            strokeDasharray={`${dash} ${circumference - dash}`}
            strokeDashoffset={offset}
          />
        );
      })}
    </svg>
  );
}

function DistributionBar({ categoryName, percentage, color }: { categoryName: string; percentage: number; color: string }) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs">
        <span className="flex items-center gap-1.5 font-medium text-body">
          <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: color }} />
          {categoryName}
        </span>
        <span className="font-semibold text-ink">{percentage}%</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-neutral-bg">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${Math.max(percentage, 2)}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}

function ActivityThumb({ src, size = 44 }: { src: string | null; size?: number }) {
  if (src) {
    return (
      <img
        src={src}
        alt=""
        style={{ width: size, height: size }}
        className="shrink-0 rounded-lg object-cover"
      />
    );
  }
  return (
    <span
      style={{ width: size, height: size }}
      className="flex shrink-0 items-center justify-center rounded-lg bg-neutral-bg text-neutral-text"
    >
      <Clapperboard size={size * 0.45} />
    </span>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [quickViewActivity, setQuickViewActivity] = useState<ActivityQuickViewData | null>(null);

  const { data: statsData, isLoading: statsLoading } = useGetStatisticsQuery();
  const { data: distributionData } = useGetCategoryDistributionQuery();
  const { data: usersData, isLoading: usersLoading } = useGetRecentUsersQuery({ limit: 5 });
  const { data: activitiesData, isLoading: activitiesLoading } = useGetRecentActivitiesQuery({ limit: 5 });
  const [updateActivityStatus] = useUpdateActivityStatusMutation();

  const stats = statsData?.data;
  const distribution = distributionData?.data ?? [];
  const recentUsers = usersData?.data ?? [];
  const recentActivities = activitiesData?.data ?? [];

  return (
    <div>
      <PageHeader title="Dashboard" showSearch showBell />

      <div className="space-y-6">
        {/* Statistic Cards Grid */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
          <Card className="p-6">
            <div className="flex items-start justify-between">
              <p className="text-xs font-semibold uppercase tracking-wide text-label">Total Users</p>
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-success-bg text-success">
                <UsersIcon size={18} />
              </span>
            </div>
            <p className="mt-3 font-heading text-3xl font-bold text-ink">
              {statsLoading ? '—' : (stats?.totalUsers ?? 0).toLocaleString()}
            </p>
          </Card>

          <Card className="p-6">
            <div className="flex items-start justify-between">
              <p className="text-xs font-semibold uppercase tracking-wide text-label">Total Activities</p>
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-success-bg text-success">
                <Calendar size={18} />
              </span>
            </div>
            <p className="mt-3 font-heading text-3xl font-bold text-ink">
              {statsLoading ? '—' : (stats?.totalActivities ?? 0).toLocaleString()}
            </p>
          </Card>

          <Card className="p-6">
            <div className="flex items-start justify-between">
              <p className="text-xs font-semibold uppercase tracking-wide text-label">Pending Approvals</p>
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-danger-bg text-danger">
                <ClipboardList size={18} />
              </span>
            </div>
            <div className="mt-3 flex items-center gap-3">
              <p className="font-heading text-3xl font-bold text-ink">
                {statsLoading ? '—' : (stats?.pendingApprovals ?? 0).toLocaleString()}
              </p>
              {!statsLoading && (stats?.pendingApprovals ?? 0) > 0 && (
                <span className="rounded-full bg-danger-solid px-2.5 py-1 text-[11px] font-bold text-white">
                  ACTION REQUIRED
                </span>
              )}
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Category Distribution */}
          <Card className="p-6 lg:col-span-1">
            <h2 className="font-heading text-lg font-semibold text-ink">Category Distribution</h2>
            <p className="mt-1 text-sm text-muted">Activity breakdown across the community.</p>
            {distribution.length > 0 ? (
              <>
                <div className="mt-5 flex justify-center">
                  <DistributionDonut slices={distribution} />
                </div>
                <div className="mt-6 max-h-64 space-y-3.5 overflow-y-auto pr-1">
                  {distribution.map((slice, i) => (
                    <DistributionBar
                      key={slice.categoryName}
                      categoryName={slice.categoryName}
                      percentage={slice.percentage}
                      color={colorFor(i)}
                    />
                  ))}
                </div>
              </>
            ) : (
              <p className="mt-10 text-center text-sm text-muted">No approved activities yet.</p>
            )}
          </Card>

          {/* Recent Users */}
          <Card className="lg:col-span-2">
            <div className="flex items-center justify-between px-6 pt-6">
              <div>
                <h2 className="font-heading text-lg font-semibold text-ink">Recent Users</h2>
                <p className="mt-1 text-sm text-muted">New members who joined in the last 24 hours.</p>
              </div>
              <button
                type="button"
                onClick={() => navigate('/users')}
                className="flex items-center gap-1 rounded-full bg-success-bg px-4 py-2 text-sm font-semibold text-success-text hover:bg-success-bg/70"
              >
                View All
                <ChevronRight size={14} />
              </button>
            </div>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="text-sm font-semibold text-body">
                    <th className="px-6 pb-3 font-semibold">User</th>
                    <th className="px-6 pb-3 font-semibold">Date Joined</th>
                    <th className="px-6 pb-3 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {!usersLoading && recentUsers.length === 0 && (
                    <tr>
                      <td colSpan={3} className="px-6 py-8 text-center text-sm text-muted">
                        No new members in the last 24 hours.
                      </td>
                    </tr>
                  )}
                  {recentUsers.map((user) => (
                    <tr key={user.id} className="border-t border-line">
                      <td className="flex items-center gap-3 px-6 py-3.5">
                        <Avatar src={user.profilePhoto} name={`${user.firstName} ${user.lastName}`} size={36} />
                        <div>
                          <p className="font-semibold text-ink">
                            {user.firstName} {user.lastName}
                          </p>
                          <p className="text-xs text-muted">{user.email}</p>
                        </div>
                      </td>
                      <td className="px-6 py-3.5 text-body">
                        {new Date(user.dateJoined).toLocaleDateString('en-US', {
                          month: 'short',
                          day: '2-digit',
                          year: 'numeric',
                        })}
                      </td>
                      <td className="px-6 py-3.5">
                        <StatusBadge status={user.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        {/* Recent Activities */}
        <Card>
          <div className="flex items-center justify-between px-6 pt-6">
            <div>
              <h2 className="font-heading text-lg font-semibold text-ink">Recent Activities</h2>
              <p className="mt-1 text-sm text-muted">Latest events scheduled across the network.</p>
            </div>
            <button
              type="button"
              onClick={() => navigate('/activities')}
              className="flex items-center gap-1 rounded-full bg-success-bg px-4 py-2 text-sm font-semibold text-success-text hover:bg-success-bg/70"
            >
              View All
              <ChevronRight size={14} />
            </button>
          </div>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="text-sm font-semibold text-body">
                  <th className="px-6 pb-3 font-semibold">Activity Name</th>
                  <th className="px-6 pb-3 font-semibold">Location</th>
                  <th className="px-6 pb-3 font-semibold">Category</th>
                  <th className="px-6 pb-3 font-semibold">Action</th>
                </tr>
              </thead>
              <tbody>
                {!activitiesLoading && recentActivities.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-sm text-muted">
                      No activities have been created yet.
                    </td>
                  </tr>
                )}
                {recentActivities.map((activity) => (
                  <tr key={activity.id} className="border-t border-line">
                    <td className="flex items-center gap-3 px-6 py-3.5">
                      <ActivityThumb src={activity.activityPhoto} />
                      <span className="font-semibold text-ink">{activity.activityName}</span>
                    </td>
                    <td className="px-6 py-3.5 text-body">{activity.activityLocation}</td>
                    <td className="px-6 py-3.5">
                      <span className="rounded-md bg-neutral-bg px-2.5 py-1 text-xs font-semibold text-neutral-text">
                        {activity.categoryName}
                      </span>
                    </td>
                    <td className="px-6 py-3.5">
                      <div className="flex items-center gap-3">
                        {activity.status === 'Pending' && (
                          <>
                            <button
                              type="button"
                              onClick={() => updateActivityStatus({ id: activity.id, status: 'Approved' })}
                              className="text-success"
                              title="Approve"
                            >
                              <Check size={17} />
                            </button>
                            <button
                              type="button"
                              onClick={() => updateActivityStatus({ id: activity.id, status: 'Rejected' })}
                              className="text-danger"
                              title="Reject"
                            >
                              <X size={17} />
                            </button>
                          </>
                        )}
                        <button
                          type="button"
                          onClick={() =>
                            setQuickViewActivity({
                              id: activity.id,
                              activityName: activity.activityName,
                              category: activity.categoryName,
                              location: activity.activityLocation,
                              thumbnail: activity.activityPhoto ?? undefined,
                            })
                          }
                          className="text-success"
                          title="View"
                        >
                          <Eye size={17} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      <ActivityQuickViewModal activity={quickViewActivity} onClose={() => setQuickViewActivity(null)} />
    </div>
  );
}
