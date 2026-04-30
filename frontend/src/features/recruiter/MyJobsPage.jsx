// Recruiter page component for My Jobs.

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Edit, Trash2, Users, Briefcase, MoreVertical } from 'lucide-react';
import toast from 'react-hot-toast';
import { jobsApi } from '../../lib/api';
import Badge from '../../shared/ui/Badge';
import Button from '../../shared/ui/Button';
import { SkeletonCard } from '../../shared/ui/Skeleton';
import EmptyState from '../../shared/ui/EmptyState';
import Modal from '../../shared/ui/Modal';

// Render the my jobs page.
export default function MyJobsPage() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [deleteId, setDeleteId] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ['my-jobs'],
    queryFn: () => jobsApi.myJobs({ limit: 50 }).then((r) => r.data)
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => jobsApi.delete(id),
    onSuccess: () => {
      toast.success('Job deleted');
      setDeleteId(null);
      qc.invalidateQueries({ queryKey: ['my-jobs'] });
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to delete')
  });

  const jobs = data?.data || [];

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto grid gap-4">
        {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
      </div>);

  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">My Jobs</h1>
          <p className="text-sm text-slate-600 mt-1">{jobs.length} job{jobs.length !== 1 ? 's' : ''} posted</p>
        </div>
        <Link to="/recruiter/jobs/new">
          <Button><Plus size={16} /> Post Job</Button>
        </Link>
      </div>

      {jobs.length === 0 ?
      <EmptyState
        icon={Briefcase}
        title="No jobs posted yet"
        description="Start attracting top talent by creating your first job listing"
        action={<Link to="/recruiter/jobs/new"><Button><Plus size={15} /> Post Your First Job</Button></Link>} /> :


      <div className="space-y-4">
          {jobs.map((job) =>
        <div
          key={job._id}
          className="bg-white border border-slate-200 rounded-xl p-5 hover:border-indigo-500/40 transition-all cursor-pointer"
          onClick={() => navigate(`/recruiter/jobs/${job._id}/applications`)}>
          
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <h3 className="text-base font-semibold text-slate-900">{job.title}</h3>
                    <Badge variant="accent">{job.jobType}</Badge>
                    {job.location?.type && <Badge variant={job.location.type}>{job.location.type}</Badge>}
                  </div>
                  <p className="text-sm text-slate-600">{job.companyName}</p>
                  {job.location?.city &&
              <p className="text-xs text-slate-500 mt-1">{job.location.city}{job.location.country ? `, ${job.location.country}` : ''}</p>
              }
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-100 rounded-lg text-sm">
                    <Users size={13} className="text-slate-600" />
                    <span className="text-emerald-400 font-bold">{job.applicationsCount || 0}</span>
                  </div>
                  <Link to={`/recruiter/jobs/${job._id}/edit`} onClick={(e) => e.stopPropagation()}>
                    <Button variant="secondary" size="icon">
                      <Edit size={14} />
                    </Button>
                  </Link>
                  <Button
                variant="danger"
                size="icon"
                onClick={(e) => {e.stopPropagation();setDeleteId(job._id);}}>
                
                    <Trash2 size={14} />
                  </Button>
                </div>
              </div>

              {job.requiredSkills?.length > 0 &&
          <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-slate-200">
                  {job.requiredSkills.slice(0, 5).map((s) =>
            <span key={s} className="px-2 py-0.5 bg-indigo-500/10 text-indigo-400 rounded-full text-xs">{s}</span>
            )}
                </div>
          }
            </div>
        )}
        </div>
      }

      
      <Modal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        title="Delete Job"
        footer={
        <>
            <Button variant="secondary" onClick={() => setDeleteId(null)}>Cancel</Button>
            <Button variant="danger" loading={deleteMutation.isPending} onClick={() => deleteMutation.mutate(deleteId)}>
              Delete
            </Button>
          </>
        }>
        
        <p className="text-sm text-slate-600">Are you sure you want to delete this job? This action cannot be undone and all applications will be permanently removed.</p>
      </Modal>
    </div>);

}