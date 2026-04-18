import { formatDistanceToNow, format, isPast } from 'date-fns';
import api from '../utils/api';
import toast from 'react-hot-toast';

const CONTENT_ICONS = { text: '📝', image: '🖼️', voice: '🎙️', video: '🎬' };
const CONTENT_CLASSES = { text: 'type-text', image: 'type-image', voice: 'type-voice', video: 'type-video' };

const CapsuleCard = ({ capsule, onClick, onRefresh }) => {
  const {
    _id, title, contentType, status, rules,
    createdAt, recipient, creator, seenByRecipient, capsuleType,
  } = capsule;

  const statusLower = status.toLowerCase();
  const isLocked = status === 'LOCKED';
  const unlockDate = rules?.unlockAt ? new Date(rules.unlockAt) : null;
  const expireDate = rules?.expireAt ? new Date(rules.expireAt) : null;

  const handleDelete = async (e) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this capsule?')) return;
    try {
      await api.delete(`/capsules/${_id}`);
      toast.success('Capsule deleted');
      onRefresh && onRefresh();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error deleting');
    }
  };

  return (
    <div 
      className={`capsule-card ${statusLower}`} 
      onClick={status === 'DESTROYED' ? undefined : onClick} 
      role={status === 'DESTROYED' ? undefined : "button"} 
      tabIndex={status === 'DESTROYED' ? undefined : 0}
      style={status === 'DESTROYED' ? { cursor: 'default', opacity: 0.7 } : undefined}
    >

      {/* Title + badge */}
      <div className="flex items-center justify-between" style={{ marginBottom: 'var(--space-3)', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
        <h4 style={{ fontSize: '1rem', fontFamily: 'var(--font-serif)', fontWeight: 600, lineHeight: 1.3, flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {title}
        </h4>
        <span className={`capsule-status-badge badge-${statusLower}`} style={{ flexShrink: 0 }}>
          {isLocked ? '🔒' : status === 'UNLOCKED' ? '🔓' : status === 'EXPIRED' ? '⏳' : '💨'}
          {' '}{status}
        </span>
      </div>

      {/* Rule info */}
      <div style={{ marginBottom: 'var(--space-4)' }}>
        {rules?.destroyAfterView && (
          <p className="text-xs text-muted">💣 Destroys after one view</p>
        )}
        {unlockDate && (
          <p className="text-xs text-muted">
            {isLocked && !isPast(unlockDate)
              ? `🔒 Unlocks ${formatDistanceToNow(unlockDate, { addSuffix: true })}`
              : `🔓 Unlocked ${formatDistanceToNow(unlockDate, { addSuffix: true })}`}
          </p>
        )}
        {expireDate && (
          <p className="text-xs text-muted">
            ⏳ {isPast(expireDate) ? 'Expired' : `Expires`} {formatDistanceToNow(expireDate, { addSuffix: true })}
          </p>
        )}
      </div>

      {/* Recipient/sender */}
      {capsuleType === 'shared' && creator && (
        <p className="text-xs text-muted" style={{ marginBottom: 'var(--space-3)' }}>
          From: <strong>{creator.displayName || creator.username}</strong>
        </p>
      )}

      {/* Footer: date + delete */}
      <div className="flex items-center justify-between" style={{ marginTop: 'auto', paddingTop: 'var(--space-3)', borderTop: '1px solid rgba(212,196,176,0.3)' }}>
        <span className="text-xs text-muted">
          {format(new Date(createdAt), 'MMM d, yyyy')}
        </span>
        {['LOCKED', 'UNLOCKED'].includes(status) && onRefresh && (
          <button className="btn btn-ghost btn-sm"
            style={{ fontSize: '0.75rem', padding: '4px 10px', color: 'var(--color-rose)' }}
            onClick={handleDelete}>
            Delete
          </button>
        )}
      </div>
    </div>
  );
};

export default CapsuleCard;
