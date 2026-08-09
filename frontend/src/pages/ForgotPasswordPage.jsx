import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import toast from 'react-hot-toast';
import './LoginPage.css';

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
    <div className="lp-root login-page" style={{ minHeight: '100vh', position: 'relative' }}>
      <div className="login-card lp-glass-card">
        {/* Header */}
        <div className="login-header">
          <div className="login-logo">✦</div>
          <h1>Forgot Password</h1>
          <p>Enter your email and we'll send you a reset link</p>
        </div>

        {submitted ? (
          /* Success state */
          <div style={{
            textAlign: 'center',
            padding: '32px 20px',
            background: 'rgba(255, 255, 255, 0.65)',
            borderRadius: '20px',
            border: '1px solid rgba(122, 84, 95, 0.15)',
          }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '16px' }}>📬</div>
            <h3 style={{ fontFamily: 'Playfair Display, serif', marginBottom: '12px', fontSize: '1.2rem', color: '#1d1b19' }}>Check your inbox!</h3>
            <p style={{ fontFamily: 'Manrope, sans-serif', color: '#4f4447', fontSize: '0.9rem', lineHeight: 1.7 }}>
              If <strong>{email}</strong> is registered, a password reset link has been sent.
              It expires in <strong>10 minutes</strong>.
            </p>
            <p style={{ fontFamily: 'Manrope, sans-serif', color: '#7a545f', fontSize: '0.8rem', marginTop: '16px' }}>
              Didn't receive it? Check your spam folder.
            </p>
          </div>
        ) : (
          /* Form state */
          <form onSubmit={handleSubmit}>
            <div className="login-form-group">
              <label htmlFor="forgot-email">Email Address</label>
              <input
                id="forgot-email"
                name="email"
                type="email"
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
              className="login-button"
              disabled={loading}
            >
              {loading ? <><span className="login-spinner" />  Sending…</> : 'Send Reset Link'}
            </button>
          </form>
        )}

        <div className="login-divider" />

        <p className="login-register">
          <Link to="/login">← Back to Login</Link>
        </p>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
