import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import toast from 'react-hot-toast';
import CapsuleCard from '../components/CapsuleCard';
import ShaderBackground from '../components/ShaderBackground';
import './LandingPage.css';

const TABS = [
  { key: 'received', label: 'Received', icon: 'mark_email_unread' },
  { key: 'sent', label: 'Sent', icon: 'outbox' },
];

const SharedPage = () => {
  const [received, setReceived] = useState([]);
  const [sent, setSent] = useState([]);
  const [activeTab, setActiveTab] = useState('received');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchAll = async () => {
    try {
      const [recRes, sentRes] = await Promise.all([
        api.get('/capsules/received'),
        api.get('/capsules/sent'),
      ]);
      setReceived(recRes.data.capsules);
      setSent(sentRes.data.capsules);
    } catch {
      toast.error('Could not load shared capsules');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  const activeCapsules = activeTab === 'received' ? received : sent;

  return (
    <div className="lp-root create-shader-bg" style={{ minHeight: '100vh', position: 'relative' }}>
      {/* ── WebGL Shader Background ── */}
      <div className="lp-bg">
        <ShaderBackground />
        <div className="lp-bg-overlay" />
      </div>

      <div className="container page-content" style={{ position: 'relative', zIndex: 10, paddingTop: '100px', paddingBottom: '64px', maxWidth: '1100px', margin: '0 auto' }}>
        
        {/* Header */}
        <div className="flex justify-between items-start" style={{ marginBottom: '32px', flexWrap: 'wrap', gap: '20px' }}>
          <div>
            <span className="lp-eyebrow" style={{ marginBottom: '12px' }}>Shared Vault</span>
            <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: 'clamp(28px, 4vw, 42px)', fontWeight: 700, color: '#1d1b19', marginBottom: '8px' }}>
              Shared Capsules
            </h1>
            <p style={{ fontFamily: 'Manrope, sans-serif', color: '#4f4447', fontSize: '16px' }}>
              Memories entrusted to you by others, and capsules you've sent into the future.
            </p>
          </div>
          <button className="lp-btn-primary" onClick={() => navigate('/create')}>
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>mark_email_read</span> Send Capsule
          </button>
        </div>

        {/* Status Tabs */}
        <div style={{ marginBottom: '32px', display: 'inline-flex', background: 'rgba(237, 231, 227, 0.7)', backdropFilter: 'blur(12px)', padding: '4px', borderRadius: '9999px', border: '1px solid rgba(255, 255, 255, 0.5)' }}>
          {TABS.map(({ key, label, icon }) => (
            <button
              key={key}
              className={`status-tab ${activeTab === key ? 'active' : ''}`}
              onClick={() => setActiveTab(key)}
              style={{
                padding: '10px 24px',
                borderRadius: '9999px',
                border: 'none',
                background: activeTab === key ? '#ffffff' : 'transparent',
                color: activeTab === key ? '#7a545f' : '#4f4447',
                fontFamily: 'Manrope, sans-serif',
                fontWeight: activeTab === key ? 700 : 600,
                fontSize: '14px',
                cursor: 'pointer',
                boxShadow: activeTab === key ? '0 2px 8px rgba(74, 43, 77, 0.12)' : 'none',
                transition: 'all 0.25s',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>{icon}</span> {label}
              {activeTab === key && (
                <span style={{ marginLeft: 6, background: '#7a545f', color: '#fff', borderRadius: '9999px', padding: '2px 8px', fontSize: '11px', fontWeight: 700 }}>
                  {activeCapsules.length}
                </span>
              )}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px' }}>
            {[...Array(3)].map((_, i) => (
              <div key={i} className="lp-glass-card" style={{ height: 200, borderRadius: '24px' }} />
            ))}
          </div>
        ) : activeCapsules.length === 0 ? (
          <div className="lp-glass-card" style={{ borderRadius: '28px', padding: '64px 32px', textAlign: 'center', maxWidth: '600px', margin: '0 auto' }}>
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(212, 165, 178, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', color: '#7a545f' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '32px' }}>
                {activeTab === 'received' ? 'mail_lock' : 'forward_to_inbox'}
              </span>
            </div>
            <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: '24px', fontWeight: 600, color: '#1d1b19', marginBottom: '10px' }}>
              {activeTab === 'received' ? 'No capsules received yet' : 'No capsules sent yet'}
            </h3>
            <p style={{ color: '#4f4447', fontSize: '15px', marginBottom: '28px', lineHeight: 1.6 }}>
              {activeTab === 'received' ? 'When a friend seals a memory and sends it to you, it will appear in your private vault.' : 'Seal a photo, video, audio, or message for a friend to get started.'}
            </p>
            <button className="lp-btn-primary" onClick={() => navigate('/create')}>
              Create & Send a Capsule
            </button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px' }}>
            {activeCapsules.map((capsule) => (
              <CapsuleCard key={capsule._id} capsule={capsule} onClick={() => navigate(`/capsule/${capsule._id}`)} onRefresh={fetchAll} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SharedPage;
