// Public job listing page with search, filters, and pagination.
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { Search, MapPin, Briefcase, Filter, X, Clock, Building2, ChevronRight, DollarSign } from 'lucide-react';
import { jobsApi } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import Badge from '../../shared/ui/Badge';
import Pagination from '../../shared/ui/Pagination';
import { SkeletonCard } from '../../shared/ui/Skeleton';
import EmptyState from '../../shared/ui/EmptyState';
import Button from '../../shared/ui/Button';

const JOB_TYPES = ['full-time', 'part-time', 'internship', 'contract'];
const LOCATION_TYPES = ['remote', 'onsite', 'hybrid'];

function JobCard({ job }) {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleApplyClick = (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    navigate(`/jobs/${job._id}`);
  };

  return (
    <Link
      to={`/jobs/${job._id}`}
      className="block bg-[#131929] border border-[#1e2a3d] rounded-xl p-5 hover:border-[#243047] hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 group"
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="w-10 h-10 bg-indigo-500/10 rounded-lg flex items-center justify-center flex-shrink-0">
          <Building2 size={18} className="text-indigo-400" />
        </div>
        <div className="flex gap-2 flex-wrap">
          <Badge variant="accent">{job.jobType}</Badge>
          <Badge variant={job.location?.type}>{job.location?.type}</Badge>
        </div>
      </div>

      <h3 className="text-base font-semibold text-[#e2e8f0] mb-1 group-hover:text-indigo-400 transition-colors">{job.title}</h3>
      <p className="text-sm text-[#94a3b8] mb-2">{job.companyName}</p>

      {(job.location?.city || job.location?.country) && (
        <div className="flex items-center gap-1 text-xs text-[#64748b] mb-3">
          <MapPin size={12} />
          <span>{[job.location?.city, job.location?.country].filter(Boolean).join(', ')}</span>
        </div>
      )}

      {job.requiredSkills?.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-4">
          {job.requiredSkills.slice(0, 4).map(skill => (
            <span key={skill} className="px-2 py-0.5 bg-indigo-500/10 text-indigo-400 rounded-full text-xs">{skill}</span>
          ))}
          {job.requiredSkills.length > 4 && (
            <span className="px-2 py-0.5 bg-[#1a2236] text-[#64748b] rounded-full text-xs">+{job.requiredSkills.length - 4}</span>
          )}
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 text-xs text-[#64748b]">
          {job.minExperience != null && (
            <span className="flex items-center gap-1"><Briefcase size={12} />{job.minExperience}+ yrs</span>
          )}
          {job.salary && <span className="flex items-center gap-1"><DollarSign size={12} />{job.salary}</span>}
        </div>
        <button
          onClick={handleApplyClick}
          className="flex items-center gap-1 text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors"
        >
          {isAuthenticated ? 'View & Apply' : 'Login to Apply'}
          <ChevronRight size={13} />
        </button>
      </div>
    </Link>
  );
}

export default function JobsPage() {
  // Filters double as the React Query key so changing any control naturally
  // triggers a refetch and resets pagination together.
  const [filters, setFilters] = useState({ search: '', jobType: '', locationType: '', page: 1 });
  const [showFilters, setShowFilters] = useState(false);
  const { isAuthenticated } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ['jobs', filters],
    queryFn: () => jobsApi.list({ ...filters, limit: 12 }).then(r => r.data),
    staleTime: 30000,
  });

  const jobs = data?.data || [];
  const pagination = data?.pagination;

  const setFilter = (key, value) => setFilters(f => ({ ...f, [key]: value, page: 1 }));
  const clearFilters = () => setFilters({ search: '', jobType: '', locationType: '', page: 1 });
  const hasFilters = filters.search || filters.jobType || filters.locationType;

  return (
    <div className="min-h-screen bg-[#0b0f1a]">
      {/* Header banner */}
      <div className="bg-gradient-to-r from-indigo-600/20 to-emerald-600/10 border-b border-[#1e2a3d]">
        <div className="max-w-7xl mx-auto px-4 py-10">
          <div className="flex items-center gap-3 mb-2">
            <Briefcase size={24} className="text-indigo-400" />
            <span className="text-sm font-semibold text-indigo-400 uppercase tracking-wider">TalentBridge</span>
          </div>
          <h1 className="text-3xl font-bold text-[#e2e8f0] mb-2">Find Your Next Role</h1>
          <p className="text-[#94a3b8] mb-6">Discover opportunities that match your skills and ambitions</p>

          {/* Search bar */}
          <div className="flex gap-3">
            <div className="relative flex-1 max-w-2xl">
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#64748b]" />
              <input
                type="text"
                value={filters.search}
                onChange={e => setFilter('search', e.target.value)}
                placeholder="Search jobs, skills, companies…"
                className="w-full bg-[#131929] border border-[#1e2a3d] rounded-xl pl-11 pr-4 py-3 text-sm text-[#e2e8f0] placeholder-[#64748b] outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
              />
            </div>
            <button
              onClick={() => setShowFilters(f => !f)}
              className={`flex items-center gap-2 px-4 py-3 rounded-xl border text-sm font-medium transition-all ${showFilters ? 'bg-indigo-500 border-indigo-500 text-white' : 'bg-[#131929] border-[#1e2a3d] text-[#94a3b8] hover:border-[#243047]'}`}
            >
              <Filter size={16} />
              Filters
              {hasFilters && <span className="w-2 h-2 bg-amber-400 rounded-full" />}
            </button>
            {!isAuthenticated && (
              <Link to="/login">
                <Button variant="primary">Sign In</Button>
              </Link>
            )}
          </div>

          {/* Filter row */}
          {showFilters && (
            <div className="flex flex-wrap gap-3 mt-4">
              <select
                value={filters.jobType}
                onChange={e => setFilter('jobType', e.target.value)}
                className="bg-[#131929] border border-[#1e2a3d] rounded-lg px-3 py-2 text-sm text-[#e2e8f0] outline-none focus:border-indigo-500 cursor-pointer"
                style={{ appearance: 'none', backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%2364748b' d='M6 8L1 3h10z'/%3E%3C/svg%3E\")", backgroundRepeat: 'no-repeat', backgroundPosition: 'right 8px center', paddingRight: '1.75rem' }}
              >
                <option value="">All Job Types</option>
                {JOB_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
              <select
                value={filters.locationType}
                onChange={e => setFilter('locationType', e.target.value)}
                className="bg-[#131929] border border-[#1e2a3d] rounded-lg px-3 py-2 text-sm text-[#e2e8f0] outline-none focus:border-indigo-500 cursor-pointer"
                style={{ appearance: 'none', backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%2364748b' d='M6 8L1 3h10z'/%3E%3C/svg%3E\")", backgroundRepeat: 'no-repeat', backgroundPosition: 'right 8px center', paddingRight: '1.75rem' }}
              >
                <option value="">All Locations</option>
                {LOCATION_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
              {hasFilters && (
                <button onClick={clearFilters} className="flex items-center gap-1.5 text-sm text-[#64748b] hover:text-rose-400 transition-colors">
                  <X size={14} /> Clear
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Jobs grid */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: 9 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : jobs.length === 0 ? (
          <div className="py-20">
            <EmptyState
              icon={Briefcase}
              title="No jobs found"
              description={hasFilters ? 'Try adjusting your search or filters' : 'No jobs have been posted yet. Check back later!'}
              action={hasFilters ? <Button variant="secondary" onClick={clearFilters}>Clear filters</Button> : null}
            />
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-5">
              <p className="text-sm text-[#64748b]">
                {pagination?.total ? `${pagination.total.toLocaleString()} jobs found` : `${jobs.length} jobs`}
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {jobs.map(job => <JobCard key={job._id} job={job} />)}
            </div>
            {pagination && (
              <Pagination
                page={filters.page}
                totalPages={pagination.totalPages}
                onPageChange={p => setFilters(f => ({ ...f, page: p }))}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}
