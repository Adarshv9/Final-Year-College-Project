// Central React Router definition for public, protected, and role-based routes.
import { createElement, lazy, Suspense } from 'react';
import { createBrowserRouter, RouterProvider, Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AppLayout from '../shared/layout/AppLayout';
import PublicLayout from '../shared/layout/PublicLayout';
import { PageLoader } from '../shared/ui/Spinner';

// ── Page skeleton fallback ──
const PageSkeleton = () => (
  <div className="p-8 flex flex-col gap-4">
    {[1, 2, 3].map(i => (
      <div key={i} className="h-28 rounded-xl animate-shimmer" />
    ))}
  </div>
);

// ── Lazy pages ──
// Each area is lazy-loaded so users only download the screens for the role
// and route they actually visit.
const LoginPage        = lazy(() => import('../features/auth/LoginPage'));
const RegisterPage     = lazy(() => import('../features/auth/RegisterPage'));
const OTPVerifyPage    = lazy(() => import('../features/auth/OTPVerifyPage'));
const LandingPage      = lazy(() => import('../features/public/LandingPage'));
const JobsPage         = lazy(() => import('../features/jobs/JobsPage'));
const JobDetailPage    = lazy(() => import('../features/jobs/JobDetailPage'));

// Job Seeker
const JobSeekerDashboard  = lazy(() => import('../features/jobseeker/DashboardPage'));
const RecommendedJobsPage = lazy(() => import('../features/jobseeker/RecommendedJobsPage'));
const MyApplicationsPage  = lazy(() => import('../features/jobseeker/MyApplicationsPage'));
const ResumePage          = lazy(() => import('../features/jobseeker/ResumePage'));
const JobSeekerProfile    = lazy(() => import('../features/jobseeker/ProfilePage'));
const ChangePasswordPage  = lazy(() => import('../features/jobseeker/ChangePasswordPage'));

// Recruiter
const RecruiterDashboard        = lazy(() => import('../features/recruiter/DashboardPage'));
const MyJobsPage                = lazy(() => import('../features/recruiter/MyJobsPage'));
const JobFormPage               = lazy(() => import('../features/recruiter/JobFormPage'));
const JobApplicationsPage       = lazy(() => import('../features/recruiter/JobApplicationsPage'));
const RecruiterApplicationsPage = lazy(() => import('../features/recruiter/RecruiterApplicationsPage'));
const RecruiterProfile          = lazy(() => import('../features/recruiter/ProfilePage'));

// Admin
const AdminDashboard        = lazy(() => import('../features/admin/DashboardPage'));
const PendingRecruitersPage = lazy(() => import('../features/admin/PendingRecruitersPage'));
const UsersPage             = lazy(() => import('../features/admin/UsersPage'));
const ResumesPage           = lazy(() => import('../features/admin/ResumesPage'));

// ── Helper ──
function getRoleDashboard(role) {
  if (role === 'recruiter') return '/recruiter/dashboard';
  if (role === 'admin') return '/admin/dashboard';
  return '/dashboard';
}

// ── Guards ──
function PublicRoute() {
  const { isAuthenticated, user, loading } = useAuth();
  if (loading) return <PageLoader />;
  // Logged-in users should not see auth pages again.
  if (isAuthenticated) return <Navigate to={getRoleDashboard(user?.role)} replace />;
  return <Outlet />;
}

function ProtectedRoute({ allowedRoles }) {
  const { isAuthenticated, user, loading } = useAuth();
  if (loading) return <PageLoader />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  // If a user is signed in but hits the wrong area, send them to their own dashboard.
  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    return <Navigate to={getRoleDashboard(user?.role)} replace />;
  }
  return <Outlet />;
}

function JobsLayout() {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return <PageLoader />;
  // Jobs stay public, but signed-in users should browse them inside the shared
  // application shell so their role sidebar remains available.
  return isAuthenticated ? <AppLayout /> : <PublicLayout />;
}

const S = (Component) => (
  <Suspense fallback={<PageSkeleton />}>
    {createElement(Component)}
  </Suspense>
);

const SNull = (Component) => (
  // Auth screens provide their own loading treatment, so use no extra skeleton.
  <Suspense fallback={null}>
    {createElement(Component)}
  </Suspense>
);

// ── Router ──
const router = createBrowserRouter([
  // Landing page served via PublicLayout
  {
    element: <PublicLayout />,
    children: [
      { path: '/', element: S(LandingPage) },
    ],
  },

  // Public job browsing – uses PublicLayout for guests, AppLayout for logged-in users
  {
    element: <JobsLayout />,
    children: [
      { path: '/jobs',         element: S(JobsPage) },
      { path: '/jobs/:jobId',  element: S(JobDetailPage) },
    ],
  },

  // Auth routes (redirect if already logged in)
  {
    element: <PublicRoute />,
    children: [
      { path: '/login',      element: SNull(LoginPage) },
      { path: '/register',   element: SNull(RegisterPage) },
      { path: '/verify-otp', element: SNull(OTPVerifyPage) },
    ],
  },

  // Job Seeker routes
  {
    element: <ProtectedRoute allowedRoles={['job_seeker']} />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { path: '/dashboard',       element: S(JobSeekerDashboard) },
          { path: '/recommended',     element: S(RecommendedJobsPage) },
          { path: '/my-applications', element: S(MyApplicationsPage) },
          { path: '/resume',          element: S(ResumePage) },
          { path: '/profile',         element: S(JobSeekerProfile) },
          { path: '/change-password', element: S(ChangePasswordPage) },
        ],
      },
    ],
  },

  // Recruiter routes
  {
    element: <ProtectedRoute allowedRoles={['recruiter']} />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { path: '/recruiter/dashboard',                element: S(RecruiterDashboard) },
          { path: '/recruiter/applications',             element: S(RecruiterApplicationsPage) },
          { path: '/recruiter/jobs',                     element: S(MyJobsPage) },
          { path: '/recruiter/jobs/new',                 element: S(JobFormPage) },
          { path: '/recruiter/jobs/:jobId/edit',         element: S(JobFormPage) },
          { path: '/recruiter/jobs/:jobId/applications', element: S(JobApplicationsPage) },
          { path: '/recruiter/profile',                  element: S(RecruiterProfile) },
        ],
      },
    ],
  },

  // Admin routes
  {
    element: <ProtectedRoute allowedRoles={['admin']} />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { path: '/admin/dashboard',  element: S(AdminDashboard) },
          { path: '/admin/recruiters', element: S(PendingRecruitersPage) },
          { path: '/admin/users',      element: S(UsersPage) },
          { path: '/admin/resumes',    element: S(ResumesPage) },
        ],
      },
    ],
  },

  // Catch-all redirect
  { path: '*', element: <Navigate to="/" replace /> },
]);

export default function AppRouter() {
  // Keeping RouterProvider here lets main.jsx stay focused on app-wide
  // providers such as auth, React Query, and toasts.
  return <RouterProvider router={router} />;
}
