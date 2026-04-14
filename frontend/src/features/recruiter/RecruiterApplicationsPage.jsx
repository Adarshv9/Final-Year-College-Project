// Recruiter page for browsing all applications across their open jobs.
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { ArrowLeft, Filter, Users } from 'lucide-react';
import toast from 'react-hot-toast';
import { applicationsApi, jobsApi } from '../../lib/api';
import Button from '../../shared/ui/Button';
import Select from '../../shared/ui/Select';
import { SkeletonList } from '../../shared/ui/Skeleton';
import EmptyState from '../../shared/ui/EmptyState';
import Modal from '../../shared/ui/Modal';
import ApplicationCandidateCard from './components/ApplicationCandidateCard';

export default function RecruiterApplicationsPage() {
  const qc = useQueryClient();
  const [selectedJobId, setSelectedJobId] = useState('');
  const [status, setStatus] = useState('all');
  const [sort, setSort] = useState('newest');
  const [confirmModal, setConfirmModal] = useState(null);

  const { data: jobsData } = useQuery({
    queryKey: ['my-jobs'],
    queryFn: () => jobsApi.myJobs({ limit: 100 }).then((r) => r.data),
  });

  const { data: appsData, isLoading } = useQuery({
    queryKey: ['recruiter-applications', selectedJobId, status, sort],
    queryFn: () =>
      applicationsApi.recruiter({
        jobId: selectedJobId || undefined,
        status: status === 'all' ? undefined : status,
        sort,
        limit: 200,
      }).then((r) => r.data),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, action }) => applicationsApi.updateStatus(id, action),
    onSuccess: (_, vars) => {
      const message =
        vars.action === 'pending'
          ? 'Application moved back to pending.'
          : `Application ${vars.action}. Candidate email will be sent in 15 seconds.`;
      toast.success(message);
      setConfirmModal(null);
      qc.invalidateQueries({ queryKey: ['recruiter-applications'] });
      qc.invalidateQueries({ queryKey: ['job-applications'] });
      qc.invalidateQueries({ queryKey: ['job-recommended'] });
      qc.invalidateQueries({ queryKey: ['my-jobs'] });
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to update'),
  });

  const jobs = jobsData?.data || [];
  const applications = appsData?.data || [];

  return (
    <div className="mx-auto max-w-5xl space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <Link to="/recruiter/dashboard" className="text-slate-500 transition-colors hover:text-slate-900">
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">All Applications</h1>
          <p className="text-sm text-slate-600">{applications.length} applications in the current view</p>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-900">
          <Filter size={15} className="text-indigo-400" />
          Filter and sort applications
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <Select
            label="Job"
            value={selectedJobId}
            onChange={(e) => setSelectedJobId(e.target.value)}
          >
            <option value="">All jobs</option>
            {jobs.map((job) => (
              <option key={job._id} value={job._id}>{job.title}</option>
            ))}
          </Select>

          <Select
            label="Status"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="all">All statuses</option>
            <option value="pending">Pending</option>
            <option value="accepted">Accepted</option>
            <option value="rejected">Rejected</option>
          </Select>

          <Select
            label="Sort"
            value={sort}
            onChange={(e) => setSort(e.target.value)}
          >
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
          </Select>
        </div>
      </div>

      {isLoading ? (
        <SkeletonList count={4} />
      ) : applications.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No applications found"
          description="Try a different job or status filter, or wait for new applicants to apply."
        />
      ) : (
        <div className="space-y-4">
          {applications.map((app) => (
            <ApplicationCandidateCard
              key={app._id}
              app={app}
              onAction={(id, action) => setConfirmModal({ id, action })}
            />
          ))}
        </div>
      )}

      <Modal
        isOpen={!!confirmModal}
        onClose={() => setConfirmModal(null)}
        title={
          confirmModal?.action === 'accepted'
            ? 'Accept Application'
            : confirmModal?.action === 'rejected'
              ? 'Reject Application'
              : 'Move Application Back To Pending'
        }
        footer={(
          <>
            <Button variant="secondary" onClick={() => setConfirmModal(null)}>Cancel</Button>
            <Button
              variant={
                confirmModal?.action === 'accepted'
                  ? 'success'
                  : confirmModal?.action === 'rejected'
                    ? 'danger'
                    : 'secondary'
              }
              loading={statusMutation.isPending}
              onClick={() => statusMutation.mutate(confirmModal)}
            >
              {confirmModal?.action === 'accepted'
                ? 'Confirm Accept'
                : confirmModal?.action === 'rejected'
                  ? 'Confirm Reject'
                  : 'Move To Pending'}
            </Button>
          </>
        )}
      >
        <p className="text-sm text-slate-600">
          {confirmModal?.action === 'pending' ? (
            <>
              This will move the application back to <strong className="text-slate-900">pending</strong> and cancel any scheduled decision email.
            </>
          ) : (
            <>
              Are you sure you want to <strong className="text-slate-900">{confirmModal?.action}</strong> this application? The applicant will be notified after 15 seconds.
            </>
          )}
        </p>
      </Modal>
    </div>
  );
}
