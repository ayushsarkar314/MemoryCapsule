import { useState } from 'react';
import api from '../utils/api';

const FriendPickerModal = ({ onSelect, onClose }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);

  const handleSearch = async (e) => {
    const q = e.target.value;
    setQuery(q);
    if (q.length < 2) { setResults([]); return; }
    setSearching(true);
    try {
      const res = await api.get(`/friends/search?q=${encodeURIComponent(q)}`);
      setResults(res.data.users);
    } catch {
      setResults([]);
    } finally {
      setSearching(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between" style={{ marginBottom: 'var(--space-6)' }}>
          <h4>Send to a Friend</h4>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>✕</button>
        </div>

        <input
          className="form-input"
          placeholder="Search by username…"
          value={query}
          onChange={handleSearch}
          autoFocus
        />

        <div style={{ marginTop: 'var(--space-4)', maxHeight: 280, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          {searching && (
            <div style={{ textAlign: 'center', padding: 'var(--space-4)' }}>
              <div className="spinner spinner-amber" style={{ margin: '0 auto' }} />
            </div>
          )}
          {!searching && results.length === 0 && query.length >= 2 && (
            <p className="text-muted text-sm text-center" style={{ padding: 'var(--space-4)' }}>No friends found for "{query}"</p>
          )}
          {!searching && query.length < 2 && (
            <p className="text-muted text-sm text-center" style={{ padding: 'var(--space-4)' }}>Type at least 2 characters to search</p>
          )}
          {results.map(user => {
            const initials = (user.displayName || user.username).slice(0, 2).toUpperCase();
            return (
              <div
                key={user._id}
                className="flex items-center gap-3"
                style={{ padding: 'var(--space-3)', borderRadius: 'var(--radius-md)', cursor: 'pointer', background: 'var(--color-parchment)', transition: 'background var(--transition-fast)' }}
                onClick={() => onSelect(user)}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--color-blush)'}
                onMouseLeave={e => e.currentTarget.style.background = 'var(--color-parchment)'}
              >
                {user.avatar ? (
                  <img src={user.avatar} alt="" className="avatar avatar-sm" />
                ) : (
                  <div className="avatar avatar-sm avatar-placeholder" style={{ background: 'var(--gradient-amber)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 700, borderRadius: '50%', flexShrink: 0 }}>
                    {initials}
                  </div>
                )}
                <div>
                  <p style={{ fontWeight: 600, fontSize: '0.9rem' }}>{user.displayName || user.username}</p>
                  <p className="text-xs text-muted">@{user.username}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default FriendPickerModal;
