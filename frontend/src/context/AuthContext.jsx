import { createContext, useContext, useState, useEffect } from 'react';
import api from '../utils/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('mc_access_token');
    if (token) {
      api.get('/auth/me')
        .then((res) => setUser(res.data.user))
        .catch(() => {
          localStorage.removeItem('mc_access_token');
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    if (res.data.accessToken) {
      localStorage.setItem('mc_access_token', res.data.accessToken);
      setUser(res.data.user);
    }
    return res.data;
  };

  const register = async (registerData) => {
    // registerData = { fullName, email, password, confirmPassword }
    // Request sending 6-digit OTP code to email
    const res = await api.post('/auth/register', registerData);
    return res.data;
  };

  const verifyOTP = async (email, otp) => {
    // Verify OTP code and insert user into MongoDB database
    const res = await api.post('/auth/verify-otp', { email, otp });
    if (res.data.accessToken) {
      localStorage.setItem('mc_access_token', res.data.accessToken);
      setUser(res.data.user);
    }
    return res.data;
  };

  const resendOTP = async (email) => {
    const res = await api.post('/auth/resend-otp', { email });
    return res.data;
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (_) {
      // Clean up client-side regardless
    }
    localStorage.removeItem('mc_access_token');
    setUser(null);
  };

  const refreshUser = async () => {
    const res = await api.get('/auth/me');
    setUser(res.data.user);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, verifyOTP, resendOTP, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
