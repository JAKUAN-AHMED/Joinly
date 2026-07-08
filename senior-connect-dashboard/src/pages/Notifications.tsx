import { useEffect, useRef, useState } from 'react';
import { Download, Filter, Send } from 'lucide-react';
import {
  useComposeNotificationMutation,
  useGetNotificationsQuery,
  type Audience,
  type NotificationStatus,
} from '../app/api/apiSlice';
import Card from '../components/Card';
import Pagination from '../components/Pagination';
import PageHeader from '../components/PageHeader';

/**
 * Figma "Notifications" screen — Communication Hub / Notification Management:
 * Compose Notification (Title, Message Content, Send Notification) |
 * Notification History (SUBJECT, AUDIENCE, SENT DATE, STATUS)
 * Wired to GET/POST /notifications/admin/notifications.
 */
const audiences: Audience[] = ['Everyone', 'Seniors', 'Volunteers'];
const STATUS_OPTIONS: { label: string; value: NotificationStatus | '' }[] = [
  { label: 'All statuses', value: '' },
  { label: 'Delivered', value: 'Delivered' },
  { label: 'Failed', value: 'Failed' },
];
const PAGE_SIZE = 5;

function downloadCsv(rows: { notificationTitle: string; audience: string; sentDate: string; status: string }[]) {
  const header = ['Subject', 'Audience', 'Sent Date', 'Status'];
  const lines = rows.map((r) => [r.notificationTitle, r.audience, r.sentDate, r.status].map((v) => `"${v}"`).join(','));
  const csv = [header.join(','), ...lines].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'notification-history.csv';
  a.click();
  URL.revokeObjectURL(url);
}

export default function Notifications() {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [audience, setAudience] = useState<Audience>('Everyone');
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<NotificationStatus | ''>('');
  const [filterOpen, setFilterOpen] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) setFilterOpen(false);
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  const { data, isLoading, isFetching } = useGetNotificationsQuery({
    page,
    limit: PAGE_SIZE,
    status: status || undefined,
  });
  const [composeNotification, { isLoading: isSending }] = useComposeNotificationMutation();

  const history = data?.data ?? [];
  const meta = data?.meta;
  const totalPages = meta?.totalPages ?? 1;
  const total = meta?.total ?? 0;
  const rangeStart = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const rangeEnd = Math.min(page * PAGE_SIZE, total);

  const handleSend = async () => {
    if (!title.trim() || !message.trim()) {
      setFormError('Notification Title and Message Content are required.');
      return;
    }
    setFormError(null);
    try {
      const res = await composeNotification({
        notificationTitle: title.trim(),
        messageContent: message.trim(),
        audience,
      }).unwrap();
      setTitle('');
      setMessage('');
      setSuccessMessage(
        res.data.status === 'Delivered' ? 'Notification sent successfully.' : 'Notification failed to send.',
      );
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err) {
      setFormError((err as { data?: { message?: string } })?.data?.message ?? 'Failed to send notification');
    }
  };

  return (
    <div>
      <PageHeader title="Notifications" />

      <p className="text-xs font-semibold uppercase tracking-wide text-label">Communication Hub</p>
      <h2 className="mb-5 font-heading text-2xl font-bold text-ink">Notification Management</h2>

      <Card className="mb-6 p-6">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-success-bg text-success">
            <Send size={16} />
          </span>
          <h3 className="font-heading text-base font-bold text-ink">Compose Notification</h3>
        </div>

        <div className="mt-5 space-y-4">
          {formError && (
            <div className="rounded-lg bg-danger-bg px-3.5 py-2.5 text-sm font-medium text-danger-text">
              {formError}
            </div>
          )}
          {successMessage && (
            <div className="rounded-lg bg-success-bg px-3.5 py-2.5 text-sm font-medium text-success-text">
              {successMessage}
            </div>
          )}
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-ink" htmlFor="notif-title">
              Notification Title
            </label>
            <input
              id="notif-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Community Garden Workshop"
              className="w-full rounded-lg border border-line px-3.5 py-2.5 text-sm text-ink outline-none placeholder:text-muted focus:border-primary"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-ink" htmlFor="notif-message">
              Message Content
            </label>
            <textarea
              id="notif-message"
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Share details about the event or update..."
              className="w-full rounded-lg border border-line px-3.5 py-2.5 text-sm text-ink outline-none placeholder:text-muted focus:border-primary"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-ink">Audience</label>
            <div className="flex gap-2">
              {audiences.map((a) => (
                <button
                  key={a}
                  type="button"
                  onClick={() => setAudience(a)}
                  className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
                    audience === a ? 'bg-primary text-white' : 'bg-page text-body'
                  }`}
                >
                  {a}
                </button>
              ))}
            </div>
          </div>
          <button
            type="button"
            onClick={handleSend}
            disabled={isSending}
            className="rounded-lg bg-primary px-6 py-2.5 text-sm font-bold text-white hover:bg-primary-dark disabled:opacity-60"
          >
            {isSending ? 'Sending…' : 'Send Notification'}
          </button>
        </div>
      </Card>

      <Card>
        <div className="flex items-center justify-between px-6 pt-6">
          <h3 className="font-heading text-base font-bold text-ink">Notification History</h3>
          <div className="flex items-center gap-3 text-muted">
            <div ref={filterRef} className="relative">
              <button type="button" onClick={() => setFilterOpen((v) => !v)} title="Filter by status">
                <Filter size={17} />
              </button>
              {filterOpen && (
                <div className="absolute right-0 top-full z-40 mt-2 w-44 rounded-2xl border border-line bg-card p-2 shadow-xl">
                  {STATUS_OPTIONS.map((opt) => (
                    <button
                      key={opt.label}
                      type="button"
                      onClick={() => {
                        setStatus(opt.value);
                        setPage(1);
                        setFilterOpen(false);
                      }}
                      className={`flex w-full items-center rounded-xl px-3 py-2 text-sm font-medium hover:bg-page ${
                        status === opt.value ? 'text-primary' : 'text-body'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button type="button" onClick={() => downloadCsv(history)} title="Download CSV">
              <Download size={17} />
            </button>
          </div>
        </div>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-table-head text-xs font-bold uppercase tracking-wide text-label">
                <th className="px-6 py-3.5 font-bold">Subject</th>
                <th className="px-6 py-3.5 font-bold">Audience</th>
                <th className="px-6 py-3.5 font-bold">Sent Date</th>
                <th className="px-6 py-3.5 font-bold">Status</th>
              </tr>
            </thead>
            <tbody>
              {!isLoading && history.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-10 text-center text-sm text-muted">
                    No notifications sent yet.
                  </td>
                </tr>
              )}
              {history.map((n) => (
                <tr key={n.id} className="border-b border-line last:border-0">
                  <td className="px-6 py-4">
                    <p className="font-semibold text-ink">{n.notificationTitle}</p>
                    <p className="line-clamp-1 text-xs text-muted">{n.messageContent}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className="rounded-full bg-success-bg px-3 py-1 text-xs font-semibold text-success-text">
                      {n.audience}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-body">
                    {new Date(n.sentDate).toLocaleDateString('en-US', {
                      month: 'short',
                      day: '2-digit',
                      year: 'numeric',
                    })}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`flex items-center gap-1.5 ${n.status === 'Delivered' ? 'text-success-text' : 'text-danger'}`}
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-current" />
                      {n.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Pagination
          summary={
            isFetching ? 'Loading…' : `Showing ${rangeStart} to ${rangeEnd} of ${total} notifications`
          }
          page={page}
          totalPages={totalPages}
          onPageChange={setPage}
        />
      </Card>
    </div>
  );
}
