import { createContext, useContext, useState, useEffect } from 'react';
import api from '../utils/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // ─── Restore session on mount ───────────────────────────────────────────
  // If an access token is in localStorage, try to verify it with /auth/me.
  // If the token is expired, the axios interceptor will silently refresh it
  // using the httpOnly refresh token cookie before /auth/me retries.
  useEffect(() => {
    const token = localStorage.getItem('mc_access_token');
    if (token) {
      api.get('/auth/me')
        .then((res) => setUser(res.data.user))
        .catch(() => {
          // If even the refresh failed, the interceptor already cleared storage
          // and redirected. Just clean up any stale state here.
          localStorage.removeItem('mc_access_token');
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  // ─── Auth actions ────────────────────────────────────────────────────────

  const login = async (identifier, password) => {
    const res = await api.post('/auth/login', { identifier, password });
    // Store the short-lived access token in localStorage
    localStorage.setItem('mc_access_token', res.data.accessToken);
    // The refresh token is automatically stored in an httpOnly cookie by the server
    setUser(res.data.user);
    return res.data;
  };

  const register = async (username, email, password, displayName) => {
    const res = await api.post('/auth/register', { username, email, password, displayName });
    localStorage.setItem('mc_access_token', res.data.accessToken);
    setUser(res.data.user);
    return res.data;
  };

  const logout = async () => {
    try {
      // Server wipes the refreshToken from DB and clears the cookie
      await api.post('/auth/logout');
    } catch (_) {
      // Even if the request fails, clean up client-side
    }
    localStorage.removeItem('mc_access_token');
    setUser(null);
  };

  const refreshUser = async () => {
    const res = await api.get('/auth/me');
    setUser(res.data.user);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
