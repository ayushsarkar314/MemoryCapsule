import { formatDistanceToNow, format, isPast } from 'date-fns';
import api from '../utils/api';
import toast from 'react-hot-toast';

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

  const handleTrigger = async (e) => {
    e.stopPropagation();
    if (!window.confirm(`Trigger event '${rules.eventName}' and unlock this capsule now?`)) return;
    try {
      await api.post(`/capsules/${_id}/trigger`);
      toast.success(`🏁 Event '${rules.eventName}' triggered! Capsule unlocked.`);
      onRefresh && onRefresh();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not trigger event');
    }
  };

  const getStatusBadge = () => {
    switch (status) {
      case 'LOCKED':
        return { label: 'SEALED', bg: 'rgba(122, 84, 95, 0.15)', color: '#7a545f', icon: 'lock' };
      case 'UNLOCKED':
        return { label: 'UNLOCKED', bg: 'rgba(117, 83, 119, 0.15)', color: '#755377', icon: 'lock_open' };
      case 'EXPIRED':
        return { label: 'EXPIRED', bg: 'rgba(79, 68, 71, 0.12)', color: '#4f4447', icon: 'history' };
      case 'DESTROYED':
        return { label: 'DESTROYED', bg: 'rgba(186, 26, 26, 0.15)', color: '#ba1a1a', icon: 'auto_delete' };
      default:
        return { label: status, bg: 'rgba(122, 84, 95, 0.15)', color: '#7a545f', icon: 'lock' };
    }
  };

  const badge = getStatusBadge();

  return (
    <div 
      className="lp-glass-card"
      onClick={status === 'DESTROYED' ? undefined : onClick} 
      role={status === 'DESTROYED' ? undefined : "button"} 
      tabIndex={status === 'DESTROYED' ? undefined : 0}
      style={{
        padding: '24px',
        borderRadius: '24px',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        transition: 'transform 0.3s ease, box-shadow 0.3s ease',
        cursor: status === 'DESTROYED' ? 'default' : 'pointer',
        opacity: status === 'DESTROYED' ? 0.7 : 1,
      }}
      onMouseEnter={(e) => {
        if (status !== 'DESTROYED') {
          e.currentTarget.style.transform = 'translateY(-2px)';
        }
      }}
      onMouseLeave={(e) => {
        if (status !== 'DESTROYED') {
          e.currentTarget.style.transform = 'translateY(0)';
        }
      }}
    >
      {/* Title + Status Badge */}
      <div className="flex items-center justify-between" style={{ marginBottom: '14px', gap: '12px', flexWrap: 'wrap' }}>
        <h3 style={{ fontSize: '18px', fontFamily: 'Playfair Display, serif', fontWeight: 600, color: '#1d1b19', lineHeight: 1.3, flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', margin: 0 }}>
          {title}
        </h3>
        <span style={{
          background: badge.bg,
          color: badge.color,
          padding: '4px 12px',
          borderRadius: '9999px',
          fontSize: '12px',
          fontWeight: 700,
          letterSpacing: '0.04em',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          flexShrink: 0,
        }}>
          <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>{badge.icon}</span>
          {badge.label}
        </span>
      </div>

      {/* Rule details */}
      <div style={{ marginBottom: '16px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {rules?.destroyAfterView && (
          <p style={{ fontSize: '13px', color: '#ba1a1a', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>visibility_off</span> Destroys after one view
          </p>
        )}
        {unlockDate && (
          <p style={{ fontSize: '13px', color: '#4f4447', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
              {isLocked && !isPast(unlockDate) ? 'schedule' : 'lock_open'}
            </span>
            {isLocked && !isPast(unlockDate)
              ? `Unlocks ${formatDistanceToNow(unlockDate, { addSuffix: true })}`
              : `Unlocked ${formatDistanceToNow(unlockDate, { addSuffix: true })}`}
          </p>
        )}
        {expireDate && (
          <p style={{ fontSize: '13px', color: '#4f4447', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>hourglass_bottom</span>
            {isPast(expireDate) ? 'Expired' : `Expires`} {formatDistanceToNow(expireDate, { addSuffix: true })}
          </p>
        )}
        {rules?.eventName && (
          <p style={{ fontSize: '13px', color: '#755377', fontWeight: 600, margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>flag</span>
            Event: {rules.eventName}
            {rules.eventTriggerDate && (
              <span style={{ fontWeight: 400, opacity: 0.8, marginLeft: 4 }}>
                · auto {formatDistanceToNow(new Date(rules.eventTriggerDate), { addSuffix: true })}
              </span>
            )}
          </p>
        )}
      </div>

      {/* Recipient / Creator info */}
      {capsuleType === 'shared' && creator && (
        <p style={{ fontSize: '13px', color: '#4f4447', marginBottom: '14px', margin: 0 }}>
          From: <strong style={{ color: '#7a545f' }}>{creator.displayName || creator.username}</strong>
        </p>
      )}

      {/* Footer: Date + Actions */}
      <div className="flex items-center justify-between" style={{ marginTop: 'auto', paddingTop: '14px', borderTop: '1px solid rgba(122, 84, 95, 0.15)', flexWrap: 'wrap', gap: '12px' }}>
        <span style={{ fontSize: '12px', color: 'rgba(79, 68, 71, 0.7)' }}>
          {format(new Date(createdAt), 'MMM d, yyyy')}
        </span>
        <div className="flex gap-2" style={{ alignItems: 'center' }}>
          {/* Trigger button: only for LOCKED event-based capsules */}
          {status === 'LOCKED' && rules?.eventName && onRefresh && (
            <button
              className="lp-btn-primary"
              style={{ fontSize: '12px', padding: '6px 14px', borderRadius: '9999px' }}
              onClick={handleTrigger}
              id={`trigger-event-${_id}`}
            >
              🏁 Trigger
            </button>
          )}
          {['LOCKED', 'UNLOCKED'].includes(status) && onRefresh && (
            <button
              className="lp-btn-outline"
              style={{ fontSize: '12px', padding: '6px 14px', marginTop: 0, color: '#ba1a1a', borderColor: 'rgba(186, 26, 26, 0.3)' }}
              onClick={handleDelete}
            >
              Delete
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default CapsuleCard;
