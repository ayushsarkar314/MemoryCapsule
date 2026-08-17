import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { checkPasswordStrength, validateEmail } from '../utils/passwordValidation';
import toast from 'react-hot-toast';
import './LoginPage.css';

const RegisterPage = () => {
  const { register, verifyOTP, resendOTP } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState(1); // 1 = Registration Details, 2 = OTP Verification
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  const passwordRules = checkPasswordStrength(form.password);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // Step 1: Request Registration & Send OTP Email
  const handleRegisterSubmit = async (e) => {
    e.preventDefault();

    if (!form.fullName.trim() || !form.email.trim() || !form.password || !form.confirmPassword) {
      return toast.error('Please fill in all required fields');
    }

    if (!validateEmail(form.email)) {
      return toast.error('Please enter a valid email address');
    }

    if (!passwordRules.isStrong) {
      return toast.error('Password does not meet all strength requirements');
    }

    if (form.password !== form.confirmPassword) {
      return toast.error('Password and Confirm Password must match');
    }

    setLoading(true);
    try {
      const res = await register({
        fullName: form.fullName.trim(),
        email: form.email.trim(),
        password: form.password,
        confirmPassword: form.confirmPassword,
      });

      toast.success(res.message || 'OTP code sent to your email address!');
      setStep(2); // Move to OTP verification step
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration request failed');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify OTP and Insert User into MongoDB Database
  const handleOTPSubmit = async (e) => {
    e.preventDefault();

    if (!otp.trim() || otp.trim().length !== 6) {
      return toast.error('Please enter a valid 6-digit OTP code');
    }

    setLoading(true);
    try {
      await verifyOTP(form.email.trim(), otp.trim());
      toast.success('Account created successfully.');
      navigate('/vault');
    } catch (err) {
      toast.error(err.response?.data?.message || 'OTP verification failed');
    } finally {
      setLoading(false);
    }
  };

  // Resend OTP handler
  const handleResendOTP = async () => {
    setResending(true);
    try {
      await resendOTP(form.email.trim());
      toast.success('New OTP sent to your email!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to resend OTP');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="lp-root login-page" style={{ minHeight: '100vh', position: 'relative' }}>
      <div className="login-card lp-glass-card" style={{ maxWidth: '440px' }}>
        
        {step === 1 ? (
          /* STEP 1: Registration Form */
          <>
            <div className="login-header">
              <div className="login-logo">✦</div>
              <h1>Create Account</h1>
              <p>Sign up to preserve your memories</p>
            </div>

            <form onSubmit={handleRegisterSubmit}>
              {/* Full Name */}
              <div className="login-form-group">
                <label htmlFor="fullName">Full Name *</label>
                <input
                  id="fullName"
                  name="fullName"
                  type="text"
                  placeholder="John Doe"
                  value={form.fullName}
                  onChange={handleChange}
                  required
                />
              </div>

              {/* Email Address */}
              <div className="login-form-group">
                <label htmlFor="email">Email Address *</label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={handleChange}
                  required
                />
              </div>

              {/* Password */}
              <div className="login-form-group">
                <label htmlFor="reg-password">Password *</label>
                <input
                  id="reg-password"
                  name="password"
                  type="password"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={handleChange}
                  required
                />

                {/* Password strength indicator */}
                {form.password && (
                  <div style={{
                    marginTop: '8px',
                    padding: '8px 12px',
                    background: 'rgba(255, 255, 255, 0.5)',
                    borderRadius: '8px',
                    fontSize: '0.75rem',
                    fontFamily: 'Manrope, sans-serif',
                  }}>
                    <p style={{ fontWeight: 600, color: '#4f4447', marginBottom: '4px' }}>Password must include:</p>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px' }}>
                      <span style={{ color: passwordRules.minLength ? '#16a34a' : '#9ca3af' }}>
                        {passwordRules.minLength ? '✓' : '○'} Min 6 characters
                      </span>
                      <span style={{ color: passwordRules.hasUpper ? '#16a34a' : '#9ca3af' }}>
                        {passwordRules.hasUpper ? '✓' : '○'} Uppercase letter (A-Z)
                      </span>
                      <span style={{ color: passwordRules.hasLower ? '#16a34a' : '#9ca3af' }}>
                        {passwordRules.hasLower ? '✓' : '○'} Lowercase letter (a-z)
                      </span>
                      <span style={{ color: passwordRules.hasNumber ? '#16a34a' : '#9ca3af' }}>
                        {passwordRules.hasNumber ? '✓' : '○'} Number (0-9)
                      </span>
                      <span style={{ color: passwordRules.hasSpecial ? '#16a34a' : '#9ca3af', gridColumn: 'span 2' }}>
                        {passwordRules.hasSpecial ? '✓' : '○'} Special character (!@#$%...)
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Confirm Password */}
              <div className="login-form-group">
                <label htmlFor="confirmPassword">Confirm Password *</label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  value={form.confirmPassword}
                  onChange={handleChange}
                  required
                />

                {form.confirmPassword && (
                  <p style={{
                    marginTop: '4px',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    color: form.password === form.confirmPassword ? '#16a34a' : '#dc2626',
                  }}>
                    {form.password === form.confirmPassword ? '✓ Passwords match' : '✗ Passwords do not match'}
                  </p>
                )}
              </div>

              <button
                id="register-submit"
                type="submit"
                className="login-button"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="login-spinner" /> Sending OTP…
                  </>
                ) : (
                  'Send Verification Code'
                )}
              </button>
            </form>
          </>
        ) : (
          /* STEP 2: OTP Verification Form */
          <>
            <div className="login-header">
              <div className="login-logo">🔑</div>
              <h1>Verify Email OTP</h1>
              <p style={{ fontSize: '0.88rem', color: '#4f4447' }}>
                Enter the 6-digit code sent to <strong>{form.email}</strong>
              </p>
            </div>

            <form onSubmit={handleOTPSubmit}>
              <div className="login-form-group">
                <label htmlFor="otp-input" style={{ textAlign: 'center', display: 'block' }}>
                  6-Digit Verification Code
                </label>

                <input
                  id="otp-input"
                  name="otp"
                  type="text"
                  maxLength={6}
                  placeholder="123456"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  style={{
                    fontSize: '1.6rem',
                    letterSpacing: '8px',
                    textAlign: 'center',
                    fontWeight: 700,
                    fontFamily: 'monospace',
                  }}
                  autoFocus
                  required
                />
              </div>

              <button
                id="verify-otp-submit"
                type="submit"
                className="login-button"
                disabled={loading || otp.length !== 6}
              >
                {loading ? (
                  <>
                    <span className="login-spinner" /> Verifying & Creating Account…
                  </>
                ) : (
                  'Verify Code & Create Account'
                )}
              </button>
            </form>

            <div style={{ marginTop: '20px', textAlign: 'center', fontSize: '0.85rem' }}>
              <p style={{ color: '#6b7280', marginBottom: '8px' }}>Didn't receive the code?</p>
              <button
                type="button"
                onClick={handleResendOTP}
                disabled={resending}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#f59e0b',
                  fontWeight: 700,
                  cursor: 'pointer',
                  fontSize: '0.85rem',
                  textDecoration: 'underline',
                }}
              >
                {resending ? 'Resending Code…' : 'Resend Verification Code'}
              </button>
            </div>

            <div style={{ marginTop: '16px', textAlign: 'center' }}>
              <button
                type="button"
                onClick={() => setStep(1)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#6b7280',
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                }}
              >
                ← Back to Registration Details
              </button>
            </div>
          </>
        )}

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
