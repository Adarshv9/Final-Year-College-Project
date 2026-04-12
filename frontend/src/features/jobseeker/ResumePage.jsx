// Job seeker resume page for PDF upload, manual editing, and resume management.
import { useEffect, useRef, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, useFieldArray } from 'react-hook-form';
import { Upload, Trash2, Edit3, Plus, Save, Download, CheckCircle2, Clock, Paperclip } from 'lucide-react';
import toast from 'react-hot-toast';
import { resumeApi } from '../../lib/api';
import Button from '../../shared/ui/Button';
import { Skeleton } from '../../shared/ui/Skeleton';
import TagInput from '../../shared/ui/TagInput';
import Alert from '../../shared/ui/Alert';

const RESUME_PROCESS_STEPS = [
  {
    title: 'Uploading PDF',
    description: 'Sending your file securely to the server',
  },
  {
    title: 'Extracting text',
    description: 'Reading the PDF and extracting resume content',
  },
  {
    title: 'Parsing with AI',
    description: 'Structuring skills, experience, education, and projects',
  },
  {
    title: 'Saving resume',
    description: 'Updating your profile and storing the source PDF',
  },
];

function getUploadStatusText(step, progress) {
  if (step === 0) {
    return progress > 0 && progress < 100
      ? `Uploading PDF (${progress}%)`
      : 'Uploading PDF...';
  }
  if (step === 1) return 'Extracting text from PDF...';
  if (step === 2) return 'Parsing resume with AI...';
  return 'Saving resume to your profile...';
}

