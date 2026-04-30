// Job seeker page component for Recommended Jobs.

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Star, Briefcase, MapPin, ChevronRight } from 'lucide-react';
import { jobsApi } from '../../lib/api';
import Badge from '../../shared/ui/Badge';
import { SkeletonCard } from '../../shared/ui/Skeleton';
import EmptyState from '../../shared/ui/EmptyState';
import Button from '../../shared/ui/Button';
import Pagination from '../../shared/ui/Pagination';

// Render the recommended jobs page.
export default function RecommendedJobsPage() {
  const [page, setPage] = useState(1);

  const { data, isLoading, error } = useQuery({
    queryKey: ['recommended-jobs', page],
    queryFn: () => jobsApi.recommended({ page, limit: 12 }).then((r) => r.data)
  });

  const jobs = data?.data || [];
  const pagination = data?.pagination;

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mt-6">
          {Array.from({ length: 9 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      </div>);

  }

  if (error) {
    return (
      <div className="max-w-5xl mx-auto animate-fade-in">
        <EmptyState
          icon={Star}
          title="Recommendations unavailable"
          description="Complete your profile and add skills to get personalized job recommendations"
          action={<Link to="/profile"><Button>Update Profile</Button></Link>} />
        
      </div>);

  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <Star size={22} className="text-amber-400" /> Recommended Jobs
        </h1>
        <p className="text-sm text-slate-600 mt-1">Jobs matched to your skills and experience</p>
      </div>

      {jobs.length === 0 ?
      <EmptyState
        icon={Star}
        title="No recommendations yet"
        description="Add your skills and work experience to your profile to get tailored job recommendations"
        action={<Link to="/profile"><Button>Update Profile</Button></Link>} /> :


      <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {jobs.map((job) =>
          <Link
            key={job.jobId || job._id}
            to={`/jobs/${job.jobId || job._id}`}
            className="block bg-white border border-slate-200 rounded-xl p-5 hover:border-indigo-500/50 hover:shadow-lg hover:-translate-y-0.5 transition-all group">
            
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="w-10 h-10 bg-indigo-500/10 rounded-lg flex items-center justify-center">
                    <Briefcase size={17} className="text-indigo-400" />
                  </div>
                  <Badge variant="accent">{job.jobType}</Badge>
                </div>
                <h3 className="text-sm font-semibold text-slate-900 mb-1 group-hover:text-indigo-400 transition-colors">{job.title}</h3>
                <p className="text-xs text-slate-600 mb-2">{job.companyName}</p>
                {(job.location?.city || job.location?.country) &&
            <p className="text-xs text-slate-500 flex items-center gap-1 mb-3">
                    <MapPin size={11} />{[job.location?.city, job.location?.country].filter(Boolean).join(', ')}
                  </p>
            }
                {job.requiredSkills?.length > 0 &&
            <div className="flex flex-wrap gap-1.5 mb-3">
                    {job.requiredSkills.slice(0, 3).map((s) =>
              <span key={s} className="px-2 py-0.5 bg-indigo-500/10 text-indigo-400 rounded-full text-xs">{s}</span>
              )}
                  </div>
            }
                <div className="flex items-center justify-end">
                  <span className="text-xs text-indigo-400 flex items-center gap-0.5">Apply <ChevronRight size={12} /></span>
                </div>
              </Link>
          )}
          </div>
          <Pagination page={page} totalPages={pagination?.totalPages || 1} onPageChange={setPage} />
        </>
      }
    </div>);

}