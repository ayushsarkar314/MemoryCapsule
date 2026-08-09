import { useState, useCallback, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import api from '../utils/api';
import toast from 'react-hot-toast';
import FriendPickerModal from '../components/FriendPickerModal';
import AISuggestPanel from '../components/AISuggestPanel';
import ShaderBackground from '../components/ShaderBackground';
import './LandingPage.css';

const CONTENT_TYPES = [
  { key: 'text', icon: 'subject', label: 'Text' },
  { key: 'image', icon: 'image', label: 'Image' },
  { key: 'voice', icon: 'mic', label: 'Voice' },
  { key: 'video', icon: 'videocam', label: 'Video' },
];

const RULES = [
  {
    key: 'unlockAt',
    icon: 'calendar_clock',
    title: 'Unlock at a future time',
    desc: 'Capsule stays sealed until the date you set.',
  },
  {
    key: 'destroyAfterView',
    icon: 'visibility_off',
    title: 'Destroy after one view',
    desc: 'Opens once, then it\'s gone forever.',
  },
  {
    key: 'expireAt',
    icon: 'hourglass_bottom',
    title: 'Auto-expire on a date',
    desc: 'Content disappears on schedule.',
  },
  {
    key: 'eventName',
    icon: 'flag',
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
    <div className="lp-root create-shader-bg" style={{ minHeight: '100vh', position: 'relative' }}>
      {/* ── Live Shader Background + Dark Readability Overlay ── */}
      <div className="lp-bg">
        <ShaderBackground />
        <div className="lp-bg-overlay" />
      </div>

      <div className="container page-content" style={{ position: 'relative', zIndex: 2, paddingTop: '100px', paddingBottom: '64px', maxWidth: '840px', margin: '0 auto' }}>

        
        {/* Page Header */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <span className="lp-eyebrow" style={{ marginBottom: '12px' }}>Sanctum</span>
          <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: 'clamp(32px, 5vw, 48px)', fontWeight: 700, color: '#1d1b19', marginBottom: '8px' }}>
            Seal a Memory
          </h1>
          <p style={{ fontFamily: 'Manrope, sans-serif', color: '#4f4447', fontSize: '16px', maxWidth: '520px', margin: '0 auto' }}>
            Create it. Choose its fate. Let time preserve your thoughts for later.
          </p>
        </div>

        {/* AI Suggest Panel — appears above the steps */}
        <AISuggestPanel onUseSuggestion={handleAISuggestion} />

        {/* Step indicators */}
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '16px', margin: '32px 0 28px' }}>
          {['Content', 'Rules', 'Share'].map((s, i) => (
            <div key={s} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '14px',
                fontWeight: 700,
                background: step === i + 1 ? '#7a545f' : step > i + 1 ? '#603d48' : 'rgba(237, 231, 227, 0.8)',
                color: step <= i + 1 && step !== i + 1 ? '#4f4447' : '#ffffff',
                boxShadow: step === i + 1 ? '0 4px 14px rgba(122, 84, 95, 0.35)' : 'none',
                transition: 'all 0.3s',
              }}>
                {step > i + 1 ? '✓' : i + 1}
              </div>
              <span style={{
                fontFamily: 'Manrope, sans-serif',
                fontSize: '14px',
                fontWeight: step === i + 1 ? 700 : 600,
                color: step === i + 1 ? '#7a545f' : '#4f4447',
                letterSpacing: '0.02em'
              }}>
                {s}
              </span>
              {i < 2 && (
                <div style={{
                  width: 40,
                  height: 2,
                  background: step > i + 1 ? '#7a545f' : 'rgba(122, 84, 95, 0.2)',
                  borderRadius: 2
                }} />
              )}
            </div>
          ))}
        </div>

        {/* Form Container */}
        <div className="lp-glass-card" style={{ padding: '40px', borderRadius: '32px' }}>

          {/* STEP 1: Content */}
          {step === 1 && (
            <div style={{ animation: 'slideUp 300ms ease' }}>
              <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: '24px', fontWeight: 600, color: '#1d1b19', marginBottom: '24px' }}>
                01 — What's in this capsule?
              </h3>

              <div className="form-group" style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontFamily: 'Manrope, sans-serif', fontWeight: 600, fontSize: '14px', color: '#1d1b19', marginBottom: '8px' }}>
                  Capsule Title
                </label>
                <input
                  className="form-input"
                  placeholder="Give it a meaningful name…"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
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
              </div>

              <div className="form-group" style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontFamily: 'Manrope, sans-serif', fontWeight: 600, fontSize: '14px', color: '#1d1b19', marginBottom: '12px' }}>
                  Content Type
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
                  {CONTENT_TYPES.map(({ key, icon, label }) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => { setContentType(key); setMediaFile(null); }}
                      style={{
                        padding: '16px 12px',
                        borderRadius: '20px',
                        border: contentType === key ? '2px solid #7a545f' : '1px solid rgba(122, 84, 95, 0.15)',
                        background: contentType === key ? 'rgba(122, 84, 95, 0.12)' : 'rgba(255, 255, 255, 0.65)',
                        color: contentType === key ? '#7a545f' : '#4f4447',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '8px',
                        cursor: 'pointer',
                        transition: 'all 0.25s',
                        boxShadow: contentType === key ? '0 4px 12px rgba(122, 84, 95, 0.15)' : 'none',
                      }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: '28px' }}>{icon}</span>
                      <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: '13px', fontWeight: 600 }}>{label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {contentType === 'text' ? (
                <div className="form-group" style={{ marginBottom: '28px' }}>
                  <label style={{ display: 'block', fontFamily: 'Manrope, sans-serif', fontWeight: 600, fontSize: '14px', color: '#1d1b19', marginBottom: '8px' }}>
                    Your Message
                  </label>
                  <textarea
                    rows={6}
                    placeholder="Write your memory, thought, or message…"
                    value={textContent}
                    onChange={e => setTextContent(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '14px 18px',
                      borderRadius: '16px',
                      border: '1px solid rgba(122, 84, 95, 0.22)',
                      background: 'rgba(255, 255, 255, 0.85)',
                      color: '#1d1b19',
                      fontFamily: 'Manrope, sans-serif',
                      fontSize: '15px',
                      lineHeight: '1.6',
                      outline: 'none',
                      resize: 'vertical',
                    }}
                  />
                </div>
              ) : (
                <div className="form-group" style={{ marginBottom: '28px', animation: 'fadeIn 0.3s ease' }}>
                  <div className="flex items-center justify-between" style={{ marginBottom: '8px' }}>
                    <label style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 600, fontSize: '14px', color: '#1d1b19' }}>Content</label>
                    <span style={{ fontSize: '12px', color: '#4f4447' }}>Upload or Record Live</span>
                  </div>

                  <div style={{ position: 'relative' }}>
                    {/* Recording/Capture UI */}
                    {(contentType === 'voice' || contentType === 'video' || contentType === 'image') && (
                      <div style={{ marginBottom: '16px' }}>
                        {recordingStatus === 'idle' ? (
                          <button
                            type="button"
                            className="lp-btn-outline"
                            style={{ width: '100%', padding: '24px', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyCenter: 'center', gap: '10px', marginTop: 0 }}
                            onClick={startCamera}
                          >
                            <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>
                              {contentType === 'voice' ? 'mic' : contentType === 'image' ? 'photo_camera' : 'videocam'}
                            </span>
                            <span>Enable {contentType === 'voice' ? 'Microphone' : 'Camera'}</span>
                          </button>
                        ) : (
                          <div style={{ padding: '20px', borderRadius: '20px', background: 'rgba(255, 255, 255, 0.8)', border: '1px solid rgba(122, 84, 95, 0.2)' }}>
                            <div className="flex items-center justify-between" style={{ marginBottom: '16px' }}>
                              <div className="flex items-center gap-2">
                                <div className={`record-dot ${isRecording ? 'pulse' : ''} ${recordingStatus === 'open' ? 'ready' : ''}`} />
                                <span style={{ fontWeight: 600, fontSize: '14px', color: '#1d1b19' }}>
                                  {recordingStatus === 'open' ? 'Ready' : isRecording ? 'Recording...' : 'Preview Capture'}
                                </span>
                              </div>
                              {(contentType === 'video' || contentType === 'voice') && (
                                <span style={{ fontFamily: 'monospace', fontSize: '14px', color: '#7a545f', fontWeight: 700 }}>{formatTime(recordTimer)}</span>
                              )}
                            </div>

                            {/* Live/Preview Displays */}
                            <div style={{ marginBottom: '16px', borderRadius: '14px', overflow: 'hidden', background: '#000' }}>
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
                                <audio controls src={recordedUrl} style={{ width: '100%', padding: '12px' }} />
                              )}
                              {contentType === 'voice' && (recordingStatus === 'recording' || recordingStatus === 'open') && (
                                <div style={{ height: 60, display: 'flex', alignItems: 'center', justifyCenter: 'center', color: '#fff' }}>
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
                                  <button type="button" className="lp-btn-outline" style={{ width: '100%', marginTop: 0 }} onClick={resetRecording}>Cancel</button>
                                  {contentType === 'image' ? (
                                    <button type="button" className="lp-btn-primary" style={{ width: '100%' }} onClick={takePhoto}>Take Photo</button>
                                  ) : (
                                    <button type="button" className="lp-btn-primary" style={{ width: '100%' }} onClick={startRecording}>Start Recording</button>
                                  )}
                                </>
                              ) : isRecording ? (
                                <button type="button" className="lp-btn-primary" style={{ width: '100%', background: '#ba1a1a' }} onClick={stopRecording}>Stop Recording</button>
                              ) : (
                                <>
                                  <button type="button" className="lp-btn-outline" style={{ width: '100%', marginTop: 0 }} onClick={resetRecording}>Retake</button>
                                  <button type="button" className="lp-btn-primary" style={{ width: '100%' }} onClick={() => toast.success('Captured! Ready to seal.')}>Keep This</button>
                                </>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Standard Dropzone */}
                    {recordingStatus === 'idle' && (
                      <div
                        {...getRootProps()}
                        style={{
                          border: '2px dashed rgba(122, 84, 95, 0.3)',
                          borderRadius: '20px',
                          padding: '32px 20px',
                          textAlign: 'center',
                          background: isDragActive ? 'rgba(122, 84, 95, 0.08)' : 'rgba(255, 255, 255, 0.5)',
                          cursor: 'pointer',
                          transition: 'all 0.25s',
                        }}
                      >
                        <input {...getInputProps()} />
                        {mediaFile ? (
                          <div>
                            <p style={{ fontWeight: 600, color: '#7a545f', marginBottom: '4px' }}>✅ {mediaFile.name}</p>
                            <p style={{ fontSize: '12px', color: '#4f4447' }}>{(mediaFile.size / 1024 / 1024).toFixed(2)} MB</p>
                            <button
                              type="button"
                              style={{ marginTop: '8px', border: 'none', background: 'none', color: '#ba1a1a', cursor: 'pointer', textDecoration: 'underline', fontSize: '12px' }}
                              onClick={(e) => { e.stopPropagation(); setMediaFile(null); }}
                            >
                              Remove & upload other
                            </button>
                          </div>
                        ) : (
                          <div>
                            <span className="material-symbols-outlined" style={{ fontSize: '36px', color: '#7a545f', marginBottom: '8px' }}>cloud_upload</span>
                            <p style={{ fontSize: '15px', fontWeight: 600, color: '#1d1b19', marginBottom: '4px' }}>Or Upload File</p>
                            <p style={{ fontSize: '13px', color: '#4f4447' }}>Drag & drop or click to choose</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

              <button type="button" className="lp-btn-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={() => setStep(2)}>
                Next: Set Rules <span className="material-symbols-outlined">arrow_forward</span>
              </button>
            </div>
          )}

          {/* STEP 2: Rules */}
          {step === 2 && (
            <div style={{ animation: 'slideUp 300ms ease' }}>
              <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: '24px', fontWeight: 600, color: '#1d1b19', marginBottom: '8px' }}>
                02 — Choose a Lifecycle Rule
              </h3>
              <p style={{ fontSize: '14px', color: '#4f4447', marginBottom: '24px' }}>
                Every capsule must follow one rule. This determines when and how it can be opened.
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '14px', marginBottom: '24px' }}>
                {RULES.map(({ key, icon, title: rTitle, desc }) => (
                  <div
                    key={key}
                    onClick={() => { setRuleType(key); setRuleValue(''); }}
                    style={{
                      padding: '20px',
                      borderRadius: '20px',
                      border: ruleType === key ? '2px solid #7a545f' : '1px solid rgba(122, 84, 95, 0.15)',
                      background: ruleType === key ? 'rgba(122, 84, 95, 0.1)' : 'rgba(255, 255, 255, 0.65)',
                      cursor: 'pointer',
                      transition: 'all 0.25s',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '14px',
                      boxShadow: ruleType === key ? '0 4px 12px rgba(122, 84, 95, 0.12)' : 'none',
                    }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '28px', color: '#7a545f', flexShrink: 0 }}>{icon}</span>
                    <div>
                      <p style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 600, fontSize: '15px', color: '#1d1b19', marginBottom: '4px' }}>{rTitle}</p>
                      <p style={{ fontSize: '12px', color: '#4f4447', lineHeight: '1.4' }}>{desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              {ruleType === 'unlockAt' && (
                <div className="form-group" style={{ marginBottom: '24px' }}>
                  <label style={{ display: 'block', fontFamily: 'Manrope, sans-serif', fontWeight: 600, fontSize: '14px', color: '#1d1b19', marginBottom: '8px' }}>Unlock Date & Time</label>
                  <input
                    type="datetime-local"
                    className="form-input"
                    min={minDate}
                    value={ruleValue}
                    onChange={e => setRuleValue(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '14px 18px',
                      borderRadius: '14px',
                      border: '1px solid rgba(122, 84, 95, 0.22)',
                      background: 'rgba(255, 255, 255, 0.85)',
                      color: '#1d1b19',
                      fontFamily: 'Manrope, sans-serif',
                      fontSize: '15px',
                    }}
                  />
                </div>
              )}

              {ruleType === 'expireAt' && (
                <div className="form-group" style={{ marginBottom: '24px' }}>
                  <label style={{ display: 'block', fontFamily: 'Manrope, sans-serif', fontWeight: 600, fontSize: '14px', color: '#1d1b19', marginBottom: '8px' }}>Expiry Date & Time</label>
                  <input
                    type="datetime-local"
                    className="form-input"
                    min={minDate}
                    value={ruleValue}
                    onChange={e => setRuleValue(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '14px 18px',
                      borderRadius: '14px',
                      border: '1px solid rgba(122, 84, 95, 0.22)',
                      background: 'rgba(255, 255, 255, 0.85)',
                      color: '#1d1b19',
                      fontFamily: 'Manrope, sans-serif',
                      fontSize: '15px',
                    }}
                  />
                </div>
              )}

              {ruleType === 'destroyAfterView' && (
                <div style={{ padding: '16px 20px', background: 'rgba(186, 26, 26, 0.08)', borderRadius: '16px', marginBottom: '24px', border: '1px solid rgba(186, 26, 26, 0.2)' }}>
                  <p style={{ fontSize: '14px', color: '#ba1a1a', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>warning</span>
                    This capsule will be permanently destroyed the moment it's opened. This cannot be undone.
                  </p>
                </div>
              )}

              {ruleType === 'eventName' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
                  <div className="form-group">
                    <label style={{ display: 'block', fontFamily: 'Manrope, sans-serif', fontWeight: 600, fontSize: '14px', color: '#1d1b19', marginBottom: '8px' }}>Event Name</label>
                    <input
                      className="form-input"
                      placeholder="e.g. GRADUATION, BIRTHDAY, NEW_JOB…"
                      value={eventName}
                      onChange={(e) => setEventName(e.target.value.toUpperCase())}
                      id="event-name-input"
                      style={{
                        width: '100%',
                        padding: '14px 18px',
                        borderRadius: '14px',
                        border: '1px solid rgba(122, 84, 95, 0.22)',
                        background: 'rgba(255, 255, 255, 0.85)',
                        color: '#1d1b19',
                        fontFamily: 'Manrope, sans-serif',
                        fontSize: '15px',
                      }}
                    />
                    <p style={{ fontSize: '12px', color: '#4f4447', marginTop: '6px' }}>You can manually trigger this capsule anytime from your vault.</p>
                  </div>
                  <div className="form-group">
                    <label style={{ display: 'block', fontFamily: 'Manrope, sans-serif', fontWeight: 600, fontSize: '14px', color: '#1d1b19', marginBottom: '8px' }}>
                      Auto-trigger Date <span style={{ opacity: 0.6, fontWeight: 400 }}>(optional)</span>
                    </label>
                    <input
                      type="datetime-local"
                      className="form-input"
                      min={minDate}
                      value={eventTriggerDate}
                      onChange={(e) => setEventTriggerDate(e.target.value)}
                      id="event-trigger-date-input"
                      style={{
                        width: '100%',
                        padding: '14px 18px',
                        borderRadius: '14px',
                        border: '1px solid rgba(122, 84, 95, 0.22)',
                        background: 'rgba(255, 255, 255, 0.85)',
                        color: '#1d1b19',
                        fontFamily: 'Manrope, sans-serif',
                        fontSize: '15px',
                      }}
                    />
                    <p style={{ fontSize: '12px', color: '#4f4447', marginTop: '6px' }}>If set, capsule auto-unlocks on this date even if you haven't triggered it manually.</p>
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                <button type="button" className="lp-btn-outline" style={{ marginTop: 0 }} onClick={() => setStep(1)}>
                  <span className="material-symbols-outlined">arrow_back</span> Back
                </button>
                <button type="button" className="lp-btn-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={() => validateRule() && setStep(3)}>
                  Next: Share Options <span className="material-symbols-outlined">arrow_forward</span>
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Share */}
          {step === 3 && (
            <div style={{ animation: 'slideUp 300ms ease' }}>
              <h3 style={{ fontFamily: 'Playfair Display, serif', fontSize: '24px', fontWeight: 600, color: '#1d1b19', marginBottom: '8px' }}>
                03 — Who gets this capsule?
              </h3>
              <p style={{ fontSize: '14px', color: '#4f4447', marginBottom: '24px' }}>
                Keep it in your personal vault, or send it to a friend.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '28px' }}>
                <div
                  onClick={() => { setRecipientId(''); setRecipientName(''); }}
                  style={{
                    padding: '20px',
                    borderRadius: '20px',
                    border: !recipientId ? '2px solid #7a545f' : '1px solid rgba(122, 84, 95, 0.15)',
                    background: !recipientId ? 'rgba(122, 84, 95, 0.1)' : 'rgba(255, 255, 255, 0.65)',
                    cursor: 'pointer',
                    transition: 'all 0.25s',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px',
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '32px', color: '#7a545f' }}>inventory_2</span>
                  <div>
                    <p style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 600, fontSize: '16px', color: '#1d1b19', marginBottom: '2px' }}>Keep in my vault</p>
                    <p style={{ fontSize: '13px', color: '#4f4447', margin: 0 }}>Private, only accessible by you.</p>
                  </div>
                </div>

                <div
                  onClick={() => setShowFriendPicker(true)}
                  style={{
                    padding: '20px',
                    borderRadius: '20px',
                    border: recipientId ? '2px solid #7a545f' : '1px solid rgba(122, 84, 95, 0.15)',
                    background: recipientId ? 'rgba(122, 84, 95, 0.1)' : 'rgba(255, 255, 255, 0.65)',
                    cursor: 'pointer',
                    transition: 'all 0.25s',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px',
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '32px', color: '#7a545f' }}>send</span>
                  <div>
                    <p style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 600, fontSize: '16px', color: '#1d1b19', marginBottom: '2px' }}>
                      Send to a friend {recipientId && <span style={{ color: '#7a545f', fontWeight: 700 }}>→ {recipientName}</span>}
                    </p>
                    <p style={{ fontSize: '13px', color: '#4f4447', margin: 0 }}>Delivered to their received capsules.</p>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button type="button" className="lp-btn-outline" style={{ marginTop: 0 }} onClick={() => setStep(2)}>
                  <span className="material-symbols-outlined">arrow_back</span> Back
                </button>
                <button type="button" className="lp-btn-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={handleSubmit} disabled={loading}>
                  {loading ? <>Sealing capsule…</> : <>Seal & Save <span className="material-symbols-outlined">lock</span></>}
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

      {/* Success Animation Overlay */}
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
