import { useParams, useNavigate } from 'react-router-dom';
import { Banknote, Check, Clock, ImageOff, MapPin, MapPinned, Trash2, Users2, X } from 'lucide-react';
import {
  useDeleteActivityMutation,
  useGetActivityDetailsQuery,
  useUpdateActivityStatusMutation,
} from '../app/api/apiSlice';
import Avatar from '../components/Avatar';
import Card from '../components/Card';
import PageHeader from '../components/PageHeader';
import StatusBadge from '../components/StatusBadge';

/**
 * Figma "Activity Details" screen — hero image w/ overlaid title, then
 * Description + Location (row 1), Activity Highlights + Organized by (row 2).
 * Wired to GET /activities/admin/activities/:id.
 */
export default function ActivityDetails() {
  const { activityId } = useParams<{ activityId: string }>();
  const navigate = useNavigate();
  const { data, isLoading } = useGetActivityDetailsQuery(activityId ?? '', { skip: !activityId });
  const [updateActivityStatus] = useUpdateActivityStatusMutation();
  const [deleteActivity] = useDeleteActivityMutation();

  if (isLoading) {
    return (
      <div>
        <PageHeader title="Activity Details" backTo="/activities" showSearch showBell />
        <p className="text-sm text-muted">Loading…</p>
      </div>
    );
  }

  const d = data?.data;
  if (!d || !activityId) {
    return (
      <div>
        <PageHeader title="Activity Details" backTo="/activities" showSearch showBell />
        <p className="text-sm text-muted">Activity not found.</p>
      </div>
    );
  }

  const organizerName = `${d.organizer.firstName} ${d.organizer.lastName}`.trim();
  const mapsUrl =
    d.latitude !== null && d.longitude !== null
      ? `https://www.google.com/maps?q=${d.latitude},${d.longitude}`
      : null;

  const highlightCards = [
    {
      icon: Users2,
      label: 'PARTICIPANTS',
      value: `${d.maximumNumberOfParticipants} Slots Total`,
      note: `${d.joinedCount} joined so far`,
    },
    { icon: Users2, label: 'AGE RANGE', value: d.ageLimit, note: 'Participant age range' },
    {
      icon: Banknote,
      label: 'PRICE',
      value: d.price != null ? `$${d.price.toFixed(2)}` : 'Free',
      note: 'Paid directly to the organizer',
    },
    { icon: Clock, label: 'DURATION', value: d.activityDuration, note: `Starts at ${d.activityTime}` },
  ];

  const handleApprove = () => updateActivityStatus({ id: activityId, status: 'Approved' });
  const handleReject = () => updateActivityStatus({ id: activityId, status: 'Rejected' });
  const handleDelete = async () => {
    await deleteActivity(activityId);
    navigate('/activities');
  };

  return (
    <div>
      <PageHeader title="Activity Details" backTo="/activities" showSearch showBell />

      <div className="mx-auto max-w-5xl">
        <Card className="relative mb-6 aspect-[1024/500] w-full overflow-hidden rounded-[20px] bg-neutral-bg">
          {d.activityPhoto ? (
            <img src={d.activityPhoto} alt={d.activityName} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-neutral-text">
              <ImageOff size={40} />
            </div>
          )}
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent p-6">
            <div className="flex gap-2">
              <span className="rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-ink">
                {d.category.categoryName.toUpperCase()}
              </span>
              <span className="rounded-full bg-success px-3 py-1 text-xs font-semibold text-white">
                {d.status.toUpperCase()}
              </span>
            </div>
            <h1 className="mt-3 font-heading text-3xl font-bold text-white">{d.activityName}</h1>
          </div>
        </Card>

        {d.status === 'Pending' && (
          <div className="mb-6 flex gap-3">
            <button
              type="button"
              onClick={handleApprove}
              className="flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-bold text-white hover:bg-primary-dark"
            >
              <Check size={16} />
              Approve Activity
            </button>
            <button
              type="button"
              onClick={handleReject}
              className="flex items-center gap-2 rounded-lg bg-danger-bg px-5 py-2.5 text-sm font-bold text-danger-text hover:bg-danger-bg/70"
            >
              <X size={16} />
              Reject Activity
            </button>
          </div>
        )}
        {d.status === 'Rejected' && d.rejectionReason && (
          <div className="mb-6 rounded-xl bg-danger-bg px-4 py-3 text-sm text-danger-text">
            Rejection reason: {d.rejectionReason}
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <Card className="flex flex-col rounded-[20px] p-6 lg:col-span-2">
            <h2 className="border-b border-line pb-3 font-heading text-base font-bold text-ink">Description</h2>
            <div className="flex flex-1 flex-col justify-center gap-4 py-4">
              <p className="text-sm leading-relaxed text-body">{d.descriptions}</p>
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="font-heading text-base font-bold text-ink">Location</h2>
            {mapsUrl && (
              <a
                href={mapsUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-4 flex items-center justify-center gap-2 rounded-xl bg-page py-6 text-sm font-semibold text-primary hover:bg-success-bg"
              >
                <MapPinned size={18} />
                Open in Maps
              </a>
            )}
            <div className="mt-4 flex gap-2 text-sm">
              <MapPin size={16} className="mt-0.5 shrink-0 text-primary" />
              <p className="text-body">{d.activityLocation}</p>
            </div>
          </Card>

          <Card className="rounded-[20px] p-6 lg:col-span-2">
            <h2 className="font-heading text-base font-bold text-ink">Activity Highlights</h2>
            <div className="mt-4 grid grid-cols-2 gap-4">
              {highlightCards.map(({ icon: Icon, label, value, note }) => (
                <div key={label} className="rounded-xl bg-page p-4">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-success-bg text-success">
                    <Icon size={17} />
                  </span>
                  <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-label">{label}</p>
                  <p className="mt-1 text-sm font-bold text-ink">{value}</p>
                  <p className="mt-0.5 text-xs text-muted">{note}</p>
                </div>
              ))}
            </div>
            <div className="mt-4 flex items-center gap-2 text-xs text-muted">
              <span className="font-semibold uppercase tracking-wide text-label">Difficulty:</span>
              {d.difficulty}
              {d.activityEquipment && (
                <>
                  <span className="mx-1">•</span>
                  <span className="font-semibold uppercase tracking-wide text-label">Equipment:</span>
                  {d.activityEquipment}
                </>
              )}
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <h2 className="font-heading text-base font-bold text-ink">Organized by</h2>
              <StatusBadge status={d.status} />
            </div>
            <div className="mt-4 flex items-center gap-3">
              <Avatar src={d.organizer.profilePhoto} name={organizerName} size={48} />
              <div>
                <p className="text-sm font-bold text-ink">{organizerName || 'Unknown organizer'}</p>
                <p className="text-xs text-muted">{d.organizer.email}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => navigate(`/users/${d.organizer.id}`)}
              className="mt-5 w-full rounded-lg border border-line py-2.5 text-sm font-semibold text-body hover:bg-page"
            >
              View Organizer Profile
            </button>
            <button
              type="button"
              onClick={handleDelete}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg border border-danger-bg py-2.5 text-sm font-semibold text-danger hover:bg-danger-bg"
            >
              <Trash2 size={15} />
              Delete Activity
            </button>
          </Card>
        </div>
      </div>
    </div>
  );
}
