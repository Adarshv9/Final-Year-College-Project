// Public page component for Landing.
import { createElement } from 'react';
import { Link } from 'react-router-dom';
import { Bot, Zap, ShieldCheck, TrendingUp, CheckCircle2, ArrowRight, Briefcase, Building2, UserCheck, Target } from 'lucide-react';
import Button from '../../shared/ui/Button';
import heroImage from '../../assets/hero.png';

// Render the hero section component.
function HeroSection() {
  const heroHighlights = [
  { icon: Bot, label: 'AI-ranked matches' },
  { icon: ShieldCheck, label: 'Verified recruiters' },
  { icon: TrendingUp, label: 'Faster shortlists' }];


  return (
    <section className="relative overflow-hidden border-b border-slate-200 bg-white pt-20 pb-16 lg:pt-24 lg:pb-20">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(99,102,241,0.14),transparent_42%),radial-gradient(circle_at_right,rgba(16,185,129,0.1),transparent_28%)]" />
      <div className="pointer-events-none absolute inset-x-0 top-8 flex justify-center">
        <img
          src={heroImage}
          alt=""
          className="w-[280px] max-w-[72vw] opacity-20 blur-[0.5px] sm:w-[340px] lg:mt-2 lg:w-[420px]"
          aria-hidden="true"
          style={{ maskImage: 'radial-gradient(circle at center, black 42%, transparent 78%)' }} />
        
      </div>
      <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-white via-white/90 to-transparent" />

      <div className="relative z-10 mx-auto max-w-6xl px-4 text-center">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-indigo-500/20 bg-white/80 px-3 py-1.5 text-sm font-medium text-indigo-700 backdrop-blur">
          <SparklesIcon className="h-4 w-4" />
          <span>AI-ranked hiring and job discovery</span>
        </div>

        <h1 className="mx-auto max-w-5xl text-5xl font-bold leading-[1.02] tracking-tight text-slate-900 sm:text-6xl lg:text-7xl">
          Find better-fit roles.
          <br className="hidden md:block" />
          <span className="bg-gradient-to-r from-indigo-500 via-sky-500 to-emerald-500 bg-clip-text text-transparent">
            Build better teams.
          </span>
        </h1>

        <p className="mx-auto mt-6 max-w-3xl text-lg leading-relaxed text-slate-600 sm:text-xl">
          CompasX helps candidates surface stronger opportunities and helps recruiters shortlist faster with AI scoring, verified profiles, and cleaner matching.
        </p>

        <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Link to="/jobs" className="w-full sm:w-auto">
            <Button variant="primary" size="lg" className="w-full px-8 sm:w-auto">
              Explore Jobs
            </Button>
          </Link>
          <Link to="/register?role=recruiter" className="w-full sm:w-auto">
            <Button variant="secondary" size="lg" className="group w-full gap-2 px-8 sm:w-auto">
              Recruiter Sign Up
              <ArrowRight size={18} className="text-slate-500 transition-all group-hover:translate-x-1 group-hover:text-slate-900" />
            </Button>
          </Link>
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          {heroHighlights.map(({ icon: Icon, label }) =>
          <div
            key={label}
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/85 px-4 py-2 text-sm font-medium text-slate-700 shadow-sm backdrop-blur">
            
              <Icon size={16} className="text-indigo-600" />
              <span>{label}</span>
            </div>
          )}
        </div>
      </div>
    </section>);

}

