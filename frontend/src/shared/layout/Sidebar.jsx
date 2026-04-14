// Sidebar navigation that adapts links to the signed-in user role.
import { NavLink, useNavigate } from 'react-router-dom';
import {
  Briefcase, LayoutDashboard, Star, FileText, User,
  Plus, List, Users, ShieldCheck, LogOut, Building2,
  BookOpen,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import BrandLogo from '../ui/BrandLogo';

const NAV = {
  // The sidebar is configuration-driven so role menus stay centralized in one
  // place instead of being scattered across conditional JSX.
  job_seeker: [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/jobs', icon: Briefcase, label: 'Browse Jobs' },
    { to: '/recommended', icon: Star, label: 'Recommended' },
    { to: '/my-applications', icon: List, label: 'My Applications' },
    { to: '/resume', icon: FileText, label: 'My Resume' },
    { to: '/profile', icon: User, label: 'Profile' },
    { to: '/change-password', icon: ShieldCheck, label: 'Security' },
  ],
  recruiter: [
    { to: '/recruiter/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/recruiter/jobs', icon: Briefcase, label: 'My Jobs' },
    { to: '/recruiter/applications', icon: Users, label: 'Applications' },
    { to: '/recruiter/jobs/new', icon: Plus, label: 'Post a Job' },
    { to: '/recruiter/profile', icon: Building2, label: 'Company Profile' },
    { to: '/change-password', icon: ShieldCheck, label: 'Security' },
  ],
  admin: [
    { to: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/admin/recruiters', icon: ShieldCheck, label: 'Pending Recruiters' },
    { to: '/admin/users', icon: Users, label: 'Users' },
    { to: '/admin/resumes', icon: FileText, label: 'Resumes' },
    { to: '/change-password', icon: ShieldCheck, label: 'Security' },
    { to: '/jobs', icon: Briefcase, label: 'All Jobs' },
  ],
};

const ROLE_BADGE = {
  job_seeker: 'bg-indigo-500/10 text-indigo-700',
  recruiter: 'bg-emerald-500/10 text-emerald-700',
  admin: 'bg-amber-500/15 text-amber-800',
};

export default function Sidebar({ mobileOpen, onClose }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const links = NAV[user?.role] || [];

  const handleLogout = async () => {
    await logout();
    toast.success('Logged out successfully');
    navigate('/login');
  };

  const initials = user?.name
    // Fallback avatar keeps the footer usable even without uploaded photos.
    ? user.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
    : '?';

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-[99] lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={[
          'fixed top-0 left-0 h-screen w-[240px] bg-white border-r border-slate-200 z-[100]',
          'flex flex-col transition-transform duration-300',
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
        ].join(' ')}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 h-[60px] border-b border-slate-200 flex-shrink-0">
          <NavLink
            to="/"
            onClick={onClose}
            className="inline-flex items-center gap-2.5"
            aria-label="Go to home"
          >
            <BrandLogo imageClassName="h-7 w-auto" />
          </NavLink>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {links.map(({ to, icon, label }) => {
            const Icon = icon;

            return (
              <NavLink
                key={to}
                to={to}
                end={to !== '/jobs'}
                onClick={onClose}
                className={({ isActive }) => [
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150',
                  isActive
                    ? 'bg-indigo-500/10 text-indigo-700'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
                ].join(' ')}
              >
                <Icon size={17} className="flex-shrink-0" />
                <span>{label}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* User footer */}
        <div className="px-3 pb-4 pt-3 border-t border-slate-200">
          <div className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${ROLE_BADGE[user?.role] || 'bg-slate-100 text-slate-600'}`}>
              {initials}
            </div>
            <div className="flex-1 min-w-0 text-left">
              <div className="text-sm font-semibold text-slate-900 truncate">{user?.name || 'User'}</div>
              <div className="text-xs text-slate-500 capitalize">{user?.role?.replace('_', ' ')}</div>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="h-9 w-9 inline-flex items-center justify-center rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors flex-shrink-0"
              aria-label="Logout"
              title="Logout"
            >
              <LogOut size={14} />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
