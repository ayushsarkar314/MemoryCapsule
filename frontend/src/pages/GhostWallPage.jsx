import { useState, useEffect, useCallback } from 'react';
import { formatDistanceToNow, differenceInSeconds } from 'date-fns';
import { useDropzone } from 'react-dropzone';
import api from '../utils/api';
import toast from 'react-hot-toast';
import ShaderBackground from '../components/ShaderBackground';
import './LandingPage.css';

const EXPIRY_OPTIONS = [
  { label: '1 hour', value: 1 },
  { label: '6 hours', value: 6 },
  { label: '12 hours', value: 12 },
  { label: '24 hours', value: 24 },
  { label: '3 days', value: 72 },
  { label: '7 days', value: 168 },
];

const GhostTimer = ({ expiresAt }) => {
  const [remaining, setRemaining] = useState('');

  useEffect(() => {
    const update = () => {
      const secs = differenceInSeconds(new Date(expiresAt), new Date());
      if (secs <= 0) { setRemaining('Expired'); return; }
      const h = Math.floor(secs / 3600);
      const m = Math.floor((secs % 3600) / 60);
      const s = secs % 60;
      setRemaining(h > 0 ? `${h}h ${m}m` : m > 0 ? `${m}m ${s}s` : `${s}s`);
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [expiresAt]);

  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '4px',
      padding: '4px 12px', borderRadius: '9999px',
      background: 'rgba(122, 84, 95, 0.12)', color: '#7a545f',
      fontFamily: 'Manrope, sans-serif', fontSize: '0.8rem', fontWeight: 600
    }}>
      ⏳ {remaining}
    </span>
  );
};

