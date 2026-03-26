import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, useFieldArray } from 'react-hook-form';
import { Upload, FileText, Trash2, Edit3, Plus, Save, Download, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { resumeApi } from '../../lib/api';
import Button from '../../shared/ui/Button';
import { Skeleton } from '../../shared/ui/Skeleton';
import TagInput from '../../shared/ui/TagInput';
import Alert from '../../shared/ui/Alert';
import Badge from '../../shared/ui/Badge';

function UploadTab({ resume }) {
  const qc = useQueryClient();
  const fileRef = useRef(null);
  const [dragging, setDragging] = useState(false);
  const [file, setFile] = useState(null);

  const uploadMutation = useMutation({
    mutationFn: (f) => {
      const fd = new FormData();
      fd.append('resume', f);
      return resumeApi.upload(fd);
    },
    onSuccess: () => {
      toast.success('Resume uploaded!');
      setFile(null);
      qc.invalidateQueries({ queryKey: ['my-resume'] });
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Upload failed'),
  });

  const deleteMutation = useMutation({
    mutationFn: resumeApi.delete,
    onSuccess: () => {
      toast.success('Resume deleted');
      qc.invalidateQueries({ queryKey: ['my-resume'] });
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Delete failed'),
  });

  const handleFile = (f) => {
    if (!f) return;
    if (f.type !== 'application/pdf') { toast.error('Only PDF files allowed'); return; }
    if (f.size > 2 * 1024 * 1024) { toast.error('Max file size is 2 MB'); return; }
    setFile(f);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  };

  return (
    <div className="space-y-5">
      {resume ? (
        <div className="flex items-center justify-between p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl">
          <div className="flex items-center gap-3">
            <CheckCircle2 size={20} className="text-emerald-400" />
            <div>
              <div className="text-sm font-semibold text-[#e2e8f0]">Resume on file</div>
              {resume.isVerified && <div className="text-xs text-emerald-400">✓ Verified by admin</div>}
            </div>
          </div>
          <div className="flex gap-2">
            {resume.fileUrl && (
              <a href="/api/v1/resumes/resume/download">
                <Button variant="secondary" size="sm"><Download size={13} /> Download</Button>
              </a>
            )}
            <Button
              variant="danger"
              size="sm"
              loading={deleteMutation.isPending}
              onClick={() => deleteMutation.mutate()}
            >
              <Trash2 size={13} /> Remove
            </Button>
          </div>
        </div>
      ) : null}

      {/* Drop zone */}
      <div
        className={`border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer ${dragging ? 'border-indigo-500 bg-indigo-500/5' : 'border-[#1e2a3d] hover:border-[#243047]'}`}
        onClick={() => fileRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
      >
        <Upload size={28} className={`mx-auto mb-3 ${dragging ? 'text-indigo-400' : 'text-[#64748b]'}`} />
        <p className="text-sm font-medium text-[#e2e8f0] mb-1">
          {file ? file.name : 'Drop your resume here or click to browse'}
        </p>
        <p className="text-xs text-[#64748b]">PDF only, max 2 MB</p>
        <input
          ref={fileRef}
          type="file"
          accept="application/pdf"
          className="hidden"
          onChange={e => handleFile(e.target.files[0])}
        />
      </div>

      {file && (
        <Button
          full
          loading={uploadMutation.isPending}
          onClick={() => uploadMutation.mutate(file)}
        >
          <Upload size={14} /> Upload Resume
        </Button>
      )}
    </div>
  );
}

function ManualEditTab({ resume }) {
  const qc = useQueryClient();
  const [skills, setSkills] = useState(resume?.skills || []);

  const { register, handleSubmit, control, formState: { isSubmitting } } = useForm({
    values: resume ? {
      name: resume.name || '',
      email: resume.email || '',
      phone: resume.phone || '',
      location: resume.location || '',
      summary: resume.summary || '',
      experienceYears: resume.experienceYears || '',
      experiences: resume.experiences || [],
      education: resume.education || [],
      projects: resume.projects || [],
    } : {},
  });

  const { fields: expFields, append: appendExp, remove: removeExp } = useFieldArray({ control, name: 'experiences' });
  const { fields: eduFields, append: appendEdu, remove: removeEdu } = useFieldArray({ control, name: 'education' });
  const { fields: projFields, append: appendProj, remove: removeProj } = useFieldArray({ control, name: 'projects' });

  const isNew = !resume;

  const mutation = useMutation({
    mutationFn: (data) => isNew ? resumeApi.manual(data) : resumeApi.update(data),
    onSuccess: () => {
      toast.success('Resume saved!');
      qc.invalidateQueries({ queryKey: ['my-resume'] });
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to save'),
  });

  const inputCls = 'w-full bg-[#0b0f1a] border border-[#1e2a3d] rounded-lg px-3 py-2.5 text-sm text-[#e2e8f0] placeholder-[#64748b] outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20';
  const labelCls = 'text-sm font-medium text-[#e2e8f0]';
  const sectionCls = 'bg-[#0b0f1a] rounded-lg border border-[#1e2a3d] p-4 space-y-3';

  return (
    <form onSubmit={handleSubmit(d => mutation.mutate({ ...d, skills }))} className="space-y-6">
      {/* Basic info */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <label className={labelCls}>Full Name</label>
          <input className={inputCls} placeholder="John Doe" {...register('name')} />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className={labelCls}>Email</label>
          <input className={inputCls} placeholder="you@email.com" {...register('email')} />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className={labelCls}>Phone</label>
          <input className={inputCls} placeholder="+91 9876543210" {...register('phone')} />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className={labelCls}>Location</label>
          <input className={inputCls} placeholder="Mumbai, India" {...register('location')} />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className={labelCls}>Total Experience (years)</label>
          <input type="number" min="0" className={inputCls} placeholder="3" {...register('experienceYears')} />
        </div>
      </div>

      {/* Summary */}
      <div className="flex flex-col gap-1.5">
        <label className={labelCls}>Professional Summary</label>
        <textarea rows={3} className={`${inputCls} resize-y`} placeholder="Brief overview of your expertise…" {...register('summary')} />
      </div>

      {/* Skills */}
      <TagInput value={skills} onChange={setSkills} placeholder="Add skill…" label="Skills" />

      {/* Experience */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <label className={labelCls}>Work Experience</label>
          <Button type="button" variant="secondary" size="sm" onClick={() => appendExp({ company: '', role: '', startDate: '', endDate: '' })}>
            <Plus size={14} /> Add
          </Button>
        </div>
        <div className="space-y-3">
          {expFields.map((f, i) => (
            <div key={f.id} className={sectionCls}>
              <div className="flex justify-end">
                <button type="button" onClick={() => removeExp(i)} className="text-rose-400 hover:text-rose-300"><Trash2 size={14} /></button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input className={inputCls} placeholder="Company" {...register(`experiences.${i}.company`)} />
                <input className={inputCls} placeholder="Role" {...register(`experiences.${i}.role`)} />
                <input className={inputCls} placeholder="Start Date (e.g. Jan 2022)" {...register(`experiences.${i}.startDate`)} />
                <input className={inputCls} placeholder="End Date (or Present)" {...register(`experiences.${i}.endDate`)} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Education */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <label className={labelCls}>Education</label>
          <Button type="button" variant="secondary" size="sm" onClick={() => appendEdu({ degree: '', institution: '', year: '' })}>
            <Plus size={14} /> Add
          </Button>
        </div>
        <div className="space-y-3">
          {eduFields.map((f, i) => (
            <div key={f.id} className={sectionCls}>
              <div className="flex justify-end">
                <button type="button" onClick={() => removeEdu(i)} className="text-rose-400 hover:text-rose-300"><Trash2 size={14} /></button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input className={inputCls} placeholder="Degree (B.Tech)" {...register(`education.${i}.degree`)} />
                <input className={inputCls} placeholder="Institution" {...register(`education.${i}.institution`)} />
                <input type="number" className={inputCls} placeholder="Graduation Year" {...register(`education.${i}.year`)} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Projects */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <label className={labelCls}>Projects</label>
          <Button type="button" variant="secondary" size="sm" onClick={() => appendProj({ title: '', description: '' })}>
            <Plus size={14} /> Add
          </Button>
        </div>
        <div className="space-y-3">
          {projFields.map((f, i) => (
            <div key={f.id} className={sectionCls}>
              <div className="flex justify-end">
                <button type="button" onClick={() => removeProj(i)} className="text-rose-400 hover:text-rose-300"><Trash2 size={14} /></button>
              </div>
              <input className={inputCls} placeholder="Project Title" {...register(`projects.${i}.title`)} />
              <textarea rows={2} className={`${inputCls} resize-none`} placeholder="Short description…" {...register(`projects.${i}.description`)} />
            </div>
          ))}
        </div>
      </div>

      <Button type="submit" loading={isSubmitting || mutation.isPending} size="lg">
        <Save size={16} /> {isNew ? 'Create Resume' : 'Save Resume'}
      </Button>
    </form>
  );
}

export default function ResumePage() {
  const [tab, setTab] = useState('upload');

  const { data: resume, isLoading } = useQuery({
    queryKey: ['my-resume'],
    queryFn: () => resumeApi.get().then(r => r.data.data).catch(err => {
      if (err.response?.status === 404) return null;
      throw err;
    }),
  });

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto space-y-4">
        {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20" />)}
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-[#e2e8f0]">My Resume</h1>
        <p className="text-sm text-[#94a3b8] mt-1">Upload a PDF or build your resume manually</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-[#1e2a3d]">
        {[
          { id: 'upload', label: '📎 Upload PDF', icon: Upload },
          { id: 'manual', label: '✏️ Manual Edit', icon: Edit3 },
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

      <div>
        {tab === 'upload' && <UploadTab resume={resume} />}
        {tab === 'manual' && <ManualEditTab resume={resume} />}
      </div>
    </div>
  );
}
