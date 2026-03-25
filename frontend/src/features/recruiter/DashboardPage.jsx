import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Briefcase, Users, Clock, CheckCircle, Plus, ArrowRight, AlertTriangle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { jobsApi, applicationsApi } from '../../lib/api';
import { recruiterApi } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { SkeletonStats } from '../../shared/ui/Skeleton';
import Badge from '../../shared/ui/Badge';
import Button from '../../shared/ui/Button';
import Alert from '../../shared/ui/Alert';

function StatCard({ icon: Icon, label, value, color, to }) {
  const c = (
    <div className={`bg-[#131929] border border-[#1e2a3d] rounded-xl p-5 flex items-center gap-4 hover:border-[#243047] transition-all ${to ? 'cursor-pointer hover:-translate-y-0.5' : ''}`}>
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
        <Icon size={20} />
      </div>
      <div>
        <div className="text-2xl font-bold text-[#e2e8f0]">{value ?? '–'}</div>
        <div className="text-xs text-[#94a3b8]">{label}</div>
      </div>
    </div>
  );
  return to ? <Link to={to}>{c}</Link> : c;
}

export default function RecruiterDashboard() {
  const { user } = useAuth();

  const { data: profileData } = useQuery({
    queryKey: ['recruiter-profile'],
    queryFn: () => recruiterApi.getProfile().then(r => r.data.data),
  });

  const { data: jobsData, isLoading: jobsLoading } = useQuery({
    queryKey: ['my-jobs'],
    queryFn: () => jobsApi.myJobs({ limit: 100 }).then(r => r.data),
  });

  const jobs = jobsData?.data || [];
  const totalJobs = jobs.length;

  // Build per-job application counts for chart
  const chartData = jobs.slice(0, 5).map(j => ({
    name: j.title?.slice(0, 15) + (j.title?.length > 15 ? '…' : ''),
    applications: j.applicationsCount || 0,
  }));

  const profileMissing = !profileData;
  const pendingApproval = user?.isVerified === false;

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-[#e2e8f0]">Welcome, {user?.name?.split(' ')[0]}! 👋</h1>
        <p className="text-sm text-[#94a3b8] mt-1">Your recruiter dashboard</p>
      </div>

      {pendingApproval && (
        <Alert type="warning">
          <div className="font-semibold mb-1">Account Pending Approval</div>
          <div>Your recruiter account is awaiting admin approval. You can set up your profile, but posting jobs requires approval.</div>
        </Alert>
      )}

      {profileMissing && (
        <Alert type="info">
          <div className="font-semibold mb-1">Complete Your Company Profile</div>
          <div className="flex items-center justify-between gap-4 mt-2">
            <span>Set up your company profile to start posting jobs and attracting candidates.</span>
            <Link to="/recruiter/profile"><Button size="sm">Set Up Profile</Button></Link>
          </div>
        </Alert>
      )}

      {/* Stats */}
      {jobsLoading ? <SkeletonStats count={3} /> : (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          <StatCard icon={Briefcase} label="Active Jobs" value={totalJobs} color="bg-indigo-500/15 text-indigo-400" to="/recruiter/jobs" />
          <StatCard icon={Users} label="Total Applicants" value={jobs.reduce((s, j) => s + (j.applicationsCount || 0), 0)} color="bg-emerald-500/15 text-emerald-400" />
          <StatCard icon={Plus} label="Post New Job" value="+" color="bg-amber-500/15 text-amber-400" to="/recruiter/jobs/new" />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Applications chart */}
        <div className="bg-[#131929] border border-[#1e2a3d] rounded-xl p-5">
          <h2 className="text-base font-semibold text-[#e2e8f0] mb-4">Applications per Job</h2>
          {chartData.length === 0 ? (
            <div className="flex items-center justify-center h-36 text-[#64748b] text-sm">No jobs posted yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={chartData} margin={{ left: -20 }}>
                <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip contentStyle={{ background: '#0f1525', border: '1px solid #1e2a3d', borderRadius: 8, color: '#e2e8f0' }} cursor={{ fill: 'rgba(99,102,241,0.05)' }} />
                <Bar dataKey="applications" radius={[6, 6, 0, 0]} fill="#6366f1" fillOpacity={0.85} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Recent jobs */}
        <div className="bg-[#131929] border border-[#1e2a3d] rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-[#e2e8f0]">My Jobs</h2>
            <Link to="/recruiter/jobs" className="text-xs text-indigo-400 hover:underline flex items-center gap-1">
              View all <ArrowRight size={12} />
            </Link>
          </div>
          {jobs.length === 0 ? (
            <div className="flex flex-col items-center py-8 text-center gap-3">
              <p className="text-sm text-[#64748b]">No jobs posted yet</p>
              <Link to="/recruiter/jobs/new"><Button size="sm"><Plus size={13} /> Post a Job</Button></Link>
            </div>
          ) : (
            <div className="space-y-3">
              {jobs.slice(0, 5).map(job => (
                <div key={job._id} className="flex items-center justify-between py-2 border-b border-[#1e2a3d] last:border-0">
                  <div>
                    <div className="text-sm font-medium text-[#e2e8f0]">{job.title}</div>
                    <div className="text-xs text-[#64748b]">
                      <span className="text-emerald-400">{job.applicationsCount || 0}</span> applicants
                    </div>
                  </div>
                  <Link to={`/recruiter/jobs/${job._id}/applications`}>
                    <Button size="sm" variant="secondary">View Apps</Button>
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
