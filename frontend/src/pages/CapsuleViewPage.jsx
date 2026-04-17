import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format, formatDistanceToNow } from 'date-fns';
import api from '../utils/api';
import toast from 'react-hot-toast';
import Countdown from '../components/Countdown';

const CapsuleViewPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [capsule, setCapsule] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCapsule = async () => {
      try {
        const res = await api.get(`/capsules/${id}`);
        setCapsule(res.data.capsule);
      } catch (err) {
        const msg = err.response?.data?.message || 'Could not open capsule';
        const unlocksAt = err.response?.data?.unlocksAt;
        setError({ msg, unlocksAt });
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
        <div style={{ fontSize: '4rem', marginBottom: 'var(--space-4)' }}>🔒</div>
        <h2 style={{ marginBottom: 'var(--space-4)' }}>{error.msg}</h2>
        {error.unlocksAt && (
          <>
            <p className="text-muted" style={{ marginBottom: 'var(--space-6)' }}>
              This capsule unlocks {formatDistanceToNow(new Date(error.unlocksAt), { addSuffix: true })}
            </p>
            <Countdown targetDate={new Date(error.unlocksAt)} />
          </>
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
            <div style={{ fontSize: '3rem', marginBottom: 'var(--space-3)' }}>
              {contentType === 'text' ? '📝' : contentType === 'image' ? '🖼️' : contentType === 'voice' ? '🎙️' : '🎬'}
            </div>
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
                <img src={mediaUrl} alt={title}
                  style={{ width: '100%', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-md)' }} />
              )}

              {contentType === 'voice' && mediaUrl && (
                <div style={{ padding: 'var(--space-6)', background: 'rgba(138,164,184,0.1)', borderRadius: 'var(--radius-lg)', textAlign: 'center' }}>
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
            {recipient && <span className="capsule-status-badge badge-unlocked">💌 Sent to {recipient.displayName || recipient.username}</span>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CapsuleViewPage;
