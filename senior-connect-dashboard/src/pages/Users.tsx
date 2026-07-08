import { useEffect, useRef, useState } from 'react';
import { Filter, Search, ShieldCheck, ShieldOff, Eye } from 'lucide-react';
import { useGetUsersQuery, useUpdateUserStatusMutation, type UserStatus } from '../app/api/apiSlice';
import Avatar from '../components/Avatar';
import Card from '../components/Card';
import Pagination from '../components/Pagination';
import PageHeader from '../components/PageHeader';
import StatusBadge from '../components/StatusBadge';
import UserQuickViewModal, { type UserQuickViewData } from '../components/UserQuickViewModal';

const PAGE_SIZE = 10;
const STATUS_OPTIONS: { label: string; value: UserStatus | '' }[] = [
  { label: 'All statuses', value: '' },
  { label: 'Active', value: 'Active' },
  { label: 'Inactive', value: 'Inactive' },
  { label: 'Suspended', value: 'Suspended' },
  { label: 'Blocked', value: 'Blocked' },
];

/**
 * Figma "Users" screen:
 * Search by name, email or country... | Filter |
 * USER PROFILE | EMAIL ADDRESS | COUNTRY | ACTIVITIES | STATUS | ACTIONS |
 * Wired to GET /users/admin/users.
 */
export default function Users() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<UserStatus | ''>('');
  const [filterOpen, setFilterOpen] = useState(false);
  const [quickViewUser, setQuickViewUser] = useState<UserQuickViewData | null>(null);
  const filterRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) setFilterOpen(false);
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  const { data, isLoading, isFetching } = useGetUsersQuery({
    page,
    limit: PAGE_SIZE,
    search: search || undefined,
    status: status || undefined,
  });
  const [updateUserStatus] = useUpdateUserStatusMutation();

  const users = data?.data ?? [];
  const meta = data?.meta;
  const totalPages = meta?.totalPages ?? 1;
  const total = meta?.total ?? 0;
  const rangeStart = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const rangeEnd = Math.min(page * PAGE_SIZE, total);

  const toggleBlock = (userId: string, currentStatus: UserStatus) => {
    const nextStatus: UserStatus = currentStatus === 'Blocked' ? 'Active' : 'Blocked';
    updateUserStatus({ userId, status: nextStatus });
  };

  return (
    <div>
      <PageHeader title="Users" showSearch showBell />

      <div className="mb-5 flex items-center gap-3">
        <label className="flex flex-1 items-center gap-2 rounded-full bg-white px-4 py-2.5 ring-1 ring-line">
          <Search size={16} className="text-muted" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search by name, email or country..."
            className="w-full bg-transparent text-sm text-ink outline-none placeholder:text-muted"
          />
        </label>
        <div ref={filterRef} className="relative">
          <button
            type="button"
            onClick={() => setFilterOpen((v) => !v)}
            className="flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-dark"
          >
            <Filter size={15} />
            Filter
          </button>
          {filterOpen && (
            <div className="absolute right-0 top-full z-40 mt-2 w-48 rounded-2xl border border-line bg-card p-2 shadow-xl">
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
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-line text-xs font-bold uppercase tracking-wide text-label">
                <th className="px-6 py-4 font-bold">User Profile</th>
                <th className="px-6 py-4 font-bold">Email Address</th>
                <th className="px-6 py-4 font-bold">Country</th>
                <th className="px-6 py-4 font-bold">Activities</th>
                <th className="px-6 py-4 font-bold">Status</th>
                <th className="px-6 py-4 font-bold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {!isLoading && users.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-sm text-muted">
                    No users found.
                  </td>
                </tr>
              )}
              {users.map((user) => {
                const name = `${user.firstName} ${user.lastName}`;
                return (
                  <tr key={user.id} className="border-b border-line last:border-0">
                    <td className="flex items-center gap-3 px-6 py-3.5">
                      <Avatar src={user.profilePhoto} name={name} size={40} />
                      <span className="font-semibold text-ink">{name}</span>
                    </td>
                    <td className="px-6 py-3.5 text-body">{user.email}</td>
                    <td className="px-6 py-3.5 text-body">{user.country ?? '—'}</td>
                    <td className="px-6 py-3.5 text-body">{user.activities}</td>
                    <td className="px-6 py-3.5">
                      <StatusBadge status={user.status} />
                    </td>
                    <td className="px-6 py-3.5">
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => toggleBlock(user.id, user.status)}
                          className={user.status === 'Blocked' ? 'text-success' : 'text-danger'}
                          title={user.status === 'Blocked' ? 'Unblock user' : 'Block user'}
                        >
                          {user.status === 'Blocked' ? <ShieldCheck size={17} /> : <ShieldOff size={17} />}
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setQuickViewUser({
                              id: user.id,
                              name,
                              email: user.email,
                              country: user.country,
                              activities: user.activities,
                              status: user.status,
                              profilePhoto: user.profilePhoto,
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
                );
              })}
            </tbody>
          </table>
        </div>
        <Pagination
          summary={
            isFetching
              ? 'Loading…'
              : `Showing ${rangeStart} to ${rangeEnd} of ${total} user${total === 1 ? '' : 's'}`
          }
          page={page}
          totalPages={totalPages}
          onPageChange={setPage}
        />
      </Card>

      <UserQuickViewModal user={quickViewUser} onClose={() => setQuickViewUser(null)} />
    </div>
  );
}
