import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, Link } from 'react-router-dom';
import {
  Users, CheckCircle, XCircle, Star, ArrowLeft,
  Mail, Briefcase, User, FileText,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { applicationsApi } from '../../lib/api';
import Badge from '../../shared/ui/Badge';
import Button from '../../shared/ui/Button';
import { SkeletonList } from '../../shared/ui/Skeleton';
import EmptyState from '../../shared/ui/EmptyState';
import Modal from '../../shared/ui/Modal';

function CandidateCard({ app, onAction }) {
  return (
    <div className="bg-[#131929] border border-[#1e2a3d] rounded-xl p-5 hover:border-[#243047] transition-all">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-indigo-500/10 rounded-full flex items-center justify-center font-bold text-indigo-400 text-sm flex-shrink-0">
            {app.applicant?.name?.[0]?.toUpperCase() || '?'}
          </div>
          <div>
            <h3 className="text-sm font-semibold text-[#e2e8f0]">{app.applicant?.name || 'Applicant'}</h3>
            <a href={`mailto:${app.applicant?.email}`} className="text-xs text-indigo-400 hover:underline flex items-center gap-1">
              <Mail size={11} /> {app.applicant?.email}
            </a>
            {app.applicant?.profile?.headline && (
              <p className="text-xs text-[#94a3b8] mt-0.5">{app.applicant.profile.headline}</p>
            )}
          </div>
        </div>
        <Badge variant={app.status}>{app.status}</Badge>
      </div>

      {app.message && (
        <div className="mt-3 pt-3 border-t border-[#1e2a3d]">
          <p className="text-xs font-semibold text-[#64748b] uppercase mb-1">Cover Message</p>
          <p className="text-xs text-[#94a3b8] line-clamp-3">{app.message}</p>
        </div>
      )}

      {app.status === 'pending' && (
        <div className="flex gap-2 mt-4">
          <Button
            variant="success"
            size="sm"
            onClick={() => onAction(app._id, 'accepted')}
          >
            <CheckCircle size={13} /> Accept
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={() => onAction(app._id, 'rejected')}
          >
            <XCircle size={13} /> Reject
          </Button>
        </div>
      )}
    </div>
  );
}

export default function JobApplicationsPage() {
  const { jobId } = useParams();
  const qc = useQueryClient();
  const [tab, setTab] = useState('all');
  const [confirmModal, setConfirmModal] = useState(null); // { id, action }

  const { data: appsData, isLoading: appsLoading } = useQuery({
    queryKey: ['job-applications', jobId],
    queryFn: () => applicationsApi.forJob(jobId).then(r => r.data),
  });

  // Recommended candidates (AI-ranked)
  const { data: recData, isLoading: recLoading } = useQuery({
    queryKey: ['job-recommended', jobId],
    queryFn: () => applicationsApi.recommendedForJob(jobId).then(r => r.data)
      .catch(() => ({ data: [] })),
    enabled: tab === 'recommended',
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }) => applicationsApi.updateStatus(id, status),
    onSuccess: (_, vars) => {
      toast.success(`Application ${vars.status}. Candidate email will be sent in 15 seconds.`);
      setConfirmModal(null);
      qc.invalidateQueries({ queryKey: ['job-applications', jobId] });
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to update'),
  });

  const allApps = appsData?.data || [];
  const recApps = recData?.data || [];

  const displayApps = tab === 'recommended' ? recApps : allApps;

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <Link to="/recruiter/jobs" className="text-[#64748b] hover:text-[#e2e8f0] transition-colors">
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-[#e2e8f0]">Applications</h1>
          <p className="text-sm text-[#94a3b8]">{allApps.length} total applicants</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-[#1e2a3d]">
        {[
          { id: 'all', label: `All (${allApps.length})` },
          { id: 'recommended', label: '⭐ AI Recommended' },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={[
              'px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-all',
              tab === t.id ? 'text-indigo-400 border-indigo-500' : 'text-[#64748b] border-transparent hover:text-[#94a3b8]',
            ].join(' ')}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
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
          {displayApps.map(app => (
            <CandidateCard
              key={app._id}
              app={app}
              onAction={(id, action) => setConfirmModal({ id, action })}
            />
          ))}
        </div>
      )}

      {/* Confirm modal */}
      <Modal
        isOpen={!!confirmModal}
        onClose={() => setConfirmModal(null)}
        title={confirmModal?.action === 'accepted' ? 'Accept Application' : 'Reject Application'}
        footer={
          <>
            <Button variant="secondary" onClick={() => setConfirmModal(null)}>Cancel</Button>
            <Button
              variant={confirmModal?.action === 'accepted' ? 'success' : 'danger'}
              loading={statusMutation.isPending}
              onClick={() => statusMutation.mutate(confirmModal)}
            >
              Confirm {confirmModal?.action === 'accepted' ? 'Accept' : 'Reject'}
            </Button>
          </>
        }
      >
        <p className="text-sm text-[#94a3b8]">
          Are you sure you want to <strong className="text-[#e2e8f0]">{confirmModal?.action}</strong> this application? The applicant will be notified after 15 seconds.
        </p>
      </Modal>
    </div>
  );
}
