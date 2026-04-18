import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import toast from 'react-hot-toast';
import CapsuleCard from '../components/CapsuleCard';
import { useSocket } from '../context/SocketContext';

const TABS = [
  { key: 'unlocked',  label: 'Unlocked',  icon: '🔓', color: 'var(--color-unlocked)' },
  { key: 'locked',    label: 'Locked',    icon: '🔒', color: 'var(--color-locked)' },
  { key: 'expired',   label: 'Expired',   icon: '⏳', color: 'var(--color-expired)' },
  { key: 'destroyed', label: 'Destroyed', icon: '💨', color: 'var(--color-destroyed)' },
];

const VaultPage = () => {
  const [vault, setVault] = useState({ locked: [], unlocked: [], expired: [], destroyed: [] });
  const [activeTab, setActiveTab] = useState('unlocked');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchVault = async () => {
    try {
      const res = await api.get('/capsules/vault');
      setVault(res.data.vault);
    } catch {
      toast.error('Could not load vault');
    } finally {
      setLoading(false);
    }
  };

  const fireTriggerEvent = async () => {
    const eventName = window.prompt("Enter the Event Name to trigger (e.g. GRADUATION):");
    if (!eventName) return;
    
    try {
      const res = await api.post(`/capsules/trigger/${eventName.toUpperCase()}`);
      toast.success(res.data.message);
      fetchVault();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not trigger event');
    }
  };

  useEffect(() => { fetchVault(); }, []);

  const { socket } = useSocket();

  useEffect(() => {
    if (!socket) return;
    
    const handleStatusChanged = (data) => {
      if (data.event) {
        toast.success(`Event '${data.event}' unlocked ${data.count} capsules!`);
      } else if (data.status) {
        toast(`A capsule status changed to ${data.status}`, { icon: '🔔' });
      }
      fetchVault();
    };

    socket.on('capsule_status_changed', handleStatusChanged);

    return () => {
      socket.off('capsule_status_changed', handleStatusChanged);
    };
  }, [socket]);

  const activeCapsules = vault[activeTab] || [];

  return (
    <div className="container page-content">
      {/* Header */}
      <div style={{ marginBottom: 'var(--space-8)' }}>
        
        <div className="section-header">
          <h2>My Vault</h2>
          <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
            <button className="btn btn-sm" style={{ background: 'var(--color-sand)', color: 'var(--color-text-primary)' }} onClick={fireTriggerEvent}>
              🎉 Trigger Event
            </button>
            <button className="btn btn-primary btn-sm" onClick={() => navigate('/create')}>
              ✨ New Capsule
            </button>
          </div>
        </div>

        {/* Stats row */}
        <div style={{ display: 'flex', gap: 'var(--space-4)', flexWrap: 'wrap', marginBottom: 'var(--space-6)' }}>
          {TABS.map(({ key, label, icon, color }) => (
            <div key={key} className="card" style={{ flex: '1', minWidth: '120px', textAlign: 'center', padding: 'var(--space-4)', cursor: 'pointer' }} onClick={() => setActiveTab(key)}>
              <div style={{ fontSize: '1.4rem' }}>{icon}</div>
              <div style={{ fontSize: '1.6rem', fontFamily: 'var(--font-serif)', fontWeight: 700, color }}>{vault[key]?.length ?? 0}</div>
              <div className="text-muted text-xs" style={{ textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>{label}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="status-tabs">
          {TABS.map(({ key, label, icon }) => (
            <button key={key} className={`status-tab ${activeTab === key ? 'active' : ''}`} onClick={() => setActiveTab(key)}>
              {icon} {label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="vault-grid">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="skeleton" style={{ height: 180, borderRadius: 'var(--radius-xl)' }} />
          ))}
        </div>
      ) : activeCapsules.length === 0 ? (
        <div className="vault-empty">
          <div className="vault-empty-icon">{TABS.find(t => t.key === activeTab)?.icon}</div>
          <h3 style={{ marginBottom: 'var(--space-2)' }}>No {activeTab} capsules yet</h3>
          {activeTab === 'unlocked' || activeTab === 'locked' ? (
            <p style={{ marginBottom: 'var(--space-5)' }}>
              {activeTab === 'locked' ? 'Capsules you seal for the future will appear here.' : 'Open capsules will show up here.'}
            </p>
          ) : null}
          {(activeTab === 'unlocked' || activeTab === 'locked') && (
            <button className="btn btn-primary" onClick={() => navigate('/create')}>
              Create your first capsule
            </button>
          )}
        </div>
      ) : (
        <div className="vault-grid">
          {activeCapsules.map((capsule) => (
            <CapsuleCard key={capsule._id} capsule={capsule} onClick={() => navigate(`/capsule/${capsule._id}`)} onRefresh={fetchVault} />
          ))}
        </div>
      )}
    </div>
  );
};

export default VaultPage;
