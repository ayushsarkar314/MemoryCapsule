import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ identifier: '', password: '' });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.identifier || !form.password) {
      return toast.error('Please fill in all fields');
    }
    setLoading(true);
    try {
      await login(form.identifier, form.password);
      toast.success('Welcome back ✨');
      navigate('/vault');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
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
          }}>🫙</div>
          <h1 style={{ fontSize: '1.8rem', marginBottom: 'var(--space-2)' }}>Welcome back</h1>
          <p className="text-muted text-sm">Your memories are waiting for you</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="identifier">Email or Username</label>
            <input
              id="identifier"
              name="identifier"
              type="text"
              className="form-input"
              placeholder="you@example.com or @username"
              value={form.identifier}
              onChange={handleChange}
              autoComplete="username"
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="password">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              className="form-input"
              placeholder="••••••••"
              value={form.password}
              onChange={handleChange}
              autoComplete="current-password"
            />
          </div>

          <button
            id="login-submit"
            type="submit"
            className="btn btn-primary w-full"
            style={{ marginTop: 'var(--space-2)', padding: 'var(--space-4)' }}
            disabled={loading}
          >
            {loading ? <><span className="spinner" />  Signing in…</> : 'Sign In'}
          </button>
        </form>

        <div className="divider" />

        <p className="text-center text-sm text-muted">
          Don't have an account?{' '}
          <Link to="/register" style={{ fontWeight: 600 }}>Create one</Link>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
