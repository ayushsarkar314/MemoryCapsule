import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import ShaderBackground from '../components/ShaderBackground';
import './LoginPage.css';

const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    identifier: '',
    password: '',
  });

  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

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
    <div className="lp-root login-page" style={{ minHeight: '100vh', position: 'relative' }}>
      <div className="lp-bg">
        <ShaderBackground />
        <div className="lp-bg-overlay" />
      </div>

      <div className="login-card lp-glass-card">

        {/* Logo / Brand */}
        <div className="login-header">
          <div className="login-logo">✦</div>

          <h1>Welcome back</h1>

          <p>Your memories are waiting for you.</p>
        </div>

        <form onSubmit={handleSubmit}>

          {/* Email / Username */}
          <div className="login-form-group">
            <label htmlFor="identifier">
              Email or Username
            </label>

            <input
              id="identifier"
              name="identifier"
              type="text"
              placeholder="you@example.com or @username"
              value={form.identifier}
              onChange={handleChange}
              autoComplete="username"
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