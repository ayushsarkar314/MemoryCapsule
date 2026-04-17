import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import api from '../utils/api';
import toast from 'react-hot-toast';
import FriendPickerModal from '../components/FriendPickerModal';

const CONTENT_TYPES = [
  { key: 'text',  icon: '📝', label: 'Text' },
  { key: 'image', icon: '🖼️', label: 'Image' },
  { key: 'voice', icon: '🎙️', label: 'Voice' },
  { key: 'video', icon: '🎬', label: 'Video' },
];

const RULES = [
  {
    key: 'unlockAt',
    icon: '⏰',
    title: 'Unlock at a future time',
    desc: 'Capsule stays sealed until the date you set.',
  },
  {
    key: 'destroyAfterView',
    icon: '💣',
    title: 'Destroy after one view',
    desc: 'Opens once, then it\'s gone forever.',
  },
  {
    key: 'expireAt',
    icon: '⌛',
    title: 'Auto-expire on a date',
    desc: 'Content disappears on schedule.',
  },
  {
    key: 'eventName',
    icon: '🎉',
    title: 'Unlock on an Event',
    desc: 'Capsule stays sealed until a specific event is triggered.',
  },
];

const CreatePage = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1: content, 2: rules, 3: share
  const [contentType, setContentType] = useState('text');
  const [title, setTitle] = useState('');
  const [textContent, setTextContent] = useState('');
  const [mediaFile, setMediaFile] = useState(null);
  const [ruleType, setRuleType] = useState('unlockAt');
  const [ruleValue, setRuleValue] = useState('');
  const [recipientId, setRecipientId] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [showFriendPicker, setShowFriendPicker] = useState(false);
  const [loading, setLoading] = useState(false);

  const onDrop = useCallback((accepted) => {
    if (accepted.length > 0) setMediaFile(accepted[0]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: contentType === 'image' ? { 'image/*': [] }
          : contentType === 'voice' ? { 'audio/*': [] }
          : { 'video/*': [] },
    maxFiles: 1,
  });

  const handleSubmit = async () => {
    if (!title.trim()) return toast.error('Please give your capsule a title');
    if (contentType === 'text' && !textContent.trim()) return toast.error('Please add some text content');
    if (contentType !== 'text' && !mediaFile) return toast.error('Please upload a file');
    if (ruleType !== 'destroyAfterView' && !ruleValue) return toast.error('Please set the rule value');

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('contentType', contentType);
      if (contentType === 'text') formData.append('textContent', textContent);
      if (mediaFile) formData.append('media', mediaFile);
      formData.append('ruleType', ruleType);
      if (ruleValue) formData.append('ruleValue', ruleValue);
      if (recipientId) formData.append('recipientId', recipientId);

      await api.post('/capsules', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success('Capsule sealed! ✨');
      navigate('/vault');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not create capsule');
    } finally {
      setLoading(false);
    }
  };

  const minDate = new Date(Date.now() + 60 * 1000).toISOString().slice(0, 16);

  return (
    <div className="container page-content">
      <div className="create-page">
        <p className="section-eyebrow">New</p>
        <h2 style={{ marginBottom: 'var(--space-8)' }}>Create a Capsule</h2>

        {/* Step indicators */}
        <div className="flex items-center gap-3" style={{ marginBottom: 'var(--space-8)', flexWrap: 'wrap', justifyContent: 'center' }}>
          {['Content', 'Rules', 'Share'].map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div className="flex items-center gap-2">
                <div style={{
                  width: 28, height: 28, borderRadius: '50%',
                  background: step > i + 1 ? 'var(--color-sage)' : step === i + 1 ? 'var(--gradient-amber)' : 'var(--color-sand)',
                  color: step >= i + 1 ? '#fff' : 'var(--color-text-muted)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.8rem', fontWeight: 700, flexShrink: 0,
                  background: step > i + 1 ? '#8FA88A' : step === i + 1 ? '#D4845A' : '#E8DDD0',
                }}>{step > i + 1 ? '✓' : i + 1}</div>
                <span style={{ fontSize: '0.875rem', fontWeight: step === i + 1 ? 600 : 400, color: step === i + 1 ? 'var(--color-text-primary)' : 'var(--color-text-muted)' }}>{s}</span>
              </div>
              {i < 2 && <div style={{ flex: 1, height: 1, background: step > i + 1 ? 'var(--color-sage)' : 'var(--color-sand)', width: 32 }} />}
            </div>
          ))}
        </div>

        <div className="card-glass" style={{ padding: 'var(--space-8)' }}>

          {/* STEP 1: Content */}
          {step === 1 && (
            <div style={{ animation: 'slideUp 300ms ease' }}>
              <h4 style={{ marginBottom: 'var(--space-6)' }}>What's in this capsule?</h4>

              <div className="form-group">
                <label className="form-label">Capsule Title</label>
                <input className="form-input" placeholder="Give it a meaningful name…" value={title} onChange={e => setTitle(e.target.value)} />
              </div>

              <div className="form-group">
                <label className="form-label">Content Type</label>
                <div className="content-type-grid">
                  {CONTENT_TYPES.map(({ key, icon, label }) => (
                    <button key={key} className={`content-type-btn ${contentType === key ? 'selected' : ''}`} onClick={() => { setContentType(key); setMediaFile(null); }}>
                      <span className="icon">{icon}</span>
                      <span>{label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {contentType === 'text' ? (
                <div className="form-group">
                  <label className="form-label">Your Message</label>
                  <textarea className="form-textarea" rows={6} placeholder="Write your memory, thought, or message…" value={textContent} onChange={e => setTextContent(e.target.value)} />
                </div>
              ) : (
                <div className="form-group">
                  <label className="form-label">Upload File</label>
                  <div {...getRootProps()} className={`dropzone ${isDragActive ? 'active' : ''}`}>
                    <input {...getInputProps()} />
                    {mediaFile ? (
                      <div>
                        <p style={{ fontWeight: 600, marginBottom: 'var(--space-1)' }}>✅ {mediaFile.name}</p>
                        <p className="text-xs text-muted">{(mediaFile.size / 1024 / 1024).toFixed(2)} MB</p>
                      </div>
                    ) : (
                      <div>
                        <p style={{ fontSize: '2rem', marginBottom: 'var(--space-3)' }}>
                          {contentType === 'image' ? '🖼️' : contentType === 'voice' ? '🎙️' : '🎬'}
                        </p>
                        <p style={{ fontWeight: 500, marginBottom: 'var(--space-2)' }}>
                          {isDragActive ? 'Drop it here…' : 'Drag & drop or click to select'}
                        </p>
                        <p className="text-xs text-muted">Max 50MB</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <button className="btn btn-primary w-full" onClick={() => setStep(2)}>
                Next: Set Rules →
              </button>
            </div>
          )}

          {/* STEP 2: Rules */}
          {step === 2 && (
            <div style={{ animation: 'slideUp 300ms ease' }}>
              <h4 style={{ marginBottom: 'var(--space-2)' }}>Choose a Lifecycle Rule</h4>
              <p className="text-sm text-muted" style={{ marginBottom: 'var(--space-6)' }}>
                Every capsule must follow one rule. This determines when and how it can be opened.
              </p>

              <div className="rule-selector" style={{ marginBottom: 'var(--space-6)' }}>
                {RULES.map(({ key, icon, title: rTitle, desc }) => (
                  <div key={key} className={`rule-option ${ruleType === key ? 'selected' : ''}`} onClick={() => { setRuleType(key); setRuleValue(''); }}>
                    <span className="rule-option-icon">{icon}</span>
                    <div>
                      <p className="rule-option-title">{rTitle}</p>
                      <p className="rule-option-desc">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              {ruleType === 'unlockAt' && (
                <div className="form-group">
                  <label className="form-label">Unlock Date & Time</label>
                  <input type="datetime-local" className="form-input" min={minDate} value={ruleValue} onChange={e => setRuleValue(e.target.value)} />
                </div>
              )}

              {ruleType === 'expireAt' && (
                <div className="form-group">
                  <label className="form-label">Expiry Date & Time</label>
                  <input type="datetime-local" className="form-input" min={minDate} value={ruleValue} onChange={e => setRuleValue(e.target.value)} />
                </div>
              )}

              {ruleType === 'eventName' && (
                <div className="form-group">
                  <label className="form-label">Event Name</label>
                  <input type="text" className="form-input" placeholder="e.g. GRADUATION" value={ruleValue} onChange={e => setRuleValue(e.target.value.toUpperCase())} />
                </div>
              )}

              {ruleType === 'destroyAfterView' && (
                <div style={{ padding: 'var(--space-4)', background: 'var(--color-blush)', borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-4)' }}>
                  <p className="text-sm" style={{ color: 'var(--color-rose)' }}>
                    ⚠️ This capsule will be permanently destroyed the moment it's opened. This cannot be undone.
                  </p>
                </div>
              )}

              <div className="flex gap-3">
                <button className="btn btn-ghost" onClick={() => setStep(1)}>← Back</button>
                <button className="btn btn-primary w-full" onClick={() => setStep(3)}>Next: Share Options →</button>
              </div>
            </div>
          )}

          {/* STEP 3: Share */}
          {step === 3 && (
            <div style={{ animation: 'slideUp 300ms ease' }}>
              <h4 style={{ marginBottom: 'var(--space-2)' }}>Who gets this capsule?</h4>
              <p className="text-sm text-muted" style={{ marginBottom: 'var(--space-6)' }}>
                Keep it in your personal vault, or send it to a friend.
              </p>

              <div className="flex flex-col gap-3" style={{ marginBottom: 'var(--space-6)' }}>
                <div className={`rule-option ${!recipientId ? 'selected' : ''}`} onClick={() => { setRecipientId(''); setRecipientName(''); }}>
                  <span className="rule-option-icon">🫙</span>
                  <div>
                    <p className="rule-option-title">Keep in my vault</p>
                    <p className="rule-option-desc">Private, only for you.</p>
                  </div>
                </div>
                <div className={`rule-option ${recipientId ? 'selected' : ''}`} onClick={() => setShowFriendPicker(true)}>
                  <span className="rule-option-icon">💌</span>
                  <div>
                    <p className="rule-option-title">
                      Send to a friend {recipientId && <span style={{ color: 'var(--color-amber)' }}>→ {recipientName}</span>}
                    </p>
                    <p className="rule-option-desc">Delivered to their received capsules.</p>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button className="btn btn-ghost" onClick={() => setStep(2)}>← Back</button>
                <button className="btn btn-primary w-full" onClick={handleSubmit} disabled={loading}>
                  {loading ? <><span className="spinner" /> Sealing capsule…</> : '🫙 Seal & Save'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {showFriendPicker && (
        <FriendPickerModal
          onSelect={(friend) => { setRecipientId(friend._id); setRecipientName(friend.displayName || friend.username); setShowFriendPicker(false); }}
          onClose={() => setShowFriendPicker(false)}
        />
      )}
    </div>
  );
};

export default CreatePage;
