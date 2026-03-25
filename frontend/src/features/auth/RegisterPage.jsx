import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod/v4';
import { Briefcase, Mail, Lock, Eye, EyeOff, User, Briefcase as BriefIcon } from 'lucide-react';
import toast from 'react-hot-toast';
import { authApi } from '../../lib/api';
import Button from '../../shared/ui/Button';

const schema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Enter a valid email'),
  password: z.string().min(6, 'At least 6 characters'),
  role: z.enum(['job_seeker', 'recruiter'], { error: 'Select a role' }),
});

export default function RegisterPage() {
  const [showPass, setShowPass] = useState(false);
  const navigate = useNavigate();

  const { register, handleSubmit, watch, setValue, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { role: 'job_seeker' },
  });

  const selectedRole = watch('role');

  const onSubmit = async (data) => {
    try {
      await authApi.register(data);
      toast.success('Account created! Please verify your email.');
      navigate('/verify-otp', { state: { email: data.email } });
    } catch (err) {
      const errors = err.response?.data?.errors;
      if (errors?.length) {
        errors.forEach(e => toast.error(e.message || e));
      } else {
        toast.error(err.response?.data?.message || 'Registration failed. Please try again.');
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0b0f1a] p-4 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-emerald-500/4 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-[480px] bg-[#131929] border border-[#1e2a3d] rounded-2xl p-8 shadow-2xl animate-fade-in">
        {/* Logo */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 bg-indigo-500 rounded-xl flex items-center justify-center">
            <Briefcase size={20} className="text-white" />
          </div>
          <span className="text-xl font-bold text-[#e2e8f0]">TalentBridge</span>
        </div>

        <h1 className="text-2xl font-bold text-[#e2e8f0] mb-1">Create an account</h1>
        <p className="text-sm text-[#94a3b8] mb-8">Join TalentBridge and start your journey</p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* Role Selection */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-[#e2e8f0]">I am a…</label>
            <div className="grid grid-cols-2 gap-3">
              {[
                { value: 'job_seeker', label: 'Job Seeker', icon: User, desc: 'Find your dream job' },
                { value: 'recruiter', label: 'Recruiter', icon: BriefIcon, desc: 'Hire top talent' },
              ].map(({ value, label, icon: Icon, desc }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setValue('role', value)}
                  className={[
                    'flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all duration-150 cursor-pointer',
                    selectedRole === value
                      ? 'border-indigo-500 bg-indigo-500/10'
                      : 'border-[#1e2a3d] bg-[#0b0f1a] hover:border-[#243047]',
                  ].join(' ')}
                >
                  <Icon size={20} className={selectedRole === value ? 'text-indigo-400' : 'text-[#64748b]'} />
                  <div>
                    <div className={`text-sm font-semibold ${selectedRole === value ? 'text-indigo-400' : 'text-[#e2e8f0]'}`}>{label}</div>
                    <div className="text-xs text-[#64748b]">{desc}</div>
                  </div>
                </button>
              ))}
            </div>
            <input type="hidden" {...register('role')} />
            {errors.role && <p className="text-xs text-rose-400">{errors.role.message}</p>}
          </div>

          {/* Name */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-[#e2e8f0]">Full name</label>
            <div className="relative">
              <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#64748b] pointer-events-none" />
              <input
                type="text"
                placeholder="John Doe"
                autoComplete="name"
                className={`w-full bg-[#0b0f1a] border rounded-lg pl-9 pr-3 py-2.5 text-sm text-[#e2e8f0] placeholder-[#64748b] outline-none transition-all focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 ${errors.name ? 'border-rose-500' : 'border-[#1e2a3d]'}`}
                {...register('name')}
              />
            </div>
            {errors.name && <p className="text-xs text-rose-400">{errors.name.message}</p>}
          </div>

          {/* Email */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-[#e2e8f0]">Email address</label>
            <div className="relative">
              <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#64748b] pointer-events-none" />
              <input
                type="email"
                placeholder="you@example.com"
                autoComplete="email"
                className={`w-full bg-[#0b0f1a] border rounded-lg pl-9 pr-3 py-2.5 text-sm text-[#e2e8f0] placeholder-[#64748b] outline-none transition-all focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 ${errors.email ? 'border-rose-500' : 'border-[#1e2a3d]'}`}
                {...register('email')}
              />
            </div>
            {errors.email && <p className="text-xs text-rose-400">{errors.email.message}</p>}
          </div>

          {/* Password */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-[#e2e8f0]">Password</label>
            <div className="relative">
              <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#64748b] pointer-events-none" />
              <input
                type={showPass ? 'text' : 'password'}
                placeholder="At least 6 characters"
                autoComplete="new-password"
                className={`w-full bg-[#0b0f1a] border rounded-lg pl-9 pr-10 py-2.5 text-sm text-[#e2e8f0] placeholder-[#64748b] outline-none transition-all focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 ${errors.password ? 'border-rose-500' : 'border-[#1e2a3d]'}`}
                {...register('password')}
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#64748b] hover:text-[#e2e8f0] transition-colors"
                onClick={() => setShowPass(p => !p)}
              >
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {errors.password && <p className="text-xs text-rose-400">{errors.password.message}</p>}
          </div>

          {selectedRole === 'recruiter' && (
            <div className="flex items-start gap-2 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg text-xs text-amber-400">
              <span className="mt-0.5">ℹ️</span>
              <span>Recruiter accounts require admin approval before login is granted.</span>
            </div>
          )}

          <Button type="submit" full loading={isSubmitting} size="lg">
            Create Account
          </Button>
        </form>

        <p className="text-center text-sm text-[#94a3b8] mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-indigo-400 font-medium hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
