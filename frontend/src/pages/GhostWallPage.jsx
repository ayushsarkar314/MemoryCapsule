import { useState, useEffect } from 'react';
import { formatDistanceToNow, differenceInSeconds } from 'date-fns';
import { useDropzone } from 'react-dropzone';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { useCallback } from 'react';

const EXPIRY_OPTIONS = [
  { label: '1 hour',  value: 1 },
  { label: '6 hours', value: 6 },
  { label: '12 hours', value: 12 },
  { label: '24 hours', value: 24 },
  { label: '3 days',  value: 72 },
  { label: '7 days',  value: 168 },
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
    <span className="ghost-timer">
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
    <div className="ghost-wall page" style={{ paddingTop: 80 }}>
      <div className="container" style={{ paddingTop: 'var(--space-8)', paddingBottom: 'var(--space-16)' }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 'var(--space-10)' }}>
          <p style={{ fontSize: '3rem', marginBottom: 'var(--space-4)', animation: 'float 3s ease-in-out infinite' }}>👻</p>
          <h2 style={{ color: '#E8D5F0', fontFamily: 'var(--font-serif)', marginBottom: 'var(--space-2)' }}>
            Ghost Wall
          </h2>
          <p style={{ color: 'rgba(232,213,240,0.6)', fontSize: '0.9rem', marginBottom: 'var(--space-6)' }}>
            Anonymous. Temporary. Honest.
          </p>
          <button
            className="btn"
            style={{ background: 'rgba(255,255,255,0.12)', color: '#E8D5F0', border: '1px solid rgba(255,255,255,0.2)', backdropFilter: 'blur(10px)' }}
            onClick={() => setShowCompose(!showCompose)}
          >
            {showCompose ? '✕ Cancel' : '+ Post a Ghost Message'}
          </button>
        </div>

        {/* Compose Panel */}
        {showCompose && (
          <div style={{
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: 'var(--radius-xl)',
            padding: 'var(--space-8)',
            marginBottom: 'var(--space-8)',
            backdropFilter: 'blur(20px)',
            animation: 'slideDown 250ms ease',
          }}>
            <h4 style={{ color: '#E8D5F0', marginBottom: 'var(--space-5)' }}>Release your ghost</h4>

            {/* Type select */}
            <div className="flex gap-3" style={{ marginBottom: 'var(--space-5)' }}>
              {['text', 'image'].map(t => (
                <button key={t} onClick={() => setContentType(t)}
                  style={{
                    padding: 'var(--space-2) var(--space-4)',
                    borderRadius: 'var(--radius-full)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    background: contentType === t ? 'rgba(255,255,255,0.15)' : 'transparent',
                    color: '#E8D5F0', fontSize: '0.875rem', cursor: 'pointer',
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
                  width: '100%', background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  borderRadius: 'var(--radius-md)', padding: 'var(--space-4)',
                  color: '#E8D5F0', fontFamily: 'var(--font-sans)', fontSize: '0.95rem',
                  resize: 'vertical', outline: 'none',
                }}
              />
            ) : (
              <div {...getRootProps()} style={{
                border: '2px dashed rgba(255,255,255,0.2)',
                borderRadius: 'var(--radius-md)',
                padding: 'var(--space-8)',
                textAlign: 'center', cursor: 'pointer',
                background: isDragActive ? 'rgba(255,255,255,0.08)' : 'transparent',
                color: 'rgba(232,213,240,0.7)',
              }}>
                <input {...getInputProps()} />
                {mediaFile ? <p>✅ {mediaFile.name}</p> : <p>Drop an image here</p>}
              </div>
            )}

            {/* Expiry */}
            <div style={{ marginTop: 'var(--space-5)' }}>
              <p style={{ color: 'rgba(232,213,240,0.7)', fontSize: '0.875rem', marginBottom: 'var(--space-3)' }}>
                Disappears after:
              </p>
              <div className="flex gap-2" style={{ flexWrap: 'wrap' }}>
                {EXPIRY_OPTIONS.map(({ label, value }) => (
                  <button key={value} onClick={() => setExpiryHours(value)}
                    style={{
                      padding: 'var(--space-1) var(--space-3)',
                      borderRadius: 'var(--radius-full)',
                      border: '1px solid rgba(255,255,255,0.2)',
                      background: expiryHours === value ? 'rgba(255,255,255,0.18)' : 'transparent',
                      color: '#E8D5F0', fontSize: '0.8rem', cursor: 'pointer',
                    }}>
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <button
              className="btn"
              style={{ marginTop: 'var(--space-6)', background: 'rgba(255,255,255,0.12)', color: '#E8D5F0', border: '1px solid rgba(255,255,255,0.2)', width: '100%' }}
              onClick={handleSubmit}
              disabled={submitting}
            >
              {submitting ? '👻 Releasing…' : '👻 Release into the Wall'}
            </button>
          </div>
        )}

        {/* Posts */}
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            {[...Array(3)].map((_, i) => (
              <div key={i} className="skeleton" style={{ height: 100, borderRadius: 'var(--radius-xl)', background: 'rgba(255,255,255,0.06)' }} />
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 'var(--space-16) 0', color: 'rgba(232,213,240,0.4)' }}>
            <p style={{ fontSize: '3rem', marginBottom: 'var(--space-4)' }}>🌫️</p>
            <p>The wall is empty. Be the first to haunt it.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            {posts.map(post => (
              <div key={post._id} className="ghost-post-card">
                {post.contentType === 'text' ? (
                  <p style={{ color: '#E8D5F0', lineHeight: 1.75, marginBottom: 'var(--space-4)', fontFamily: 'var(--font-serif)', fontSize: '1rem' }}>
                    {post.textContent}
                  </p>
                ) : post.mediaUrl ? (
                  <img src={post.mediaUrl} alt="ghost post" style={{ width: '100%', maxHeight: 320, objectFit: 'cover', borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-4)' }} />
                ) : null}

                <div className="flex items-center justify-between" style={{ flexWrap: 'wrap', gap: 'var(--space-2)' }}>
                  <GhostTimer expiresAt={post.expiresAt} />
                  <div className="flex gap-2" style={{ flexWrap: 'wrap' }}>
                    {[['heart', '❤️'], ['ghost', '👻'], ['fire', '🔥']].map(([key, emoji]) => (
                      <button key={key} className="ghost-reaction-btn" onClick={() => handleReact(post._id, key)}>
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
