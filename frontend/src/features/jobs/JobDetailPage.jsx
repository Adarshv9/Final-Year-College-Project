// Jobs page component for Job Detail.

import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft, MapPin, Briefcase, Clock, Building2,
  CheckCircle, Send, AlertTriangle, Star, DollarSign } from
'lucide-react';
import toast from 'react-hot-toast';
import { jobsApi, applicationsApi } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import Badge from '../../shared/ui/Badge';
import Button from '../../shared/ui/Button';
import { Skeleton } from '../../shared/ui/Skeleton';
import Modal from '../../shared/ui/Modal';

// Format applied date.
function formatAppliedDate(str) {
  if (!str) return '';
  return new Date(str).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

// Get application job ID.
function getApplicationJobId(application) {
  return String(application?.jobId || application?.job?._id || '');
}

// Render the job detail page.
export default function JobDetailPage() {
  const { jobId: jobIdParam } = useParams();
  const jobId = jobIdParam && jobIdParam !== 'undefined' ? jobIdParam : undefined;
  const { isAuthenticated, user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [applyModal, setApplyModal] = useState(false);
  const [message, setMessage] = useState('');

  const { data, isLoading, error } = useQuery({
    queryKey: ['job', jobId],
    queryFn: () => jobsApi.get(jobId).then((r) => r.data.data),
    enabled: Boolean(jobId)
  });

  const {
    data: myAppsData,
    isLoading: myAppsLoading,
    refetch: refetchMyApplications
  } = useQuery({
    queryKey: ['my-applications'],
    queryFn: () => applicationsApi.myApplications().then((r) => r.data),
    enabled: Boolean(jobId && isAuthenticated && user?.role === 'job_seeker'),
    refetchOnMount: 'always'
  });

  const myApps = myAppsData?.data || [];
  const myApplication = myApps.find((application) => getApplicationJobId(application) === String(jobId));

  const atsMutation = useMutation({
    mutationFn: () => jobsApi.atsScore(jobId).then((r) => r.data.data),
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to generate ATS score');
    }
  });

  const applyMutation = useMutation({
    mutationFn: async () => {
      const latest = await refetchMyApplications();
      const latestApps = latest.data?.data || [];
      const existingApplication = latestApps.find(
        (application) => getApplicationJobId(application) === String(jobId)
      );

      if (existingApplication) {
        const duplicateError = new Error('You have already applied for this job');
        duplicateError.isDuplicateApplication = true;
        throw duplicateError;
      }

      return applicationsApi.apply(jobId, { message });
    },
    onSuccess: () => {
      toast.success('Application submitted!');
      setApplyModal(false);
      setMessage('');
      qc.invalidateQueries({ queryKey: ['my-applications'] });
    },
    onError: async (err) => {
      if (err.isDuplicateApplication) {
        setApplyModal(false);
        setMessage('');
        toast.error(err.message);
        return;
      }

      const status = err.response?.status;
      const apiMessage = err.response?.data?.message || 'Failed to apply';

      if (status === 409) {
        setApplyModal(false);
        setMessage('');
        await refetchMyApplications();
        toast.error(apiMessage);
        return;
      }

      toast.error(apiMessage);
    }
  });

  // Handle apply.
  const handleApply = () => {
    if (!isAuthenticated) {navigate('/login');return;}
    if (user?.role !== 'job_seeker') {toast.error('Only job seekers can apply');return;}
    if (authLoading || myAppsLoading) {
      toast('Checking your application status...');
      return;
    }
    if (myApplication) {
      toast.error('You have already applied for this job');
      return;
    }
    setApplyModal(true);
  };

  // Handle check ats score.
  const handleCheckAtsScore = () => {
    if (!isAuthenticated) {navigate('/login');return;}
    if (user?.role !== 'job_seeker') {toast.error('Only job seekers can check ATS score');return;}
    if (!jobId) return;
    atsMutation.mutate();
  };

  if (!jobId) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle size={40} className="text-amber-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-slate-900 mb-2">Job not found</h2>
          <Link to="/jobs"><Button variant="secondary">← Browse Jobs</Button></Link>
        </div>
      </div>);

  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 py-10 px-4">
        <div className="max-w-3xl mx-auto space-y-6">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-8 w-2/3" />
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-32" />
          <Skeleton className="h-48" />
        </div>
      </div>);

  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle size={40} className="text-amber-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-slate-900 mb-2">Job not found</h2>
          <Link to="/jobs"><Button variant="secondary">← Browse Jobs</Button></Link>
        </div>
      </div>);

  }

  const job = data;
  const atsResult = atsMutation.data;
  const matchingSkills = atsResult?.breakdown?.matchingSkills || [];
  const missingSkills = atsResult?.breakdown?.missingSkills || [];

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        
        <Link to="/jobs" className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 transition-colors mb-6">
          <ArrowLeft size={16} /> Back to jobs
        </Link>

        
        <div className="bg-white border border-slate-200 rounded-2xl p-6 mb-5">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="w-14 h-14 bg-indigo-500/10 rounded-xl flex items-center justify-center flex-shrink-0">
              <Building2 size={24} className="text-indigo-400" />
            </div>
            <div className="flex gap-2 flex-wrap">
              <Badge variant="accent">{job.jobType}</Badge>
              {job.location?.type && <Badge variant={job.location.type}>{job.location.type}</Badge>}
            </div>
          </div>

          <h1 className="text-2xl font-bold text-slate-900 mb-1">{job.title}</h1>
          <p className="text-slate-600 font-medium mb-3">{job.companyName}</p>

          <div className="flex flex-wrap gap-4 text-sm text-slate-500">
            {(job.location?.city || job.location?.country) &&
            <span className="flex items-center gap-1.5">
                <MapPin size={14} />
                {[job.location?.city, job.location?.country].filter(Boolean).join(', ')}
              </span>
            }
            {job.minExperience != null &&
            <span className="flex items-center gap-1.5">
                <Briefcase size={14} />
                {job.minExperience}+ years experience
              </span>
            }
            {job.salary &&
            <span className="flex items-center gap-1.5">
                <DollarSign size={14} /> {job.salary}
              </span>
            }
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          
          <div className="lg:col-span-2 space-y-5">
            
            <div className="bg-white border border-slate-200 rounded-2xl p-6">
              <h2 className="text-base font-semibold text-slate-900 mb-4">Job Description</h2>
              <div className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">{job.description}</div>
            </div>

            
            {job.requiredSkills?.length > 0 &&
            <div className="bg-white border border-slate-200 rounded-2xl p-6">
                <h2 className="text-base font-semibold text-slate-900 mb-4">Required Skills</h2>
                <div className="flex flex-wrap gap-2">
                  {job.requiredSkills.map((skill) =>
                <span key={skill} className="px-3 py-1.5 bg-indigo-500/10 text-indigo-700 border border-indigo-500/20 rounded-full text-sm font-medium">
                      {skill}
                    </span>
                )}
                </div>
              </div>
            }
          </div>

          
          <div className="space-y-5">
            
            <div className="bg-white border border-slate-200 rounded-2xl p-5">
              {isAuthenticated && user?.role === 'job_seeker' ?
              authLoading || myAppsLoading ?
              <p className="text-sm text-slate-500 text-center py-2">Loading your application…</p> :
              myApplication ?
              <>
                    <h3 className="text-sm font-semibold text-slate-900 mb-3">Your application</h3>
                    <div className="flex flex-col gap-3">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs text-slate-500">Status</span>
                        <Badge variant={myApplication.status}>{myApplication.status}</Badge>
                      </div>
                      {(myApplication.appliedAt || myApplication.createdAt) &&
                  <p className="text-xs text-slate-600">
                          Applied {formatAppliedDate(myApplication.appliedAt || myApplication.createdAt)}
                        </p>
                  }
                      {myApplication.status === 'accepted' &&
                  <p className="text-xs text-emerald-400 font-medium">You&apos;ve been accepted for this role.</p>
                  }
                      <Link to="/my-applications">
                        <Button full variant="secondary">View my applications</Button>
                      </Link>
                    </div>
                  </> :

              <>
                    <h3 className="text-sm font-semibold text-slate-900 mb-3">Ready to apply?</h3>
                    <Button full onClick={handleApply}>
                      <Send size={15} /> Apply Now
                    </Button>
                  </> :

              isAuthenticated ?
              <div className="text-sm text-slate-500 text-center py-2">
                  Only job seekers can apply to jobs.
                </div> :

              <>
                  <h3 className="text-sm font-semibold text-slate-900 mb-2">Interested in this role?</h3>
                  <p className="text-xs text-slate-500 mb-4">Create a free account to apply in seconds</p>
                  <div className="space-y-2">
                    <Link to="/login"><Button full variant="primary">Sign In to Apply</Button></Link>
                    <Link to="/register"><Button full variant="secondary">Create Account</Button></Link>
                  </div>
                </>
              }

              {isAuthenticated && user?.role === 'job_seeker' ?
              <div className="mt-4 border-t border-slate-200 pt-4">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-semibold text-slate-900">ATS score</h3>
                      <p className="mt-0.5 text-xs text-slate-500">Compare your resume with this role.</p>
                    </div>
                    {atsResult ? <Badge variant="accent">{atsResult.atsScore}%</Badge> : null}
                  </div>

                  {atsResult ?
                <div className="mb-4 space-y-3 rounded-lg bg-slate-50 p-3">
                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div>
                          <div className="text-sm font-semibold text-slate-900">{atsResult.breakdown?.skillScore ?? 0}%</div>
                          <div className="text-[11px] text-slate-500">Skills</div>
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-slate-900">{atsResult.breakdown?.experienceScore ?? 0}%</div>
                          <div className="text-[11px] text-slate-500">Experience</div>
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-slate-900">{atsResult.aiScore ?? 0}%</div>
                          <div className="text-[11px] text-slate-500">AI fit</div>
                        </div>
                      </div>

                      {atsResult.reason ?
                  <p className="text-xs leading-5 text-slate-600">{atsResult.reason}</p> :
                  null}

                      {matchingSkills.length > 0 ?
                  <div>
                          <div className="mb-1 text-[11px] font-semibold uppercase text-slate-500">Matched skills</div>
                          <div className="flex flex-wrap gap-1.5">
                            {matchingSkills.slice(0, 5).map((skill) =>
                      <Badge key={`match-${skill}`} variant="success">{skill}</Badge>
                      )}
                          </div>
                        </div> :
                  null}

                      {missingSkills.length > 0 ?
                  <div>
                          <div className="mb-1 text-[11px] font-semibold uppercase text-slate-500">Skills to improve</div>
                          <div className="flex flex-wrap gap-1.5">
                            {missingSkills.slice(0, 5).map((skill) =>
                      <Badge key={`missing-${skill}`} variant="warning">{skill}</Badge>
                      )}
                          </div>
                        </div> :
                  null}
                    </div> :
                null}

                  <Button
                  full
                  variant="secondary"
                  loading={atsMutation.isPending}
                  onClick={handleCheckAtsScore}>
                  
                    <Star size={15} /> {atsResult ? 'Refresh ATS Score' : 'Check ATS Score'}
                  </Button>
                </div> :
              null}
            </div>

            
            <div className="bg-white border border-slate-200 rounded-2xl p-5">
              <h3 className="text-sm font-semibold text-slate-900 mb-4">Job Summary</h3>
              <dl className="space-y-3 text-sm">
                <div>
                  <dt className="text-slate-500 text-xs mb-0.5">Job Type</dt>
                  <dd className="text-slate-900 font-medium capitalize">{job.jobType}</dd>
                </div>
                <div>
                  <dt className="text-slate-500 text-xs mb-0.5">Work Type</dt>
                  <dd className="text-slate-900 font-medium capitalize">{job.location?.type}</dd>
                </div>
                {job.minExperience != null &&
                <div>
                    <dt className="text-slate-500 text-xs mb-0.5">Experience</dt>
                    <dd className="text-slate-900 font-medium">{job.minExperience}+ years</dd>
                  </div>
                }
                {job.salary &&
                <div>
                    <dt className="text-slate-500 text-xs mb-0.5">Salary</dt>
                    <dd className="text-slate-900 font-medium">{job.salary}</dd>
                  </div>
                }
              </dl>
            </div>
          </div>
        </div>
      </div>

      
      <Modal
        isOpen={applyModal}
        onClose={() => setApplyModal(false)}
        title="Apply for this position"
        footer={
        <>
            <Button variant="secondary" onClick={() => setApplyModal(false)}>Cancel</Button>
            <Button
            loading={applyMutation.isPending}
            onClick={() => applyMutation.mutate()}>
            
              <Send size={14} /> Submit Application
            </Button>
          </>
        }>
        
        <div className="space-y-4">
          <div className="p-3 bg-slate-50 rounded-xl">
            <div className="font-semibold text-slate-900 text-sm">{job.title}</div>
            <div className="text-xs text-slate-600">{job.companyName}</div>
          </div>
          <div>
            <label className="text-sm font-medium text-slate-900 block mb-1.5">
              Cover Message <span className="text-slate-500 font-normal">(optional)</span>
            </label>
            <textarea
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Tell the recruiter why you're a great fit for this role…"
              className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-900 placeholder-slate-400 outline-none resize-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all" />
            
          </div>
        </div>
      </Modal>
    </div>);

}