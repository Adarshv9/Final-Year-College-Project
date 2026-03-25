import api from '../lib/axios';

export const authApi = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  verifyOTP: (data) => api.post('/auth/verify-otp', data),
  resendOTP: (data) => api.post('/auth/resend-otp', data),
  logout: () => api.post('/auth/logout'),
  me: () => api.get('/auth/me'),
  profile: () => api.get('/auth/profile'),
};

export const usersApi = {
  changePassword: (data) =>
    api.patch('/users/change-password', {
      oldPassword: data.oldPassword ?? data.currentPassword,
      newPassword: data.newPassword,
    }),
  list: (params) => api.get('/users', { params }),
  get: (id) => api.get(`/users/${id}`),
  update: (id, data) => api.put(`/users/${id}`, data),
  delete: (id) => api.delete(`/users/${id}`),
};

export const jobsApi = {
  list: (params) => api.get('/jobs', { params }),
  recommended: (params) => api.get('/jobs/recommended', { params }),
  myJobs: (params) => api.get('/jobs/my', { params }),
  get: (jobId) => api.get(`/jobs/${jobId}`),
  create: (data) => api.post('/jobs', data),
  update: (jobId, data) => api.patch(`/jobs/${jobId}`, data),
  delete: (jobId) => api.delete(`/jobs/${jobId}`),
};

export const applicationsApi = {
  apply: (jobId, data) => api.post(`/applications/${jobId}`, data),
  myApplications: (params) => api.get('/applications/my', { params }),
  forJob: (jobId, params) => api.get(`/applications/job/${jobId}`, { params }),
  recommendedForJob: (jobId, params) => api.get(`/applications/job/${jobId}/recommended`, { params }),
  updateStatus: (applicationId, status) =>
    api.patch(`/applications/${applicationId}/status`, { status }),
};

export const resumeApi = {
  get: () => api.get('/resumes/resume'),
  upload: (formData) => api.put('/resumes/resume', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  manual: (data) => api.post('/resumes/resume/manual', data),
  update: (data) => api.patch('/resumes/resume', data),
  delete: () => api.delete('/resumes/resume'),
};

export const jobSeekerApi = {
  getProfile: () => api.get('/jobseeker/profile'),
  createProfile: (data) => api.post('/jobseeker/profile', data),
  updateProfile: (data) => api.put('/jobseeker/profile', data),
};

export const recruiterApi = {
  getProfile: () => api.get('/recruiter/profile'),
  createProfile: (data) => api.post('/recruiter/profile', data),
  updateProfile: (data) => api.put('/recruiter/profile', data),
};

export const adminApi = {
  pendingRecruiters: (params) => api.get('/admin/recruiters/pending', { params }),
  verifyRecruiter: (id) => api.patch(`/admin/recruiter/${id}/verify`),
  rejectRecruiter: (id) => api.patch(`/admin/recruiter/${id}/reject`),
  getUsers: (params) => api.get('/admin/users', { params }),
  promoteUser: (id) => api.patch(`/admin/users/${id}/promote-admin`),
  updateUser: (id, data) => api.put(`/users/${id}`, data),
  deleteUser: (id) => api.delete(`/users/${id}`),
  getResumes: (params) => api.get('/resumes/resumes', { params }),
  verifyResume: (resumeId, isVerified) => api.patch(`/resumes/resumes/${resumeId}/verify`, { isVerified }),
};
