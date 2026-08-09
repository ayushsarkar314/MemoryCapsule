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
    <div className="modal-overlay" onClick={onClose} style={{ backdropFilter: 'blur(16px)', background: 'rgba(29, 27, 25, 0.4)' }}>
      <div className="modal lp-glass-card" onClick={e => e.stopPropagation()} style={{ borderRadius: '28px', padding: '32px', maxWidth: '440px', width: '90%' }}>
        <div className="flex items-center justify-between" style={{ marginBottom: '20px' }}>
          <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: '20px', fontWeight: 700, color: '#1d1b19', margin: 0 }}>Send to a Friend</h3>
          <button className="lp-btn-outline" onClick={onClose} style={{ padding: '4px 12px', fontSize: '14px', margin: 0, cursor: 'pointer' }}>✕</button>
        </div>

        <input
          style={{
            width: '100%', padding: '14px 18px', borderRadius: '14px',
            border: '1px solid rgba(122, 84, 95, 0.22)', background: 'rgba(255, 255, 255, 0.85)',
            color: '#1d1b19', fontFamily: 'Manrope, sans-serif', fontSize: '15px', outline: 'none'
          }}
          placeholder="Search by username…"
          value={query}
          onChange={handleSearch}
          autoFocus
        />

        <div style={{ marginTop: '16px', maxHeight: 280, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {searching && (
            <div style={{ textAlign: 'center', padding: '16px' }}>
              <div className="ai-loading-orb" style={{ width: 28, height: 28 }} />
            </div>
          )}
          {!searching && results.length === 0 && query.length >= 2 && (
            <p style={{ color: '#4f4447', fontFamily: 'Manrope, sans-serif', fontSize: '14px', textAlign: 'center', padding: '16px' }}>No friends found for "{query}"</p>
          )}
          {!searching && query.length < 2 && (
            <p style={{ color: '#4f4447', fontFamily: 'Manrope, sans-serif', fontSize: '14px', textAlign: 'center', padding: '16px' }}>Type at least 2 characters to search</p>
          )}
          {results.map(user => {
            const initials = (user.displayName || user.username).slice(0, 2).toUpperCase();
            return (
              <div
                key={user._id}
                className="flex items-center gap-3"
                style={{
                  padding: '12px 16px', borderRadius: '16px', cursor: 'pointer',
                  background: 'rgba(255, 255, 255, 0.65)', border: '1px solid rgba(122, 84, 95, 0.12)',
                  transition: 'all 0.2s'
                }}
                onClick={() => onSelect(user)}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.95)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.65)'}
              >
                {user.avatar ? (
                  <img src={user.avatar} alt="" className="avatar avatar-sm" />
                ) : (
                  <div className="avatar avatar-sm avatar-placeholder" style={{ background: 'linear-gradient(135deg, #7a545f 0%, #603d48 100%)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700, borderRadius: '50%', flexShrink: 0, width: 32, height: 32 }}>
                    {initials}
                  </div>
                )}
                <div>
                  <p style={{ fontWeight: 600, fontSize: '0.9rem', color: '#1d1b19', fontFamily: 'Manrope, sans-serif' }}>{user.displayName || user.username}</p>
                  <p style={{ fontSize: '0.75rem', color: '#4f4447', fontFamily: 'Manrope, sans-serif' }}>@{user.username}</p>
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
