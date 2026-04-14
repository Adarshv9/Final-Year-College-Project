// Recruiter profile page for company details and account information.
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod/v4';
import { Building2, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import { recruiterApi } from '../../lib/api';
import Button from '../../shared/ui/Button';
import { Skeleton } from '../../shared/ui/Skeleton';
import Alert from '../../shared/ui/Alert';

const schema = z.object({
  companyName: z.string().min(2, 'Company name required'),
  companyWebsite: z.string().url('Enter a valid URL').optional().or(z.literal('')),
  companySize: z.string().optional(),
  companyDescription: z.string().optional(),
});

export default function RecruiterProfilePage() {
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['recruiter-profile'],
    queryFn: () => recruiterApi.getProfile().then(r => r.data.data),
  });

  const isNew = !isLoading && !data;

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
    values: data ? {
      companyName: data.companyName || '',
      companyWebsite: data.companyWebsite || '',
      companySize: data.companySize || '',
      companyDescription: data.companyDescription || '',
    } : undefined,
  });

  const mutation = useMutation({
    mutationFn: (d) => isNew ? recruiterApi.createProfile(d) : recruiterApi.updateProfile(d),
    onSuccess: () => {
      toast.success(isNew ? 'Profile created!' : 'Profile updated!');
      qc.invalidateQueries({ queryKey: ['recruiter-profile'] });
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to save'),
  });

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto space-y-4">
        {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16" />)}
      </div>
    );
  }

  const inputCls = (hasError) => `w-full bg-white border rounded-lg px-3 py-2.5 text-sm text-slate-900 placeholder-slate-400 outline-none focus:ring-2 transition-all ${hasError ? 'border-rose-500 focus:ring-rose-500/20' : 'border-slate-200 focus:border-indigo-500 focus:ring-indigo-500/20'}`;

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <Building2 size={22} className="text-indigo-400" /> Company Profile
        </h1>
        <p className="text-sm text-slate-600 mt-1">{isNew ? 'Set up your company profile to start posting jobs' : 'Update your company information'}</p>
      </div>

      {isNew && (
        <Alert type="info">Create your company profile to start posting jobs and attracting top talent.</Alert>
      )}

      <div className="bg-white border border-slate-200 rounded-2xl p-6">
        <form onSubmit={handleSubmit(d => mutation.mutate(d))} className="space-y-5">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-900">Company Name <span className="text-rose-400">*</span></label>
            <input className={inputCls(!!errors.companyName)} placeholder="Acme Corp" {...register('companyName')} />
            {errors.companyName && <p className="text-xs text-rose-400">{errors.companyName.message}</p>}
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-900">Website</label>
            <input className={inputCls(!!errors.companyWebsite)} placeholder="https://acme.com" type="url" {...register('companyWebsite')} />
            {errors.companyWebsite && <p className="text-xs text-rose-400">{errors.companyWebsite.message}</p>}
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-900">Company Size</label>
            <select
              className={`${inputCls(false)} cursor-pointer`}
              style={{ appearance: 'none', backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%2364748b' d='M6 8L1 3h10z'/%3E%3C/svg%3E\")", backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center', paddingRight: '2rem' }}
              {...register('companySize')}
            >
              <option value="">Select size</option>
              <option value="1-10">1–10 employees</option>
              <option value="11-50">11–50 employees</option>
              <option value="51-200">51–200 employees</option>
              <option value="201-1000">201–1,000 employees</option>
              <option value="1000+">1,000+ employees</option>
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-900">Company Description</label>
            <textarea
              rows={4}
              className={`${inputCls(false)} resize-y`}
              placeholder="Tell candidates about your company culture, mission, and what makes you unique…"
              {...register('companyDescription')}
            />
          </div>

          <Button type="submit" loading={isSubmitting || mutation.isPending} size="lg">
            <Save size={16} /> {isNew ? 'Create Profile' : 'Save Changes'}
          </Button>
        </form>
      </div>
    </div>
  );
}
