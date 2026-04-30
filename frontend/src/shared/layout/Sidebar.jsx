// Sidebar navigation used inside the authenticated app layout.

import { useEffect, useMemo, useRef, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  Briefcase, LayoutDashboard, Star, FileText, User,
  Plus, List, Users, ShieldCheck, ChevronDown, Building2,
  Settings, Shield } from
'lucide-react';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import BrandLogo from '../ui/BrandLogo';

const NAV = {


  job_seeker: [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/jobs', icon: Briefcase, label: 'Browse Jobs' },
  { to: '/recommended', icon: Star, label: 'Recommended' },
  { to: '/my-applications', icon: List, label: 'My Applications' },
  { to: '/resume', icon: FileText, label: 'My Resume' }],

  recruiter: [
  { to: '/recruiter/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/recruiter/jobs', icon: Briefcase, label: 'My Jobs' },
  { to: '/recruiter/applications', icon: Users, label: 'Applications' },
  { to: '/recruiter/jobs/new', icon: Plus, label: 'Post a Job' },
  { to: '/recruiter/profile', icon: Building2, label: 'Company Profile' }],

  admin: [
  { to: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/admin/recruiters', icon: ShieldCheck, label: 'Pending Recruiters' },
  { to: '/admin/users', icon: Users, label: 'Users' },
  { to: '/admin/resumes', icon: FileText, label: 'Resumes' },
  { to: '/jobs', icon: Briefcase, label: 'All Jobs' }]

};

const ROLE_BADGE = {
  job_seeker: 'bg-indigo-500/10 text-indigo-700',
  recruiter: 'bg-emerald-500/10 text-emerald-700',
  admin: 'bg-amber-500/15 text-amber-800'
};

// Render the sidebar component.
export default function Sidebar({ mobileOpen, onClose }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const links = NAV[user?.role] || [];
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  // Handle logout.
  const handleLogout = async () => {
    await logout();
    toast.success('Logged out successfully');
    navigate('/login');
  };

  const profileTo = useMemo(() => {
    if (user?.role === 'recruiter') return '/recruiter/profile';
    if (user?.role === 'job_seeker') return '/profile';
    return null;
  }, [user?.role]);

  useEffect(() => {
    if (!menuOpen) return;

    // Handle pointer down.
    const onPointerDown = (e) => {
      if (!menuRef.current) return;
      if (menuRef.current.contains(e.target)) return;
      setMenuOpen(false);
    };

    window.addEventListener('pointerdown', onPointerDown);
    return () => window.removeEventListener('pointerdown', onPointerDown);
  }, [menuOpen]);

  const initials = user?.name ?

  user.name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase() :
  '?';

  return (
    <>
      
      {mobileOpen &&
      <div
        className="fixed inset-0 bg-black/60 z-[99] lg:hidden"
        onClick={onClose} />

      }

      <aside
        className={[
        'fixed top-0 left-0 h-screen w-[240px] bg-white border-r border-slate-200 z-[100]',
        'flex flex-col transition-transform duration-300',
        mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'].
        join(' ')}>
        
        
        <div className="flex items-center gap-3 px-5 h-[60px] border-b border-slate-200 flex-shrink-0">
          <NavLink
            to="/"
            onClick={onClose}
            className="inline-flex items-center gap-2.5"
            aria-label="Go to home">
            
            <BrandLogo imageClassName="h-7 w-auto" />
          </NavLink>
        </div>

        
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
                isActive ?
                'bg-indigo-500/10 text-indigo-700' :
                'text-slate-600 hover:bg-slate-100 hover:text-slate-900'].
                join(' ')}>
                
                <Icon size={17} className="flex-shrink-0" />
                <span>{label}</span>
              </NavLink>);

          })}
        </nav>

        
        <div className="px-3 pb-4 pt-3 border-t border-slate-200">
          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg hover:bg-slate-100 transition-colors"
              aria-haspopup="menu"
              aria-expanded={menuOpen}>
              
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${ROLE_BADGE[user?.role] || 'bg-slate-100 text-slate-600'}`}>
                {initials}
              </div>
              <div className="flex-1 min-w-0 text-left">
                <div className="text-sm font-semibold text-slate-900 truncate">{user?.name || 'User'}</div>
                <div className="text-xs text-slate-500 capitalize">{user?.role?.replace('_', ' ')}</div>
              </div>
              <ChevronDown size={16} className={`text-slate-400 transition-transform ${menuOpen ? 'rotate-180' : ''}`} />
            </button>

            {menuOpen &&
            <div
              role="menu"
              className="absolute left-0 right-0 bottom-full mb-2 rounded-2xl border border-slate-200 bg-white shadow-2xl overflow-hidden">
              
                <div className="px-4 py-3 border-b border-slate-200">
                  <div className="text-sm font-semibold text-slate-900 truncate">{user?.email || ''}</div>
                </div>

                <div className="py-2">
                  {profileTo &&
                <NavLink
                  to={profileTo}
                  onClick={() => {setMenuOpen(false);onClose?.();}}
                  className="px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-3"
                  role="menuitem">
                  
                      <User size={16} className="text-slate-500" />
                      Profile
                    </NavLink>
                }

                  <NavLink
                  to="/settings"
                  onClick={() => {setMenuOpen(false);onClose?.();}}
                  className="px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-3"
                  role="menuitem">
                  
                    <Settings size={16} className="text-slate-500" />
                    Settings
                  </NavLink>

                  <NavLink
                  to="/change-password"
                  onClick={() => {setMenuOpen(false);onClose?.();}}
                  className="px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-3"
                  role="menuitem">
                  
                    <Shield size={16} className="text-slate-500" />
                    Security
                  </NavLink>
                </div>

                <div className="border-t border-slate-200 p-2">
                  <button
                  type="button"
                  onClick={() => {setMenuOpen(false);void handleLogout();}}
                  className="w-full px-3 py-2.5 rounded-xl text-sm font-semibold text-indigo-600 hover:bg-indigo-500/10 transition-colors"
                  role="menuitem">
                  
                    Sign out
                  </button>
                </div>
              </div>
            }
          </div>
        </div>
      </aside>
    </>);

}