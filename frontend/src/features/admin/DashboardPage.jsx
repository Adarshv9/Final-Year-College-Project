// Admin dashboard page showing high-level platform metrics and recent activity.
import { useQuery } from '@tanstack/react-query';
import { Shield, Users, Briefcase, FileText, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { adminApi } from '../../lib/api';
import { SkeletonStats } from '../../shared/ui/Skeleton';
import Button from '../../shared/ui/Button';

export default function AdminDashboard() {
  const { data: usersData, isLoading: usersLoading } = useQuery({
    queryKey: ['admin-users'],
    queryFn: () => adminApi.getUsers({ limit: 100 }).then(r => r.data),
  });

  const { data: recData } = useQuery({
    queryKey: ['pending-recruiters'],
    queryFn: () => adminApi.pendingRecruiters({ limit: 100 }).then(r => r.data),
  });

  const { data: resumesData } = useQuery({
    queryKey: ['admin-resumes'],
    queryFn: () => adminApi.getResumes({ limit: 100 }).then(r => r.data),
  });

  const users = usersData?.data?.users || usersData?.users || [];
  const pendingRecruiters = recData?.data?.recruiters || recData?.recruiters || [];
  const resumes = resumesData?.data?.resumes || resumesData?.resumes || [];

  const seekers = users.filter(u => u.role === 'job_seeker').length;
  const recruiters = users.filter(u => u.role === 'recruiter').length;

  const chartData = [
    { name: 'Job Seekers', count: seekers, fill: '#6366f1' },
    { name: 'Recruiters', count: recruiters, fill: '#10b981' },
    { name: 'Pending', count: pendingRecruiters.length, fill: '#f59e0b' },
    { name: 'Resumes', count: resumes.length, fill: '#94a3b8' },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <Shield size={22} className="text-amber-400" /> Admin Dashboard
        </h1>
        <p className="text-sm text-slate-600 mt-1">Platform overview and moderation tools</p>
      </div>

      {usersLoading ? <SkeletonStats count={4} /> : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { icon: Users, label: 'Total Users', value: users.length, color: 'bg-indigo-500/15 text-indigo-400', to: '/admin/users' },
            { icon: Users, label: 'Job Seekers', value: seekers, color: 'bg-blue-500/15 text-blue-400' },
            { icon: Briefcase, label: 'Pending Recruiters', value: pendingRecruiters.length, color: 'bg-amber-500/15 text-amber-400', to: '/admin/recruiters' },
            { icon: FileText, label: 'Resumes', value: resumes.length, color: 'bg-emerald-500/15 text-emerald-400', to: '/admin/resumes' },
          ].map(({ icon: Icon, label, value, color, to }) => {
            const c = (
              <div className={`bg-white border border-slate-200 rounded-xl p-5 flex items-center gap-4 hover:border-slate-300 transition-all ${to ? 'cursor-pointer hover:-translate-y-0.5' : ''}`}>
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
                  <Icon size={20} />
                </div>
                <div>
                  <div className="text-2xl font-bold text-slate-900">{value ?? '–'}</div>
                  <div className="text-xs text-slate-600">{label}</div>
                </div>
              </div>
            );
            return to ? <Link key={label} to={to}>{c}</Link> : <div key={label}>{c}</div>;
          })}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart */}
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <h2 className="text-base font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <TrendingUp size={16} className="text-indigo-400" /> Platform Overview
          </h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData} margin={{ left: -20 }}>
              <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip contentStyle={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 8, color: '#0f172a' }} cursor={{ fill: 'rgba(99,102,241,0.05)' }} />
              <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                {chartData.map((entry, i) => (
                  <rect key={i} fill={entry.fill} fillOpacity={0.85} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Quick actions */}
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <h2 className="text-base font-semibold text-slate-900 mb-4">Moderation Tools</h2>
          <div className="space-y-3">
            <Link to="/admin/recruiters" className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-amber-500/15 rounded-lg flex items-center justify-center"><Shield size={15} className="text-amber-400" /></div>
                <div>
                  <div className="text-sm font-medium text-slate-900">Pending Recruiters</div>
                  <div className="text-xs text-amber-400">{pendingRecruiters.length} awaiting review</div>
                </div>
              </div>
              <Button size="sm" variant="secondary">Review</Button>
            </Link>
            <Link to="/admin/users" className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-indigo-500/15 rounded-lg flex items-center justify-center"><Users size={15} className="text-indigo-400" /></div>
                <div>
                  <div className="text-sm font-medium text-slate-900">User Management</div>
                  <div className="text-xs text-slate-500">{users.length} total users</div>
                </div>
              </div>
              <Button size="sm" variant="secondary">Manage</Button>
            </Link>
            <Link to="/admin/resumes" className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-emerald-500/15 rounded-lg flex items-center justify-center"><FileText size={15} className="text-emerald-400" /></div>
                <div>
                  <div className="text-sm font-medium text-slate-900">Resume Moderation</div>
                  <div className="text-xs text-slate-500">{resumes.filter(r => !r.isVerified).length} unverified</div>
                </div>
              </div>
              <Button size="sm" variant="secondary">Verify</Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
