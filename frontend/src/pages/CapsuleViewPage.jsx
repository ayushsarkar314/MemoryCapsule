import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format, formatDistanceToNow } from 'date-fns';
import api from '../utils/api';
import toast from 'react-hot-toast';
import confetti from 'canvas-confetti';
import Countdown from '../components/Countdown';

const CapsuleViewPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [capsule, setCapsule] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [destroyCountdown, setDestroyCountdown] = useState(null);
  const [isImageFull, setIsImageFull] = useState(false);

  useEffect(() => {
    const fetchCapsule = async () => {
      try {
        const res = await api.get(`/capsules/${id}`);
        const fetchedCapsule = res.data.capsule;
        setCapsule(fetchedCapsule);
        
        // Start countdown for destroy-after-view capsules
        if (fetchedCapsule.rules?.destroyAfterView && fetchedCapsule.destroyAt) {
          setDestroyCountdown(new Date(fetchedCapsule.destroyAt));
        }

        // Trigger confetti for celebratory keywords
        const keywords = ['birthday', 'anniversary', 'congratulations', 'happy'];
        const celebrCheck = (fetchedCapsule.title || '') + ' ' + (fetchedCapsule.textContent || '');
        if (keywords.some(k => celebrCheck.toLowerCase().includes(k))) {
          // Fire a burst
          confetti({
            particleCount: 150,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#D4845A', '#C97878', '#F2DDD8', '#8FA88A']
          });
        }
      } catch (err) {
        const msg = err.response?.data?.message || 'Could not open capsule';
        const unlocksAt = err.response?.data?.unlocksAt;
        const isDestroyed = msg.toLowerCase().includes('destroyed');
        setError({ msg, unlocksAt, isDestroyed });
      } finally {
        setLoading(false);
      }
    };
    fetchCapsule();
  }, [id]);

  if (loading) return (
    <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="spinner spinner-amber" style={{ width: 40, height: 40 }} />
    </div>
  );

  if (error) return (
    <div className="container page-content">
      <div style={{ maxWidth: 480, margin: '0 auto', textAlign: 'center', paddingTop: 'var(--space-12)' }}>
        <div style={{ fontSize: '4rem', marginBottom: 'var(--space-4)' }}>
          {error.isDestroyed ? '💨' : '🔒'}
        </div>
        <h2 style={{ marginBottom: 'var(--space-4)' }}>{error.msg}</h2>
        {error.unlocksAt && (
          <>
            <p className="text-muted" style={{ marginBottom: 'var(--space-6)' }}>
              This capsule unlocks {formatDistanceToNow(new Date(error.unlocksAt), { addSuffix: true })}
            </p>
            <Countdown targetDate={new Date(error.unlocksAt)} />
          </>
        )}
        {error.isDestroyed && (
          <p className="text-muted" style={{ marginBottom: 'var(--space-6)' }}>
            This capsule was destroyed after being viewed and cannot be accessed again.
          </p>
        )}
        <button className="btn btn-secondary" style={{ marginTop: 'var(--space-8)' }} onClick={() => navigate(-1)}>
          ← Go Back
        </button>
      </div>
    </div>
  );

  if (!capsule) return null;

  const { title, contentType, textContent, mediaUrl, status, rules, creator, recipient, createdAt } = capsule;

  return (
    <div className="container page-content">
      <div style={{ maxWidth: 680, margin: '0 auto' }}>
        <button className="btn btn-ghost btn-sm" onClick={() => navigate(-1)} style={{ marginBottom: 'var(--space-6)' }}>
          ← Back
        </button>

        <div className="card-glass" style={{ padding: 'var(--space-10)' }}>
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: 'var(--space-8)' }}>
            <h2 className="font-serif" style={{ marginBottom: 'var(--space-2)' }}>{title}</h2>
            <p className="text-xs text-muted">
              Created {format(new Date(createdAt), 'MMMM d, yyyy')}
              {creator && ` · by ${creator.displayName || creator.username}`}
            </p>

            {status === 'DESTROYED' && (
              <div style={{ marginTop: 'var(--space-5)', padding: 'var(--space-4)', background: 'var(--color-blush)', borderRadius: 'var(--radius-md)' }}>
                <p style={{ color: 'var(--color-rose)', fontWeight: 600 }}>💨 This capsule has been destroyed after being viewed.</p>
              </div>
            )}

            {destroyCountdown && status !== 'DESTROYED' && (
              <div style={{ marginTop: 'var(--space-5)', padding: 'var(--space-4)', background: 'rgba(255, 193, 7, 0.1)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(255, 193, 7, 0.3)' }}>
                <p style={{ color: '#856404', fontWeight: 600, textAlign: 'center' }}>
                  ⏰ This capsule will be destroyed in:
                </p>
                <div style={{ textAlign: 'center', marginTop: 'var(--space-2)' }}>
                  <Countdown targetDate={destroyCountdown} onComplete={() => {
                    toast.error('This capsule has been destroyed!');
                    setCapsule(prev => prev ? { ...prev, status: 'DESTROYED' } : null);
                  }} />
                </div>
              </div>
            )}
          </div>

          {/* Content */}
          {status !== 'DESTROYED' && (
            <div style={{ marginBottom: 'var(--space-8)' }}>
              {contentType === 'text' && (
                <div style={{
                  background: 'var(--gradient-capsule)',
                  borderRadius: 'var(--radius-lg)',
                  padding: 'var(--space-8)',
                  fontFamily: 'var(--font-serif)',
                  fontSize: '1.1rem',
                  lineHeight: 1.85,
                  color: 'var(--color-text-primary)',
                  border: 'var(--border-light)',
                  whiteSpace: 'pre-wrap',
                }}>
                  {textContent}
                </div>
              )}

              {contentType === 'image' && mediaUrl && (
                <div 
                  onClick={() => setIsImageFull(true)} 
                  style={{ cursor: 'zoom-in' }}
                  className="image-content-wrapper clickable-image"
                >
                  <img src={mediaUrl} alt={title}
                    style={{ width: '100%', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-md)' }} />
                </div>
              )}

              {contentType === 'voice' && mediaUrl && (
                <div style={{ padding: 'var(--space-6)', background: 'rgba(223, 160, 160, 0.15)', borderRadius: 'var(--radius-lg)', textAlign: 'center', border: '1px solid rgba(223, 160, 160, 0.2)' }}>
                  <p style={{ fontSize: '2rem', marginBottom: 'var(--space-4)' }}>🎙️</p>
                  <audio controls src={mediaUrl} style={{ width: '100%' }} />
                </div>
              )}

              {contentType === 'video' && mediaUrl && (
                <video controls src={mediaUrl} style={{ width: '100%', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-md)' }} />
              )}
            </div>
          )}

          {/* Metadata */}
          <div style={{ paddingTop: 'var(--space-6)', borderTop: 'var(--border-light)', display: 'flex', flexWrap: 'wrap', gap: 'var(--space-4)' }}>
            {rules?.destroyAfterView && <span className="capsule-status-badge badge-destroyed">💣 Destroyed after view</span>}
            {rules?.unlockAt && <span className="capsule-status-badge badge-locked">⏰ Unlocked {formatDistanceToNow(new Date(rules.unlockAt), { addSuffix: true })}</span>}
            {rules?.expireAt && <span className="capsule-status-badge badge-expired">⌛ Expired {formatDistanceToNow(new Date(rules.expireAt), { addSuffix: true })}</span>}
          </div>
        </div>
      </div>

      {/* Fullscreen Lightbox Overlay */}
      {isImageFull && (
        <div 
          onClick={() => setIsImageFull(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.92)',
            zIndex: 10001,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'zoom-out',
            animation: 'fadeIn 0.3s ease'
          }}
        >
          <img 
            src={mediaUrl} 
            alt={title} 
            style={{ 
              maxWidth: '95vw', 
              maxHeight: '95vh', 
              objectFit: 'contain',
              borderRadius: 'var(--radius-sm)',
              boxShadow: '0 20px 50px rgba(0,0,0,0.5)'
            }} 
          />
          <button 
            style={{ 
              position: 'absolute', 
              top: '20px', 
              right: '20px', 
              background: 'none', 
              border: 'none', 
              color: 'white', 
              fontSize: '2rem', 
              cursor: 'pointer' 
            }}
          >✕</button>
        </div>
      )}
    </div>
  );
};

export default CapsuleViewPage;
