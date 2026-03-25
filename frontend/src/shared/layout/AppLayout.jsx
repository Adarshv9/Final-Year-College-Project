import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Menu, Bell } from 'lucide-react';
import Sidebar from './Sidebar';
import { useAuth } from '../../context/AuthContext';

const PAGE_TITLES = {
  '/dashboard': 'Dashboard',
  '/jobs': 'Browse Jobs',
  '/recommended': 'Recommended for You',
  '/my-applications': 'My Applications',
  '/resume': 'My Resume',
  '/profile': 'Profile',
  '/change-password': 'Change Password',
  '/recruiter/dashboard': 'Recruiter Dashboard',
  '/recruiter/jobs/new': 'Post a New Job',
  '/recruiter/jobs': 'My Job Listings',
  '/recruiter/profile': 'Company Profile',
  '/admin/dashboard': 'Admin Dashboard',
  '/admin/recruiters': 'Pending Recruiters',
  '/admin/users': 'User Management',
  '/admin/resumes': 'Resume Moderation',
};

export default function AppLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { pathname } = useLocation();
  const { user } = useAuth();

  const title = Object.entries(PAGE_TITLES).find(([path]) => pathname.startsWith(path))?.[1] || 'TalentBridge';

  return (
    <div className="flex min-h-screen bg-[#0b0f1a]">
      <Sidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />

      {/* Main content - offset by sidebar on large screens */}
      <div className="flex-1 flex flex-col min-h-screen lg:ml-[240px]">
        {/* Topbar */}
        <header className="h-[60px] bg-[#0f1525] border-b border-[#1e2a3d] flex items-center justify-between px-4 lg:px-6 sticky top-0 z-50">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(prev => !prev)}
              className="lg:hidden h-9 w-9 flex items-center justify-center rounded-lg text-[#94a3b8] hover:bg-[#1a2236] hover:text-[#e2e8f0] transition-colors"
              aria-label="Toggle menu"
            >
              <Menu size={20} />
            </button>
            <span className="text-base font-semibold text-[#e2e8f0]">{title}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-xs text-[#64748b] hidden sm:block">
              {user?.name}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
