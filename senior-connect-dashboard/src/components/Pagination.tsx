import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  summary: string;
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  variant?: 'numbers' | 'prev-next';
}

function getPageList(current: number, total: number): (number | '...')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages: (number | '...')[] = [1];
  if (current > 3) pages.push('...');
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  for (let p = start; p <= end; p++) pages.push(p);
  if (current < total - 2) pages.push('...');
  pages.push(total);
  return pages;
}

/** Figma pagination — square number buttons w/ chevron prev/next, or plain Previous/Next pills. Fully controlled. */
export default function Pagination({
  summary,
  page,
  totalPages,
  onPageChange,
  variant = 'numbers',
}: PaginationProps) {
  const goTo = (p: number) => onPageChange(Math.min(totalPages, Math.max(1, p)));

  return (
    <div className="flex items-center justify-between px-6 py-4">
      <p className="text-sm text-muted">{summary}</p>
      {variant === 'numbers' ? (
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => goTo(page - 1)}
            disabled={page <= 1}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-line bg-card text-muted disabled:opacity-40"
          >
            <ChevronLeft size={16} />
          </button>
          {getPageList(page, totalPages).map((p, i) =>
            p === '...' ? (
              <span key={`dots-${i}`} className="px-1 text-sm text-muted">
                ...
              </span>
            ) : (
              <button
                key={p}
                type="button"
                onClick={() => goTo(p)}
                className={`h-9 w-9 rounded-lg text-sm font-semibold ${
                  p === page
                    ? 'bg-primary text-white'
                    : 'border border-line bg-card text-body hover:bg-primary-soft'
                }`}
              >
                {p}
              </button>
            ),
          )}
          <button
            type="button"
            onClick={() => goTo(page + 1)}
            disabled={page >= totalPages}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-line bg-card text-ink disabled:opacity-40"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => goTo(page - 1)}
            disabled={page <= 1}
            className="rounded-lg border border-line bg-card px-4 py-2 text-sm font-semibold text-muted disabled:opacity-40"
          >
            Previous
          </button>
          <button
            type="button"
            onClick={() => goTo(page + 1)}
            disabled={page >= totalPages}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-dark disabled:opacity-40"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
