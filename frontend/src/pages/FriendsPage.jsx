import { useState, useEffect } from 'react';
import api from '../utils/api';
import toast from 'react-hot-toast';

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
      <div className="avatar avatar-md avatar-placeholder" style={{ background: 'var(--gradient-amber)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 700, borderRadius: '50%' }}>
        {initials}
      </div>
    );
  };

  return (
    <div className="container page-content">
      <p className="section-eyebrow">Community</p>
      <h2 style={{ marginBottom: 'var(--space-8)' }}>Friends</h2>

      {/* Search */}
      <div className="card-glass" style={{ padding: 'var(--space-6)', marginBottom: 'var(--space-8)' }}>
        <h4 style={{ marginBottom: 'var(--space-4)' }}>🔍 Find Friends</h4>
        <div style={{ position: 'relative' }}>
          <input
            className="form-input"
            placeholder="Search by username…"
            value={searchQuery}
            onChange={handleSearch}
          />
          {searching && <div className="spinner spinner-amber" style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', width: 18, height: 18 }} />}
        </div>

        {searchResults.length > 0 && (
          <div style={{ marginTop: 'var(--space-4)', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            {searchResults.map(user => (
              <div key={user._id} className="flex items-center justify-between" style={{ padding: 'var(--space-3)', background: 'rgba(255,255,255,0.6)', borderRadius: 'var(--radius-md)' }}>
                <div className="flex items-center gap-3">
                  <UserAvatar user={user} />
                  <div>
                    <p style={{ fontWeight: 600, fontSize: '0.9rem' }}>{user.displayName || user.username}</p>
                    <p className="text-xs text-muted">@{user.username}</p>
                  </div>
                </div>
                <button className="btn btn-primary btn-sm" onClick={() => sendRequest(user._id, user.username)}>
                  Add Friend
                </button>
              </div>
            ))}
          </div>
        )}

        {searchQuery.length >= 2 && !searching && searchResults.length === 0 && (
          <p className="text-muted text-sm" style={{ marginTop: 'var(--space-4)' }}>No users found for "{searchQuery}"</p>
        )}
      </div>

      {/* Tabs */}
      <div className="status-tabs" style={{ marginBottom: 'var(--space-6)', display: 'inline-flex' }}>
        <button className={`status-tab ${activeTab === 'friends' ? 'active' : ''}`} onClick={() => setActiveTab('friends')}>
          🤝 Friends ({friends.length})
        </button>
        <button className={`status-tab ${activeTab === 'requests' ? 'active' : ''}`} onClick={() => setActiveTab('requests')}>
          📨 Requests {requests.length > 0 && <span style={{ background: 'var(--color-amber)', color: '#fff', borderRadius: '50%', padding: '1px 6px', fontSize: '0.7rem', marginLeft: 4 }}>{requests.length}</span>}
        </button>
      </div>

      {/* Friends List */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          {[...Array(3)].map((_, i) => <div key={i} className="skeleton" style={{ height: 64, borderRadius: 'var(--radius-md)' }} />)}
        </div>
      ) : activeTab === 'friends' ? (
        friends.length === 0 ? (
          <div className="vault-empty">
            <div className="vault-empty-icon">🤝</div>
            <h3>No friends yet</h3>
            <p>Search for people above to add them as friends.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            {friends.map(friend => (
              <div key={friend._id} className="card flex items-center justify-between" style={{ padding: 'var(--space-4)' }}>
                <div className="flex items-center gap-3">
                  <UserAvatar user={friend} />
                  <div>
                    <p style={{ fontWeight: 600 }}>{friend.displayName || friend.username}</p>
                    <p className="text-xs text-muted">@{friend.username}</p>
                    {friend.bio && <p className="text-xs text-muted" style={{ marginTop: 2 }}>{friend.bio}</p>}
                  </div>
                </div>
                <button className="btn btn-ghost btn-sm" style={{ color: 'var(--color-rose)' }} onClick={() => removeFriend(friend._id, friend.username)}>
                  Remove
                </button>
              </div>
            ))}
          </div>
        )
      ) : (
        requests.length === 0 ? (
          <div className="vault-empty">
            <div className="vault-empty-icon">📨</div>
            <h3>No pending requests</h3>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            {requests.map(req => (
              <div key={req._id} className="card flex items-center justify-between" style={{ padding: 'var(--space-4)' }}>
                <div className="flex items-center gap-3">
                  <UserAvatar user={req.from} />
                  <div>
                    <p style={{ fontWeight: 600 }}>{req.from.displayName || req.from.username}</p>
                    <p className="text-xs text-muted">@{req.from.username} wants to be friends</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button className="btn btn-primary btn-sm" onClick={() => respondRequest(req.from._id, 'accept')}>Accept</button>
                  <button className="btn btn-ghost btn-sm" onClick={() => respondRequest(req.from._id, 'reject')}>Decline</button>
                </div>
              </div>
            ))}
          </div>
        )
      )}
    </div>
  );
};

export default FriendsPage;
