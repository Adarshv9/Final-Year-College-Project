// Account page component for Settings.
import { useMemo, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { usersApi } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import Button from '../../shared/ui/Button';
import Modal from '../../shared/ui/Modal';

const cardCls = 'bg-white border border-slate-200 rounded-2xl p-6';
const labelCls = 'text-sm font-medium text-slate-900';
const inputCls = 'w-full bg-white border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-900 placeholder-slate-400 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20';

// Handle To Account Type Label.
function roleToAccountTypeLabel(role) {
  if (role === 'recruiter') return 'Recruiter';
  if (role === 'job_seeker') return 'Jobseeker';
  return 'Jobseeker';
}

// Render the settings page.
export default function SettingsPage() {
  const { user, logout, updateUser } = useAuth();
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [role, setRole] = useState(user?.role || 'job_seeker');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmRole, setConfirmRole] = useState(null);

  const canSwitchRole = useMemo(() => user?.role !== 'admin', [user?.role]);
  const recruiterPending = user?.role === 'job_seeker' && user?.pendingRole === 'recruiter' && user?.approvalStatus === 'pending';

  const updateMutation = useMutation({
    mutationFn: (payload) => usersApi.updateMe(payload).then((r) => r.data.data),
    onSuccess: (updated) => {
      updateUser(updated);
      toast.success('Settings updated');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to update settings')
  });

  const accountTypeMutation = useMutation({
    mutationFn: (nextRole) => usersApi.updateMe({ role: nextRole }).then((r) => r.data.data),
    onSuccess: (updated) => {
      updateUser(updated);
      toast.success(updated?.pendingRole === 'recruiter' ? 'Recruiter request submitted' : 'Account type updated');
      setConfirmOpen(false);
      setConfirmRole(null);
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to update account type')
  });

  const closeAccountMutation = useMutation({
    mutationFn: () => usersApi.deleteMe(),
    onSuccess: async () => {
      toast.success('Account closed');
      await logout();
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to close account')
  });

  // Handle save contact.
  const handleSaveContact = () => {
    updateMutation.mutate({
      email: email.trim(),
      phone: phone.trim()
    });
  };

  // Handle save account type.
  const handleSaveAccountType = () => {
    if (!canSwitchRole) return;

    if (recruiterPending) {
      toast('Recruiter request is pending admin approval.');
      return;
    }

    if (role === user?.role) {
      toast('No changes to account type');
      return;
    }
    setConfirmRole(role);
    setConfirmOpen(true);
  };

  // Handle cancel recruiter request.
  const handleCancelRecruiterRequest = () => {
    updateMutation.mutate({ role: 'job_seeker' });
  };

  // Handle sign out.
  const handleSignOut = async () => {
    await logout();
    toast.success('Signed out');
  };

  // Handle close account.
  const handleCloseAccount = () => {
    const ok = window.confirm('Close your account permanently? This cannot be undone.');
    if (!ok) return;
    closeAccountMutation.mutate();
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Account settings</h1>
        <p className="text-sm text-slate-600 mt-1">Manage your account type, contact info, and security actions.</p>
      </div>

      <Modal
        isOpen={confirmOpen}
        onClose={() => {
          if (accountTypeMutation.isPending) return;
          setConfirmOpen(false);
        }}
        title="Confirm account type change"
        size="sm"
        footer={
        <>
            <Button
            type="button"
            variant="secondary"
            onClick={() => {
              if (accountTypeMutation.isPending) return;
              setConfirmOpen(false);
              setConfirmRole(null);
            }}
            disabled={accountTypeMutation.isPending}>
            
              Cancel
            </Button>
            <Button
            type="button"
            loading={accountTypeMutation.isPending}
            onClick={() => {
              if (!confirmRole) return;
              accountTypeMutation.mutate(confirmRole);
            }}>
            
              Confirm change
            </Button>
          </>
        }>
        
        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-200 overflow-hidden">
            <div className="px-4 py-3 flex items-center justify-between bg-slate-50">
              <span className="text-sm text-slate-600">Current</span>
              <span className="text-sm font-semibold text-slate-900">{roleToAccountTypeLabel(user?.role)}</span>
            </div>
            <div className="px-4 py-3 flex items-center justify-between">
              <span className="text-sm text-slate-600">New</span>
              <span className="text-sm font-semibold text-slate-900">{roleToAccountTypeLabel(confirmRole)}</span>
            </div>
          </div>

          {confirmRole === 'recruiter' &&
          <div className="rounded-2xl bg-amber-500/10 border border-amber-200 px-4 py-3 text-sm text-amber-900 leading-relaxed">
              Recruiter accounts require <span className="font-semibold">admin approval</span>. Your account will stay <span className="font-semibold">Jobseeker</span> until approved.
            </div>
          }

          <p className="text-xs text-slate-500">
            You can change this later in Settings.
          </p>
        </div>
      </Modal>

      <section className={cardCls}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold text-slate-900">Account type</h2>
            <p className="text-sm text-slate-600 mt-1">Current: {roleToAccountTypeLabel(user?.role)}</p>
          </div>
        </div>

        <div className="mt-4 grid gap-3">
          <label className={labelCls}>Choose account type</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              disabled={!canSwitchRole}
              onClick={() => setRole('job_seeker')}
              className={[
              'text-left rounded-xl border p-4 transition-colors',
              role === 'job_seeker' ? 'border-indigo-500 bg-indigo-500/5' : 'border-slate-200 hover:bg-slate-50',
              !canSwitchRole ? 'opacity-60 cursor-not-allowed' : ''].
              join(' ')}>
              
              <div className="font-semibold text-slate-900">Jobseeker</div>
              <div className="text-sm text-slate-600 mt-1">Find jobs and apply faster.</div>
            </button>

            <button
              type="button"
              disabled={!canSwitchRole || recruiterPending}
              onClick={() => setRole('recruiter')}
              className={[
              'text-left rounded-xl border p-4 transition-colors',
              role === 'recruiter' ? 'border-indigo-500 bg-indigo-500/5' : 'border-slate-200 hover:bg-slate-50',
              recruiterPending ? 'opacity-80 cursor-not-allowed' : '',
              !canSwitchRole ? 'opacity-60 cursor-not-allowed' : ''].
              join(' ')}>
              
              <div className="flex items-center justify-between gap-2">
                <div className="font-semibold text-slate-900">Recruiter</div>
                {recruiterPending &&
                <span className="text-[11px] font-semibold px-2 py-1 rounded-full bg-amber-500/15 text-amber-800">
                    Pending approval
                  </span>
                }
              </div>
              <div className="text-sm text-slate-600 mt-1">
                {recruiterPending ? 'Waiting for admin to approve your recruiter request.' : 'Post jobs and manage applicants.'}
              </div>
            </button>
          </div>

          <div className="pt-2">
            <Button
              type="button"
              onClick={handleSaveAccountType}
              loading={updateMutation.isPending}
              disabled={!canSwitchRole || recruiterPending}>
              
              Change account type
            </Button>
            {recruiterPending &&
            <div className="mt-3">
                <Button
                type="button"
                variant="secondary"
                onClick={handleCancelRecruiterRequest}
                loading={updateMutation.isPending}>
                
                  Cancel recruiter request
                </Button>
              </div>
            }
          </div>
        </div>
      </section>

      <section className={cardCls}>
        <h2 className="text-base font-semibold text-slate-900">Contact</h2>
        <div className="mt-4 grid gap-4">
          <div className="grid gap-1.5">
            <label className={labelCls}>Email</label>
            <input value={email} onChange={(e) => setEmail(e.target.value)} className={inputCls} placeholder="you@example.com" />
          </div>

          <div className="grid gap-1.5">
            <label className={labelCls}>Phone number</label>
            <input value={phone} onChange={(e) => setPhone(e.target.value)} className={inputCls} placeholder="Add phone number" />
          </div>

          <div className="pt-1">
            <Button type="button" onClick={handleSaveContact} loading={updateMutation.isPending}>
              Save contact info
            </Button>
          </div>
        </div>
      </section>

      <section className={cardCls}>
        <h2 className="text-base font-semibold text-slate-900">Sign out</h2>
        <p className="text-sm text-slate-600 mt-1">Sign out from this device.</p>
        <div className="mt-4">
          <Button type="button" variant="secondary" onClick={handleSignOut}>
            Sign out
          </Button>
        </div>
      </section>

      <section className={[cardCls, 'border-rose-200'].join(' ')}>
        <h2 className="text-base font-semibold text-rose-600">Close my account</h2>
        <p className="text-sm text-slate-600 mt-1">Permanently delete your account.</p>
        <div className="mt-4">
          <Button
            type="button"
            variant="danger"
            onClick={handleCloseAccount}
            loading={closeAccountMutation.isPending}>
            
            Close my account
          </Button>
        </div>
      </section>
    </div>);

}