const GhostWallPage = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCompose, setShowCompose] = useState(false);
  const [contentType, setContentType] = useState('text');
  const [textContent, setTextContent] = useState('');
  const [expiryHours, setExpiryHours] = useState(24);
  const [mediaFile, setMediaFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchPosts = async () => {
    try {
      const res = await api.get('/ghost');
      setPosts(res.data.posts);
    } catch {
      toast.error('Could not load Ghost Wall');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
    const interval = setInterval(fetchPosts, 30000); // refresh every 30s
    return () => clearInterval(interval);
  }, []);

  const onDrop = useCallback((accepted) => {
    if (accepted.length > 0) setMediaFile(accepted[0]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': [] },
    maxFiles: 1,
  });

  const handleReact = async (postId, reaction) => {
    try {
      const res = await api.post(`/ghost/${postId}/react`, { reaction });
      setPosts(posts.map(p => p._id === postId ? { ...p, reactions: res.data.reactions } : p));
    } catch {
      toast.error('Could not react');
    }
  };

  const handleSubmit = async () => {
    if (contentType === 'text' && !textContent.trim()) return toast.error('Write something first');
    if (contentType === 'image' && !mediaFile) return toast.error('Please select an image');
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('contentType', contentType);
      formData.append('expiryHours', expiryHours);
      if (contentType === 'text') formData.append('textContent', textContent);
      if (mediaFile) formData.append('media', mediaFile);
      await api.post('/ghost', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success('👻 Ghost post released!');
      setShowCompose(false);
      setTextContent('');
      setMediaFile(null);
      setExpiryHours(24);
      fetchPosts();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not post');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="lp-root create-shader-bg" style={{ minHeight: '100vh', position: 'relative' }}>
      {/* ── WebGL Shader Background ── */}
      <div className="lp-bg">
        <ShaderBackground />
        <div className="lp-bg-overlay" />
      </div>

      <div className="container page-content" style={{ position: 'relative', zIndex: 10, paddingTop: '100px', paddingBottom: '64px', maxWidth: '780px', margin: '0 auto' }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '36px' }}>
          <span className="lp-eyebrow" style={{ marginBottom: '12px' }}>Ephemeral Realm</span>
          <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: 'clamp(28px, 4vw, 42px)', fontWeight: 700, color: '#1d1b19', marginBottom: '8px' }}>
            Ghost Wall
          </h1>
          <p style={{ fontFamily: 'Manrope, sans-serif', color: '#4f4447', fontSize: '16px', marginBottom: '20px' }}>
            Anonymous. Temporary. Honest.
          </p>
          <button
            className="lp-btn-primary"
            onClick={() => setShowCompose(!showCompose)}
          >
            {showCompose ? '✕ Cancel' : '+ Post a Ghost Message'}
          </button>
        </div>

        {/* Compose Panel */}
        {showCompose && (
          <div className="lp-glass-card" style={{
            borderRadius: '28px',
            padding: '32px',
            marginBottom: '32px',
            animation: 'slideDown 250ms ease',
          }}>
            <h3 style={{ fontFamily: 'Playfair Display, serif', color: '#1d1b19', fontSize: '20px', fontWeight: 600, marginBottom: '20px' }}>Release your ghost</h3>

            {/* Type select */}
            <div className="flex gap-3" style={{ marginBottom: '20px' }}>
              {['text', 'image'].map(t => (
                <button key={t} onClick={() => setContentType(t)}
                  style={{
                    padding: '8px 20px',
                    borderRadius: '9999px',
                    border: contentType === t ? '2px solid #7a545f' : '1px solid rgba(122, 84, 95, 0.2)',
                    background: contentType === t ? 'rgba(122, 84, 95, 0.12)' : 'rgba(255, 255, 255, 0.65)',
                    color: contentType === t ? '#7a545f' : '#4f4447',
                    fontFamily: 'Manrope, sans-serif', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer',
                  }}>
                  {t === 'text' ? '📝 Text' : '🖼️ Image'}
                </button>
              ))}
            </div>

            {contentType === 'text' ? (
              <textarea
                placeholder="What's haunting you tonight…"
                value={textContent}
                onChange={e => setTextContent(e.target.value)}
                rows={4}
                style={{
                  width: '100%', background: 'rgba(255, 255, 255, 0.85)',
                  border: '1px solid rgba(122, 84, 95, 0.22)',
                  borderRadius: '16px', padding: '16px',
                  color: '#1d1b19', fontFamily: 'Manrope, sans-serif', fontSize: '0.95rem',
                  resize: 'vertical', outline: 'none',
                }}
              />
            ) : (
              <div {...getRootProps()} style={{
                border: '2px dashed rgba(122, 84, 95, 0.3)',
                borderRadius: '16px',
                padding: '32px',
                textAlign: 'center', cursor: 'pointer',
                background: isDragActive ? 'rgba(122, 84, 95, 0.08)' : 'rgba(255, 255, 255, 0.65)',
                color: '#4f4447', fontFamily: 'Manrope, sans-serif',
              }}>
                <input {...getInputProps()} />
                {mediaFile ? <p>✅ {mediaFile.name}</p> : <p>Drop an image here or click to select</p>}
              </div>
            )}

            {/* Expiry */}
            <div style={{ marginTop: '20px' }}>
              <p style={{ color: '#4f4447', fontFamily: 'Manrope, sans-serif', fontSize: '0.875rem', fontWeight: 600, marginBottom: '10px' }}>
                Disappears after:
              </p>
              <div className="flex gap-2" style={{ flexWrap: 'wrap' }}>
                {EXPIRY_OPTIONS.map(({ label, value }) => (
                  <button key={value} onClick={() => setExpiryHours(value)}
                    style={{
                      padding: '6px 14px',
                      borderRadius: '9999px',
                      border: expiryHours === value ? '2px solid #7a545f' : '1px solid rgba(122, 84, 95, 0.2)',
                      background: expiryHours === value ? 'rgba(122, 84, 95, 0.15)' : 'rgba(255, 255, 255, 0.65)',
                      color: expiryHours === value ? '#7a545f' : '#4f4447',
                      fontFamily: 'Manrope, sans-serif', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer',
                    }}>
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <button
              className="lp-btn-primary"
              style={{ marginTop: '24px', width: '100%', justifyContent: 'center', padding: '14px' }}
              onClick={handleSubmit}
              disabled={submitting}
            >
              {submitting ? '👻 Releasing…' : '👻 Release into the Wall'}
            </button>
          </div>
        )}

        {/* Posts */}
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {[...Array(3)].map((_, i) => (
              <div key={i} className="lp-glass-card" style={{ height: 120, borderRadius: '24px' }} />
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div className="lp-glass-card" style={{ borderRadius: '28px', padding: '64px 32px', textAlign: 'center' }}>
            <p style={{ fontSize: '3rem', marginBottom: '16px' }}>🌫️</p>
            <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: '22px', fontWeight: 600, color: '#1d1b19', marginBottom: '8px' }}>The wall is empty</h3>
            <p style={{ fontFamily: 'Manrope, sans-serif', color: '#4f4447', fontSize: '15px' }}>Be the first to haunt it with a message.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            {posts.map(post => (
              <div key={post._id} className="lp-glass-card" style={{ padding: '24px', borderRadius: '24px' }}>
                {post.contentType === 'text' ? (
                  <p style={{ color: '#1d1b19', lineHeight: 1.75, marginBottom: '16px', fontFamily: 'Playfair Display, serif', fontSize: '1.05rem' }}>
                    {post.textContent}
                  </p>
                ) : post.mediaUrl ? (
                  <img src={post.mediaUrl} alt="ghost post" style={{ width: '100%', maxHeight: 340, objectFit: 'cover', borderRadius: '16px', marginBottom: '16px' }} />
                ) : null}

                <div className="flex items-center justify-between" style={{ flexWrap: 'wrap', gap: '12px' }}>
                  <GhostTimer expiresAt={post.expiresAt} />
                  <div className="flex gap-2" style={{ flexWrap: 'wrap' }}>
                    {[['heart', '❤️'], ['ghost', '👻'], ['fire', '🔥']].map(([key, emoji]) => (
                      <button key={key} onClick={() => handleReact(post._id, key)}
                        style={{
                          display: 'inline-flex', alignItems: 'center', gap: '4px',
                          padding: '6px 14px', borderRadius: '9999px',
                          border: '1px solid rgba(122, 84, 95, 0.2)',
                          background: 'rgba(255, 255, 255, 0.7)',
                          color: '#1d1b19', fontSize: '0.85rem', fontWeight: 600,
                          cursor: 'pointer', transition: 'all 0.2s'
                        }}>
                        {emoji} {post.reactions[key] > 0 && post.reactions[key]}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default GhostWallPage;