function UploadTab({ resume, file, setFile, uploadMutation, uploadProgress, uploadStep, aiSlow, onCancelUpload }) {
  const qc = useQueryClient();
  const fileRef = useRef(null);
  const [dragging, setDragging] = useState(false);
  const isUploading = uploadMutation.isPending;
  const statusText = getUploadStatusText(uploadStep, uploadProgress);

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
    if (isUploading) return;
    // Mirror backend upload limits here so validation feels instant.
    if (f.type !== 'application/pdf') { toast.error('Only PDF files allowed'); return; }
    if (f.size > 2 * 1024 * 1024) { toast.error('Max file size is 2 MB'); return; }
    setFile(f);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    if (isUploading) return;
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
              {resume.isVerified && <div className="text-xs text-emerald-400 flex items-center gap-1"><CheckCircle2 size={11} /> Verified by admin</div>}
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
              disabled={isUploading}
              onClick={() => deleteMutation.mutate()}
            >
              <Trash2 size={13} /> Remove
            </Button>
          </div>
        </div>
      ) : null}

      {/* Drop zone */}
      <div
        className={`border-2 border-dashed rounded-xl p-8 text-center transition-all ${isUploading ? 'opacity-60 cursor-not-allowed border-[#1e2a3d]' : dragging ? 'border-indigo-500 bg-indigo-500/5 cursor-pointer' : 'border-[#1e2a3d] hover:border-[#243047] cursor-pointer'}`}
        onClick={() => { if (!isUploading) fileRef.current?.click(); }}
        onDragOver={(e) => {
          e.preventDefault();
          if (isUploading) return;
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
      >
        <Upload size={28} className={`mx-auto mb-3 ${dragging && !isUploading ? 'text-indigo-400' : 'text-[#64748b]'}`} />
        <p className="text-sm font-medium text-[#e2e8f0] mb-1">
          {file ? file.name : 'Drop your resume here or click to browse'}
        </p>
        <p className="text-xs text-[#64748b]">
          {isUploading ? statusText : 'PDF only, max 2 MB'}
        </p>
        <input
          ref={fileRef}
          type="file"
          accept="application/pdf"
          className="hidden"
          disabled={isUploading}
          onChange={e => handleFile(e.target.files[0])}
        />
      </div>

      {isUploading && (
        <Alert type="info">
          <div className="space-y-4">
            <div>
              <div className="font-semibold text-[#e2e8f0]">Processing your resume</div>
              <p className="mt-1 text-xs text-indigo-200/80">
                We upload the PDF, extract the text, parse it with AI, and then save the structured resume.
              </p>
            </div>

            {/* Slow AI warning */}
            {aiSlow && uploadStep === 2 && (
              <div className="text-xs text-amber-300/90 bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2 flex items-center gap-2">
                <Clock size={13} className="flex-shrink-0 text-amber-400" />
                The AI is taking longer than usual — free models can queue. Please keep the tab open and wait.
              </div>
            )}

            <div className="space-y-3">
              {RESUME_PROCESS_STEPS.map((step, index) => {
                const isCompleted = index < uploadStep;
                const isActive = index === uploadStep;
                const title =
                  index === 0 && isActive && uploadProgress > 0 && uploadProgress < 100
                    ? `${step.title} (${uploadProgress}%)`
                    : step.title;

                return (
                  <div key={step.title} className="flex items-start gap-3">
                    <div className="mt-0.5 flex-shrink-0">
                      {isCompleted ? (
                        <CheckCircle2 size={16} className="text-emerald-300" />
                      ) : (
                        <span
                          className={[
                            'block h-3 w-3 rounded-full border',
                            isActive
                              ? 'border-indigo-200 bg-indigo-300 animate-pulse'
                              : 'border-indigo-200/40 bg-transparent',
                          ].join(' ')}
                        />
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className={isActive ? 'text-[#e2e8f0] font-medium' : 'text-indigo-100/90'}>
                        {title}
                      </div>
                      <div className="text-xs text-indigo-200/70">{step.description}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </Alert>
      )}

      {file && (
        isUploading ? (
          <div className="flex gap-3">
            <Button
              className="flex-1"
              loading={uploadMutation.isPending}
              onClick={() => uploadMutation.mutate(file)}
            >
              <Upload size={14} /> {statusText}
            </Button>
            <Button
              variant="secondary"
              onClick={onCancelUpload}
            >
              Cancel Upload
            </Button>
          </div>
        ) : (
          <Button
            full
            loading={uploadMutation.isPending}
            onClick={() => uploadMutation.mutate(file)}
          >
            <Upload size={14} /> Upload Resume
          </Button>
        )
      )}
    </div>
  );
}

function ManualEditTab({ resume }) {
  const qc = useQueryClient();
  const [skills, setSkills] = useState(resume?.skills || []);

  const { register, handleSubmit, control, formState: { isSubmitting } } = useForm({
    // `values` rehydrates the editor whenever a saved resume is fetched or refreshed.
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
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStep, setUploadStep] = useState(0);
  const [aiSlow, setAiSlow] = useState(false);
  const qc = useQueryClient();
  const abortControllerRef = useRef(null);

  const resetUploadState = () => {
    setUploadProgress(0);
    setUploadStep(0);
    setAiSlow(false);
  };

  const handleCancelUpload = () => {
    abortControllerRef.current?.abort();
  };

  const uploadMutation = useMutation({
    mutationFn: (file) => {
      const controller = new AbortController();
      abortControllerRef.current = controller;
      resetUploadState();
      const fd = new FormData();
      fd.append('resume', file);
      return resumeApi.upload(fd, {
        signal: controller.signal,
        onUploadProgress: (event) => {
          if (!event.total) return;
          const nextProgress = Math.min(100, Math.round((event.loaded / event.total) * 100));
          setUploadProgress(nextProgress);
        },
      });
    },
    onSuccess: () => {
      toast.success('Resume uploaded!');
      setUploadFile(null);
      resetUploadState();
      qc.invalidateQueries({ queryKey: ['my-resume'] });
    },
    onError: (err) => {
      resetUploadState();
      if (err?.code === 'ERR_CANCELED') {
        toast('Resume upload canceled');
        return;
      }
      toast.error(err.response?.data?.message || 'Upload failed');
    },
    onSettled: () => {
      abortControllerRef.current = null;
    },
  });

  useEffect(() => {
    if (!uploadMutation.isPending) return undefined;
    if (uploadProgress < 100) {
      setUploadStep(0);
      return undefined;
    }

    // PDF reached server — start the server-side pipeline steps
    setUploadStep(1);

    // Step 1 (text extraction) is fast — advance to AI parsing after ~1.5s
    const extractTimer = setTimeout(() => setUploadStep(2), 1500);

    // Step 2 (AI) can take 30-60s on a free model.
    // Show a "taking longer than usual" warning after 15s.
    // Do NOT auto-advance to "Saving" — only advance when the response truly arrives.
    const slowTimer = setTimeout(() => setAiSlow(true), 16_500);

    return () => {
      clearTimeout(extractTimer);
      clearTimeout(slowTimer);
    };
  }, [uploadMutation.isPending, uploadProgress]);

  // When the mutation finally resolves (AI done + saved), bump to the last step briefly
  useEffect(() => {
    if (uploadMutation.isSuccess) {
      setUploadStep(3);
    }
  }, [uploadMutation.isSuccess]);

  useEffect(() => () => {
    abortControllerRef.current?.abort();
  }, []);

  const { data: resume, isLoading } = useQuery({
    queryKey: ['my-resume'],
    queryFn: () => resumeApi.get().then(r => r.data.data).catch(err => {
      // A missing resume is a normal empty state for new users.
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
        <p className="text-sm text-[#94a3b8] mt-1">This is the resume document shown to recruiters when you apply for jobs.</p>
      </div>

      <Alert type="info">
        This page manages the actual document recruiters see.
      </Alert>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-[#1e2a3d]">
        {[
          { id: 'upload', label: 'Upload PDF', icon: Paperclip },
          { id: 'manual', label: 'Manual Edit', icon: Edit3 },
        ].map(t => (
          <button
            key={t.id}
            disabled={uploadMutation.isPending}
            onClick={() => setTab(t.id)}
            className={[
              'flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-all disabled:opacity-60 disabled:cursor-not-allowed',
              tab === t.id ? 'text-indigo-400 border-indigo-500' : 'text-[#64748b] border-transparent hover:text-[#94a3b8]',
            ].join(' ')}
          >
            <t.icon size={14} />
            {t.label}
          </button>
        ))}
      </div>

      <div>
        {tab === 'upload' && (
          <UploadTab
            resume={resume}
            file={uploadFile}
            setFile={setUploadFile}
            uploadMutation={uploadMutation}
            uploadProgress={uploadProgress}
            uploadStep={uploadStep}
            aiSlow={aiSlow}
            onCancelUpload={handleCancelUpload}
          />
        )}
        {tab === 'manual' && <ManualEditTab resume={resume} />}
      </div>
    </div>
  );
}
