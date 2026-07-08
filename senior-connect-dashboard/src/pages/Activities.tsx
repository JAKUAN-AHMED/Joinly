import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Check, ChevronDown, ImageOff, Leaf, X } from 'lucide-react';
import {
  useDeleteActivityMutation,
  useGetActiveCategoriesQuery,
  useGetActivitiesQuery,
  useUpdateActivityStatusMutation,
  type ActivityStatus,
} from '../app/api/apiSlice';
import Avatar from '../components/Avatar';
import Card from '../components/Card';
import Pagination from '../components/Pagination';
import PageHeader from '../components/PageHeader';

/**
 * Figma "Activities" screen — tabs Pending | Approved | Rejected, category filter,
 * activity photo cards (organizer, date, Approve/Reject or Delete).
 * Wired to GET /activities/admin/activities.
 */
const tabs: { label: string; status: ActivityStatus }[] = [
  { label: 'Pending', status: 'Pending' },
  { label: 'Approved', status: 'Approved' },
  { label: 'Rejected', status: 'Rejected' },
];

const PAGE_SIZE = 6;

export default function Activities() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<ActivityStatus>('Pending');
  const [page, setPage] = useState(1);
  const [categoryId, setCategoryId] = useState('');
  const [categoryOpen, setCategoryOpen] = useState(false);
  const categoryRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (categoryRef.current && !categoryRef.current.contains(e.target as Node)) setCategoryOpen(false);
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  const { data, isLoading, isFetching } = useGetActivitiesQuery({
    status: activeTab,
    categoryId: categoryId || undefined,
    page,
    limit: PAGE_SIZE,
  });
  const { data: categoriesData } = useGetActiveCategoriesQuery();
  const [updateActivityStatus] = useUpdateActivityStatusMutation();
  const [deleteActivity] = useDeleteActivityMutation();

  const activities = data?.data ?? [];
  const categories = categoriesData?.data ?? [];
  const meta = data?.meta;
  const totalPages = meta?.totalPages ?? 1;
  const total = meta?.total ?? 0;
  const shown = Math.min(page * PAGE_SIZE, total);
  const selectedCategoryName = categories.find((c) => c.id === categoryId)?.categoryName ?? 'All Categories';

  return (
    <div>
      <PageHeader title="Activities" showSearch showBell />

      <div className="mx-auto max-w-9xl">
        <div className="mb-5 flex items-center justify-between">
          <div className="flex gap-1 rounded-xl bg-card p-1 ring-1 ring-line">
            {tabs.map((tab) => (
              <button
                key={tab.status}
                type="button"
                onClick={() => {
                  setActiveTab(tab.status);
                  setPage(1);
                }}
                className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
                  activeTab === tab.status ? 'bg-card text-primary ring-1 ring-line' : 'text-muted'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <div ref={categoryRef} className="relative">
            <button
              type="button"
              onClick={() => setCategoryOpen((v) => !v)}
              className="flex items-center gap-2 rounded-lg bg-card px-4 py-2 text-sm font-medium text-body ring-1 ring-line"
            >
              {selectedCategoryName}
              <ChevronDown size={15} />
            </button>
            {categoryOpen && (
              <div className="absolute right-0 top-full z-40 mt-2 w-56 max-h-72 overflow-y-auto rounded-2xl border border-line bg-card p-2 shadow-xl">
                <button
                  type="button"
                  onClick={() => {
                    setCategoryId('');
                    setPage(1);
                    setCategoryOpen(false);
                  }}
                  className={`flex w-full items-center rounded-xl px-3 py-2 text-sm font-medium hover:bg-page ${
                    categoryId === '' ? 'text-primary' : 'text-body'
                  }`}
                >
                  All Categories
                </button>
                {categories.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => {
                      setCategoryId(c.id);
                      setPage(1);
                      setCategoryOpen(false);
                    }}
                    className={`flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium hover:bg-page ${
                      categoryId === c.id ? 'text-primary' : 'text-body'
                    }`}
                  >
                    {c.categoryName}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {!isLoading && activities.length === 0 && (
          <Card className="p-10 text-center text-sm text-muted">No {activeTab.toLowerCase()} activities.</Card>
        )}

        <div
          className="grid justify-center gap-x-30 gap-y-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5"
          style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(0, 260px))' }}
        >
          {activities.map((activity) => {
            const organizerName = `${activity.organizer.firstName} ${activity.organizer.lastName}`.trim();
            const dateTime = `${new Date(activity.activityDate).toLocaleDateString('en-US', {
              month: 'short',
              day: '2-digit',
              year: 'numeric',
            })} • ${activity.activityTime}`;

            return (
              <Card key={activity.id} className="flex w-[350px] flex-col overflow-hidden rounded-[20px]">
                <div className="relative aspect-[260/165] w-full shrink-0 bg-neutral-bg">
                  {activity.activityPhoto ? (
                    <img
                      src={activity.activityPhoto}
                      alt={activity.activityName}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-neutral-text">
                      <ImageOff size={28} />
                    </div>
                  )}
                  <span className="absolute left-2.5 top-2.5 flex items-center gap-1 rounded-full bg-white/90 px-2 py-0.5 text-[11px] font-semibold text-ink">
                    <Leaf size={11} className="text-success" />
                    {activity.categoryName}
                  </span>
                </div>
                <div className="flex-1 space-y-2.5 p-3.5">
                  <h3 className="text-sm font-bold text-ink">{activity.activityName}</h3>
                  <div className="flex items-center gap-2 text-xs text-muted">
                    <Avatar src={activity.organizer.profilePhoto} name={organizerName} size={20} />
                    Organizer: {organizerName || 'Unknown'}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted">
                    <Calendar size={14} />
                    {dateTime}
                  </div>

                  {activeTab === 'Pending' ? (
                    <div className="flex gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => updateActivityStatus({ id: activity.id, status: 'Approved' })}
                        className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-primary py-1.5 text-xs font-bold text-white hover:bg-primary-dark"
                      >
                        <Check size={13} />
                        Approve
                      </button>
                      <button
                        type="button"
                        onClick={() => updateActivityStatus({ id: activity.id, status: 'Rejected' })}
                        className="flex h-8 w-8 items-center justify-center rounded-lg bg-danger-bg text-danger"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => deleteActivity(activity.id)}
                      className="w-full rounded-lg bg-primary py-1.5 text-xs font-bold text-white hover:bg-primary-dark"
                    >
                      Delete
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => navigate(`/activities/${activity.id}`)}
                    className="w-full text-center text-xs font-semibold text-primary hover:underline"
                  >
                    View details
                  </button>
                </div>
              </Card>
            );
          })}
        </div>

        <Card className="mt-5 mx-auto max-w-[1380px]">
          <Pagination
            summary={
              isFetching
                ? 'Loading…'
                : `Showing ${shown} of ${total} ${activeTab.toLowerCase()} activities`
            }
            page={page}
            totalPages={totalPages}
            onPageChange={setPage}
            variant="prev-next"
          />
        </Card>
      </div>
    </div>
  );
}
