// Reusable recruiter card component that displays applicant details and scores.
import { Link } from 'react-router-dom';
import {
  CheckCircle,
  XCircle,
  Star,
  Mail,
  Briefcase,
  FileText,
  Phone,
  MapPin,
  Calendar,
  GraduationCap,
  ArrowRight,
} from 'lucide-react';
import Badge from '../../../shared/ui/Badge';
import Button from '../../../shared/ui/Button';

const formatDate = (value) => {
  if (!value) return 'Date unavailable';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Date unavailable';

  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

const formatLooseDate = (value) => {
  if (!value) return '';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);

  return date.toLocaleDateString('en-IN', {
    month: 'short',
    year: 'numeric',
  });
};

const formatYears = (value) => {
  const years = Number(value ?? 0);
  if (!Number.isFinite(years) || years <= 0) return 'Fresher';
  return `${years} year${years === 1 ? '' : 's'} experience`;
};

const formatScore = (value) => {
  if (typeof value !== 'number' || Number.isNaN(value)) return null;
  return Math.round(value);
};

const formatEducation = (item) => {
  if (!item) return '';

  const parts = [item.degree, item.institution, item.year].filter(Boolean);
  return parts.join(' | ');
};

const formatExperience = (item) => {
  if (!item) return '';

  const parts = [item.role, item.company].filter(Boolean);
  return parts.join(' at ');
};

function SectionCard({ title, icon: Icon, children }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
      <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
        {Icon ? <Icon size={13} /> : null}
        <span>{title}</span>
      </div>
      {children}
    </div>
  );
}

