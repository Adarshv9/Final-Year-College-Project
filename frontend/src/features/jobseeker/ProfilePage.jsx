// Job seeker profile editor for personal details and career preferences.
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod/v4';
import { Plus, Trash2, Save, User } from 'lucide-react';
import toast from 'react-hot-toast';
import { jobSeekerApi } from '../../lib/api';
import Button from '../../shared/ui/Button';
import { Skeleton } from '../../shared/ui/Skeleton';
import TagInput from '../../shared/ui/TagInput';
import Alert from '../../shared/ui/Alert';

const schema = z.object({
  headline: z.string().optional(),
  skills: z.array(z.string()).optional().default([]),
  experience: z.array(z.object({
    company: z.string().min(1, 'Required'),
    role: z.string().min(1, 'Required'),
    years: z.coerce.number().min(0).optional(),
  })).optional().default([]),
  education: z.array(z.object({
    degree: z.string().min(1, 'Required'),
    institution: z.string().min(1, 'Required'),
    year: z.coerce.number().optional(),
  })).optional().default([]),
});

export default function JobSeekerProfilePage() {
  const qc = useQueryClient();
  const [skills, setSkills] = useState([]);

  const { data, isLoading } = useQuery({
    queryKey: ['jobseeker-profile'],
    queryFn: () => jobSeekerApi.getProfile().then(r => r.data.data),
    onSuccess: (d) => {
      if (d?.skills) setSkills(d.skills);
    },
  });

  const { register, handleSubmit, control, reset, formState: { errors, isDirty, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
    values: data ? {
      headline: data.headline || '',
      skills: data.skills || [],
      experience: data.experience || [],
      education: data.education || [],
    } : undefined,
  });

  const { fields: expFields, append: appendExp, remove: removeExp } = useFieldArray({ control, name: 'experience' });
  const { fields: eduFields, append: appendEdu, remove: removeEdu } = useFieldArray({ control, name: 'education' });

  const isNew = !isLoading && !data;

  const mutation = useMutation({
    mutationFn: (payload) => isNew
      ? jobSeekerApi.createProfile(payload)
      : jobSeekerApi.updateProfile(payload),
    onSuccess: () => {
      toast.success(isNew ? 'Profile created!' : 'Profile updated!');
      qc.invalidateQueries({ queryKey: ['jobseeker-profile'] });
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to save profile');
    },
  });

  const onSubmit = (values) => {
    mutation.mutate({ ...values, skills });
  };

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto space-y-4">
        {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16" />)}
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-[#e2e8f0]">Job Seeker Profile</h1>
        <p className="text-sm text-[#94a3b8] mt-1">Complete your profile to get better job recommendations</p>
      </div>

      {isNew && (
        <Alert type="info">
          You haven't created a profile yet. Fill in your details to get started with personalized job recommendations!
        </Alert>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Headline */}
        <div className="bg-[#131929] border border-[#1e2a3d] rounded-xl p-5">
          <h2 className="text-base font-semibold text-[#e2e8f0] mb-4 flex items-center gap-2">
            <User size={16} /> Basic Info
          </h2>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-[#e2e8f0]">Professional Headline</label>
            <input
              placeholder="e.g. Full Stack Developer | 3+ Years Experience"
              className="w-full bg-[#0b0f1a] border border-[#1e2a3d] rounded-lg px-3 py-2.5 text-sm text-[#e2e8f0] placeholder-[#64748b] outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
              {...register('headline')}
            />
          </div>
        </div>

        {/* Skills */}
        <div className="bg-[#131929] border border-[#1e2a3d] rounded-xl p-5">
          <h2 className="text-base font-semibold text-[#e2e8f0] mb-4">Skills</h2>
          <TagInput
            value={skills}
            onChange={setSkills}
            placeholder="Add a skill and press Enter…"
          />
        </div>

        {/* Experience */}
        <div className="bg-[#131929] border border-[#1e2a3d] rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-[#e2e8f0]">Work Experience</h2>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => appendExp({ company: '', role: '', years: '' })}
            >
              <Plus size={14} /> Add
            </Button>
          </div>
          <div className="space-y-4">
            {expFields.map((field, idx) => (
              <div key={field.id} className="p-4 bg-[#0b0f1a] rounded-lg border border-[#1e2a3d] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-[#64748b] uppercase">Experience {idx + 1}</span>
                  <button type="button" onClick={() => removeExp(idx)} className="text-rose-400 hover:text-rose-300 transition-colors">
                    <Trash2 size={14} />
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium text-[#94a3b8]">Company</label>
                    <input className="bg-[#131929] border border-[#1e2a3d] rounded-lg px-3 py-2 text-sm text-[#e2e8f0] placeholder-[#64748b] outline-none focus:border-indigo-500" placeholder="Company name" {...register(`experience.${idx}.company`)} />
                    {errors.experience?.[idx]?.company && <p className="text-xs text-rose-400">{errors.experience[idx].company.message}</p>}
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium text-[#94a3b8]">Role</label>
                    <input className="bg-[#131929] border border-[#1e2a3d] rounded-lg px-3 py-2 text-sm text-[#e2e8f0] placeholder-[#64748b] outline-none focus:border-indigo-500" placeholder="Your role" {...register(`experience.${idx}.role`)} />
                    {errors.experience?.[idx]?.role && <p className="text-xs text-rose-400">{errors.experience[idx].role.message}</p>}
                  </div>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-[#94a3b8]">Years</label>
                  <input type="number" min="0" className="bg-[#131929] border border-[#1e2a3d] rounded-lg px-3 py-2 text-sm text-[#e2e8f0] placeholder-[#64748b] outline-none focus:border-indigo-500 w-24" placeholder="2" {...register(`experience.${idx}.years`)} />
                </div>
              </div>
            ))}
            {expFields.length === 0 && (
              <p className="text-sm text-[#64748b] text-center py-4">No experience added yet</p>
            )}
          </div>
        </div>

        {/* Education */}
        <div className="bg-[#131929] border border-[#1e2a3d] rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-[#e2e8f0]">Education</h2>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => appendEdu({ degree: '', institution: '', year: '' })}
            >
              <Plus size={14} /> Add
            </Button>
          </div>
          <div className="space-y-4">
            {eduFields.map((field, idx) => (
              <div key={field.id} className="p-4 bg-[#0b0f1a] rounded-lg border border-[#1e2a3d] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-[#64748b] uppercase">Education {idx + 1}</span>
                  <button type="button" onClick={() => removeEdu(idx)} className="text-rose-400 hover:text-rose-300 transition-colors">
                    <Trash2 size={14} />
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium text-[#94a3b8]">Degree</label>
                    <input className="bg-[#131929] border border-[#1e2a3d] rounded-lg px-3 py-2 text-sm text-[#e2e8f0] placeholder-[#64748b] outline-none focus:border-indigo-500" placeholder="B.Tech, MBA…" {...register(`education.${idx}.degree`)} />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium text-[#94a3b8]">Institution</label>
                    <input className="bg-[#131929] border border-[#1e2a3d] rounded-lg px-3 py-2 text-sm text-[#e2e8f0] placeholder-[#64748b] outline-none focus:border-indigo-500" placeholder="University name" {...register(`education.${idx}.institution`)} />
                  </div>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-[#94a3b8]">Graduation Year</label>
                  <input type="number" className="bg-[#131929] border border-[#1e2a3d] rounded-lg px-3 py-2 text-sm text-[#e2e8f0] placeholder-[#64748b] outline-none focus:border-indigo-500 w-28" placeholder="2024" {...register(`education.${idx}.year`)} />
                </div>
              </div>
            ))}
            {eduFields.length === 0 && (
              <p className="text-sm text-[#64748b] text-center py-4">No education added yet</p>
            )}
          </div>
        </div>

        <Button type="submit" loading={isSubmitting || mutation.isPending} size="lg">
          <Save size={16} /> {isNew ? 'Create Profile' : 'Save Changes'}
        </Button>
      </form>
    </div>
  );
}
