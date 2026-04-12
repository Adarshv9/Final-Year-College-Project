// Admin page for reviewing and approving pending recruiter accounts.
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ShieldCheck, ShieldX, Search, User, Mail, Clock, Building2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { adminApi } from '../../lib/api';
import Badge from '../../shared/ui/Badge';
import Button from '../../shared/ui/Button';
import { SkeletonList } from '../../shared/ui/Skeleton';
import EmptyState from '../../shared/ui/EmptyState';
import Pagination from '../../shared/ui/Pagination';

export default function PendingRecruitersPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [actionMap, setActionMap] = useState({});

  const { data, isLoading } = useQuery({
    queryKey: ['pending-recruiters', search, page],
    queryFn: () => adminApi.pendingRecruiters({ search, page, limit: 10 }).then(r => r.data),
  });

  const verifyMutation = useMutation({
    mutationFn: (id) => adminApi.verifyRecruiter(id),
    onMutate: (id) => setActionMap(m => ({ ...m, [id]: 'verifying' })),
    onSuccess: (_, id) => {
      toast.success('Recruiter approved!');
      setActionMap(m => { const n = { ...m }; delete n[id]; return n; });
      qc.invalidateQueries({ queryKey: ['pending-recruiters'] });
    },
    onError: (err, id) => {
      toast.error(err.response?.data?.message || 'Failed');
      setActionMap(m => { const n = { ...m }; delete n[id]; return n; });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: (id) => adminApi.rejectRecruiter(id),
    onMutate: (id) => setActionMap(m => ({ ...m, [id]: 'rejecting' })),
    onSuccess: (_, id) => {
      toast.success('Recruiter rejected');
      setActionMap(m => { const n = { ...m }; delete n[id]; return n; });
      qc.invalidateQueries({ queryKey: ['pending-recruiters'] });
    },
    onError: (err, id) => {
      toast.error(err.response?.data?.message || 'Failed');
      setActionMap(m => { const n = { ...m }; delete n[id]; return n; });
    },
  });

  const recruiters = data?.data?.recruiters || [];
  const pagination = data?.data?.pagination;

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-[#e2e8f0]">Pending Recruiters</h1>
        <p className="text-sm text-[#94a3b8] mt-1">Review and approve recruiter account requests</p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#64748b]" />
        <input
          type="text"
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1); }}
          placeholder="Search by name or email…"
          className="w-full bg-[#131929] border border-[#1e2a3d] rounded-xl pl-9 pr-4 py-2.5 text-sm text-[#e2e8f0] placeholder-[#64748b] outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
        />
      </div>

      {isLoading ? (
        <SkeletonList count={5} />
      ) : recruiters.length === 0 ? (
        <EmptyState
          icon={ShieldCheck}
          title="No pending recruiters"
          description={search ? 'No recruiters match your search' : 'All recruiter requests have been reviewed!'}
        />
      ) : (
        <div className="space-y-4">
          {recruiters.map(recruiter => (
            <div key={recruiter._id} className="bg-[#131929] border border-[#1e2a3d] rounded-xl p-5 hover:border-[#243047] transition-all">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-amber-500/10 rounded-full flex items-center justify-center font-bold text-amber-400 text-sm flex-shrink-0">
                    {recruiter.name?.[0]?.toUpperCase() || '?'}
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-[#e2e8f0]">{recruiter.name}</h3>
                    <p className="text-xs text-indigo-400 flex items-center gap-1">
                      <Mail size={11} /> {recruiter.email}
                    </p>
                    {recruiter.createdAt && (
                      <p className="text-xs text-[#64748b] flex items-center gap-1 mt-0.5">
                        <Clock size={11} />
                        Registered {new Date(recruiter.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                    )}
                    {recruiter.profile?.companyName && (
                      <p className="text-xs text-[#94a3b8] mt-1 flex items-center gap-1">
                        <Building2 size={11} /> {recruiter.profile.companyName}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <Badge variant="pending">Pending</Badge>
                  <Button
                    variant="success"
                    size="sm"
                    loading={actionMap[recruiter._id] === 'verifying'}
                    disabled={!!actionMap[recruiter._id]}
                    onClick={() => verifyMutation.mutate(recruiter._id)}
                  >
                    <ShieldCheck size={13} /> Approve
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    loading={actionMap[recruiter._id] === 'rejecting'}
                    disabled={!!actionMap[recruiter._id]}
                    onClick={() => rejectMutation.mutate(recruiter._id)}
                  >
                    <ShieldX size={13} /> Reject
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Pagination page={page} totalPages={pagination?.totalPages || 1} onPageChange={setPage} />
    </div>
  );
}
