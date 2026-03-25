import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import api from '../lib/axios';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Restore session on mount using httpOnly cookie (no localStorage)
  useEffect(() => {
    api.get('/auth/me')
      .then(({ data }) => setUser(data.data?.user || data.data))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  // After login, call /auth/me to hydrate user (cookies set by backend)
  const login = useCallback(async () => {
    const { data } = await api.get('/auth/me');
    const userData = data.data?.user || data.data;
    setUser(userData);
    return userData;
  }, []);

  const logout = useCallback(async () => {
    try { await api.post('/auth/logout'); } catch (_) { /* ignore */ }
    setUser(null);
  }, []);

  const updateUser = useCallback((updates) => {
    setUser(prev => ({ ...prev, ...updates }));
  }, []);

  const value = { user, loading, login, logout, updateUser, isAuthenticated: !!user };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};
