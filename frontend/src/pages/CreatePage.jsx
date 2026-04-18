import { useState, useCallback, useRef, useEffect } from 'react';
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
  const [showSuccess, setShowSuccess] = useState(false);

  // Recording State
  const [isRecording, setIsRecording] = useState(false);
  const [recordingStatus, setRecordingStatus] = useState('idle'); // idle, open, recording, preview
  const [recordedUrl, setRecordedUrl] = useState(null);
  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);
  const videoPreviewRef = useRef(null);
  const [chunks, setChunks] = useState([]);
  const [recordTimer, setRecordTimer] = useState(0);
  const timerRef = useRef(null);

  // Cleanup effect
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // Timer logic
  useEffect(() => {
    if (isRecording) {
      timerRef.current = setInterval(() => {
        setRecordTimer(prev => prev + 1);
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [isRecording]);

  useEffect(() => {
    if ((recordingStatus === 'recording' || recordingStatus === 'open') && streamRef.current && (contentType === 'video' || contentType === 'image')) {
      if (videoPreviewRef.current) {
        videoPreviewRef.current.srcObject = streamRef.current;
      }
    }
  }, [recordingStatus, contentType]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const startCamera = async () => {
    try {
      const constraints = {
        audio: contentType !== 'image',
        video: contentType === 'video' || contentType === 'image'
      };
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      setRecordingStatus('open');
      setRecordTimer(0);
    } catch (err) {
      console.error('Camera/Mic access error:', err);
      toast.error('Could not access camera/microphone. Please check permissions.');
    }
  };

  const takePhoto = () => {
    if (!videoPreviewRef.current || !streamRef.current) return;

    const canvas = document.createElement('canvas');
    canvas.width = videoPreviewRef.current.videoWidth;
    canvas.height = videoPreviewRef.current.videoHeight;
    const ctx = canvas.getContext('2d');

    // Mirror if necessary
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(videoPreviewRef.current, 0, 0);

    canvas.toBlob((blob) => {
      const url = URL.createObjectURL(blob);
      setRecordedUrl(url);
      
      const file = new File([blob], `captured-${Date.now()}.jpg`, { type: 'image/jpeg' });
      setMediaFile(file);
      setRecordingStatus('preview');
      
      // Stop camera
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
    }, 'image/jpeg', 0.9);
  };

  const startRecording = () => {
    try {
      if (!streamRef.current) return;

      const recorder = new MediaRecorder(streamRef.current, {
        mimeType: contentType === 'video' ? 'video/webm' : 'audio/webm'
      });
      
      mediaRecorderRef.current = recorder;
      const localChunks = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) localChunks.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(localChunks, { 
          type: contentType === 'video' ? 'video/webm' : 'audio/webm' 
        });
        const url = URL.createObjectURL(blob);
        setRecordedUrl(url);
        
        // Convert Blob to File for submission
        const extension = 'webm';
        const file = new File([blob], `recorded-${Date.now()}.${extension}`, {
          type: blob.type
        });
        setMediaFile(file);
      };

      recorder.start();
      setIsRecording(true);
      setRecordingStatus('recording');
      setRecordTimer(0);
    } catch (err) {
      console.error('Recording error:', err);
      toast.error('Recording failed to start.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setRecordingStatus('preview');
      
      if (videoPreviewRef.current) {
        videoPreviewRef.current.srcObject = null;
      }

      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
    }
  };

  const resetRecording = () => {
    setRecordedUrl(null);
    setRecordingStatus('idle');
    setMediaFile(null);
    setRecordTimer(0);
  };

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

  const validateRule = () => {
    if (ruleType === 'destroyAfterView') return true;
    
    if (!ruleValue) {
      toast.error(`Please set the ${ruleType === 'unlockAt' ? 'unlock' : 'expiry'} date`);
      return false;
    }

    const selectedDate = new Date(ruleValue);
    const now = new Date();
    if (isNaN(selectedDate.getTime()) || selectedDate <= now) {
      toast.error(`The ${ruleType === 'unlockAt' ? 'unlock' : 'expiry'} date must be in the future`);
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!title.trim()) return toast.error('Please give your capsule a title');
    if (contentType === 'text' && !textContent.trim()) return toast.error('Please add some text content');
    if (contentType !== 'text' && !mediaFile) return toast.error('Please upload a file');
    
    if (!validateRule()) return;

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
      
      // Trigger success animation
      setShowSuccess(true);
      
      // Wait for animation to finish before navigating
      setTimeout(() => {
        toast.success('Capsule sealed! ✨');
        navigate('/vault');
      }, 4000);
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
       
        <h2 style={{ marginBottom: 'var(--space-8)' }}>Create a Capsule</h2>

        {/* Step indicators */}
        <div className="flex items-center gap-2" style={{ marginBottom: 'var(--space-8)', justifyContent: 'center' }}>
          {['Content', 'Rules', 'Share'].map((s, i) => (
            <div key={s} className="flex items-center gap-2" style={{ flexShrink: 1 }}>
              <div className="flex items-center gap-2">
                <div style={{
                  width: 28, height: 28, borderRadius: '50%',
                  color: step >= i + 1 ? '#fff' : 'var(--color-text-muted)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.8rem', fontWeight: 700, flexShrink: 0,
                  background: step > i + 1 ? '#8FA88A' : step === i + 1 ? '#D4845A' : '#E8DDD0',
                }}>{step > i + 1 ? '✓' : i + 1}</div>
                <span style={{ fontSize: '0.875rem', fontWeight: step === i + 1 ? 600 : 400, color: step === i + 1 ? 'var(--color-text-primary)' : 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>{s}</span>
              </div>
              {i < 2 && <div style={{ flexShrink: 1, minWidth: 8, height: 1, background: step > i + 1 ? 'var(--color-sage)' : 'var(--color-sand)', width: 32 }} />}
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
                <div className="form-group" style={{ animation: 'fadeIn 0.3s ease' }}>
                  <div className="flex items-center justify-between" style={{ marginBottom: 'var(--space-2)' }}>
                    <label className="form-label" style={{ marginBottom: 0 }}>Content</label>
                    <span className="text-xs text-muted">Upload or Record Live</span>
                  </div>

                  <div className="dropzone-container" style={{ position: 'relative' }}>
                    {/* Recording/Capture UI */}
                    {(contentType === 'voice' || contentType === 'video' || contentType === 'image') && (
                      <div className="recorder-section" style={{ marginBottom: 'var(--space-4)' }}>
                        {recordingStatus === 'idle' ? (
                          <button className="btn btn-ghost w-full" style={{ border: '2px dashed var(--color-sand)', padding: 'var(--space-6)', borderRadius: 'var(--radius-lg)' }} onClick={startCamera}>
                            <span style={{ fontSize: '1.5rem', marginRight: 'var(--space-2)' }}>
                              {contentType === 'voice' ? '🎙️' : contentType === 'image' ? '📸' : '🎬'}
                            </span>
                            Enable {contentType === 'voice' ? 'Microphone' : 'Camera'}
                          </button>
                        ) : (
                          <div className="recorder-active card-glass" style={{ padding: 'var(--space-4)', border: '1px solid var(--color-sage)' }}>
                            <div className="flex items-center justify-between" style={{ marginBottom: 'var(--space-4)' }}>
                              <div className="flex items-center gap-2">
                                <div className={`record-dot ${isRecording ? 'pulse' : ''} ${recordingStatus === 'open' ? 'ready' : ''}`} />
                                <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>
                                  {recordingStatus === 'open' ? 'Ready' : isRecording ? 'Recording...' : 'Preview Capture'}
                                </span>
                              </div>
                              {(contentType === 'video' || contentType === 'voice') && (
                                <span className="font-mono" style={{ fontSize: '0.9rem', color: 'var(--color-rose)' }}>{formatTime(recordTimer)}</span>
                              )}
                            </div>

                            {/* Live/Preview Displays */}
                            <div style={{ marginBottom: 'var(--space-4)', borderRadius: 'var(--radius-md)', overflow: 'hidden', background: '#000' }}>
                              {(contentType === 'video' || contentType === 'image') && (
                                <>
                                  {recordingStatus === 'preview' && contentType === 'image' ? (
                                    <img 
                                      src={recordedUrl} 
                                      style={{ width: '100%', display: 'block', aspectRatio: '16/9', objectFit: 'cover' }} 
                                    />
                                  ) : (
                                    <video 
                                      ref={videoPreviewRef} 
                                      autoPlay 
                                      muted={recordingStatus !== 'preview'} 
                                      controls={recordingStatus === 'preview' && contentType === 'video'}
                                      src={recordingStatus === 'preview' && contentType === 'video' ? recordedUrl : undefined}
                                      style={{ 
                                        width: '100%', 
                                        display: 'block',
                                        transform: (recordingStatus === 'recording' || recordingStatus === 'open') ? 'scaleX(-1)' : 'none',
                                        aspectRatio: '16/9',
                                        objectFit: 'cover'
                                      }} 
                                    />
                                  )}
                                </>
                              )}
                              {contentType === 'voice' && recordingStatus === 'preview' && recordedUrl && (
                                <audio controls src={recordedUrl} style={{ width: '100%', padding: 'var(--space-2)' }} />
                              )}
                              {contentType === 'voice' && (recordingStatus === 'recording' || recordingStatus === 'open') && (
                                <div style={{ height: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                                  <div className="voice-waves">
                                    <span style={{ animationPlayState: isRecording ? 'running' : 'paused' }} />
                                    <span style={{ animationPlayState: isRecording ? 'running' : 'paused' }} />
                                    <span style={{ animationPlayState: isRecording ? 'running' : 'paused' }} />
                                    <span style={{ animationPlayState: isRecording ? 'running' : 'paused' }} />
                                    <span style={{ animationPlayState: isRecording ? 'running' : 'paused' }} />
                                  </div>
                                </div>
                              )}
                            </div>

                            <div className="flex gap-2">
                              {recordingStatus === 'open' ? (
                                <>
                                  <button className="btn btn-ghost w-full" onClick={resetRecording}>Cancel</button>
                                  {contentType === 'image' ? (
                                    <button className="btn btn-primary w-full" onClick={takePhoto}>Take Photo</button>
                                  ) : (
                                    <button className="btn btn-primary w-full" onClick={startRecording}>Start Recording</button>
                                  )}
                                </>
                              ) : isRecording ? (
                                <button className="btn btn-rose w-full" onClick={stopRecording}>Stop Recording</button>
                              ) : (
                                <>
                                  <button className="btn btn-ghost w-full" onClick={resetRecording}>Retake</button>
                                  <button className="btn btn-sage w-full" onClick={() => toast.success('Captured! Ready to seal.')}>Keep This</button>
                                </>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Standard Dropzone (Always available as alternative) */}
                    {recordingStatus === 'idle' && (
                      <div {...getRootProps()} className={`dropzone ${isDragActive ? 'active' : ''}`}>
                        <input {...getInputProps()} />
                        {mediaFile ? (
                          <div>
                            <p style={{ fontWeight: 600, marginBottom: 'var(--space-1)' }}>✅ {mediaFile.name}</p>
                            <p className="text-xs text-muted">{(mediaFile.size / 1024 / 1024).toFixed(2)} MB</p>
                            <button className="text-xs text-rose" style={{ marginTop: 'var(--space-2)', border: 'none', background: 'none', cursor: 'pointer', textDecoration: 'underline' }} onClick={(e) => { e.stopPropagation(); setMediaFile(null); }}>Remove & upload other</button>
                          </div>
                        ) : (
                          <div>
                            <p style={{ fontSize: '1.2rem', marginBottom: 'var(--space-2)' }}>Or Upload File</p>
                            <p className="text-sm text-muted">Drag & drop or click</p>
                          </div>
                        )}
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

              {ruleType === 'destroyAfterView' && (
                <div style={{ padding: 'var(--space-4)', background: 'var(--color-blush)', borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-4)' }}>
                  <p className="text-sm" style={{ color: 'var(--color-rose)' }}>
                    ⚠️ This capsule will be permanently destroyed the moment it's opened. This cannot be undone.
                  </p>
                </div>
              )}

              <div className="flex gap-3">
                <button className="btn btn-ghost" onClick={() => setStep(1)}>← Back</button>
                <button className="btn btn-primary w-full" onClick={() => validateRule() && setStep(3)}>Next: Share Options →</button>
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

      {/* Success Animation Overlay (Postman Delivery) */}
      {showSuccess && (
        <div className="success-overlay">
          <div className="vault-animation">🫙</div>
          <div className="envelope-flying">💌</div>
        </div>
      )}
    </div>
  );
};

export default CreatePage;
