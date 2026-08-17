import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { validateEmail } from '../utils/passwordValidation';
import api from '../utils/api';
import toast from 'react-hot-toast';
import './LoginPage.css';

const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    email: '',
    password: '',
  });

  const [loading, setLoading] = useState(false);
  const [unverifiedEmail, setUnverifiedEmail] = useState('');
  const [resending, setResending] = useState(false);

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.email.trim() || !form.password) {
      return toast.error('Please fill in all fields');
    }

    if (!validateEmail(form.email)) {
      return toast.error('Please enter a valid email address');
    }

    setLoading(true);
    setUnverifiedEmail('');

    try {
      await login(form.email.trim(), form.password);
      toast.success('Welcome back ✨');
      navigate('/vault');
    } catch (err) {
      const msg = err.response?.data?.message || 'Login failed';
      toast.error(msg);
      if (err.response?.data?.isUnverified) {
        setUnverifiedEmail(err.response.data.email || form.email);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!unverifiedEmail) return;
    setResending(true);
    try {
      const res = await api.post('/auth/resend-verification', { email: unverifiedEmail });
      toast.success('Verification link resent! Check your inbox.');
      if (res.data.verifyUrl) {
        console.log('[Prototype Shortcut] Verify URL:', res.data.verifyUrl);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to resend verification link');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="lp-root login-page" style={{ minHeight: '100vh', position: 'relative' }}>
      <div className="login-card lp-glass-card">

        {/* Logo / Brand */}
        <div className="login-header">
          <div className="login-logo">✦</div>
          <h1>Welcome back</h1>
          <p>Your memories are waiting for you.</p>
        </div>

        {unverifiedEmail && (
          <div style={{
            marginBottom: '20px',
            padding: '12px 16px',
            background: '#fff7ed',
            border: '1px solid #ffedd5',
            borderRadius: '12px',
            fontSize: '0.85rem',
            color: '#9a3412',
          }}>
            <p style={{ fontWeight: 600, marginBottom: '6px' }}>Email not verified yet</p>
            <p style={{ marginBottom: '10px' }}>
              Please click the link sent to <strong>{unverifiedEmail}</strong>.
            </p>
            <button
              type="button"
              onClick={handleResend}
              disabled={resending}
              style={{
                background: '#ea580c',
                color: '#ffffff',
                border: 'none',
                padding: '6px 14px',
                borderRadius: '6px',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              {resending ? 'Sending...' : 'Resend Verification Email'}
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit}>

          {/* Email Address */}
          <div className="login-form-group">
            <label htmlFor="email">
              Email Address
            </label>

            <input
              id="email"
              name="email"
              type="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={handleChange}
              autoComplete="email"
              required
            />
          </div>

          {/* Password */}
          <div className="login-form-group">
            <div className="password-header">
              <label htmlFor="password">
                Password
              </label>

              <Link to="/forgot-password">
                Forgot password?
              </Link>
            </div>

            <input
              id="password"
              name="password"
              type="password"
              placeholder="••••••••"
              value={form.password}
              onChange={handleChange}
              autoComplete="current-password"
              required
            />
          </div>

          {/* Submit */}
          <button
            id="login-submit"
            type="submit"
            className="login-button"
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="login-spinner" />
                Signing in…
              </>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        <div className="login-divider">
          <span>or</span>
        </div>

        <p className="login-register">
          Don't have an account?{' '}
          <Link to="/register">
            Create one
          </Link>
        </p>

      </div>
    </div>
  );
};

export default LoginPage;