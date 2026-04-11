// Job seeker page for tracking submitted applications and their statuses.
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Briefcase, MapPin, Clock, ChevronRight, Sparkles } from 'lucide-react';
import { applicationsApi } from '../../lib/api';
import Badge from '../../shared/ui/Badge';
import { SkeletonCard } from '../../shared/ui/Skeleton';
import EmptyState from '../../shared/ui/EmptyState';
import Button from '../../shared/ui/Button';

function formatDate(str) {
  if (!str) return '';
  return new Date(str).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function MyApplicationsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['my-applications'],
    queryFn: () => applicationsApi.myApplications().then(r => r.data),
  });

  const apps = data?.data || [];

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto grid gap-4">
        {Array.from({ length: 5 }).map((_, i) => <SkeletonCard key={i} />)}
      </div>
    );
  }

  if (apps.length === 0) {
    return (
      <div className="max-w-3xl mx-auto animate-fade-in">
        <EmptyState
          icon={Briefcase}
          title="No applications yet"
          description="Start applying to jobs to track your progress here"
          action={<Link to="/jobs"><Button>Browse Jobs</Button></Link>}
        />
      </div>
    );
  }

  const counts = {
    total: apps.length,
    pending: apps.filter(a => a.status === 'pending').length,
    accepted: apps.filter(a => a.status === 'accepted').length,
    rejected: apps.filter(a => a.status === 'rejected').length,
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-[#e2e8f0]">My Applications</h1>
        <p className="text-sm text-[#94a3b8] mt-1">{counts.total} total · {counts.pending} pending · {counts.accepted} accepted · {counts.rejected} rejected</p>
      </div>

      <div className="space-y-4">
        {apps.map((app, idx) => (
          <div
            key={app.applicationId || app._id || `app-${idx}`}
            className="bg-[#131929] border border-[#1e2a3d] rounded-xl p-5 hover:border-[#243047] transition-all"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-indigo-500/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Briefcase size={17} className="text-indigo-400" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-[#e2e8f0]">
                    {app.jobTitle || app.job?.title || 'Job Position'}
                  </h3>
                  <p className="text-sm text-[#94a3b8]">{app.companyName || app.job?.companyName}</p>
                  <div className="flex flex-wrap gap-3 mt-2 text-xs text-[#64748b]">
                    {(app.location?.city || app.job?.location?.city) && (
                      <span className="flex items-center gap-1">
                        <MapPin size={11} />
                        {app.location?.city || app.job?.location?.city}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Clock size={11} />
                      Applied {formatDate(app.appliedAt || app.createdAt)}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                <Badge variant={app.status}>{app.status}</Badge>
                {(app.jobId || app.job?._id) ? (
                  <Link
                    to={`/jobs/${app.jobId || app.job?._id}`}
                    className="text-xs text-indigo-400 hover:underline flex items-center gap-0.5"
                  >
                    View job <ChevronRight size={12} />
                  </Link>
                ) : (
                  <span className="text-xs text-[#64748b]">Job unavailable</span>
                )}
              </div>
            </div>

            {app.message && (
              <div className="mt-4 pt-4 border-t border-[#1e2a3d]">
                <p className="text-xs font-semibold text-[#64748b] uppercase mb-1">Your message</p>
                <p className="text-sm text-[#94a3b8]">{app.message}</p>
              </div>
            )}

            {app.status === 'accepted' && (
              <div className="mt-3 flex items-center gap-2 p-3 bg-emerald-500/10 rounded-lg">
                <Sparkles size={15} className="text-emerald-400 flex-shrink-0" />
                <span className="text-emerald-400 text-sm font-medium">Congratulations! You've been accepted.</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
