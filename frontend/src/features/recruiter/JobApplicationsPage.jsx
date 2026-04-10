// Recruiter page for reviewing applications tied to one specific job posting.
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, Link } from 'react-router-dom';
import { Users, Star, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import { applicationsApi } from '../../lib/api';
import Button from '../../shared/ui/Button';
import { SkeletonList } from '../../shared/ui/Skeleton';
import EmptyState from '../../shared/ui/EmptyState';
import Modal from '../../shared/ui/Modal';
import ApplicationCandidateCard from './components/ApplicationCandidateCard';

export default function JobApplicationsPage() {
  const { jobId } = useParams();
  const qc = useQueryClient();
  const [tab, setTab] = useState('all');
  const [confirmModal, setConfirmModal] = useState(null);

  const { data: appsData, isLoading: appsLoading } = useQuery({
    queryKey: ['job-applications', jobId],
    queryFn: () => applicationsApi.forJob(jobId).then((r) => r.data),
  });

  const { data: recData, isLoading: recLoading } = useQuery({
    queryKey: ['job-recommended', jobId],
    queryFn: () =>
      applicationsApi.recommendedForJob(jobId)
        .then((r) => r.data)
        .catch(() => ({ data: [] })),
    enabled: tab === 'recommended',
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
      qc.invalidateQueries({ queryKey: ['job-applications', jobId] });
      qc.invalidateQueries({ queryKey: ['job-recommended', jobId] });
      qc.invalidateQueries({ queryKey: ['recruiter-applications'] });
      qc.invalidateQueries({ queryKey: ['my-jobs'] });
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to update'),
  });

  const allApps = appsData?.data || [];
  const recApps = recData?.data || [];
  const displayApps = tab === 'recommended' ? recApps : allApps;

  return (
    <div className="mx-auto max-w-5xl space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <Link to="/recruiter/jobs" className="text-[#64748b] transition-colors hover:text-[#e2e8f0]">
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-[#e2e8f0]">Applications</h1>
          <p className="text-sm text-[#94a3b8]">{allApps.length} total applicants</p>
        </div>
      </div>

      <div className="flex gap-1 border-b border-[#1e2a3d]">
        {[
          { id: 'all', label: `All (${allApps.length})` },
          { id: 'recommended', label: 'AI Recommended', icon: Star },
        ].map((item) => {
          const Icon = item.icon;

          return (
            <button
              key={item.id}
              onClick={() => setTab(item.id)}
              className={[
                'flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-all',
                'border-b-2 -mb-px',
                tab === item.id
                  ? 'border-indigo-500 text-indigo-400'
                  : 'border-transparent text-[#64748b] hover:text-[#94a3b8]',
              ].join(' ')}
            >
              {Icon ? <Icon size={14} /> : null}
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>

      {(tab === 'all' ? appsLoading : recLoading) ? (
        <SkeletonList count={4} />
      ) : displayApps.length === 0 ? (
        <EmptyState
          icon={Users}
          title={tab === 'recommended' ? 'No recommended candidates' : 'No applications yet'}
          description={tab === 'recommended' ? 'AI ranking requires at least one application' : 'Share your job posting to attract candidates'}
        />
      ) : (
        <div className="space-y-4">
          {displayApps.map((app) => (
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
        <p className="text-sm text-[#94a3b8]">
          {confirmModal?.action === 'pending' ? (
            <>
              This will move the application back to <strong className="text-[#e2e8f0]">pending</strong> and cancel any scheduled decision email.
            </>
          ) : (
            <>
              Are you sure you want to <strong className="text-[#e2e8f0]">{confirmModal?.action}</strong> this application? The applicant will be notified after 15 seconds.
            </>
          )}
        </p>
      </Modal>
    </div>
  );
}
