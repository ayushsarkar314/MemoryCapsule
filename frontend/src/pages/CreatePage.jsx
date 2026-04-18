import { useState, useCallback, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import api from '../utils/api';
import toast from 'react-hot-toast';
import FriendPickerModal from '../components/FriendPickerModal';
import AISuggestPanel from '../components/AISuggestPanel';

const CONTENT_TYPES = [
  { key: 'text', icon: 'fa-solid fa-file-signature', label: 'Text' },
  { key: 'image', icon: 'fa-solid fa-image', label: 'Image' },
  { key: 'voice', icon: 'fa-solid fa-microphone-lines', label: 'Voice' },
  { key: 'video', icon: 'fa-solid fa-video', label: 'Video' },
];

const RULES = [
  {
    key: 'unlockAt',
    icon: 'fa-solid fa-unlock-keyhole',
    title: 'Unlock at a future time',
    desc: 'Capsule stays sealed until the date you set.',
  },
  {
    key: 'destroyAfterView',
    icon: 'fa-solid fa-bomb',
    title: 'Destroy after one view',
    desc: 'Opens once, then it\'s gone forever.',
  },
  {
    key: 'expireAt',
    icon: 'fa-solid fa-hourglass-end',
    title: 'Auto-expire on a date',
    desc: 'Content disappears on schedule.',
  },
  {
    key: 'eventName',
    icon: 'fa-solid fa-flag-checkered',
    title: 'Unlock on an event',
    desc: 'Stays locked until you (or a date) triggers it.',
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
  // Event rule specific
  const [eventName, setEventName] = useState('');
  const [eventTriggerDate, setEventTriggerDate] = useState('');
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

    if (ruleType === 'eventName') {
      if (!eventName.trim()) {
        toast.error('Please enter an event name (e.g. Graduation, Birthday)');
        return false;
      }
      if (eventTriggerDate) {
        const selectedDate = new Date(eventTriggerDate);
        if (isNaN(selectedDate.getTime()) || selectedDate <= new Date()) {
          toast.error('Auto-trigger date must be in the future');
          return false;
        }
      }
      return true;
    }

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
      // Event rule fields
      if (ruleType === 'eventName') {
        formData.append('eventName', eventName.trim().toUpperCase());
        if (eventTriggerDate) formData.append('eventTriggerDate', eventTriggerDate);
      }
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

  // Called when user picks an AI suggestion
  const handleAISuggestion = (suggestion) => {
    if (suggestion.title) setTitle(suggestion.title);
    if (suggestion.contentType) setContentType(suggestion.contentType);
    if (suggestion.suggestedRule) {
      setRuleType(suggestion.suggestedRule);
      setRuleValue('');
      setEventName('');
      setEventTriggerDate('');
    }
    // Move to next step so user sees context
    setStep(1);
  };

  const minDate = new Date(Date.now() + 60 * 1000).toISOString().slice(0, 16);

  return (
    <div className="create-forest-layout">
      <div className="container">
        <h1 className="forest-title">Create a Capsule</h1>

        {/* AI Suggest Panel — appears above the steps */}
        <AISuggestPanel onUseSuggestion={handleAISuggestion} />

        {/* Step indicators */}
        <div className="forest-step-indicator">
          {['Content', 'Rules', 'Share'].map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`forest-step-dot ${step === i + 1 ? 'active' : step > i + 1 ? 'completed' : 'pending'}`}>
                {step > i + 1 ? '✓' : i + 1}
              </div>
              <span style={{
                fontSize: '0.85rem',
                fontWeight: step === i + 1 ? 700 : 500,
                color: step === i + 1 ? 'var(--color-sunbeam)' : 'rgba(255,255,255,0.6)',
                letterSpacing: '0.02em'
              }}>
                {s}
              </span>
              {i < 2 && (
                <div style={{
                  width: 30,
                  height: 2,
                  background: step > i + 1 ? '#fff' : 'rgba(255,255,255,0.2)',
                  borderRadius: 1
                }} />
              )}
            </div>
          ))}
        </div>

        <div className="mossy-panel">

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
                      <span className="icon"><i className={icon}></i></span>
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
                            <i className={contentType === 'voice' ? 'fa-solid fa-microphone-lines' : contentType === 'image' ? 'fa-solid fa-camera' : 'fa-solid fa-video'} style={{ fontSize: '1.5rem', marginRight: 'var(--space-2)' }}></i>
                            Enable {contentType === 'voice' ? 'Microphone' : 'Camera'}
                          </button>
                        ) : (
                          <div className="recorder-active" style={{ padding: 'var(--space-4)', borderRadius: 'var(--radius-lg)', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
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
                    <span className="rule-option-icon"><i className={icon}></i></span>
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

              {ruleType === 'eventName' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                  <div className="form-group">
                    <label className="form-label">Event Name</label>
                    <input
                      className="form-input"
                      placeholder="e.g. GRADUATION, BIRTHDAY, NEW_JOB…"
                      value={eventName}
                      onChange={(e) => setEventName(e.target.value.toUpperCase())}
                      id="event-name-input"
                    />
                    <p className="text-xs text-muted" style={{ marginTop: 'var(--space-1)' }}>You can manually trigger this capsule anytime from your vault.</p>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Auto-trigger Date <span style={{ opacity: 0.6, fontWeight: 400 }}>(optional)</span></label>
                    <input
                      type="datetime-local"
                      className="form-input"
                      min={minDate}
                      value={eventTriggerDate}
                      onChange={(e) => setEventTriggerDate(e.target.value)}
                      id="event-trigger-date-input"
                    />
                    <p className="text-xs text-muted" style={{ marginTop: 'var(--space-1)' }}>If set, capsule auto-unlocks on this date even if you haven't triggered it manually.</p>
                  </div>
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
                  <span className="rule-option-icon"><i className="fa-solid fa-vault"></i></span>
                  <div>
                    <p className="rule-option-title">Keep in my vault</p>
                    <p className="rule-option-desc">Private, only for you.</p>
                  </div>
                </div>
                <div className={`rule-option ${recipientId ? 'selected' : ''}`} onClick={() => setShowFriendPicker(true)}>
                  <span className="rule-option-icon"><i className="fa-solid fa-paper-plane"></i></span>
                  <div>
                    <p className="rule-option-title">
                      Send to a friend {recipientId && <span style={{ color: 'var(--color-sunbeam)' }}>→ {recipientName}</span>}
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

      {/* Success Animation Overlay (Refined Blue Postman Delivery) */}
      {showSuccess && (
        <div className="success-overlay">
          <div className="postman-sequence">
            <div className="vault-jar-back"></div>
            <div className="envelope-flying">💌</div>
            <div className="vault-jar-front"></div>
            <div className="vault-jar-lid"></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreatePage;
