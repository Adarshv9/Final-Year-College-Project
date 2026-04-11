// Login page that authenticates users and redirects them into the correct role area.
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod/v4';
import { Briefcase, Mail, Lock, Eye, EyeOff, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { authApi } from '../../lib/api';
import Button from '../../shared/ui/Button';

const schema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export default function LoginPage() {
  const [showPass, setShowPass] = useState(false);
  const [pendingApproval, setPendingApproval] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data) => {
    try {
      // 1. POST login - backend sets httpOnly cookies
      await authApi.login(data);
      // 2. Hydrate user from /auth/me
      const user = await login();
      toast.success(`Welcome back, ${user.name}!`);
      if (user.role === 'recruiter') navigate('/recruiter/dashboard');
      else if (user.role === 'admin') navigate('/admin/dashboard');
      else navigate('/dashboard');
    } catch (err) {
      const status = err.response?.status;
      const message = err.response?.data?.message || 'Login failed. Please try again.';
      // Recruiter pending approval 403
      if (status === 403 && message.toLowerCase().includes('approv')) {
        setPendingApproval(true);
      } else {
        toast.error(message);
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0b0f1a] p-4 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-emerald-500/4 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-[440px] bg-[#131929] border border-[#1e2a3d] rounded-2xl p-8 shadow-2xl animate-fade-in">
        {/* Logo */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 bg-indigo-500 rounded-xl flex items-center justify-center">
            <Briefcase size={20} className="text-white" />
          </div>
          <span className="text-xl font-bold text-[#e2e8f0]">TalentBridge</span>
        </div>

        <h1 className="text-2xl font-bold text-[#e2e8f0] mb-1">Welcome back</h1>
        <p className="text-sm text-[#94a3b8] mb-8">Sign in to your account to continue</p>

        {pendingApproval && (
          <div className="flex items-start gap-3 p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-300 text-sm mb-6">
            <AlertTriangle size={16} className="text-amber-400 mt-0.5 flex-shrink-0" />
            <div>
              <div className="font-semibold mb-1">Account Pending Approval</div>
              <div className="text-amber-400/80">Your recruiter account is awaiting admin approval. You'll be notified once approved.</div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
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
                placeholder="••••••••"
                autoComplete="current-password"
                className={`w-full bg-[#0b0f1a] border rounded-lg pl-9 pr-10 py-2.5 text-sm text-[#e2e8f0] placeholder-[#64748b] outline-none transition-all focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 ${errors.password ? 'border-rose-500' : 'border-[#1e2a3d]'}`}
                {...register('password')}
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#64748b] hover:text-[#e2e8f0] transition-colors"
                onClick={() => setShowPass(p => !p)}
                aria-label={showPass ? 'Hide password' : 'Show password'}
              >
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {errors.password && <p className="text-xs text-rose-400">{errors.password.message}</p>}
          </div>

          <Button type="submit" full loading={isSubmitting} size="lg" className="mt-2">
            Sign In
          </Button>
        </form>

        <p className="text-center text-sm text-[#94a3b8] mt-6">
          Don&apos;t have an account?{' '}
          <Link to="/register" className="text-indigo-400 font-medium hover:underline">Create one</Link>
        </p>
      </div>
    </div>
  );
}
