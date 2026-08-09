import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import api from '../utils/api';
import toast from 'react-hot-toast';
import './LoginPage.css';

const ResetPasswordPage = () => {
  const [searchParams]  = useSearchParams();
  const navigate         = useNavigate();
  const token            = searchParams.get('token') || '';

  const [form, setForm]   = useState({ newPassword: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);
  const [showNew, setShowNew]     = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.newPassword || !form.confirmPassword) {
      return toast.error('Please fill in all fields');
    }
    if (form.newPassword.length < 6) {
      return toast.error('Password must be at least 6 characters');
    }
    if (form.newPassword !== form.confirmPassword) {
      return toast.error('Passwords do not match');
    }
    if (!token) {
      return toast.error('Invalid reset link. Please request a new one.');
    }

    setLoading(true);
    try {
      await api.post('/auth/reset-password', { token, newPassword: form.newPassword });
      toast.success('Password reset! Please log in with your new password.');
      navigate('/login');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Reset failed. The link may have expired.');
    } finally {
      setLoading(false);
    }
  };

  /* Invalid / missing token guard */
  if (!token) {
    return (
      <div className="lp-root login-page" style={{ minHeight: '100vh', position: 'relative' }}>
        <div className="login-card lp-glass-card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '16px' }}>⚠️</div>
          <h2 style={{ fontFamily: 'Playfair Display, serif', marginBottom: '12px', color: '#1d1b19' }}>Invalid Reset Link</h2>
          <p style={{ fontFamily: 'Manrope, sans-serif', color: '#4f4447', fontSize: '0.9rem', marginBottom: '24px' }}>
            This reset link is missing or malformed.
          </p>
          <Link to="/forgot-password" className="login-button" style={{ display: 'inline-block', textDecoration: 'none' }}>
            Request a New Link
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="lp-root login-page" style={{ minHeight: '100vh', position: 'relative' }}>
      <div className="login-card lp-glass-card">
        {/* Header */}
        <div className="login-header">
          <div className="login-logo">✦</div>
          <h1>Reset Password</h1>
          <p>Choose a strong new password for your account</p>
        </div>

        <form onSubmit={handleSubmit}>
          {/* New Password */}
          <div className="login-form-group">
            <label htmlFor="reset-new-password">New Password</label>
            <div style={{ position: 'relative' }}>
              <input
                id="reset-new-password"
                name="newPassword"
                type={showNew ? 'text' : 'password'}
                placeholder="Min. 6 characters"
                value={form.newPassword}
                onChange={handleChange}
                autoComplete="new-password"
                style={{ paddingRight: '2.8rem' }}
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                style={{
                  position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem',
                  color: '#4f4447', padding: '0 0.25rem',
                }}
                aria-label={showNew ? 'Hide password' : 'Show password'}
              >
                {showNew ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div className="login-form-group">
            <label htmlFor="reset-confirm-password">Confirm New Password</label>
            <div style={{ position: 'relative' }}>
              <input
                id="reset-confirm-password"
                name="confirmPassword"
                type={showConfirm ? 'text' : 'password'}
                placeholder="Re-enter new password"
                value={form.confirmPassword}
                onChange={handleChange}
                autoComplete="new-password"
                style={{ paddingRight: '2.8rem' }}
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                style={{
                  position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem',
                  color: '#4f4447', padding: '0 0.25rem',
                }}
                aria-label={showConfirm ? 'Hide password' : 'Show password'}
              >
                {showConfirm ? '🙈' : '👁️'}
              </button>
            </div>

            {/* Match indicator */}
            {form.confirmPassword && (
              <p style={{
                marginTop: '6px', fontSize: '0.8rem', fontFamily: 'Manrope, sans-serif', fontWeight: 600,
                color: form.newPassword === form.confirmPassword ? '#22c55e' : '#ef4444',
              }}>
                {form.newPassword === form.confirmPassword ? '✓ Passwords match' : '✗ Passwords do not match'}
              </p>
            )}
          </div>

          <button
            id="reset-submit"
            type="submit"
            className="login-button"
            disabled={loading}
          >
            {loading ? <><span className="login-spinner" />  Resetting…</> : 'Set New Password'}
          </button>
        </form>

        <div className="login-divider" />

        <p className="login-register">
          <Link to="/login">← Back to Login</Link>
        </p>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