// Render the stats section component.
function StatsSection() {
  const stats = [
  {
    icon: Briefcase,
    label: 'Active jobs',
    value: '10,000+',
    description: 'Live roles across product, engineering, design, and operations.'
  },
  {
    icon: Building2,
    label: 'Hiring companies',
    value: '500+',
    description: 'Growing teams using CompasX to source and shortlist faster.'
  },
  {
    icon: UserCheck,
    label: 'Successful placements',
    value: '5,000+',
    description: 'Candidate and recruiter matches that moved into real hiring outcomes.'
  },
  {
    icon: Target,
    label: 'Match accuracy',
    value: '98%',
    description: 'AI ranking tuned to surface stronger fits with less manual review.'
  }];


  return (
    <section className="border-b border-slate-200 bg-slate-50 py-16">
      <div className="mx-auto max-w-7xl px-4">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-semibold uppercase text-indigo-600">Platform snapshot</p>
          <h2 className="mt-3 text-3xl font-bold text-slate-900 md:text-4xl">
            Real hiring momentum, not empty vanity numbers.
          </h2>
          <p className="mt-4 text-base leading-relaxed text-slate-600 md:text-lg">
            A quick look at the scale of open roles, recruiter activity, and matching performance across the platform.
          </p>
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map(({ icon: Icon, label, value, description }) =>
          <div
            key={label}
            className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-md">
            
              <div className="flex items-center justify-between gap-4">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                  <Icon size={20} />
                </div>
                <span className="text-xs font-semibold uppercase text-slate-400">Updated daily</span>
              </div>
              <div className="mt-6 text-4xl font-bold tracking-tight text-slate-900">{value}</div>
              <div className="mt-2 text-sm font-semibold uppercase text-slate-500">{label}</div>
              <p className="mt-3 text-sm leading-6 text-slate-600">{description}</p>
            </div>
          )}
        </div>
      </div>
    </section>);

}

// Render the feature card component.
function FeatureCard({ icon: Icon, title, description }) {
  return (
    <div className="group rounded-2xl border border-slate-200 bg-white p-8 transition-all duration-300 hover:border-indigo-500/40 hover:shadow-[0_8px_30px_rgb(99,102,241,0.12)]">
      <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-xl bg-slate-100 transition-colors group-hover:bg-indigo-500/15 group-hover:text-indigo-700">
        {createElement(Icon, { size: 28, className: 'text-slate-500 group-hover:text-indigo-700' })}
      </div>
      <h3 className="mb-3 text-xl font-semibold text-slate-900">{title}</h3>
      <p className="leading-relaxed text-slate-600">{description}</p>
    </div>);

}

// Render the features section component.
function FeaturesSection() {
  const features = [
  {
    icon: Bot,
    title: 'AI Resume Scoring',
    description: 'Our proprietary AI instantly analyzes and scores resumes against job requirements, saving recruiters hours of manual screening.'
  },
  {
    icon: Zap,
    title: 'Smart Matching Engine',
    description: 'Get personalized job recommendations based on your skills, experience, and career trajectory. Stop searching, start matching.'
  },
  {
    icon: ShieldCheck,
    title: 'Verified Opportunities',
    description: 'Every recruiter and company on CompasX is vetted to ensure a safe, high-quality environment for all job seekers.'
  },
  {
    icon: TrendingUp,
    title: 'Actionable Insights',
    description: 'Real-time analytics and application tracking so you never have to wonder where you stand in the hiring process.'
  }];


  return (
    <section id="features" className="relative py-24">
      <div className="mx-auto max-w-7xl px-4">
        <div className="mx-auto mb-16 max-w-3xl text-center">
          <h2 className="mb-6 text-3xl font-bold text-slate-900 md:text-4xl">Why choose CompasX?</h2>
          <p className="text-lg text-slate-600">
            We are redefining the recruitment landscape with cutting-edge technology that puts candidates first and makes hiring a breeze.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:gap-8">
          {features.map((feat, idx) =>
          <FeatureCard key={idx} {...feat} />
          )}
        </div>
      </div>
    </section>);

}

// Render the step item component.
function StepItem({ number, title, description }) {
  return (
    <div className="relative pb-12 pl-12 last:pb-0">
      <div className="absolute left-0 top-1 flex h-8 w-8 items-center justify-center rounded-full border border-indigo-500/30 bg-indigo-500/20 font-bold text-indigo-400">
        {number}
      </div>
      <div className="absolute left-[15px] top-11 bottom-0 w-[2px] bg-gradient-to-b from-indigo-500/30 to-transparent last:hidden" />
      <h3 className="mb-2 flex items-center gap-2 text-xl font-semibold text-slate-900">
        {title}
      </h3>
      <p className="text-slate-600">{description}</p>
    </div>);

}

