import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import toast from 'react-hot-toast';
import CapsuleCard from '../components/CapsuleCard';
import { useSocket } from '../context/SocketContext';

const TABS = [
  { key: 'unlocked',  label: 'Unlocked',  icon: 'fa-solid fa-envelope-open', color: 'var(--color-unlocked)' },
  { key: 'locked',    label: 'Locked',    icon: 'fa-solid fa-lock', color: 'var(--color-locked)' },
  { key: 'expired',   label: 'Expired',   icon: 'fa-solid fa-clock-rotate-left', color: 'var(--color-expired)' },
  { key: 'destroyed', label: 'Destroyed', icon: 'fa-solid fa-wind', color: 'var(--color-destroyed)' },
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
    <div className="vault-luminous-layout">
      {/* Immersive Video Background */}
      <div className="video-container-fixed">
        <video 
          className="video-full-bg" 
          autoPlay 
          loop 
          muted 
          playsInline
          preload="auto"
        >
          <source src="/assets/video/MainVault.mp4" type="video/mp4" />
        </video>
      </div>

      <div className="vault-luminous-overlay">
        <div className="container">
          {/* Visual Header */}
          <div className="vault-hero-text">
         
            <h1>The Vault</h1>
            <div style={{ marginTop: 'var(--space-6)' }}>
              <button 
                className="btn btn-primary btn-lg" 
                style={{ background: 'var(--color-brown-mid)', borderColor: 'var(--color-brown-mid)', color: '#fff' }}
                onClick={() => navigate('/create')}
              >
                ✨ Preserve a Memory
              </button>
            </div>
          </div>

          {/* Main Content Area — Glassmorphism removed as per request */}
          <div className="vault-content-minimal">
            <div className="section-header">
              <h2 className="text-high-contrast">My Collection</h2>
              <div className="status-tabs">
                {TABS.map(({ key, label, icon }) => (
                  <button key={key} className={`status-tab ${activeTab === key ? 'active' : ''}`} onClick={() => setActiveTab(key)}>
                    <i className={icon} style={{ marginRight: 'var(--space-2)' }}></i> {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Snapshot Row — Clean design without glass effect */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 'var(--space-4)', marginBottom: 'var(--space-8)' }}>
              {TABS.map(({ key, label, icon }) => (
                <div 
                  key={key} 
                  style={{ 
                    textAlign: 'center', 
                    padding: 'var(--space-5)',
                    cursor: 'pointer',
                    borderRadius: 'var(--radius-xl)',
                    background: activeTab === key ? 'var(--color-rose-light)' : 'rgba(251, 223, 223, 0.3)',
                    border: activeTab === key ? '2px solid var(--color-brown)' : '1px solid rgba(223, 160, 160, 0.4)',
                    transition: 'all 0.3s ease',
                    color: activeTab === key ? 'var(--color-text-primary)' : 'var(--color-text-primary)'
                  }} 
                  onClick={() => setActiveTab(key)}
                >
                  <div style={{ fontSize: '1.2rem', marginBottom: 'var(--space-2)', color: activeTab === key ? 'var(--color-text-primary)' : 'var(--color-text-muted)' }}>
                    <i className={icon}></i>
                  </div>
                  <div style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--color-brown)' }}>{vault[key]?.length ?? 0}</div>
                  <div className="text-muted text-xs" style={{ textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 600, color: 'var(--color-text-muted)' }}>{label}</div>
                </div>
              ))}
            </div>

            {/* Grid display */}
            <div style={{ minHeight: '400px' }}>
              {loading ? (
                <div className="vault-grid">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="skeleton" style={{ height: 240, borderRadius: 'var(--radius-xl)', background: 'rgba(251, 223, 223, 0.4)' }} />
                  ))}
                </div>
              ) : activeCapsules.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 'var(--space-16) 0' }}>
                  <div style={{ fontSize: '4rem', opacity: 0.3, marginBottom: 'var(--space-4)', color: 'var(--color-rose)' }}>✈️</div>
                  <h3 className="text-high-contrast">No {activeTab} travel moments yet</h3>
                  <p className="text-muted">Every mile has a story. Seal yours today.</p>
                </div>
              ) : (
                <div className="vault-grid">
                  {activeCapsules.map((capsule) => (
                    <CapsuleCard key={capsule._id} capsule={capsule} onClick={() => navigate(`/capsule/${capsule._id}`)} onRefresh={fetchVault} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VaultPage;