export default function ApplicationCandidateCard({ app, onAction }) {
  const applicant = app.applicant || {};
  const applicantName = applicant.name || app.candidateName || 'Applicant';
  const applicantEmail = applicant.email || '';
  const applicantSkills = Array.isArray(applicant.skills) ? applicant.skills.slice(0, 8) : [];
  const remainingSkills = Math.max((applicant.skills?.length || 0) - applicantSkills.length, 0);
  const experienceList = Array.isArray(applicant.experience) ? applicant.experience.slice(0, 2) : [];
  const educationList = Array.isArray(applicant.education) ? applicant.education.slice(0, 2) : [];
  const aiScore = formatScore(app.aiScore);
  const hybridScore = formatScore(app.hybridScore);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 transition-all hover:border-slate-300">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-indigo-500/10 text-sm font-bold text-indigo-400">
              {applicantName[0]?.toUpperCase() || '?'}
            </div>
            <div className="min-w-0 space-y-1">
              <h3 className="text-lg font-semibold text-slate-900">{applicantName}</h3>
              {applicantEmail ? (
                <a
                  href={`mailto:${applicantEmail}`}
                  className="flex items-center gap-1.5 text-sm text-indigo-400 hover:underline"
                >
                  <Mail size={13} />
                  <span className="truncate">{applicantEmail}</span>
                </a>
              ) : (
                <p className="text-sm text-slate-500">Email unavailable</p>
              )}

              {app.job?.title ? (
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <Badge variant="default">{app.job.title}</Badge>
                  {app.job.companyName ? (
                    <span className="text-xs text-slate-500">{app.job.companyName}</span>
                  ) : null}
                  {app.job._id ? (
                    <Link
                      to={`/recruiter/jobs/${app.job._id}/applications`}
                      className="inline-flex items-center gap-1 text-xs font-medium text-indigo-400 hover:underline"
                    >
                      Open job view <ArrowRight size={12} />
                    </Link>
                  ) : null}
                </div>
              ) : null}
            </div>
          </div>

          <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-600">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1">
              <Briefcase size={12} />
              {formatYears(app.experienceYears ?? applicant.experienceYears)}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1">
              <Calendar size={12} />
              Applied {formatDate(app.appliedAt)}
            </span>
            {applicant.location ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1">
                <MapPin size={12} />
                {applicant.location}
              </span>
            ) : null}
            {applicant.resumeVerified ? <Badge variant="success">Resume Verified</Badge> : null}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 lg:justify-end">
          {hybridScore !== null ? <Badge variant="accent">Match {hybridScore}%</Badge> : null}
          {aiScore !== null ? <Badge variant="warning">AI {aiScore}%</Badge> : null}
          <Badge variant={app.status}>{app.status}</Badge>
        </div>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[1.5fr_1fr]">
        <div className="space-y-4">
          {applicant.summary ? (
            <SectionCard title="Profile Summary" icon={FileText}>
              <p className="text-sm leading-6 text-slate-600">{applicant.summary}</p>
            </SectionCard>
          ) : null}

          {app.message ? (
            <SectionCard title="Cover Message" icon={Mail}>
              <p className="text-sm leading-6 text-slate-600">{app.message}</p>
            </SectionCard>
          ) : null}

          {app.reason ? (
            <SectionCard title="AI Insight" icon={Star}>
              <p className="text-sm leading-6 text-slate-600">{app.reason}</p>
            </SectionCard>
          ) : null}

          {applicantSkills.length > 0 ? (
            <SectionCard title="Skills" icon={Briefcase}>
              <div className="flex flex-wrap gap-2">
                {applicantSkills.map((skill, index) => (
                  <Badge key={`${skill}-${app._id}-${index}`} variant="accent">{skill}</Badge>
                ))}
                {remainingSkills > 0 ? (
                  <Badge variant="default">+{remainingSkills} more</Badge>
                ) : null}
              </div>
            </SectionCard>
          ) : null}
        </div>

        <div className="space-y-4">
          {(applicant.phone || applicant.location || applicant.resumeUrl) ? (
            <SectionCard title="Contact & Resume" icon={FileText}>
              <div className="space-y-3">
                {applicant.phone ? (
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Phone size={13} className="text-slate-500" />
                    <span>{applicant.phone}</span>
                  </div>
                ) : null}
                {applicant.location ? (
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <MapPin size={13} className="text-slate-500" />
                    <span>{applicant.location}</span>
                  </div>
                ) : null}
                {applicant.resumeUrl ? (
                  <a
                    href={applicant.resumeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex h-8 items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-slate-100 px-3 text-xs font-semibold text-slate-900 transition-all hover:border-slate-300 hover:bg-slate-200"
                  >
                    <FileText size={13} />
                    <span>View Resume</span>
                  </a>
                ) : (
                  <p className="text-sm text-slate-500">No resume file available</p>
                )}
              </div>
            </SectionCard>
          ) : null}

          {educationList.length > 0 ? (
            <SectionCard title="Education" icon={GraduationCap}>
              <div className="space-y-2">
                {educationList.map((item, index) => (
                  <div key={`${item.degree || 'education'}-${index}`} className="rounded-lg bg-white px-3 py-2 text-sm text-slate-600 border border-slate-200">
                    {formatEducation(item)}
                  </div>
                ))}
              </div>
            </SectionCard>
          ) : null}

          {experienceList.length > 0 ? (
            <SectionCard title="Recent Experience" icon={Briefcase}>
              <div className="space-y-2">
                {experienceList.map((item, index) => (
                  <div key={`${item.role || 'experience'}-${index}`} className="rounded-lg bg-white px-3 py-2 text-sm text-slate-600 border border-slate-200">
                    <div>{formatExperience(item) || 'Experience added'}</div>
                    {item.startDate || item.endDate ? (
                      <div className="mt-1 text-xs text-slate-500">
                        {[formatLooseDate(item.startDate), formatLooseDate(item.endDate) || 'Present'].filter(Boolean).join(' - ')}
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            </SectionCard>
          ) : null}
        </div>
      </div>

      {app.status === 'pending' ? (
        <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-200 pt-4">
          <Button
            variant="success"
            size="sm"
            onClick={() => onAction(app._id, 'accepted')}
          >
            <CheckCircle size={13} />
            Accept
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={() => onAction(app._id, 'rejected')}
          >
            <XCircle size={13} />
            Reject
          </Button>
        </div>
      ) : null}

      {app.status === 'accepted' ? (
        <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-200 pt-4">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => onAction(app._id, 'pending')}
          >
            Undo Accept
          </Button>
        </div>
      ) : null}
    </div>
  );
}
