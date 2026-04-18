import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import api from '../utils/api';
import toast from 'react-hot-toast';
import CapsuleCard from '../components/CapsuleCard';

const TABS = [
  { key: 'received', label: 'Received', icon: '📬' },
  { key: 'sent', label: 'Sent', icon: '📤' },
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
    <div className="container page-content">

      <div className="section-header" style={{ marginBottom: 'var(--space-6)' }}>
        <h2>Shared Capsules</h2>
        <button className="btn btn-primary btn-sm" onClick={() => navigate('/create')}>
          💌 Send Capsule
        </button>
      </div>

      <div className="status-tabs" style={{ marginBottom: 'var(--space-6)', display: 'inline-flex' }}>
        {TABS.map(({ key, label, icon }) => (
          <button key={key} className={`status-tab ${activeTab === key ? 'active' : ''}`} onClick={() => setActiveTab(key)}>
            {icon} {label} {activeTab === key && <span style={{ marginLeft: 4, background: 'var(--color-amber)', color: '#fff', borderRadius: 'var(--radius-full)', padding: '1px 8px', fontSize: '0.7rem' }}>{activeCapsules.length}</span>}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="shared-list">
          {[...Array(3)].map((_, i) => <div key={i} className="skeleton" style={{ height: 100, borderRadius: 'var(--radius-xl)' }} />)}
        </div>
      ) : activeCapsules.length === 0 ? (
        <div className="vault-empty">
          <div className="vault-empty-icon">{activeTab === 'received' ? '📬' : '📤'}</div>
          <h3 style={{ marginBottom: 'var(--space-2)' }}>
            {activeTab === 'received' ? 'No capsules received yet' : 'No capsules sent yet'}
          </h3>
          <p style={{ marginBottom: 'var(--space-5)' }}>
            {activeTab === 'received' ? 'When a friend sends you a capsule, it appears here.' : 'Send a memory to a friend to get started.'}
          </p>
          <button className="btn btn-primary" onClick={() => navigate('/create')}>
            Create & Send a Capsule
          </button>
        </div>
      ) : (
        <div className="shared-list">
          {activeCapsules.map((capsule) => (
            <CapsuleCard key={capsule._id} capsule={capsule} onClick={() => navigate(`/capsule/${capsule._id}`)} onRefresh={fetchAll} />
          ))}
        </div>
      )}
    </div>
  );
};

export default SharedPage;
