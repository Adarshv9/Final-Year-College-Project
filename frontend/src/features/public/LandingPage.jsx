import { createElement } from 'react';
import { Link } from 'react-router-dom';
import { Bot, Zap, ShieldCheck, TrendingUp, Search, Briefcase, FileText, CheckCircle2, ArrowRight } from 'lucide-react';
import Button from '../../shared/ui/Button';

function HeroSection() {
  return (
    <section className="relative overflow-hidden pt-24 pb-32 lg:pt-36 lg:pb-40">
      {/* Background decorations */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-indigo-500/20 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-emerald-500/10 blur-[100px] rounded-full pointer-events-none" />
      
      <div className="relative max-w-7xl mx-auto px-4 text-center z-10">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-700 text-sm font-medium mb-8">
          <SparklesIcon className="w-4 h-4" />
          <span>AI-Powered Job Matching</span>
        </div>
        
        <h1 className="text-5xl lg:text-7xl font-bold text-slate-900 tracking-tight mb-8 leading-tight">
          Find your next career move
          <br className="hidden md:block" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-emerald-400"> with intelligent precision.</span>
        </h1>
        
        <p className="text-lg text-slate-600 max-w-2xl mx-auto mb-10 leading-relaxed">
          Experience the future of hiring. CompasX uses advanced AI to match top-tier candidates with innovative companies faster and with sharper precision.
        </p>
        
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link to="/jobs" className="w-full sm:w-auto">
            <Button variant="primary" size="lg" className="w-full sm:w-auto px-8">
              Explore Jobs
            </Button>
          </Link>
          <Link to="/register" className="w-full sm:w-auto">
            <Button variant="secondary" size="lg" className="w-full sm:w-auto px-8 gap-2 group">
              Hire Talent
              <ArrowRight size={18} className="group-hover:translate-x-1 text-slate-500 group-hover:text-slate-900 transition-all transform" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}

function StatsSection() {
  const stats = [
    { label: 'Active Jobs', value: '10,000+' },
    { label: 'Hiring Companies', value: '500+' },
    { label: 'Successful Placements', value: '5,000+' },
    { label: 'Match Accuracy', value: '98%' },
  ];

  return (
    <section className="border-y border-slate-200 bg-white/60">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat, idx) => (
            <div key={idx} className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-slate-900 mb-2">{stat.value}</div>
              <div className="text-sm font-medium text-slate-500 uppercase tracking-wider">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FeatureCard({ icon: Icon, title, description }) {
  return (
    <div className="p-8 rounded-2xl bg-white border border-slate-200 hover:border-indigo-500/40 hover:shadow-[0_8px_30px_rgb(99,102,241,0.12)] transition-all duration-300 group">
      <div className="w-14 h-14 bg-slate-100 rounded-xl flex items-center justify-center mb-6 group-hover:bg-indigo-500/15 group-hover:text-indigo-700 transition-colors">
        {createElement(Icon, { size: 28, className: 'text-slate-500 group-hover:text-indigo-700' })}
      </div>
      <h3 className="text-xl font-semibold text-slate-900 mb-3">{title}</h3>
      <p className="text-slate-600 leading-relaxed">{description}</p>
    </div>
  );
}

function FeaturesSection() {
  const features = [
    {
      icon: Bot,
      title: 'AI Resume Scoring',
      description: 'Our proprietary AI instantly analyzes and scores resumes against job requirements, saving recruiters hours of manual screening.',
    },
    {
      icon: Zap,
      title: 'Smart Matching Engine',
      description: 'Get personalized job recommendations based on your skills, experience, and career trajectory. Stop searching, start matching.',
    },
    {
      icon: ShieldCheck,
      title: 'Verified Opportunities',
      description: 'Every recruiter and company on CompasX is vetted to ensure a safe, high-quality environment for all job seekers.',
    },
    {
      icon: TrendingUp,
      title: 'Actionable Insights',
      description: 'Real-time analytics and application tracking so you never have to wonder where you stand in the hiring process.',
    },
  ];

  return (
    <section id="features" className="py-24 relative">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-6">Why choose CompasX?</h2>
          <p className="text-slate-600 text-lg">
            We are redefining the recruitment landscape with cutting-edge technology that puts candidates first and makes hiring a breeze.
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 gap-6 lg:gap-8">
          {features.map((feat, idx) => (
            <FeatureCard key={idx} {...feat} />
          ))}
        </div>
      </div>
    </section>
  );
}

function StepItem({ number, title, description }) {
  return (
    <div className="relative pl-12 pb-12 last:pb-0">
      <div className="absolute left-0 top-1 w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold border border-indigo-500/30">
        {number}
      </div>
      <div className="absolute left-[15px] top-11 bottom-0 w-[2px] bg-gradient-to-b from-indigo-500/30 to-transparent last:hidden" />
      <h3 className="text-xl font-semibold text-slate-900 mb-2 flex items-center gap-2">
        {title}
      </h3>
      <p className="text-slate-600">{description}</p>
    </div>
  );
}

function HowItWorksSection() {
  return (
    <section className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-6">How it works</h2>
            <p className="text-slate-600 text-lg mb-12">
              Our streamlined process connects you with the perfect role in just a few simple steps. Let our AI do the heavy lifting.
            </p>
            
            <div className="max-w-md">
              <StepItem 
                number="1" 
                title="Create your profile" 
                description="Sign up and upload your resume. Our system automatically parses and structures your data."
                icon={FileText}
              />
              <StepItem 
                number="2" 
                title="Discover perfect matches" 
                description="Browse opportunities curated specifically for your skill set or let the right companies find you."
                icon={Search}
              />
              <StepItem 
                number="3" 
                title="Apply & Get Hired" 
                description="Apply with a single click and track your progress through our intuitive dashboard. No more black holes."
                icon={CheckCircle2}
              />
            </div>
          </div>
          
          <div className="relative hidden lg:block">
            {/* Abstract visual representation of UI */}
            <div className="relative w-full aspect-square max-w-md mx-auto">
              <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/20 to-emerald-500/20 rounded-full blur-3xl opacity-50" />
              <div className="absolute inset-4 border border-slate-200 bg-white/80 backdrop-blur-xl rounded-2xl shadow-2xl overflow-hidden flex flex-col">
                <div className="h-12 border-b border-slate-200 flex items-center px-4 gap-2 bg-slate-50">
                  <div className="w-3 h-3 rounded-full bg-rose-500/50" />
                  <div className="w-3 h-3 rounded-full bg-amber-500/50" />
                  <div className="w-3 h-3 rounded-full bg-emerald-500/50" />
                </div>
                <div className="flex-1 p-6 flex flex-col gap-4">
                  <div className="w-1/3 h-6 rounded bg-slate-200 animate-pulse" />
                  <div className="w-full h-24 rounded-lg bg-slate-200 animate-pulse" />
                  <div className="w-full h-24 rounded-lg bg-indigo-500/10 border border-indigo-500/20 animate-pulse flex items-center gap-4 px-4">
                     <div className="w-10 h-10 rounded-full bg-indigo-500/30" />
                     <div className="flex-1 space-y-2">
                        <div className="w-1/2 h-3 rounded bg-indigo-400/40" />
                        <div className="w-1/4 h-3 rounded bg-indigo-400/20" />
                     </div>
                     <CheckCircle2 className="text-indigo-400" />
                  </div>
                  <div className="w-full h-24 rounded-lg bg-slate-200 animate-pulse" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function CTASection() {
  return (
    <section className="py-24 relative overflow-hidden">
      <div className="absolute inset-0 bg-indigo-600 border-t border-slate-200/40" />
      {/* Pure CSS grain overlay — no external request */}
      <div
        className="absolute inset-0 opacity-[0.15] mix-blend-overlay"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'repeat',
          backgroundSize: '128px 128px',
        }}
      />
      <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-emerald-400/30 to-transparent" />

      <div className="relative max-w-4xl mx-auto px-4 text-center z-10 py-16">
        <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">Ready to accelerate your career?</h2>
        <p className="text-indigo-100 text-lg mb-10 max-w-2xl mx-auto">
          Join professionals and hiring teams already using CompasX to make shortlisting and hiring more intelligent.
        </p>
        <Link to="/register">
          <Button variant="secondary" size="lg" className="bg-white text-indigo-600 hover:bg-gray-100 hover:text-indigo-700 border-none px-10 py-4 shadow-xl text-base">
            Create Your Free Account
          </Button>
        </Link>
      </div>
    </section>
  );
}

function SparklesIcon(props) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
      <path d="M5 3v4" />
      <path d="M19 17v4" />
      <path d="M3 5h4" />
      <path d="M17 19h4" />
    </svg>
  );
}

export default function LandingPage() {
  return (
    <div className="flex flex-col bg-transparent">
      <HeroSection />
      <StatsSection />
      <FeaturesSection />
      <HowItWorksSection />
      <CTASection />
    </div>
  );
}
