import { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import toast from 'react-hot-toast';

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
    <div className="container page-content">
      <div style={{ maxWidth: 540, margin: '0 auto' }}>
        <p className="section-eyebrow">Settings</p>
        <h2 style={{ marginBottom: 'var(--space-8)' }}>My Profile</h2>

        <div className="card-glass" style={{ padding: 'var(--space-10)' }}>
          {/* Avatar */}
          <div style={{ textAlign: 'center', marginBottom: 'var(--space-8)' }}>
            <div {...getRootProps()} style={{ display: 'inline-block', cursor: 'pointer', position: 'relative' }}>
              <input {...getInputProps()} />
              <div style={{
                width: 96, height: 96, borderRadius: '50%',
                background: currentAvatar ? 'transparent' : 'var(--gradient-amber)',
                overflow: 'hidden',
                border: '3px solid var(--color-blush)',
                boxShadow: 'var(--shadow-glow)',
                margin: '0 auto',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {currentAvatar
                  ? <img src={currentAvatar} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : <span style={{ color: '#fff', fontSize: '1.5rem', fontWeight: 700 }}>{initials}</span>
                }
              </div>
              <div style={{
                position: 'absolute', bottom: 0, right: 0,
                background: 'var(--gradient-amber)', borderRadius: '50%',
                width: 28, height: 28, display: 'flex', alignItems: 'center',
                justifyContent: 'center', fontSize: '0.8rem',
                border: '2px solid #fff',
              }}>✏️</div>
            </div>
            <p className="text-xs text-muted" style={{ marginTop: 'var(--space-3)' }}>Click to change avatar</p>
          </div>

          {/* Read-only info */}
          <div style={{ marginBottom: 'var(--space-6)', padding: 'var(--space-4)', background: 'var(--color-parchment)', borderRadius: 'var(--radius-md)' }}>
            <div className="flex justify-between" style={{ marginBottom: 'var(--space-2)', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
              <span className="text-sm text-muted">Username</span>
              <span style={{ fontWeight: 600, fontSize: '0.9rem', overflowWrap: 'anywhere' }}>@{user?.username}</span>
            </div>
            <div className="flex justify-between" style={{ flexWrap: 'wrap', gap: 'var(--space-2)' }}>
              <span className="text-sm text-muted">Email</span>
              <span style={{ fontWeight: 500, fontSize: '0.9rem', overflowWrap: 'anywhere' }}>{user?.email}</span>
            </div>
          </div>

          {/* Editable fields */}
          <div className="form-group">
            <label className="form-label">Display Name</label>
            <input className="form-input" placeholder="Your name" value={form.displayName} onChange={e => setForm({ ...form, displayName: e.target.value })} />
          </div>

          <div className="form-group">
            <label className="form-label">Bio <span className="text-muted">(max 150 chars)</span></label>
            <textarea className="form-textarea" rows={3} placeholder="A short sentence about you…" maxLength={150} value={form.bio} onChange={e => setForm({ ...form, bio: e.target.value })} />
            <p className="text-xs text-muted" style={{ textAlign: 'right' }}>{form.bio.length}/150</p>
          </div>

          <button className="btn btn-primary w-full" onClick={handleSave} disabled={loading}>
            {loading ? <><span className="spinner" /> Saving…</> : 'Save Changes'}
          </button>

          <div className="divider" style={{ margin: 'var(--space-8) 0' }} />

          {/* Change Password Collapsible */}
          <div>
            <button 
              className="btn btn-secondary w-full" 
              style={{ 
                background: 'var(--color-parchment)', 
                color: 'var(--color-text-primary)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
              onClick={() => setShowPasswordSection(!showPasswordSection)}
            >
              <span>{showPasswordSection ? '🔒 Hide Password Settings' : '🔑 Change Password'}</span>
              <span>{showPasswordSection ? '−' : '+'}</span>
            </button>

            {showPasswordSection && (
              <div style={{ marginTop: 'var(--space-6)', padding: 'var(--space-4)', border: '1px dashed var(--color-sand)', borderRadius: 'var(--radius-md)' }}>
                <div className="form-group">
                  <label className="form-label">Current Password</label>
                  <input 
                    type="password" 
                    className="form-input" 
                    value={pwdForm.currentPassword} 
                    onChange={e => setPwdForm({...pwdForm, currentPassword: e.target.value})} 
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">New Password</label>
                  <input 
                    type="password" 
                    className="form-input" 
                    placeholder="Min. 6 characters"
                    value={pwdForm.newPassword} 
                    onChange={e => setPwdForm({...pwdForm, newPassword: e.target.value})} 
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Confirm New Password</label>
                  <input 
                    type="password" 
                    className="form-input" 
                    value={pwdForm.confirmPassword} 
                    onChange={e => setPwdForm({...pwdForm, confirmPassword: e.target.value})} 
                  />
                </div>
                <button 
                  className="btn btn-primary w-full" 
                  onClick={handleChangePassword} 
                  disabled={pwdLoading}
                  style={{ background: 'var(--gradient-amber)' }}
                >
                  {pwdLoading ? <><span className="spinner" /> Updating…</> : 'Update Password'}
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
