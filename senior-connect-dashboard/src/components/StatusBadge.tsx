const styles: Record<string, string> = {
  Active: 'bg-success-bg text-success-text',
  ACTIVE: 'bg-success-bg text-success-text',
  Delivered: 'bg-success-bg text-success-text',
  Completed: 'bg-success-bg text-success-text',
  Upcoming: 'bg-success-bg text-success-text',
  Inactive: 'bg-neutral-bg text-neutral-text',
  Suspend: 'bg-danger-bg text-danger-text',
  Suspended: 'bg-danger-bg text-danger-text',
  Blocked: 'bg-danger-bg text-danger-text',
  Cancelled: 'bg-danger-bg text-danger-text',
  Rejected: 'bg-danger-bg text-danger-text',
  REJECTED: 'bg-danger-bg text-danger-text',
  Pending: 'bg-pending-bg text-pending-text',
  PENDING: 'bg-pending-bg text-pending-text',
  Disabled: 'bg-neutral-bg text-neutral-text',
};

/** Figma status pills — colored dot + label, e.g. "● Active" */
export default function StatusBadge({ status, dot = true }: { status: string; dot?: boolean }) {
  const style = styles[status] ?? (status.startsWith('Failed') ? 'bg-danger-bg text-danger-text' : 'bg-neutral-bg text-neutral-text');
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${style}`}>
      {dot && <span className="h-1.5 w-1.5 rounded-full bg-current" />}
      {status}
    </span>
  );
}
