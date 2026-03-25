import axios from 'axios';

const API_BASE = '/api/v1';

const api = axios.create({
  baseURL: API_BASE,
  withCredentials: true, // backend uses httpOnly cookies
  headers: { 'Content-Type': 'application/json' },
});

// No token injection - cookies are automatically sent by the browser
// On 401, redirect to login (session expired / cookie invalid)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (
      error.response?.status === 401 &&
      // `/auth/me` is called on app mount to restore session.
      // When the user is not logged in (or token expired), returning 401 is expected;
      // the router/protected route guards should handle redirecting as needed.
      !String(error.config?.url || '').includes('/auth/me') &&
      !window.location.pathname.includes('/login') &&
      !window.location.pathname.includes('/register') &&
      !window.location.pathname.includes('/verify-otp')
    ) {
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
