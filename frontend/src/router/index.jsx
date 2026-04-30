// Defines the frontend route tree and access rules.

import { createElement, lazy, Suspense } from 'react';
import { createBrowserRouter, RouterProvider, Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AppLayout from '../shared/layout/AppLayout';
import PublicLayout from '../shared/layout/PublicLayout';
import { PageLoader } from '../shared/ui/Spinner';


// Render the page skeleton component.
const PageSkeleton = () =>
<div className="p-8 flex flex-col gap-4">
    {[1, 2, 3].map((i) =>
  <div key={i} className="h-28 rounded-xl animate-shimmer" />
  )}
  </div>;





const LoginPage = lazy(() => import('../features/auth/LoginPage'));
const RegisterPage = lazy(() => import('../features/auth/RegisterPage'));
const OTPVerifyPage = lazy(() => import('../features/auth/OTPVerifyPage'));
const LandingPage = lazy(() => import('../features/public/LandingPage'));
const JobsPage = lazy(() => import('../features/jobs/JobsPage'));
const JobDetailPage = lazy(() => import('../features/jobs/JobDetailPage'));


const JobSeekerDashboard = lazy(() => import('../features/jobseeker/DashboardPage'));
const RecommendedJobsPage = lazy(() => import('../features/jobseeker/RecommendedJobsPage'));
const MyApplicationsPage = lazy(() => import('../features/jobseeker/MyApplicationsPage'));
const ResumePage = lazy(() => import('../features/jobseeker/ResumePage'));
const JobSeekerProfile = lazy(() => import('../features/jobseeker/ProfilePage'));
const ChangePasswordPage = lazy(() => import('../features/jobseeker/ChangePasswordPage'));
const SettingsPage = lazy(() => import('../features/account/SettingsPage'));


const RecruiterDashboard = lazy(() => import('../features/recruiter/DashboardPage'));
const MyJobsPage = lazy(() => import('../features/recruiter/MyJobsPage'));
const JobFormPage = lazy(() => import('../features/recruiter/JobFormPage'));
const JobApplicationsPage = lazy(() => import('../features/recruiter/JobApplicationsPage'));
const RecruiterApplicationsPage = lazy(() => import('../features/recruiter/RecruiterApplicationsPage'));
const RecruiterProfile = lazy(() => import('../features/recruiter/ProfilePage'));


const AdminDashboard = lazy(() => import('../features/admin/DashboardPage'));
const PendingRecruitersPage = lazy(() => import('../features/admin/PendingRecruitersPage'));
const UsersPage = lazy(() => import('../features/admin/UsersPage'));
const ResumesPage = lazy(() => import('../features/admin/ResumesPage'));


// Get role dashboard.
function getRoleDashboard(role) {
  if (role === 'recruiter') return '/recruiter/dashboard';
  if (role === 'admin') return '/admin/dashboard';
  return '/dashboard';
}


// Render the public route component.
function PublicRoute() {
  const { isAuthenticated, user, loading } = useAuth();
  if (loading) return <PageLoader />;

  if (isAuthenticated) return <Navigate to={getRoleDashboard(user?.role)} replace />;
  return <Outlet />;
}

// Render the protected route component.
function ProtectedRoute({ allowedRoles }) {
  const { isAuthenticated, user, loading } = useAuth();
  if (loading) return <PageLoader />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;

  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    return <Navigate to={getRoleDashboard(user?.role)} replace />;
  }
  return <Outlet />;
}

// Render the jobs layout.
function JobsLayout() {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return <PageLoader />;


  return isAuthenticated ? <AppLayout /> : <PublicLayout />;
}

// Render the s component.
const S = (Component) =>
<Suspense fallback={<PageSkeleton />}>
    {createElement(Component)}
  </Suspense>;


// Render the s null component.
const SNull = (Component) =>

<Suspense fallback={null}>
    {createElement(Component)}
  </Suspense>;



const router = createBrowserRouter([

{
  element: <PublicLayout />,
  children: [
  { path: '/', element: S(LandingPage) }]

},


{
  element: <JobsLayout />,
  children: [
  { path: '/jobs', element: S(JobsPage) },
  { path: '/jobs/:jobId', element: S(JobDetailPage) }]

},


{
  element: <PublicRoute />,
  children: [
  { path: '/login', element: SNull(LoginPage) },
  { path: '/register', element: SNull(RegisterPage) },
  { path: '/verify-otp', element: SNull(OTPVerifyPage) }]

},


{
  element: <ProtectedRoute allowedRoles={['job_seeker']} />,
  children: [
  {
    element: <AppLayout />,
    children: [
    { path: '/dashboard', element: S(JobSeekerDashboard) },
    { path: '/recommended', element: S(RecommendedJobsPage) },
    { path: '/my-applications', element: S(MyApplicationsPage) },
    { path: '/resume', element: S(ResumePage) },
    { path: '/profile', element: S(JobSeekerProfile) }]

  }]

},


{
  element: <ProtectedRoute />,
  children: [
  {
    element: <AppLayout />,
    children: [
    { path: '/change-password', element: S(ChangePasswordPage) },
    { path: '/settings', element: S(SettingsPage) }]

  }]

},


{
  element: <ProtectedRoute allowedRoles={['recruiter']} />,
  children: [
  {
    element: <AppLayout />,
    children: [
    { path: '/recruiter/dashboard', element: S(RecruiterDashboard) },
    { path: '/recruiter/applications', element: S(RecruiterApplicationsPage) },
    { path: '/recruiter/jobs', element: S(MyJobsPage) },
    { path: '/recruiter/jobs/new', element: S(JobFormPage) },
    { path: '/recruiter/jobs/:jobId/edit', element: S(JobFormPage) },
    { path: '/recruiter/jobs/:jobId/applications', element: S(JobApplicationsPage) },
    { path: '/recruiter/profile', element: S(RecruiterProfile) }]

  }]

},


{
  element: <ProtectedRoute allowedRoles={['admin']} />,
  children: [
  {
    element: <AppLayout />,
    children: [
    { path: '/admin/dashboard', element: S(AdminDashboard) },
    { path: '/admin/recruiters', element: S(PendingRecruitersPage) },
    { path: '/admin/users', element: S(UsersPage) },
    { path: '/admin/resumes', element: S(ResumesPage) }]

  }]

},


{ path: '*', element: <Navigate to="/" replace /> }]
);

// Render the app router component.
export default function AppRouter() {


  return <RouterProvider router={router} />;
}