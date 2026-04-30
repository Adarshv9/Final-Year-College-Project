// Configures the shared Axios client for backend requests.

import axios from 'axios';

const API_BASE = '/api/v1';

const api = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' }
});

let refreshRequest = null;

// Check whether auth page.
const isAuthPage = () =>
window.location.pathname.includes('/login') ||
window.location.pathname.includes('/register') ||
window.location.pathname.includes('/verify-otp');

// Check whether skip refresh.
const shouldSkipRefresh = (url = '') =>
String(url).includes('/auth/login') ||
String(url).includes('/auth/register') ||
String(url).includes('/auth/verify-otp') ||
String(url).includes('/auth/resend-otp') ||
String(url).includes('/auth/refresh-token') ||
String(url).includes('/auth/me');

// Refresh session.
const refreshSession = async () => {
  if (!refreshRequest) {


    refreshRequest = api.post('/auth/refresh-token', {}).
    finally(() => {
      refreshRequest = null;
    });
  }

  return refreshRequest;
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config || {};
    const status = error.response?.status;
    const requestUrl = String(originalRequest.url || '');

    if (
    status === 401 &&
    !originalRequest._retry &&
    !shouldSkipRefresh(requestUrl))
    {
      originalRequest._retry = true;

      try {

        await refreshSession();
        return api(originalRequest);
      } catch (refreshError) {
        if (!isAuthPage()) {
          window.location.href = '/login';
        }
        return Promise.reject(refreshError);
      }
    }



    if (status === 401 && !isAuthPage() && !shouldSkipRefresh(requestUrl)) {
      window.location.href = '/login';
    }

    return Promise.reject(error);
  }
);

export default api;