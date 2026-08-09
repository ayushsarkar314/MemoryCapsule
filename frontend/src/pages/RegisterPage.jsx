import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import ShaderBackground from '../components/ShaderBackground';
import './LoginPage.css';

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
    <div className="lp-root login-page" style={{ minHeight: '100vh', position: 'relative' }}>
      <div className="lp-bg">
        <ShaderBackground />
        <div className="lp-bg-overlay" />
      </div>

      <div className="login-card lp-glass-card">
        <div className="login-header">
          <div className="login-logo">✦</div>
          <h1>Create your vault</h1>
          <p>Capture moments, send them into time</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="login-form-group">
              <label htmlFor="username">Username *</label>
              <input id="username" name="username" type="text"
                placeholder="@you" value={form.username} onChange={handleChange} />
            </div>
            <div className="login-form-group">
              <label htmlFor="displayName">Display Name</label>
              <input id="displayName" name="displayName" type="text"
                placeholder="Your name" value={form.displayName} onChange={handleChange} />
            </div>
          </div>

          <div className="login-form-group">
            <label htmlFor="email">Email *</label>
            <input id="email" name="email" type="email"
              placeholder="you@example.com" value={form.email} onChange={handleChange} />
          </div>

          <div className="login-form-group">
            <label htmlFor="reg-password">Password *</label>
            <input id="reg-password" name="password" type="password"
              placeholder="Min. 6 characters" value={form.password} onChange={handleChange} />
          </div>

          <button id="register-submit" type="submit"
            className="login-button"
            disabled={loading}>
            {loading ? <><span className="login-spinner" /> Creating vault…</> : 'Create My Vault'}
          </button>
        </form>

        <div className="login-divider">
          <span>or</span>
        </div>
        <p className="login-register">
          Already have an account?{' '}
          <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;
