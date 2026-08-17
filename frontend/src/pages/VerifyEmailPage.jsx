import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../utils/api';
import toast from 'react-hot-toast';
import './LoginPage.css';

const VerifyEmailPage = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';

  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (!token) {
      setLoading(false);
      setErrorMsg('Verification link is missing or malformed.');
      return;
    }

    const doVerify = async () => {
      try {
        const res = await api.post('/auth/verify-email', { token });
        setSuccess(true);
        toast.success(res.data.message || 'Email verified successfully!');
      } catch (err) {
        setErrorMsg(err.response?.data?.message || 'Verification failed. The link may have expired.');
      } finally {
        setLoading(false);
      }
    };

    doVerify();
  }, [token]);

  return (
    <div className="lp-root login-page" style={{ minHeight: '100vh', position: 'relative' }}>
      <div className="login-card lp-glass-card" style={{ textAlign: 'center', maxWidth: '440px' }}>
        <div className="login-header">
          <div className="login-logo">✦</div>
          <h1>Email Verification</h1>
        </div>

        {loading ? (
          <div style={{ padding: '32px 0' }}>
            <span className="login-spinner" style={{ width: '32px', height: '32px', borderWidth: '3px' }} />
            <p style={{ marginTop: '16px', color: '#4f4447', fontFamily: 'Manrope, sans-serif' }}>
              Verifying your email address…
            </p>
          </div>
        ) : success ? (
          <div style={{
            padding: '24px 16px',
            background: 'rgba(255, 255, 255, 0.7)',
            borderRadius: '16px',
            border: '1px solid rgba(122, 84, 95, 0.15)',
          }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>✅</div>
            <h3 style={{ fontFamily: 'Playfair Display, serif', marginBottom: '8px', fontSize: '1.2rem', color: '#1d1b19' }}>
              Email Verified Successfully!
            </h3>
            <p style={{ fontFamily: 'Manrope, sans-serif', color: '#4f4447', fontSize: '0.9rem', marginBottom: '20px', lineHeight: 1.6 }}>
              Your account is now active. You can log in with your email and password.
            </p>
            <Link to="/login" className="login-button" style={{ display: 'inline-block', textDecoration: 'none' }}>
              Log In Now
            </Link>
          </div>
        ) : (
          <div style={{
            padding: '24px 16px',
            background: 'rgba(255, 241, 242, 0.8)',
            borderRadius: '16px',
            border: '1px solid #fecdd3',
          }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>⚠️</div>
            <h3 style={{ fontFamily: 'Playfair Display, serif', marginBottom: '8px', fontSize: '1.2rem', color: '#9f1239' }}>
              Verification Failed
            </h3>
            <p style={{ fontFamily: 'Manrope, sans-serif', color: '#881337', fontSize: '0.9rem', marginBottom: '20px', lineHeight: 1.6 }}>
              {errorMsg}
            </p>
            <Link to="/login" className="login-button" style={{ display: 'inline-block', textDecoration: 'none' }}>
              Back to Login
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default VerifyEmailPage;
