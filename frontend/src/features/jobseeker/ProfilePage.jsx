// Job seeker page component for Profile.

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod/v4';
import { Plus, Trash2, Save, User, Download, MapPin, Pencil, Check, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { jobSeekerApi, resumeApi } from '../../lib/api';
import Button from '../../shared/ui/Button';
import { Skeleton } from '../../shared/ui/Skeleton';
import TagInput from '../../shared/ui/TagInput';
import Alert from '../../shared/ui/Alert';
import { usersApi } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';

const schema = z.object({
  headline: z.string().optional(),
  skills: z.array(z.string()).optional().default([]),
  experience: z.array(z.object({
    company: z.string().min(1, 'Required'),
    role: z.string().min(1, 'Required'),
    years: z.coerce.number().min(0).optional()
  })).optional().default([]),
  education: z.array(z.object({
    degree: z.string().min(1, 'Required'),
    institution: z.string().min(1, 'Required'),
    year: z.coerce.number().optional()
  })).optional().default([])
});

// Render the job seeker profile page.
export default function JobSeekerProfilePage() {
  const qc = useQueryClient();
  const [skills, setSkills] = useState([]);
  const { user: authUser, updateUser } = useAuth();
  const [editingName, setEditingName] = useState(false);
  const [editingLocation, setEditingLocation] = useState(false);
  const [draftName, setDraftName] = useState(authUser?.name || '');
  const [draftLocation, setDraftLocation] = useState(authUser?.location || '');

  const { data, isLoading } = useQuery({
    queryKey: ['jobseeker-profile'],
    queryFn: () => jobSeekerApi.getProfile().then((r) => r.data.data)
  });


  useEffect(() => {

    if (data?.skills) setSkills(data.skills);
  }, [data]);

  const { register, handleSubmit, control, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
    values: data ? {
      headline: data.headline || '',
      skills: data.skills || [],
      experience: data.experience || [],
      education: data.education || []
    } : undefined
  });

  const { fields: expFields, append: appendExp, remove: removeExp } = useFieldArray({ control, name: 'experience' });
  const { fields: eduFields, append: appendEdu, remove: removeEdu } = useFieldArray({ control, name: 'education' });

  const isNew = !isLoading && !data;


  const { data: resumeData, isLoading: resumeLoading } = useQuery({
    queryKey: ['my-resume'],
    queryFn: () => resumeApi.get().then((r) => r.data.data).catch((err) => {
      if (err.response?.status === 404) return null;
      throw err;
    }),
    staleTime: 60_000
  });

  // Handle import from resume.
  const handleImportFromResume = () => {
    const resumeSkills = resumeData?.skills || [];
    if (!resumeSkills.length) {
      toast('No skills found in your resume. Upload a resume first.');
      return;
    }

    const merged = [...new Set([...skills, ...resumeSkills])];
    setSkills(merged);
    toast.success(`Imported ${resumeSkills.length} skills from your resume!`);
  };

  const mutation = useMutation({
    mutationFn: (payload) => isNew ?
    jobSeekerApi.createProfile(payload) :
    jobSeekerApi.updateProfile(payload),
    onSuccess: () => {
      toast.success(isNew ? 'Profile created!' : 'Profile updated!');
      qc.invalidateQueries({ queryKey: ['jobseeker-profile'] });
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to save profile');
    }
  });

  // Handle submit.
  const onSubmit = (values) => {
    mutation.mutate({ ...values, skills });
  };

  const accountMutation = useMutation({
    mutationFn: (payload) => usersApi.updateMe(payload).then((r) => r.data.data),
    onSuccess: (updated) => {
      updateUser(updated);
      toast.success('Account updated');
      setEditingName(false);
      setEditingLocation(false);
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to update account')
  });

  const initials = authUser?.name ?
  authUser.name.split(' ').filter(Boolean).map((w) => w[0]).join('').slice(0, 2).toUpperCase() :
  '?';

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto space-y-4">
        {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16" />)}
      </div>);

  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">My Profile</h1>
        <p className="text-sm text-slate-600 mt-1">This information powers your AI job matching and personalised recommendations — it is not your resume document.</p>
      </div>

      
      <div className="bg-white border border-slate-200 rounded-xl p-5">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-indigo-500/10 text-indigo-700 flex items-center justify-center font-bold">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                {editingName ?
                <div className="flex items-center gap-2">
                    <input
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                    value={draftName}
                    onChange={(e) => setDraftName(e.target.value)}
                    placeholder="Add name" />
                  
                    <button
                    type="button"
                    onClick={() => accountMutation.mutate({ name: draftName.trim() })}
                    className="h-9 w-9 inline-flex items-center justify-center rounded-lg text-emerald-600 hover:bg-emerald-50"
                    aria-label="Save name"
                    title="Save">
                    
                      <Check size={16} />
                    </button>
                    <button
                    type="button"
                    onClick={() => {setDraftName(authUser?.name || '');setEditingName(false);}}
                    className="h-9 w-9 inline-flex items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100"
                    aria-label="Cancel"
                    title="Cancel">
                    
                      <X size={16} />
                    </button>
                  </div> :

                <button
                  type="button"
                  onClick={() => setEditingName(true)}
                  className="text-left w-full">
                  
                    <div className="text-sm font-semibold text-slate-900 truncate underline underline-offset-4">
                      {authUser?.name?.trim() ? authUser.name : 'Add name'}
                    </div>
                  </button>
                }
                <div className="text-sm text-slate-600 truncate mt-1">{authUser?.email}</div>
              </div>
              {!editingName &&
              <button
                type="button"
                onClick={() => setEditingName(true)}
                className="h-9 w-9 inline-flex items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100"
                aria-label="Edit name"
                title="Edit">
                
                  <Pencil size={14} />
                </button>
              }
            </div>

            <div className="mt-3 flex items-start gap-2">
              <MapPin size={16} className="text-slate-400 mt-0.5" />
              <div className="flex-1">
                {editingLocation ?
                <div className="flex items-center gap-2">
                    <input
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                    value={draftLocation}
                    onChange={(e) => setDraftLocation(e.target.value)}
                    placeholder="Add location" />
                  
                    <button
                    type="button"
                    onClick={() => accountMutation.mutate({ location: draftLocation.trim() })}
                    className="h-9 w-9 inline-flex items-center justify-center rounded-lg text-emerald-600 hover:bg-emerald-50"
                    aria-label="Save location"
                    title="Save">
                    
                      <Check size={16} />
                    </button>
                    <button
                    type="button"
                    onClick={() => {setDraftLocation(authUser?.location || '');setEditingLocation(false);}}
                    className="h-9 w-9 inline-flex items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100"
                    aria-label="Cancel"
                    title="Cancel">
                    
                      <X size={16} />
                    </button>
                  </div> :

                <button type="button" onClick={() => setEditingLocation(true)} className="text-left">
                    <span className="text-sm text-slate-600 underline underline-offset-4">
                      {authUser?.location?.trim() ? authUser.location : 'Add location'}
                    </span>
                  </button>
                }
              </div>
            </div>
          </div>
        </div>
      </div>

      {isNew ?
      <Alert type="info">
          Welcome! Fill in your headline, skills, and experience so our AI can start matching you with the right roles.
        </Alert> :

      <Alert type="info">
          Keep this profile up to date for the most accurate job recommendations.
        </Alert>
      }

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <h2 className="text-base font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <User size={16} /> Basic Info
          </h2>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-slate-900">Professional Headline</label>
            <input
              placeholder="e.g. Full Stack Developer | 3+ Years Experience"
              className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-900 placeholder-slate-400 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
              {...register('headline')} />
            
          </div>
        </div>

        
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-slate-900">Skills</h2>
            {resumeData?.skills?.length > 0 &&
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={handleImportFromResume}
              loading={resumeLoading}>
              
                <Download size={13} /> Import from Resume
              </Button>
            }
          </div>
          <TagInput
            value={skills}
            onChange={setSkills}
            placeholder="Add a skill and press Enter…" />
          
        </div>

        
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-slate-900">Work Experience</h2>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => appendExp({ company: '', role: '', years: '' })}>
              
              <Plus size={14} /> Add
            </Button>
          </div>
          <div className="space-y-4">
            {expFields.map((field, idx) =>
            <div key={field.id} className="p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500 uppercase">Experience {idx + 1}</span>
                  <button type="button" onClick={() => removeExp(idx)} className="text-rose-400 hover:text-rose-300 transition-colors">
                    <Trash2 size={14} />
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium text-slate-600">Company</label>
                    <input className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 placeholder-slate-400 outline-none focus:border-indigo-500" placeholder="Company name" {...register(`experience.${idx}.company`)} />
                    {errors.experience?.[idx]?.company && <p className="text-xs text-rose-400">{errors.experience[idx].company.message}</p>}
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium text-slate-600">Role</label>
                    <input className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 placeholder-slate-400 outline-none focus:border-indigo-500" placeholder="Your role" {...register(`experience.${idx}.role`)} />
                    {errors.experience?.[idx]?.role && <p className="text-xs text-rose-400">{errors.experience[idx].role.message}</p>}
                  </div>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-slate-600">Years</label>
                  <input type="number" min="0" className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 placeholder-slate-400 outline-none focus:border-indigo-500 w-24" placeholder="2" {...register(`experience.${idx}.years`)} />
                </div>
              </div>
            )}
            {expFields.length === 0 &&
            <p className="text-sm text-slate-500 text-center py-4">No experience added yet</p>
            }
          </div>
        </div>

        
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-slate-900">Education</h2>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => appendEdu({ degree: '', institution: '', year: '' })}>
              
              <Plus size={14} /> Add
            </Button>
          </div>
          <div className="space-y-4">
            {eduFields.map((field, idx) =>
            <div key={field.id} className="p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500 uppercase">Education {idx + 1}</span>
                  <button type="button" onClick={() => removeEdu(idx)} className="text-rose-400 hover:text-rose-300 transition-colors">
                    <Trash2 size={14} />
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium text-slate-600">Degree</label>
                    <input className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 placeholder-slate-400 outline-none focus:border-indigo-500" placeholder="B.Tech, MBA…" {...register(`education.${idx}.degree`)} />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium text-slate-600">Institution</label>
                    <input className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 placeholder-slate-400 outline-none focus:border-indigo-500" placeholder="University name" {...register(`education.${idx}.institution`)} />
                  </div>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-slate-600">Graduation Year</label>
                  <input type="number" className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 placeholder-slate-400 outline-none focus:border-indigo-500 w-28" placeholder="2024" {...register(`education.${idx}.year`)} />
                </div>
              </div>
            )}
            {eduFields.length === 0 &&
            <p className="text-sm text-slate-500 text-center py-4">No education added yet</p>
            }
          </div>
        </div>

        <Button type="submit" loading={isSubmitting || mutation.isPending} size="lg">
          <Save size={16} /> {isNew ? 'Create Profile' : 'Save Changes'}
        </Button>
      </form>
    </div>);

}