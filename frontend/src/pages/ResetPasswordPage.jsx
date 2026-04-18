import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import api from '../utils/api';
import toast from 'react-hot-toast';

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
      <div className="auth-page">
        <div className="auth-card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: 'var(--space-4)' }}>⚠️</div>
          <h2 style={{ marginBottom: 'var(--space-3)' }}>Invalid Reset Link</h2>
          <p className="text-muted text-sm" style={{ marginBottom: 'var(--space-6)' }}>
            This reset link is missing or malformed.
          </p>
          <Link to="/forgot-password" className="btn btn-primary">
            Request a New Link
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        {/* Logo */}
        <div className="text-center" style={{ marginBottom: 'var(--space-8)' }}>
          <h1 style={{ fontSize: '1.8rem', marginBottom: 'var(--space-2)' }}>Reset Password</h1>
          <p className="text-muted text-sm">Choose a strong new password for your account</p>
        </div>

        <form onSubmit={handleSubmit}>
          {/* New Password */}
          <div className="form-group">
            <label className="form-label" htmlFor="reset-new-password">New Password</label>
            <div style={{ position: 'relative' }}>
              <input
                id="reset-new-password"
                name="newPassword"
                type={showNew ? 'text' : 'password'}
                className="form-input"
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
                  color: 'var(--color-text-muted)', padding: '0 0.25rem',
                }}
                aria-label={showNew ? 'Hide password' : 'Show password'}
              >
                {showNew ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div className="form-group">
            <label className="form-label" htmlFor="reset-confirm-password">Confirm New Password</label>
            <div style={{ position: 'relative' }}>
              <input
                id="reset-confirm-password"
                name="confirmPassword"
                type={showConfirm ? 'text' : 'password'}
                className="form-input"
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
                  color: 'var(--color-text-muted)', padding: '0 0.25rem',
                }}
                aria-label={showConfirm ? 'Hide password' : 'Show password'}
              >
                {showConfirm ? '🙈' : '👁️'}
              </button>
            </div>

            {/* Match indicator */}
            {form.confirmPassword && (
              <p style={{
                marginTop: 'var(--space-1)', fontSize: '0.78rem',
                color: form.newPassword === form.confirmPassword ? '#22c55e' : '#ef4444',
              }}>
                {form.newPassword === form.confirmPassword ? '✓ Passwords match' : '✗ Passwords do not match'}
              </p>
            )}
          </div>

          <button
            id="reset-submit"
            type="submit"
            className="btn btn-primary w-full"
            style={{ marginTop: 'var(--space-2)', padding: 'var(--space-4)' }}
            disabled={loading}
          >
            {loading ? <><span className="spinner" />  Resetting…</> : 'Set New Password'}
          </button>
        </form>

        <div className="divider" />

        <p className="text-center text-sm text-muted">
          <Link to="/login" style={{ fontWeight: 600 }}>← Back to Login</Link>
        </p>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
