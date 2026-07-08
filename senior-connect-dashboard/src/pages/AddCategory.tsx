import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { useCreateCategoryMutation, useGetCategoriesQuery } from '../app/api/apiSlice';
import Card from '../components/Card';
import PageHeader from '../components/PageHeader';

/** Figma "Add Category" screen — Category Name input, Cancel / Save and continue. Wired to POST /categories/admin/categories. */
export default function AddCategory() {
  const navigate = useNavigate();
  const [categoryName, setCategoryName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const { data } = useGetCategoriesQuery({ page: 1, limit: 1 });
  const [createCategory, { isLoading }] = useCreateCategoryMutation();

  const stats = data?.data.stats;

  const handleSave = async () => {
    if (!categoryName.trim()) {
      setError('Category Name is required.');
      return;
    }
    setError(null);
    try {
      await createCategory({ categoryName: categoryName.trim() }).unwrap();
      navigate('/categories');
    } catch (err) {
      const message =
        (err as { data?: { message?: string } })?.data?.message ?? 'Failed to create category';
      setError(message);
    }
  };

  return (
    <div>
      <PageHeader
        title="Categories"
        action={
          <button
            type="button"
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
          <h2 className="font-heading text-2xl font-bold text-ink">Add Category</h2>
        </div>
        <div className="flex gap-3">
          <div className="flex items-center gap-2 rounded-xl bg-card px-4 py-2.5 ring-1 ring-line">
            <span className="text-sm text-muted">Total Categories</span>
            <span className="font-heading text-lg font-bold text-primary">{stats?.totalCategories ?? '—'}</span>
          </div>
          <div className="flex items-center gap-2 rounded-xl bg-card px-4 py-2.5 ring-1 ring-line">
            <span className="text-sm text-muted">Active Now</span>
            <span className="font-heading text-lg font-bold text-primary">{stats?.activeNow ?? '—'}</span>
          </div>
        </div>
      </div>

      <Card className="p-6">
        <label className="mb-1.5 block text-sm font-semibold text-ink" htmlFor="categoryName">
          Category Name
        </label>
        <input
          id="categoryName"
          type="text"
          value={categoryName}
          onChange={(e) => setCategoryName(e.target.value)}
          className="w-full rounded-lg border border-line px-3.5 py-2.5 text-sm text-ink outline-none focus:border-primary"
        />
        {error && <p className="mt-2 text-sm font-medium text-danger">{error}</p>}
        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={() => navigate('/categories')}
            className="rounded-lg bg-page px-6 py-2.5 text-sm font-semibold text-primary"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isLoading}
            className="rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-white hover:bg-primary-dark disabled:opacity-60"
          >
            {isLoading ? 'Saving…' : 'Save and continue'}
          </button>
        </div>
      </Card>
    </div>
  );
}
