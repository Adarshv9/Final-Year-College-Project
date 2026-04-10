// Job seeker settings page for updating the account password.
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod/v4';
import { useMutation } from '@tanstack/react-query';
import { Lock, Shield } from 'lucide-react';
import toast from 'react-hot-toast';
import { usersApi } from '../../lib/api';
import Button from '../../shared/ui/Button';
import Alert from '../../shared/ui/Alert';

const schema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(6, 'New password must be at least 6 characters'),
  confirmPassword: z.string().min(1, 'Please confirm your password'),
}).refine(d => d.newPassword === d.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

export default function ChangePasswordPage() {
  const [success, setSuccess] = useState(false);

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
  });

  const mutation = useMutation({
    mutationFn: usersApi.changePassword,
    onSuccess: () => {
      setSuccess(true);
      reset();
      toast.success('Password changed successfully!');
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to change password');
    },
  });

  const inputCls = (hasError) => `w-full bg-[#0b0f1a] border rounded-lg px-4 py-2.5 text-sm text-[#e2e8f0] placeholder-[#64748b] outline-none focus:ring-2 transition-all ${hasError ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500/20' : 'border-[#1e2a3d] focus:border-indigo-500 focus:ring-indigo-500/20'}`;

  return (
    <div className="max-w-lg mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-[#e2e8f0] flex items-center gap-2">
          <Shield size={22} className="text-indigo-400" /> Change Password
        </h1>
        <p className="text-sm text-[#94a3b8] mt-1">Update your account password</p>
      </div>

      {success && (
        <Alert type="success">Password changed successfully! Your account is now secured with the new password.</Alert>
      )}

      <div className="bg-[#131929] border border-[#1e2a3d] rounded-2xl p-6">
        <form onSubmit={handleSubmit(d => mutation.mutate(d))} className="space-y-5">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-[#e2e8f0] flex items-center gap-2">
              <Lock size={14} /> Current Password
            </label>
            <input
              type="password"
              placeholder="Enter current password"
              className={inputCls(!!errors.currentPassword)}
              {...register('currentPassword')}
            />
            {errors.currentPassword && <p className="text-xs text-rose-400">{errors.currentPassword.message}</p>}
          </div>

          <div className="h-px bg-[#1e2a3d]" />

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-[#e2e8f0]">New Password</label>
            <input
              type="password"
              placeholder="At least 6 characters"
              className={inputCls(!!errors.newPassword)}
              {...register('newPassword')}
            />
            {errors.newPassword && <p className="text-xs text-rose-400">{errors.newPassword.message}</p>}
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-[#e2e8f0]">Confirm New Password</label>
            <input
              type="password"
              placeholder="Repeat new password"
              className={inputCls(!!errors.confirmPassword)}
              {...register('confirmPassword')}
            />
            {errors.confirmPassword && <p className="text-xs text-rose-400">{errors.confirmPassword.message}</p>}
          </div>

          <Button type="submit" full loading={isSubmitting || mutation.isPending} size="lg">
            Update Password
          </Button>
        </form>
      </div>
    </div>
  );
}
