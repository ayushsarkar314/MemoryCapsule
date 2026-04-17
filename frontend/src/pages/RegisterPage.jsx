import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const RegisterPage = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: '', email: '', password: '', displayName: '' });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.username || !form.email || !form.password) {
      return toast.error('Please fill in all required fields');
    }
    if (form.password.length < 6) return toast.error('Password must be at least 6 characters');
    setLoading(true);
    try {
      await register(form.username, form.email, form.password, form.displayName);
      toast.success('Your vault is ready ✨');
      navigate('/vault');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="text-center" style={{ marginBottom: 'var(--space-8)' }}>
          <div style={{
            width: 64, height: 64,
            background: 'var(--gradient-amber)',
            borderRadius: 'var(--radius-xl)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.8rem', margin: '0 auto var(--space-4)',
            boxShadow: 'var(--shadow-glow)',
          }}>🫙</div>
          <h1 style={{ fontSize: '1.8rem', marginBottom: 'var(--space-2)' }}>Create your vault</h1>
          <p className="text-muted text-sm">Capture moments, send them into time</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
            <div className="form-group">
              <label className="form-label" htmlFor="username">Username *</label>
              <input id="username" name="username" type="text" className="form-input"
                placeholder="@you" value={form.username} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="displayName">Display Name</label>
              <input id="displayName" name="displayName" type="text" className="form-input"
                placeholder="Your name" value={form.displayName} onChange={handleChange} />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="email">Email *</label>
            <input id="email" name="email" type="email" className="form-input"
              placeholder="you@example.com" value={form.email} onChange={handleChange} />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="reg-password">Password *</label>
            <input id="reg-password" name="password" type="password" className="form-input"
              placeholder="Min. 6 characters" value={form.password} onChange={handleChange} />
          </div>

          <button id="register-submit" type="submit"
            className="btn btn-primary w-full"
            style={{ marginTop: 'var(--space-2)', padding: 'var(--space-4)' }}
            disabled={loading}>
            {loading ? <><span className="spinner" /> Creating vault…</> : 'Create My Vault'}
          </button>
        </form>

        <div className="divider" />
        <p className="text-center text-sm text-muted">
          Already have an account?{' '}
          <Link to="/login" style={{ fontWeight: 600 }}>Sign in</Link>
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;
