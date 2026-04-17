import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import toast from 'react-hot-toast';

const ForgotPasswordPage = () => {
  const [email, setEmail]       = useState('');
  const [loading, setLoading]   = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) return toast.error('Please enter your email address');

    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email: email.trim() });
      setSubmitted(true);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Something went wrong. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        {/* Logo */}
        <div className="text-center" style={{ marginBottom: 'var(--space-8)' }}>
          <div style={{
            width: 64, height: 64,
            background: 'var(--gradient-amber)',
            borderRadius: 'var(--radius-xl)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.8rem', margin: '0 auto var(--space-4)',
            boxShadow: 'var(--shadow-glow)',
          }}>🔑</div>
          <h1 style={{ fontSize: '1.8rem', marginBottom: 'var(--space-2)' }}>Forgot Password</h1>
          <p className="text-muted text-sm">Enter your email and we'll send you a reset link</p>
        </div>

        {submitted ? (
          /* Success state */
          <div style={{
            textAlign: 'center',
            padding: 'var(--space-8)',
            background: 'var(--color-parchment)',
            borderRadius: 'var(--radius-lg)',
          }}>
            <div style={{ fontSize: '2.5rem', marginBottom: 'var(--space-4)' }}>📬</div>
            <h3 style={{ marginBottom: 'var(--space-3)', fontSize: '1.1rem' }}>Check your inbox!</h3>
            <p className="text-muted text-sm" style={{ lineHeight: 1.7 }}>
              If <strong>{email}</strong> is registered, a password reset link has been sent.
              It expires in <strong>10 minutes</strong>.
            </p>
            <p className="text-muted text-xs" style={{ marginTop: 'var(--space-4)' }}>
              Didn't receive it? Check your spam folder.
            </p>
          </div>
        ) : (
          /* Form state */
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label" htmlFor="forgot-email">Email Address</label>
              <input
                id="forgot-email"
                name="email"
                type="email"
                className="form-input"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                autoFocus
              />
            </div>

            <button
              id="forgot-submit"
              type="submit"
              className="btn btn-primary w-full"
              style={{ marginTop: 'var(--space-2)', padding: 'var(--space-4)' }}
              disabled={loading}
            >
              {loading ? <><span className="spinner" />  Sending…</> : 'Send Reset Link'}
            </button>
          </form>
        )}

        <div className="divider" />

        <p className="text-center text-sm text-muted">
          <Link to="/login" style={{ fontWeight: 600 }}>← Back to Login</Link>
        </p>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
