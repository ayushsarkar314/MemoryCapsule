import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format, formatDistanceToNow } from 'date-fns';
import api from '../utils/api';
import toast from 'react-hot-toast';
import confetti from 'canvas-confetti';
import Countdown from '../components/Countdown';
import ShaderBackground from '../components/ShaderBackground';
import './LandingPage.css';

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
            colors: ['#7a545f', '#603d48', '#f2ddd8', '#8fa88a']
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
    <div className="lp-root" style={{ minHeight: '100vh', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="lp-bg">
        <ShaderBackground />
        <div className="lp-bg-overlay" />
      </div>
      <div className="ai-loading-orb" style={{ zIndex: 2 }} />
    </div>
  );

  if (error) return (
    <div className="lp-root" style={{ minHeight: '100vh', position: 'relative' }}>
      <div className="lp-bg">
        <ShaderBackground />
        <div className="lp-bg-overlay" />
      </div>
      <div className="container page-content" style={{ position: 'relative', zIndex: 2, paddingTop: '120px', paddingBottom: '64px', maxWidth: '520px', margin: '0 auto', textAlign: 'center' }}>
        <div className="lp-glass-card" style={{ padding: '40px', borderRadius: '32px' }}>
          <div style={{ fontSize: '4rem', marginBottom: '16px' }}>
            {error.isDestroyed ? '💨' : '🔒'}
          </div>
          <h2 style={{ fontFamily: 'Playfair Display, serif', color: '#1d1b19', marginBottom: '16px', fontSize: '24px' }}>{error.msg}</h2>
          {error.unlocksAt && (
            <>
              <p style={{ fontFamily: 'Manrope, sans-serif', color: '#4f4447', fontSize: '15px', marginBottom: '24px' }}>
                This capsule unlocks {formatDistanceToNow(new Date(error.unlocksAt), { addSuffix: true })}
              </p>
              <Countdown targetDate={new Date(error.unlocksAt)} />
            </>
          )}
          {error.isDestroyed && (
            <p style={{ fontFamily: 'Manrope, sans-serif', color: '#4f4447', fontSize: '15px', marginBottom: '24px' }}>
              This capsule was destroyed after being viewed and cannot be accessed again.
            </p>
          )}
          <button className="lp-btn-outline" style={{ marginTop: '24px', cursor: 'pointer' }} onClick={() => navigate(-1)}>
            ← Go Back
          </button>
        </div>
      </div>
    </div>
  );

  if (!capsule) return null;

  const { title, contentType, textContent, mediaUrl, status, rules, creator, recipient, createdAt } = capsule;

  return (
    <div className="lp-root" style={{ minHeight: '100vh', position: 'relative' }}>
      {/* ── Live Shader Background + Readability Overlay ── */}
      <div className="lp-bg">
        <ShaderBackground />
        <div className="lp-bg-overlay" />
      </div>

      <div className="container page-content" style={{ position: 'relative', zIndex: 2, paddingTop: '100px', paddingBottom: '64px', maxWidth: '720px', margin: '0 auto' }}>
        <button className="lp-btn-outline" onClick={() => navigate(-1)} style={{ marginBottom: '24px', padding: '8px 20px', fontSize: '13px' }}>
          ← Back
        </button>

        <div className="lp-glass-card" style={{ padding: '40px', borderRadius: '32px' }}>
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <span className="lp-eyebrow" style={{ marginBottom: '12px' }}>Unsealed Memory</span>
            <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: 'clamp(28px, 4vw, 36px)', fontWeight: 700, color: '#1d1b19', marginBottom: '8px' }}>{title}</h2>
            <p style={{ fontFamily: 'Manrope, sans-serif', color: '#4f4447', fontSize: '14px' }}>
              Created {format(new Date(createdAt), 'MMMM d, yyyy')}
              {creator && ` · by ${creator.displayName || creator.username}`}
            </p>

            {status === 'DESTROYED' && (
              <div style={{ marginTop: '20px', padding: '16px', background: 'rgba(201, 120, 120, 0.15)', borderRadius: '16px', border: '1px solid rgba(201, 120, 120, 0.3)' }}>
                <p style={{ color: '#c97878', fontWeight: 600, fontFamily: 'Manrope, sans-serif' }}>💨 This capsule has been destroyed after being viewed.</p>
              </div>
            )}

            {destroyCountdown && status !== 'DESTROYED' && (
              <div style={{ marginTop: '20px', padding: '16px', background: 'rgba(212, 132, 90, 0.12)', borderRadius: '16px', border: '1px solid rgba(212, 132, 90, 0.3)' }}>
                <p style={{ color: '#b8643a', fontWeight: 600, textAlign: 'center', fontFamily: 'Manrope, sans-serif' }}>
                  ⏰ This capsule will be destroyed in:
                </p>
                <div style={{ textAlign: 'center', marginTop: '8px' }}>
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
            <div style={{ marginBottom: '32px' }}>
              {contentType === 'text' && (
                <div style={{
                  background: 'rgba(255, 255, 255, 0.85)',
                  borderRadius: '24px',
                  padding: '32px',
                  fontFamily: 'Playfair Display, serif',
                  fontSize: '1.15rem',
                  lineHeight: 1.85,
                  color: '#1d1b19',
                  border: '1px solid rgba(122, 84, 95, 0.15)',
                  whiteSpace: 'pre-wrap',
                  boxShadow: '0 4px 20px rgba(74, 43, 77, 0.05)',
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
                    style={{ width: '100%', borderRadius: '24px', boxShadow: '0 8px 32px rgba(74, 43, 77, 0.12)' }} />
                </div>
              )}

              {contentType === 'voice' && mediaUrl && (
                <div style={{ padding: '28px', background: 'rgba(122, 84, 95, 0.1)', borderRadius: '24px', textAlign: 'center', border: '1px solid rgba(122, 84, 95, 0.2)' }}>
                  <p style={{ fontSize: '2rem', marginBottom: '16px' }}>🎙️</p>
                  <audio controls src={mediaUrl} style={{ width: '100%' }} />
                </div>
              )}

              {contentType === 'video' && mediaUrl && (
                <video controls src={mediaUrl} style={{ width: '100%', borderRadius: '24px', boxShadow: '0 8px 32px rgba(74, 43, 77, 0.12)' }} />
              )}
            </div>
          )}

          {/* Metadata */}
          <div style={{ paddingTop: '20px', borderTop: '1px solid rgba(122, 84, 95, 0.15)', display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
            {rules?.destroyAfterView && (
              <span style={{ background: 'rgba(201, 120, 120, 0.15)', color: '#c97878', padding: '6px 14px', borderRadius: '9999px', fontSize: '0.8rem', fontWeight: 600, fontFamily: 'Manrope, sans-serif' }}>
                💣 Destroyed after view
              </span>
            )}
            {rules?.unlockAt && (
              <span style={{ background: 'rgba(122, 84, 95, 0.12)', color: '#7a545f', padding: '6px 14px', borderRadius: '9999px', fontSize: '0.8rem', fontWeight: 600, fontFamily: 'Manrope, sans-serif' }}>
                ⏰ Unlocked {formatDistanceToNow(new Date(rules.unlockAt), { addSuffix: true })}
              </span>
            )}
            {rules?.expireAt && (
              <span style={{ background: 'rgba(184, 100, 58, 0.12)', color: '#b8643a', padding: '6px 14px', borderRadius: '9999px', fontSize: '0.8rem', fontWeight: 600, fontFamily: 'Manrope, sans-serif' }}>
                ⌛ Expired {formatDistanceToNow(new Date(rules.expireAt), { addSuffix: true })}
              </span>
            )}
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
              borderRadius: '16px',
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
