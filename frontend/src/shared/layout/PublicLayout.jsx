// Layout wrapper for public-facing pages.
import { useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { ChevronDown, Menu, Search, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Button from '../ui/Button';
import BrandLogo from '../ui/BrandLogo';

// Get role dashboard.
function getRoleDashboard(role) {
  if (role === 'recruiter') return '/recruiter/dashboard';
  if (role === 'admin') return '/admin/dashboard';
  return '/dashboard';
}


// Render the twitter icon component.
function TwitterIcon({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.737-8.835L1.254 2.25H8.08l4.259 5.63 5.905-5.63Zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>);

}

// Render the github icon component.
function GithubIcon({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844a9.59 9.59 0 0 1 2.504.337c1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.02 10.02 0 0 0 22 12.017C22 6.484 17.522 2 12 2z" />
    </svg>);

}

// Render the linkedin icon component.
function LinkedinIcon({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>);

}

// Render the navbar component.
function Navbar() {
  const { isAuthenticated, user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [mobileOpen, setMobileOpen] = useState(false);

  const jobLinks = [
  { label: 'All Jobs', to: '/jobs' },
  { label: 'Remote Jobs', to: '/jobs?locationType=remote' },
  { label: 'Full-Time Jobs', to: '/jobs?jobType=full-time' }];


  // Handle search submit.
  const handleSearchSubmit = (event) => {
    event.preventDefault();
    const query = search.trim();
    navigate(query ? `/jobs?search=${encodeURIComponent(query)}` : '/jobs');
    setMobileOpen(false);
  };

  const linkBaseClass = 'text-sm font-medium transition-colors';
  const linkActiveClass = 'text-slate-900';
  const linkIdleClass = 'text-slate-600 hover:text-slate-900';
  const isHome = location.pathname === '/';
  const isJobsArea = location.pathname.startsWith('/jobs');

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/90 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4">
        <div className="min-h-[72px] py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 lg:gap-8 min-w-0">
            <Link to="/" className="flex items-center gap-2.5 group flex-shrink-0">
              <BrandLogo imageClassName="h-8 w-auto sm:h-9" />
            </Link>

            <nav className="hidden lg:flex items-center gap-2">
              <div className="relative group">
                <button className={`px-3 py-2 rounded-lg flex items-center gap-1.5 ${linkBaseClass} ${isJobsArea ? linkActiveClass : linkIdleClass}`}>
                  Jobs
                  <ChevronDown size={16} className="text-slate-400" />
                </button>
                <div className="absolute left-0 top-full pt-2 opacity-0 pointer-events-none translate-y-1 transition-all duration-150 group-hover:opacity-100 group-hover:pointer-events-auto group-hover:translate-y-0">
                  <div className="w-56 rounded-2xl border border-slate-200 bg-white/95 backdrop-blur-xl p-2 shadow-2xl">
                    {jobLinks.map((item) =>
                    <Link
                      key={item.to}
                      to={item.to}
                      className="block rounded-xl px-3 py-2.5 text-sm text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors">
                      
                        {item.label}
                      </Link>
                    )}
                  </div>
                </div>
              </div>

              <a
                href={isHome ? '#features' : '/#features'}
                className={`px-3 py-2 rounded-lg ${linkBaseClass} ${isHome ? linkActiveClass : linkIdleClass}`}>
                
                Features
              </a>
            </nav>
          </div>

          <form onSubmit={handleSearchSubmit} className="hidden md:flex flex-1 max-w-xs xl:max-w-sm">
            <div className="relative w-full">
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search jobs"
                className="w-full rounded-full border border-slate-200 bg-white pl-11 pr-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 outline-none transition-all focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20" />
              
            </div>
          </form>

          <div className="hidden md:flex items-center gap-3 flex-shrink-0">
            {isAuthenticated ?
            <Link to={getRoleDashboard(user?.role)}>
                <Button variant="primary" size="sm">Dashboard</Button>
              </Link> :

            <>
                <Link to="/login">
                  <Button variant="outline" size="sm" className="px-5">Login</Button>
                </Link>
                <Link to="/register">
                  <Button variant="primary" size="sm" className="px-5">Register</Button>
                </Link>
                <Link to="/register?role=recruiter">
                  <Button variant="outline" size="sm" className="px-5">
                    Recruiter Sign Up
                  </Button>
                </Link>
              </>
            }
          </div>

          <button
            type="button"
            className="md:hidden inline-flex items-center justify-center w-10 h-10 rounded-xl border border-slate-200 bg-white text-slate-900"
            onClick={() => setMobileOpen((open) => !open)}
            aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}>
            
            {mobileOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>

        {mobileOpen &&
        <div className="md:hidden pb-4 animate-fade-in">
            <form onSubmit={handleSearchSubmit} className="mb-4">
              <div className="relative">
                <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search jobs"
                className="w-full rounded-2xl border border-slate-200 bg-white pl-11 pr-4 py-3 text-sm text-slate-900 placeholder-slate-400 outline-none transition-all focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20" />
              
              </div>
            </form>

            <div className="grid gap-2 rounded-2xl border border-slate-200 bg-white p-3">
              <NavLink
              to="/jobs"
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) => `rounded-xl px-3 py-2 text-sm font-medium transition-colors ${isActive ? linkActiveClass : linkIdleClass}`}>
              
                Browse Jobs
              </NavLink>
              <a
              href={isHome ? '#features' : '/#features'}
              onClick={() => setMobileOpen(false)}
              className="rounded-xl px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors">
              
                Features
              </a>

              <div className="h-px bg-slate-200 my-1" />

              {isAuthenticated ?
            <Link to={getRoleDashboard(user?.role)} onClick={() => setMobileOpen(false)}>
                  <Button variant="primary" full>Dashboard</Button>
                </Link> :

            <>
                  <Link to="/login" onClick={() => setMobileOpen(false)}>
                    <Button variant="outline" full>Login</Button>
                  </Link>
                  <Link to="/register" onClick={() => setMobileOpen(false)}>
                    <Button variant="primary" full>Register</Button>
                  </Link>
                  <Link to="/register?role=recruiter" onClick={() => setMobileOpen(false)}>
                    <Button variant="outline" full>Recruiter Sign Up</Button>
                  </Link>
                </>
            }
            </div>
          </div>
        }
      </div>
    </header>);

}

