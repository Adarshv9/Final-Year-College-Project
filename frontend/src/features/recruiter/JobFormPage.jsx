// Recruiter form page for creating new job posts and editing existing ones.
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod/v4';
import { Save, Briefcase } from 'lucide-react';
import toast from 'react-hot-toast';
import { jobsApi } from '../../lib/api';
import Button from '../../shared/ui/Button';
import { Skeleton } from '../../shared/ui/Skeleton';
import TagInput from '../../shared/ui/TagInput';

const schema = z.object({
  title: z.string().min(2, 'Job title required'),
  companyName: z.string().min(2, 'Company name required'),
  description: z.string().min(10, 'Please provide a job description'),
  jobType: z.enum(['full-time', 'part-time', 'internship', 'contract']),
  locationType: z.enum(['remote', 'onsite', 'hybrid']),
  city: z.string().optional(),
  country: z.string().optional(),
  minExperience: z.coerce.number().min(0).optional(),
  salary: z.string().optional(),
});

export default function JobFormPage() {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const isEdit = !!jobId;
  const [skills, setSkills] = useState([]);

  const { data: jobData, isLoading } = useQuery({
    queryKey: ['job', jobId],
    queryFn: () => jobsApi.get(jobId).then(r => r.data.data),
    enabled: isEdit,
  });

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { jobType: 'full-time', locationType: 'remote' },
  });

  useEffect(() => {
    if (jobData) {
      // Reshape the API response into the flat fields controlled by the form.
      reset({
        title: jobData.title || '',
        companyName: jobData.companyName || '',
        description: jobData.description || '',
        jobType: jobData.jobType || 'full-time',
        locationType: jobData.location?.type || 'remote',
        city: jobData.location?.city || '',
        country: jobData.location?.country || '',
        minExperience: jobData.minExperience ?? '',
        salary: jobData.salary || '',
      });
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSkills(jobData.requiredSkills || []);
    }
  }, [jobData, reset]);

  const mutation = useMutation({
    mutationFn: (payload) => isEdit
      ? jobsApi.update(jobId, payload)
      : jobsApi.create(payload),
    onSuccess: () => {
      toast.success(isEdit ? 'Job updated!' : 'Job posted!');
      qc.invalidateQueries({ queryKey: ['my-jobs'] });
      navigate('/recruiter/jobs');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to save job'),
  });

  const onSubmit = (data) => {
    // Convert the flat form values back into the nested payload expected by the API.
    const payload = {
      title: data.title,
      companyName: data.companyName,
      description: data.description,
      jobType: data.jobType,
      location: {
        type: data.locationType,
        city: data.city,
        country: data.country,
      },
      requiredSkills: skills,
      minExperience: data.minExperience ? Number(data.minExperience) : undefined,
      salary: data.salary,
    };
    mutation.mutate(payload);
  };

  if (isEdit && isLoading) {
    return (
      <div className="max-w-2xl mx-auto space-y-4">
        {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-14" />)}
      </div>
    );
  }

  const inputCls = (hasError) => `w-full bg-white border rounded-lg px-3 py-2.5 text-sm text-slate-900 placeholder-slate-400 outline-none focus:ring-2 transition-all ${hasError ? 'border-rose-500 focus:ring-rose-500/20' : 'border-slate-200 focus:border-indigo-500 focus:ring-indigo-500/20'}`;
  const selectCls = `${inputCls(false)} cursor-pointer`;
  // Draw a custom chevron so native selects match the rest of the form styling.
  const selectStyle = { appearance: 'none', backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%2364748b' d='M6 8L1 3h10z'/%3E%3C/svg%3E\")", backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center', paddingRight: '2rem' };

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <Briefcase size={22} className="text-indigo-400" />
          {isEdit ? 'Edit Job' : 'Post a New Job'}
        </h1>
        <p className="text-sm text-slate-600 mt-1">
          {isEdit ? 'Update the job details below' : 'Fill in the details to attract the right candidates'}
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic info */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
          <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wide text-slate-500">Basic Information</h2>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-900">Job Title <span className="text-rose-400">*</span></label>
            <input className={inputCls(!!errors.title)} placeholder="Senior React Developer" {...register('title')} />
            {errors.title && <p className="text-xs text-rose-400">{errors.title.message}</p>}
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-900">Company Name <span className="text-rose-400">*</span></label>
            <input className={inputCls(!!errors.companyName)} placeholder="Acme Corp" {...register('companyName')} />
            {errors.companyName && <p className="text-xs text-rose-400">{errors.companyName.message}</p>}
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-900">Description <span className="text-rose-400">*</span></label>
            <textarea rows={5} className={`${inputCls(!!errors.description)} resize-y`} placeholder="Describe the role, responsibilities, and what you're looking for…" {...register('description')} />
            {errors.description && <p className="text-xs text-rose-400">{errors.description.message}</p>}
          </div>
        </div>

        {/* Type & Location */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Job Type & Location</h2>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-slate-900">Job Type</label>
              <select className={selectCls} style={selectStyle} {...register('jobType')}>
                <option value="full-time">Full-time</option>
                <option value="part-time">Part-time</option>
                <option value="internship">Internship</option>
                <option value="contract">Contract</option>
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-slate-900">Work Mode</label>
              <select className={selectCls} style={selectStyle} {...register('locationType')}>
                <option value="remote">Remote</option>
                <option value="onsite">On-site</option>
                <option value="hybrid">Hybrid</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-slate-900">City</label>
              <input className={inputCls(false)} placeholder="Mumbai" {...register('city')} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-slate-900">Country</label>
              <input className={inputCls(false)} placeholder="India" {...register('country')} />
            </div>
          </div>
        </div>

        {/* Skills & Experience */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Requirements</h2>
          <TagInput value={skills} onChange={setSkills} placeholder="Add required skill…" label="Required Skills" />
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-slate-900">Min. Experience (years)</label>
              <input type="number" min="0" className={inputCls(false)} placeholder="2" {...register('minExperience')} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-slate-900">Salary / Range</label>
              <input className={inputCls(false)} placeholder="₹15-25 LPA" {...register('salary')} />
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <Button type="submit" loading={isSubmitting || mutation.isPending} size="lg">
            <Save size={16} /> {isEdit ? 'Update Job' : 'Post Job'}
          </Button>
          <Button type="button" variant="secondary" size="lg" onClick={() => navigate('/recruiter/jobs')}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
