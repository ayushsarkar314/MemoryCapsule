import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import toast from 'react-hot-toast';
import './LandingPage.css';

const ProfilePage = () => {
  const { user, refreshUser } = useAuth();
  const [form, setForm] = useState({
    displayName: user?.displayName || '',
    bio: user?.bio || '',
  });
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  
  // Change Password state
  const [showPasswordSection, setShowPasswordSection] = useState(false);
  const [pwdForm, setPwdForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [pwdLoading, setPwdLoading] = useState(false);

  const onDrop = useCallback((accepted) => {
    if (accepted.length > 0) {
      setAvatarFile(accepted[0]);
      setAvatarPreview(URL.createObjectURL(accepted[0]));
    }
  }, []);

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    accept: { 'image/*': [] },
    maxFiles: 1,
  });

  const handleSave = async () => {
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('displayName', form.displayName);
      formData.append('bio', form.bio);
      if (avatarFile) formData.append('avatar', avatarFile);
      await api.put('/auth/profile', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      await refreshUser();
      toast.success('Profile updated ✨');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!pwdForm.currentPassword || !pwdForm.newPassword || !pwdForm.confirmPassword) {
      return toast.error('Please fill in all password fields');
    }
    if (pwdForm.newPassword !== pwdForm.confirmPassword) {
      return toast.error('New passwords do not match');
    }
    if (pwdForm.newPassword.length < 6) {
      return toast.error('New password must be at least 6 characters');
    }

    setPwdLoading(true);
    try {
      await api.post('/auth/change-password', {
        currentPassword: pwdForm.currentPassword,
        newPassword: pwdForm.newPassword,
      });
      toast.success('Password updated successfully ✨');
      setPwdForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setShowPasswordSection(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not update password');
    } finally {
      setPwdLoading(false);
    }
  };

  const initials = (user?.displayName || user?.username || '?').slice(0, 2).toUpperCase();
  const currentAvatar = avatarPreview || user?.avatar;

  return (
    <div className="lp-root" style={{ minHeight: '100vh', position: 'relative' }}>
      <div className="container page-content" style={{ position: 'relative', zIndex: 2, paddingTop: '100px', paddingBottom: '64px', maxWidth: '640px', margin: '0 auto' }}>
        
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <span className="lp-eyebrow" style={{ marginBottom: '12px' }}>Account Settings</span>
          <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: 'clamp(28px, 4vw, 42px)', fontWeight: 700, color: '#1d1b19', marginBottom: '8px' }}>
            My Profile
          </h1>
          <p style={{ fontFamily: 'Manrope, sans-serif', color: '#4f4447', fontSize: '16px' }}>
            Manage your digital identity, avatar, and security settings.
          </p>
        </div>

        <div className="lp-glass-card" style={{ padding: '40px', borderRadius: '32px' }}>
          {/* Avatar */}
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <div {...getRootProps()} style={{ display: 'inline-block', cursor: 'pointer', position: 'relative' }}>
              <input {...getInputProps()} />
              <div style={{
                width: 104, height: 104, borderRadius: '50%',
                background: currentAvatar ? 'transparent' : 'linear-gradient(135deg, #7a545f 0%, #603d48 100%)',
                overflow: 'hidden',
                border: '3px solid rgba(255, 255, 255, 0.8)',
                boxShadow: '0 8px 24px rgba(74, 43, 77, 0.18)',
                margin: '0 auto',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {currentAvatar
                  ? <img src={currentAvatar} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : <span style={{ color: '#fff', fontSize: '1.75rem', fontWeight: 700, fontFamily: 'Manrope, sans-serif' }}>{initials}</span>
                }
              </div>
              <div style={{
                position: 'absolute', bottom: 2, right: 2,
                background: '#7a545f', borderRadius: '50%',
                width: 32, height: 32, display: 'flex', alignItems: 'center',
                justifyContent: 'center', fontSize: '0.85rem', color: '#fff',
                border: '2px solid #fff', boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
              }}>✏️</div>
            </div>
            <p style={{ fontFamily: 'Manrope, sans-serif', color: '#4f4447', fontSize: '13px', marginTop: '10px' }}>Click avatar to upload new photo</p>
          </div>

          {/* Read-only info */}
          <div style={{ marginBottom: '24px', padding: '18px 20px', background: 'rgba(255, 255, 255, 0.65)', border: '1px solid rgba(122, 84, 95, 0.15)', borderRadius: '16px' }}>
            <div className="flex justify-between" style={{ marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
              <span style={{ fontFamily: 'Manrope, sans-serif', color: '#4f4447', fontSize: '14px' }}>Username</span>
              <span style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 700, fontSize: '14px', color: '#1d1b19', overflowWrap: 'anywhere' }}>@{user?.username}</span>
            </div>
            <div className="flex justify-between" style={{ flexWrap: 'wrap', gap: '8px' }}>
              <span style={{ fontFamily: 'Manrope, sans-serif', color: '#4f4447', fontSize: '14px' }}>Email</span>
              <span style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 600, fontSize: '14px', color: '#1d1b19', overflowWrap: 'anywhere' }}>{user?.email}</span>
            </div>
          </div>

          {/* Editable fields */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontFamily: 'Manrope, sans-serif', fontWeight: 600, fontSize: '14px', color: '#1d1b19', marginBottom: '8px' }}>Display Name</label>
            <input
              style={{
                width: '100%', padding: '14px 18px', borderRadius: '14px',
                border: '1px solid rgba(122, 84, 95, 0.22)', background: 'rgba(255, 255, 255, 0.85)',
                color: '#1d1b19', fontFamily: 'Manrope, sans-serif', fontSize: '15px', outline: 'none'
              }}
              placeholder="Your name" value={form.displayName} onChange={e => setForm({ ...form, displayName: e.target.value })}
            />
          </div>

          <div style={{ marginBottom: '28px' }}>
            <label style={{ display: 'block', fontFamily: 'Manrope, sans-serif', fontWeight: 600, fontSize: '14px', color: '#1d1b19', marginBottom: '8px' }}>
              Bio <span style={{ color: '#4f4447', fontWeight: 400, fontSize: '13px' }}>(max 150 chars)</span>
            </label>
            <textarea
              style={{
                width: '100%', padding: '14px 18px', borderRadius: '14px',
                border: '1px solid rgba(122, 84, 95, 0.22)', background: 'rgba(255, 255, 255, 0.85)',
                color: '#1d1b19', fontFamily: 'Manrope, sans-serif', fontSize: '15px', outline: 'none', resize: 'vertical'
              }}
              rows={3} placeholder="A short sentence about you…" maxLength={150} value={form.bio} onChange={e => setForm({ ...form, bio: e.target.value })}
            />
            <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '12px', color: '#4f4447', textAlign: 'right', marginTop: '4px' }}>{form.bio.length}/150</p>
          </div>

          <button className="lp-btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '14px' }} onClick={handleSave} disabled={loading}>
            {loading ? <><span className="login-spinner" /> Saving…</> : 'Save Changes'}
          </button>

          <div style={{ height: 1, background: 'rgba(122, 84, 95, 0.15)', margin: '32px 0' }} />

          {/* Change Password Collapsible */}
          <div>
            <button 
              className="lp-btn-outline" 
              style={{ 
                width: '100%',
                display: 'flex',
                justify: 'space-between',
                alignItems: 'center',
                margin: 0,
                padding: '14px 20px',
                borderRadius: '14px'
              }}
              onClick={() => setShowPasswordSection(!showPasswordSection)}
            >
              <span style={{ fontFamily: 'Manrope, sans-serif' }}>{showPasswordSection ? '🔒 Hide Password Settings' : '🔑 Change Password'}</span>
              <span>{showPasswordSection ? '−' : '+'}</span>
            </button>

            {showPasswordSection && (
              <div style={{ marginTop: '20px', padding: '20px', background: 'rgba(255, 255, 255, 0.65)', border: '1px solid rgba(122, 84, 95, 0.18)', borderRadius: '20px' }}>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontFamily: 'Manrope, sans-serif', fontWeight: 600, fontSize: '13px', color: '#1d1b19', marginBottom: '6px' }}>Current Password</label>
                  <input 
                    type="password" 
                    style={{
                      width: '100%', padding: '12px 16px', borderRadius: '12px',
                      border: '1px solid rgba(122, 84, 95, 0.22)', background: '#ffffff',
                      color: '#1d1b19', fontFamily: 'Manrope, sans-serif', fontSize: '14px', outline: 'none'
                    }}
                    value={pwdForm.currentPassword} 
                    onChange={e => setPwdForm({...pwdForm, currentPassword: e.target.value})} 
                  />
                </div>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontFamily: 'Manrope, sans-serif', fontWeight: 600, fontSize: '13px', color: '#1d1b19', marginBottom: '6px' }}>New Password</label>
                  <input 
                    type="password" 
                    style={{
                      width: '100%', padding: '12px 16px', borderRadius: '12px',
                      border: '1px solid rgba(122, 84, 95, 0.22)', background: '#ffffff',
                      color: '#1d1b19', fontFamily: 'Manrope, sans-serif', fontSize: '14px', outline: 'none'
                    }}
                    placeholder="Min. 6 characters"
                    value={pwdForm.newPassword} 
                    onChange={e => setPwdForm({...pwdForm, newPassword: e.target.value})} 
                  />
                </div>
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', fontFamily: 'Manrope, sans-serif', fontWeight: 600, fontSize: '13px', color: '#1d1b19', marginBottom: '6px' }}>Confirm New Password</label>
                  <input 
                    type="password" 
                    style={{
                      width: '100%', padding: '12px 16px', borderRadius: '12px',
                      border: '1px solid rgba(122, 84, 95, 0.22)', background: '#ffffff',
                      color: '#1d1b19', fontFamily: 'Manrope, sans-serif', fontSize: '14px', outline: 'none'
                    }}
                    value={pwdForm.confirmPassword} 
                    onChange={e => setPwdForm({...pwdForm, confirmPassword: e.target.value})} 
                  />
                </div>
                <button 
                  className="lp-btn-primary" 
                  onClick={handleChangePassword} 
                  disabled={pwdLoading}
                  style={{ width: '100%', justifyContent: 'center', padding: '12px' }}
                >
                  {pwdLoading ? <><span className="login-spinner" /> Updating…</> : 'Update Password'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