// Render the how it works section component.
function HowItWorksSection() {
  return (
    <section className="bg-white py-24">
      <div className="mx-auto max-w-7xl px-4">
        <div className="grid items-center gap-16 lg:grid-cols-2">
          <div>
            <h2 className="mb-6 text-3xl font-bold text-slate-900 md:text-4xl">How it works</h2>
            <p className="mb-12 text-lg text-slate-600">
              Our streamlined process connects you with the perfect role in just a few simple steps. Let our AI do the heavy lifting.
            </p>

            <div className="max-w-md">
              <StepItem
                number="1"
                title="Create your profile"
                description="Sign up and upload your resume. Our system automatically parses and structures your data." />
              
              <StepItem
                number="2"
                title="Discover perfect matches"
                description="Browse opportunities curated specifically for your skill set or let the right companies find you." />
              
              <StepItem
                number="3"
                title="Apply & Get Hired"
                description="Apply with a single click and track your progress through our intuitive dashboard. No more black holes." />
              
            </div>
          </div>

          <div className="relative hidden lg:block">
            <div className="relative mx-auto aspect-square w-full max-w-md">
              <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-indigo-500/20 to-emerald-500/20 blur-3xl opacity-50" />
              <div className="absolute inset-4 flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white/80 shadow-2xl backdrop-blur-xl">
                <div className="flex h-12 items-center gap-2 border-b border-slate-200 bg-slate-50 px-4">
                  <div className="h-3 w-3 rounded-full bg-rose-500/50" />
                  <div className="h-3 w-3 rounded-full bg-amber-500/50" />
                  <div className="h-3 w-3 rounded-full bg-emerald-500/50" />
                </div>
                <div className="flex flex-1 flex-col gap-4 p-6">
                  <div className="h-6 w-1/3 animate-pulse rounded bg-slate-200" />
                  <div className="h-24 w-full animate-pulse rounded-lg bg-slate-200" />
                  <div className="flex h-24 w-full animate-pulse items-center gap-4 rounded-lg border border-indigo-500/20 bg-indigo-500/10 px-4">
                    <div className="h-10 w-10 rounded-full bg-indigo-500/30" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3 w-1/2 rounded bg-indigo-400/40" />
                      <div className="h-3 w-1/4 rounded bg-indigo-400/20" />
                    </div>
                    <CheckCircle2 className="text-indigo-400" />
                  </div>
                  <div className="h-24 w-full animate-pulse rounded-lg bg-slate-200" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>);

}

// Render the cta section component.
function CTASection() {
  return (
    <section className="border-t border-slate-200 bg-white py-16">
      <div className="mx-auto max-w-7xl px-4">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm font-medium text-slate-600">
              Start here
            </div>
            <h2 className="mt-4 text-3xl font-bold text-slate-900 md:text-4xl">
              One place to search roles or start hiring.
            </h2>
            <p className="mt-4 text-lg leading-relaxed text-slate-600">
              Browse current openings, create your profile, or open a recruiter account without leaving the homepage.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row lg:flex-shrink-0">
            <Link to="/jobs" className="w-full sm:w-auto">
              <Button variant="primary" size="lg" className="w-full px-8 sm:w-auto">
                Browse Jobs
              </Button>
            </Link>
            <Link to="/register?role=recruiter" className="w-full sm:w-auto">
              <Button variant="secondary" size="lg" className="w-full px-8 sm:w-auto">
                Recruiter Sign Up
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>);

}

// Render the sparkles icon component.
function SparklesIcon(props) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
      <path d="M5 3v4" />
      <path d="M19 17v4" />
      <path d="M3 5h4" />
      <path d="M17 19h4" />
    </svg>);

}

// Render the landing page.
export default function LandingPage() {
  return (
    <div className="flex flex-col bg-transparent">
      <HeroSection />
      <StatsSection />
      <FeaturesSection />
      <HowItWorksSection />
      <CTASection />
    </div>);

}