// Admin page for managing platform users, roles, and account status.
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, Users, Trash2, X, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import { adminApi } from '../../lib/api';
import Badge from '../../shared/ui/Badge';
import Button from '../../shared/ui/Button';
import { SkeletonList } from '../../shared/ui/Skeleton';
import EmptyState from '../../shared/ui/EmptyState';
import Pagination from '../../shared/ui/Pagination';
import Modal from '../../shared/ui/Modal';

export default function UsersPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('');
  const [page, setPage] = useState(1);
  const [deleteId, setDeleteId] = useState(null);
  const [promoteId, setPromoteId] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-users', search, role, page],
    queryFn: () => adminApi.getUsers({ search, role, page, limit: 15 }).then(r => r.data),
    staleTime: 10000,
  });

  const promoteMutation = useMutation({
    mutationFn: (id) => adminApi.promoteUser(id),
    onSuccess: () => {
      toast.success('User promoted to admin');
      setPromoteId(null);
      qc.invalidateQueries({ queryKey: ['admin-users'] });
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to promote user'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => adminApi.deleteUser(id),
    onSuccess: () => {
      toast.success('User deleted');
      setDeleteId(null);
      qc.invalidateQueries({ queryKey: ['admin-users'] });
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to delete user'),
  });

  const users = data?.data?.users || data?.users || [];
  const pagination = data?.data?.pagination || data?.pagination;

  const ROLE_COLORS = {
    job_seeker: 'accent',
    recruiter: 'success',
    admin: 'warning',
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-[#e2e8f0]">User Management</h1>
        <p className="text-sm text-[#94a3b8] mt-1">View and manage all platform users</p>
        <p className="text-xs text-[#94a3b8] mt-2">Only existing email-verified users can be promoted to admin.</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#64748b]" />
          <input
            type="text"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search by name or email…"
            className="w-full bg-[#131929] border border-[#1e2a3d] rounded-xl pl-9 pr-4 py-2.5 text-sm text-[#e2e8f0] placeholder-[#64748b] outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
          />
        </div>
        <select
          value={role}
          onChange={e => { setRole(e.target.value); setPage(1); }}
          className="bg-[#131929] border border-[#1e2a3d] rounded-xl px-3 py-2.5 text-sm text-[#e2e8f0] outline-none focus:border-indigo-500 cursor-pointer"
          style={{ appearance: 'none', backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%2364748b' d='M6 8L1 3h10z'/%3E%3C/svg%3E\")", backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center', paddingRight: '2rem' }}
        >
          <option value="">All Roles</option>
          <option value="job_seeker">Job Seekers</option>
          <option value="recruiter">Recruiters</option>
          <option value="admin">Admins</option>
        </select>
        {(search || role) && (
          <button onClick={() => { setSearch(''); setRole(''); setPage(1); }} className="flex items-center gap-1.5 text-sm text-[#64748b] hover:text-rose-400 transition-colors px-2">
            <X size={14} /> Clear
          </button>
        )}
      </div>

      {/* Table */}
      {isLoading ? (
        <SkeletonList count={8} />
      ) : users.length === 0 ? (
        <EmptyState icon={Users} title="No users found" description="Try adjusting your search or filters" />
      ) : (
        <div className="bg-[#131929] border border-[#1e2a3d] rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-[#0f1525] border-b border-[#1e2a3d]">
                <th className="text-left px-5 py-3 text-xs font-semibold text-[#64748b] uppercase tracking-wider">User</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-[#64748b] uppercase tracking-wider hidden md:table-cell">Email</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-[#64748b] uppercase tracking-wider">Role</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-[#64748b] uppercase tracking-wider hidden lg:table-cell">Status</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user._id} className="border-b border-[#1e2a3d] last:border-0 hover:bg-[#1a2236] transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-indigo-500/10 rounded-full flex items-center justify-center text-xs font-bold text-indigo-400 flex-shrink-0">
                        {user.name?.[0]?.toUpperCase() || '?'}
                      </div>
                      <span className="text-sm font-medium text-[#e2e8f0]">{user.name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4 hidden md:table-cell">
                    <span className="text-sm text-[#94a3b8]">{user.email}</span>
                  </td>
                  <td className="px-5 py-4">
                    <Badge variant={ROLE_COLORS[user.role] || 'default'}>
                      {user.role?.replace('_', ' ')}
                    </Badge>
                  </td>
                  <td className="px-5 py-4 hidden lg:table-cell">
                    <div className="flex flex-col gap-2">
                      <Badge variant={user.emailVerified ? 'success' : 'warning'}>
                        {user.emailVerified ? 'Email Verified' : 'Email Unverified'}
                      </Badge>
                      {user.role !== 'admin' && !user.emailVerified && (
                        <span className="text-xs text-amber-400">Verify email before promotion</span>
                      )}
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2 justify-end">
                      {user.role !== 'admin' && (
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={!user.emailVerified}
                          onClick={() => setPromoteId(user._id)}
                        >
                          <ShieldCheck size={14} />
                          Make Admin
                        </Button>
                      )}
                      <Button
                        variant="danger"
                        size="icon-sm"
                        onClick={() => setDeleteId(user._id)}
                      >
                        <Trash2 size={13} />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Pagination page={page} totalPages={pagination?.totalPages || 1} onPageChange={setPage} />

      <Modal
        isOpen={!!promoteId}
        onClose={() => setPromoteId(null)}
        title="Promote User to Admin"
        footer={
          <>
            <Button variant="secondary" onClick={() => setPromoteId(null)}>Cancel</Button>
            <Button variant="outline" loading={promoteMutation.isPending} onClick={() => promoteMutation.mutate(promoteId)}>
              Promote to Admin
            </Button>
          </>
        }
      >
        <p className="text-sm text-[#94a3b8]">This will grant the selected existing verified user full admin access to the platform.</p>
      </Modal>

      {/* Delete modal */}
      <Modal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        title="Delete User"
        footer={
          <>
            <Button variant="secondary" onClick={() => setDeleteId(null)}>Cancel</Button>
            <Button variant="danger" loading={deleteMutation.isPending} onClick={() => deleteMutation.mutate(deleteId)}>
              Delete User
            </Button>
          </>
        }
      >
        <p className="text-sm text-[#94a3b8]">Are you sure you want to permanently delete this user account? All their data will be removed.</p>
      </Modal>
    </div>
  );
}
