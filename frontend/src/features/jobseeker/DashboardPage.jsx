// Job seeker dashboard summarizing profile progress, resume status, and quick actions.
import { createElement } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Briefcase, Star, FileText, CheckCircle, Clock, XCircle, TrendingUp, ArrowRight } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { applicationsApi, jobsApi } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { SkeletonStats } from '../../shared/ui/Skeleton';
import Badge from '../../shared/ui/Badge';
import Button from '../../shared/ui/Button';

function StatCard({ icon: Icon, label, value, color, to }) {
  const content = (
    <div className={`bg-white border border-slate-200 rounded-xl p-5 flex items-center gap-4 hover:border-slate-300 transition-all ${to ? 'cursor-pointer hover:-translate-y-0.5' : ''}`}>
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
        {createElement(Icon, { size: 20 })}
      </div>
      <div>
        <div className="text-2xl font-bold text-slate-900">{value ?? '–'}</div>
        <div className="text-xs text-slate-600">{label}</div>
      </div>
    </div>
  );
  return to ? <Link to={to}>{content}</Link> : content;
}

const STATUS_COLORS = { pending: '#f59e0b', accepted: '#10b981', rejected: '#f43f5e' };

export default function JobSeekerDashboard() {
  const { user } = useAuth();

  const { data: appsData, isLoading: appsLoading } = useQuery({
    queryKey: ['my-applications'],
    queryFn: () => applicationsApi.myApplications({ limit: 100 }).then(r => r.data),
  });

  const { data: recommendedData } = useQuery({
    queryKey: ['recommended-jobs'],
    queryFn: () => jobsApi.recommended({ limit: 5 }).then(r => r.data),
  });

  const apps = appsData?.data || [];
  const recommended = recommendedData?.data || [];

  const stats = {
    total: apps.length,
    pending: apps.filter(a => a.status === 'pending').length,
    accepted: apps.filter(a => a.status === 'accepted').length,
    rejected: apps.filter(a => a.status === 'rejected').length,
  };

  const chartData = [
    { name: 'Pending', count: stats.pending, color: '#f59e0b' },
    { name: 'Accepted', count: stats.accepted, color: '#10b981' },
    { name: 'Rejected', count: stats.rejected, color: '#f43f5e' },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fade-in">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Welcome back, {user?.name?.split(' ')[0]}!</h1>
        <p className="text-sm text-slate-600 mt-1">Here's what's happening with your job search</p>
      </div>

      {/* Stat cards */}
      {appsLoading ? <SkeletonStats count={4} /> : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={Briefcase} label="Total Applications" value={stats.total} color="bg-indigo-500/10 text-indigo-700" to="/my-applications" />
          <StatCard icon={Clock} label="Pending" value={stats.pending} color="bg-amber-500/15 text-amber-800" />
          <StatCard icon={CheckCircle} label="Accepted" value={stats.accepted} color="bg-emerald-500/10 text-emerald-700" />
          <StatCard icon={XCircle} label="Rejected" value={stats.rejected} color="bg-rose-500/10 text-rose-700" />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart */}
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <h2 className="text-base font-semibold text-slate-900 mb-4">Application Status</h2>
          {apps.length === 0 ? (
            <div className="flex items-center justify-center h-36 text-slate-500 text-sm">No applications yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={chartData} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
                <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 8, color: '#0f172a' }}
                  cursor={{ fill: 'rgba(99,102,241,0.05)' }}
                />
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                  {chartData.map((entry, i) => <Cell key={i} fill={entry.color} fillOpacity={0.85} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Recent applications */}
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-slate-900">Recent Applications</h2>
            <Link to="/my-applications" className="text-xs text-indigo-400 hover:underline flex items-center gap-1">
              View all <ArrowRight size={12} />
            </Link>
          </div>
          {apps.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <p className="text-sm text-slate-500 mb-3">No applications yet</p>
              <Link to="/jobs"><Button size="sm">Browse Jobs</Button></Link>
            </div>
          ) : (
            <div className="space-y-3">
              {apps.slice(0, 5).map((app, idx) => (
                <div
                  key={app.applicationId || app._id || app.id || `app-${idx}`}
                  className="flex items-start justify-between gap-3 py-2 border-b border-slate-200 last:border-0"
                >
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-slate-900 truncate">
                      {app.jobTitle || app.job?.title || 'Job'}
                    </div>
                    <div className="text-xs text-slate-500">{app.companyName || app.job?.companyName}</div>
                  </div>
                  <Badge variant={app.status}>{app.status}</Badge>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recommended jobs */}
      {recommended.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2">
              <Star size={16} className="text-amber-400" /> Recommended for You
            </h2>
            <Link to="/recommended" className="text-xs text-indigo-400 hover:underline flex items-center gap-1">
              See all <ArrowRight size={12} />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {recommended.slice(0, 4).map(job => (
              <Link
                key={job.jobId || job._id}
                to={`/jobs/${job.jobId || job._id}`}
                className="flex items-start gap-3 p-3 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <div className="w-8 h-8 bg-indigo-500/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Briefcase size={14} className="text-indigo-400" />
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-medium text-slate-900 truncate">{job.title}</div>
                  <div className="text-xs text-slate-500">{job.companyName}</div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Quick actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { to: '/jobs', icon: Briefcase, label: 'Browse Jobs', desc: 'Find new opportunities', color: 'text-indigo-400 bg-indigo-500/10' },
          { to: '/resume', icon: FileText, label: 'Manage Resume', desc: 'Upload or edit your resume', color: 'text-emerald-400 bg-emerald-500/10' },
          { to: '/profile', icon: Star, label: 'Update Profile', desc: 'Add skills & experience', color: 'text-amber-400 bg-amber-500/10' },
        ].map(({ to, icon: Icon, label, desc, color }) => (
          <Link
            key={to}
            to={to}
            className="flex items-center gap-4 p-4 bg-white border border-slate-200 rounded-xl hover:border-slate-300 hover:-translate-y-0.5 transition-all"
          >
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${color}`}>
              {createElement(Icon, { size: 18 })}
            </div>
            <div>
              <div className="text-sm font-semibold text-slate-900">{label}</div>
              <div className="text-xs text-slate-500">{desc}</div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
