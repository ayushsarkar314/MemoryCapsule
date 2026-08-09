import { useState, useEffect } from 'react';
import api from '../utils/api';
import toast from 'react-hot-toast';
import ShaderBackground from '../components/ShaderBackground';
import './LandingPage.css';

const FriendsPage = () => {
  const [friends, setFriends] = useState([]);
  const [requests, setRequests] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [activeTab, setActiveTab] = useState('friends');
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const [friendsRes, requestsRes] = await Promise.all([
        api.get('/friends'),
        api.get('/friends/requests'),
      ]);
      setFriends(friendsRes.data.friends);
      setRequests(requestsRes.data.requests);
    } catch {
      toast.error('Could not load friends');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleSearch = async (e) => {
    const q = e.target.value;
    setSearchQuery(q);
    if (q.length < 2) { setSearchResults([]); return; }
    setSearching(true);
    try {
      const res = await api.get(`/friends/search?q=${encodeURIComponent(q)}`);
      setSearchResults(res.data.users);
    } catch {
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  const sendRequest = async (userId, username) => {
    try {
      await api.post(`/friends/request/${userId}`);
      toast.success(`Friend request sent to ${username}! 🤝`);
      setSearchResults(prev => prev.filter(u => u._id !== userId));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not send request');
    }
  };

  const respondRequest = async (requesterId, action) => {
    try {
      await api.put(`/friends/request/${requesterId}/respond`, { action });
      toast.success(action === 'accept' ? '🎉 Friend added!' : 'Request rejected');
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error');
    }
  };

  const removeFriend = async (friendId, name) => {
    if (!window.confirm(`Remove ${name} from your friends?`)) return;
    try {
      await api.delete(`/friends/${friendId}`);
      toast.success('Friend removed');
      fetchData();
    } catch {
      toast.error('Could not remove friend');
    }
  };

  const UserAvatar = ({ user }) => {
    const initials = (user.displayName || user.username).slice(0, 2).toUpperCase();
    return user.avatar ? (
      <img src={user.avatar} alt={user.username} className="avatar avatar-md" />
    ) : (
      <div className="avatar avatar-md avatar-placeholder" style={{ background: 'linear-gradient(135deg, #7a545f 0%, #603d48 100%)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem', fontWeight: 700, borderRadius: '50%', flexShrink: 0 }}>
        {initials}
      </div>
    );
  };

  return (
    <div className="lp-root" style={{ minHeight: '100vh', position: 'relative' }}>
      {/* ── Live Shader Background + Readability Overlay ── */}
      <div className="lp-bg">
        <ShaderBackground />
        <div className="lp-bg-overlay" />
      </div>

      <div className="container page-content" style={{ position: 'relative', zIndex: 2, paddingTop: '100px', paddingBottom: '64px', maxWidth: '960px', margin: '0 auto' }}>
        
        {/* Header */}
        <div style={{ marginBottom: '32px' }}>
          <span className="lp-eyebrow" style={{ marginBottom: '12px' }}>Connections</span>
          <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: 'clamp(28px, 4vw, 42px)', fontWeight: 700, color: '#1d1b19', marginBottom: '8px' }}>
            Friends & Vault Guardians
          </h1>
          <p style={{ fontFamily: 'Manrope, sans-serif', color: '#4f4447', fontSize: '16px' }}>
            Connect with friends to deliver sealed memories directly to their private vault.
          </p>
        </div>

        {/* Search Panel */}
        <div className="lp-glass-card" style={{ padding: '28px', borderRadius: '24px', marginBottom: '32px' }}>
          <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: '20px', fontWeight: 600, color: '#1d1b19', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="material-symbols-outlined" style={{ color: '#7a545f', fontSize: '22px' }}>person_search</span> Find Friends
          </h3>
          <div style={{ position: 'relative' }}>
            <input
              className="form-input"
              placeholder="Search by username or name…"
              value={searchQuery}
              onChange={handleSearch}
              style={{
                width: '100%',
                padding: '14px 18px',
                borderRadius: '14px',
                border: '1px solid rgba(122, 84, 95, 0.22)',
                background: 'rgba(255, 255, 255, 0.85)',
                color: '#1d1b19',
                fontFamily: 'Manrope, sans-serif',
                fontSize: '15px',
                outline: 'none',
              }}
            />
            {searching && (
              <div className="spinner spinner-amber" style={{ position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)', width: 20, height: 20 }} />
            )}
          </div>

          {searchResults.length > 0 && (
            <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {searchResults.map(user => (
                <div key={user._id} className="flex items-center justify-between" style={{ padding: '14px 18px', background: 'rgba(255, 255, 255, 0.75)', border: '1px solid rgba(122, 84, 95, 0.12)', borderRadius: '16px', flexWrap: 'wrap', gap: '12px' }}>
                  <div className="flex items-center gap-3" style={{ minWidth: 0 }}>
                    <UserAvatar user={user} />
                    <div style={{ minWidth: 0 }}>
                      <p style={{ fontWeight: 600, fontSize: '0.95rem', color: '#1d1b19', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.displayName || user.username}</p>
                      <p className="text-xs text-muted" style={{ color: '#4f4447', opacity: 0.8 }}>@{user.username}</p>
                    </div>
                  </div>
                  <button className="lp-btn-primary" style={{ padding: '8px 18px', fontSize: '13px', flexShrink: 0 }} onClick={() => sendRequest(user._id, user.username)}>
                    <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>person_add</span> Add Friend
                  </button>
                </div>
              ))}
            </div>
          )}

          {searchQuery.length >= 2 && !searching && searchResults.length === 0 && (
            <p style={{ marginTop: '16px', color: '#4f4447', fontSize: '14px', fontStyle: 'italic' }}>
              No users found matching "{searchQuery}"
            </p>
          )}
        </div>

        {/* Status Tabs */}
        <div style={{ marginBottom: '24px', display: 'inline-flex', background: 'rgba(237, 231, 227, 0.7)', backdropFilter: 'blur(12px)', padding: '4px', borderRadius: '9999px', border: '1px solid rgba(255, 255, 255, 0.5)' }}>
          <button
            className={`status-tab ${activeTab === 'friends' ? 'active' : ''}`}
            onClick={() => setActiveTab('friends')}
            style={{
              padding: '10px 24px',
              borderRadius: '9999px',
              border: 'none',
              background: activeTab === 'friends' ? '#ffffff' : 'transparent',
              color: activeTab === 'friends' ? '#7a545f' : '#4f4447',
              fontFamily: 'Manrope, sans-serif',
              fontWeight: activeTab === 'friends' ? 700 : 600,
              fontSize: '14px',
              cursor: 'pointer',
              boxShadow: activeTab === 'friends' ? '0 2px 8px rgba(74, 43, 77, 0.12)' : 'none',
              transition: 'all 0.25s',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>group</span> Friends ({friends.length})
          </button>

          <button
            className={`status-tab ${activeTab === 'requests' ? 'active' : ''}`}
            onClick={() => setActiveTab('requests')}
            style={{
              padding: '10px 24px',
              borderRadius: '9999px',
              border: 'none',
              background: activeTab === 'requests' ? '#ffffff' : 'transparent',
              color: activeTab === 'requests' ? '#7a545f' : '#4f4447',
              fontFamily: 'Manrope, sans-serif',
              fontWeight: activeTab === 'requests' ? 700 : 600,
              fontSize: '14px',
              cursor: 'pointer',
              boxShadow: activeTab === 'requests' ? '0 2px 8px rgba(74, 43, 77, 0.12)' : 'none',
              transition: 'all 0.25s',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>mark_email_unread</span> Requests
            {requests.length > 0 && (
              <span style={{ background: '#7a545f', color: '#fff', borderRadius: '9999px', padding: '2px 8px', fontSize: '11px', fontWeight: 700, marginLeft: 4 }}>
                {requests.length}
              </span>
            )}
          </button>
        </div>

        {/* Content Lists */}
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {[...Array(3)].map((_, i) => (
              <div key={i} className="lp-glass-card" style={{ height: 72, borderRadius: '20px' }} />
            ))}
          </div>
        ) : activeTab === 'friends' ? (
          friends.length === 0 ? (
            <div className="lp-glass-card" style={{ borderRadius: '28px', padding: '56px 32px', textAlign: 'center' }}>
              <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(212, 165, 178, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', color: '#7a545f' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '32px' }}>group_off</span>
              </div>
              <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: '22px', fontWeight: 600, color: '#1d1b19', marginBottom: '8px' }}>No friends yet</h3>
              <p style={{ color: '#4f4447', fontSize: '15px', maxWidth: '400px', margin: '0 auto' }}>
                Search for friends using their username above to start sharing time-locked memories.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {friends.map(friend => (
                <div key={friend._id} className="lp-glass-card flex items-center justify-between" style={{ padding: '18px 24px', borderRadius: '20px', flexWrap: 'wrap', gap: '12px' }}>
                  <div className="flex items-center gap-3" style={{ minWidth: 0, flex: 1 }}>
                    <UserAvatar user={friend} />
                    <div style={{ minWidth: 0 }}>
                      <p style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 600, fontSize: '16px', color: '#1d1b19', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {friend.displayName || friend.username}
                      </p>
                      <p className="text-xs" style={{ color: '#4f4447', opacity: 0.75 }}>@{friend.username}</p>
                      {friend.bio && (
                        <p className="text-xs" style={{ color: '#4f4447', marginTop: 4, fontStyle: 'italic', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          "{friend.bio}"
                        </p>
                      )}
                    </div>
                  </div>
                  <button
                    className="lp-btn-outline"
                    style={{ padding: '8px 16px', fontSize: '13px', marginTop: 0, color: '#ba1a1a', borderColor: 'rgba(186, 26, 26, 0.4)', flexShrink: 0 }}
                    onClick={() => removeFriend(friend._id, friend.username)}
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )
        ) : (
          requests.length === 0 ? (
            <div className="lp-glass-card" style={{ borderRadius: '28px', padding: '56px 32px', textAlign: 'center' }}>
              <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(212, 165, 178, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', color: '#7a545f' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '32px' }}>mail</span>
              </div>
              <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: '22px', fontWeight: 600, color: '#1d1b19', marginBottom: '8px' }}>No pending requests</h3>
              <p style={{ color: '#4f4447', fontSize: '15px' }}>Incoming friend requests will appear here.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {requests.map(req => (
                <div key={req._id} className="lp-glass-card flex items-center justify-between" style={{ padding: '18px 24px', borderRadius: '20px', flexWrap: 'wrap', gap: '12px' }}>
                  <div className="flex items-center gap-3" style={{ minWidth: 0, flex: 1 }}>
                    <UserAvatar user={req.from} />
                    <div style={{ minWidth: 0 }}>
                      <p style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 600, fontSize: '16px', color: '#1d1b19', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {req.from.displayName || req.from.username}
                      </p>
                      <p className="text-xs text-muted" style={{ color: '#4f4447' }}>@{req.from.username} wants to connect</p>
                    </div>
                  </div>
                  <div className="flex gap-2" style={{ flexShrink: 0 }}>
                    <button className="lp-btn-primary" style={{ padding: '8px 18px', fontSize: '13px' }} onClick={() => respondRequest(req.from._id, 'accept')}>
                      Accept
                    </button>
                    <button className="lp-btn-outline" style={{ padding: '8px 18px', fontSize: '13px', marginTop: 0 }} onClick={() => respondRequest(req.from._id, 'reject')}>
                      Decline
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )
        )}
      </div>
    </div>
  );
};

export default FriendsPage;
