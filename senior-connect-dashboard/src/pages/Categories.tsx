import { useState } from 'react';
import { Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useGetCategoriesQuery } from '../app/api/apiSlice';
import Card from '../components/Card';
import Pagination from '../components/Pagination';
import PageHeader from '../components/PageHeader';
import StatusBadge from '../components/StatusBadge';

const PAGE_SIZE = 5;

/**
 * Figma "Categories" screen:
 * MANAGEMENT | Activity Categories | Total Categories | Active Now |
 * Category Name | Activity Count | Status | pagination
 * Wired to GET /categories/admin/categories.
 */
export default function Categories() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);

  const { data, isLoading, isFetching } = useGetCategoriesQuery({ page, limit: PAGE_SIZE });
  const stats = data?.data.stats;
  const categories = data?.data.categories ?? [];
  const meta = data?.meta;
  const totalPages = meta?.totalPages ?? 1;
  const total = meta?.total ?? 0;
  const rangeStart = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const rangeEnd = Math.min(page * PAGE_SIZE, total);

  return (
    <div>
      <PageHeader
        title="Categories"
        action={
          <button
            type="button"
            onClick={() => navigate('/categories/new')}
            className="flex items-center gap-2 rounded-full bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-dark"
          >
            <Plus size={16} />
            Add Category
          </button>
        }
      />

      <div className="mb-5 flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-label">Management</p>
          <h2 className="font-heading text-2xl font-bold text-ink">Activity Categories</h2>
        </div>
        <div className="flex gap-3">
          <div className="flex items-center gap-2 rounded-xl bg-card px-4 py-2.5 ring-1 ring-line">
            <span className="text-sm text-muted">Total Categories</span>
            <span className="font-heading text-lg font-bold text-primary">
              {isLoading ? '—' : (stats?.totalCategories ?? 0)}
            </span>
          </div>
          <div className="flex items-center gap-2 rounded-xl bg-card px-4 py-2.5 ring-1 ring-line">
            <span className="text-sm text-muted">Active Now</span>
            <span className="font-heading text-lg font-bold text-primary">
              {isLoading ? '—' : (stats?.activeNow ?? 0)}
            </span>
          </div>
        </div>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-table-head text-sm font-semibold text-body">
                <th className="px-6 py-3.5 font-semibold">Category Name</th>
                <th className="px-6 py-3.5 font-semibold">Activity Count</th>
                <th className="px-6 py-3.5 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {!isLoading && categories.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-6 py-10 text-center text-sm text-muted">
                    No categories yet.
                  </td>
                </tr>
              )}
              {categories.map((category) => (
                <tr key={category.id} className="border-b border-line last:border-0">
                  <td className="px-6 py-4 font-semibold text-ink">{category.categoryName}</td>
                  <td className="px-6 py-4 text-body">{category.activityCount}</td>
                  <td className="px-6 py-4">
                    <StatusBadge status={category.status} dot={false} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Pagination
          summary={
            isFetching ? 'Loading…' : `Showing ${rangeStart} to ${rangeEnd} of ${total} categories`
          }
          page={page}
          totalPages={totalPages}
          onPageChange={setPage}
        />
      </Card>
    </div>
  );
}
