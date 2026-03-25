import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, FileText, CheckCircle, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { adminApi } from '../../lib/api';
import Badge from '../../shared/ui/Badge';
import Button from '../../shared/ui/Button';
import { SkeletonList } from '../../shared/ui/Skeleton';
import EmptyState from '../../shared/ui/EmptyState';
import Pagination from '../../shared/ui/Pagination';

export default function ResumesPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-resumes', search, page],
    queryFn: () => adminApi.getResumes({ search, page, limit: 15 }).then(r => r.data),
  });

  const verifyMutation = useMutation({
    mutationFn: ({ id, isVerified }) => adminApi.verifyResume(id, isVerified),
    onSuccess: (_, { isVerified }) => {
      toast.success(isVerified ? 'Resume verified!' : 'Resume unverified');
      qc.invalidateQueries({ queryKey: ['admin-resumes'] });
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed'),
  });

  // Handle both `data` array or nested `data.data` from API
  const resumes = data?.data?.data || data?.data || [];
  const pagination = data?.pagination || data?.data?.pagination;

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-[#e2e8f0]">Resume Moderation</h1>
        <p className="text-sm text-[#94a3b8] mt-1">Review and verify job seeker resumes</p>
      </div>

      {/* Search */}
      <div className="flex gap-3">
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
        {search && (
          <button onClick={() => { setSearch(''); setPage(1); }} className="flex items-center gap-1.5 text-sm text-[#64748b] hover:text-rose-400 transition-colors px-2">
            <X size={14} /> Clear
          </button>
        )}
      </div>

      {isLoading ? (
        <SkeletonList count={8} />
      ) : resumes.length === 0 ? (
        <EmptyState icon={FileText} title="No resumes found" description={search ? 'No resumes match your search' : 'No resumes have been uploaded yet'} />
      ) : (
        <div className="bg-[#131929] border border-[#1e2a3d] rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-[#0f1525] border-b border-[#1e2a3d]">
                <th className="text-left px-5 py-3 text-xs font-semibold text-[#64748b] uppercase tracking-wider">Candidate</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-[#64748b] uppercase tracking-wider hidden md:table-cell">Email</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-[#64748b] uppercase tracking-wider hidden md:table-cell">Experience</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-[#64748b] uppercase tracking-wider">Status</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody>
              {resumes.map(resume => (
                <tr key={resume._id} className="border-b border-[#1e2a3d] last:border-0 hover:bg-[#1a2236] transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-emerald-500/10 rounded-full flex items-center justify-center text-xs font-bold text-emerald-400 flex-shrink-0">
                        {resume.name?.[0]?.toUpperCase() || '?'}
                      </div>
                      <span className="text-sm font-medium text-[#e2e8f0]">{resume.name || 'Unknown'}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4 hidden md:table-cell">
                    <span className="text-sm text-[#94a3b8]">{resume.email || '—'}</span>
                  </td>
                  <td className="px-5 py-4 hidden md:table-cell">
                    <span className="text-sm text-[#94a3b8]">{resume.experienceYears != null ? `${resume.experienceYears} yrs` : '—'}</span>
                  </td>
                  <td className="px-5 py-4">
                    <Badge variant={resume.isVerified ? 'success' : 'warning'}>
                      {resume.isVerified ? 'Verified' : 'Unverified'}
                    </Badge>
                  </td>
                  <td className="px-5 py-4">
                    <Button
                      variant={resume.isVerified ? 'secondary' : 'success'}
                      size="sm"
                      loading={verifyMutation.isPending && verifyMutation.variables?.id === resume._id}
                      onClick={() => verifyMutation.mutate({ id: resume._id, isVerified: !resume.isVerified })}
                    >
                      <CheckCircle size={13} />
                      {resume.isVerified ? 'Unverify' : 'Verify'}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Pagination page={page} totalPages={pagination?.totalPages || 1} onPageChange={setPage} />
    </div>
  );
}