// Render the footer component.
function Footer() {
  const candidateLinks = [
  { label: 'Browse Jobs', to: '/jobs' },
  { label: 'Create Profile', to: '/register' },
  { label: 'Recommended Jobs', to: '/register' }];


  const employerLinks = [
  { label: 'Post a Job', to: '/register?role=recruiter' },
  { label: 'Recruiter Sign Up', to: '/register?role=recruiter' },
  { label: 'Hiring Dashboard', to: '/login' }];


  const companyLinks = [
  { label: 'Login', to: '/login' },
  { label: 'Privacy Policy', href: '#' },
  { label: 'Terms of Service', href: '#' }];


  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="max-w-7xl mx-auto px-4 pt-16 pb-8">
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-3">
          <div className="md:justify-self-start lg:justify-self-center">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-900">For Candidates</h3>
            <ul className="mt-5 space-y-3 text-sm text-slate-600">
              {candidateLinks.map((link) =>
              <li key={link.label}>
                  <Link to={link.to} className="transition-colors hover:text-indigo-600">
                    {link.label}
                  </Link>
                </li>
              )}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-900">For Employers</h3>
            <ul className="mt-5 space-y-3 text-sm text-slate-600">
              {employerLinks.map((link) =>
              <li key={link.label}>
                  <Link to={link.to} className="transition-colors hover:text-indigo-600">
                    {link.label}
                  </Link>
                </li>
              )}
            </ul>
          </div>

          <div className="md:justify-self-end lg:justify-self-center">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-900">Company</h3>
            <ul className="mt-5 space-y-3 text-sm text-slate-600">
              {companyLinks.map((link) =>
              <li key={link.label}>
                  {'to' in link ?
                <Link to={link.to} className="transition-colors hover:text-indigo-600">
                      {link.label}
                    </Link> :

                <a href={link.href} className="transition-colors hover:text-indigo-600">
                      {link.label}
                    </a>
                }
                </li>
              )}
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-6 border-t border-slate-200 pt-8 text-sm text-slate-500 md:flex-row md:items-center md:justify-between">
          <p>&copy; {new Date().getFullYear()} CompasX. All rights reserved.</p>
          <div className="flex items-center gap-3">
            <a
              href="#"
              className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition-colors hover:border-indigo-200 hover:text-indigo-600"
              aria-label="CompasX on X">
              
              <TwitterIcon />
            </a>
            <a
              href="#"
              className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition-colors hover:border-indigo-200 hover:text-indigo-600"
              aria-label="CompasX on GitHub">
              
              <GithubIcon />
            </a>
            <a
              href="#"
              className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition-colors hover:border-indigo-200 hover:text-indigo-600"
              aria-label="CompasX on LinkedIn">
              
              <LinkedinIcon />
            </a>
          </div>
        </div>
      </div>
    </footer>);

}

// Render the public layout.
export default function PublicLayout() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <Navbar />
      <main className="flex-1 flex flex-col">
        <Outlet />
      </main>
      <Footer />
    </div>);

}