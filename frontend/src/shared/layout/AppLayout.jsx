// Shared authenticated layout that wraps pages with navigation and content chrome.
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
  '/settings': 'Account Settings',
  '/change-password': 'Change Password',
  '/recruiter/dashboard': 'Recruiter Dashboard',
  '/recruiter/applications': 'All Applications',
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

  // Prefix matching keeps nested routes such as edit/detail pages under the
  // nearest section title without passing a title prop through every screen.
  const title = Object.entries(PAGE_TITLES).find(([path]) => pathname.startsWith(path))?.[1] || 'CompasX';

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />

      {/* Main content - offset by sidebar on large screens */}
      <div className="flex-1 flex flex-col min-h-screen lg:ml-[240px]">
        {/* Topbar */}
        <header className="h-[60px] bg-white border-b border-slate-200 flex items-center justify-between px-4 lg:px-6 sticky top-0 z-50">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(prev => !prev)}
              className="lg:hidden h-9 w-9 flex items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
              aria-label="Toggle menu"
            >
              <Menu size={20} />
            </button>
            <span className="text-base font-semibold text-slate-900">{title}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-xs text-slate-500 hidden sm:block">
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
