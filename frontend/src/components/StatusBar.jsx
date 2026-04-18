import React, { useState, useEffect } from 'react';

const STEP_LABELS = {
  0: '',
  1: 'Step 1/3 — Select type: text / image / audio / video',
  2: 'Step 2/3 — Enter content or description',
  3: 'Step 3/3 — Select rule: 1) time  2) one-view  3) 7-day expiry',
};

function formatDuration(loginTime) {
  if (!loginTime) return null;
  const diff = Math.floor((Date.now() - loginTime.getTime()) / 1000);
  const h = Math.floor(diff / 3600);
  const m = Math.floor((diff % 3600) / 60);
  const s = diff % 60;
  if (h > 0) return `${h}h ${m}m ${s}s`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

export default function StatusBar({ createStep, busy, auth, user, loginTime }) {
  const stepHint = STEP_LABELS[createStep] || '';
  const [tick, setTick] = useState(0);

  // Re-render every second to update the session duration live
  useEffect(() => {
    if (!auth || !loginTime) return;
    const id = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(id);
  }, [auth, loginTime]);

  const duration = formatDuration(loginTime);

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '4px 16px',
      borderTop: '1px solid #00ff9f11',
      background: '#000',
      flexShrink: 0,
      userSelect: 'none',
      minHeight: '26px',
      gap: '12px',
    }}>
      {/* Left: wizard step hint */}
      <span style={{
        fontFamily: "'Share Tech Mono', monospace",
        fontSize: '11px',
        color: createStep > 0 ? '#ffb800' : '#00ff9f33',
        flexShrink: 0,
      }}>
        {stepHint || '// VAULT.OS  ready'}
      </span>

      {/* Centre: session info */}
      <span style={{
        fontFamily: "'Share Tech Mono', monospace",
        fontSize: '11px',
        color: auth ? '#00ff9f88' : '#ff3c6e55',
        textAlign: 'center',
        flex: 1,
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
      }}>
        {auth && user
          ? `● SESSION  user:${user}  login:${loginTime ? loginTime.toLocaleTimeString() : '--'}  uptime:${duration}`
          : '○ NOT AUTHENTICATED  —  type  login <username>  to begin'}
      </span>

      {/* Right: busy / idle */}
      <span style={{
        fontFamily: "'Share Tech Mono', monospace",
        fontSize: '11px',
        color: busy ? '#ffb800' : '#00ff9f33',
        display: 'flex',
        alignItems: 'center',
        gap: '5px',
        flexShrink: 0,
      }}>
        {busy && (
          <span style={{
            width: 5,
            height: 5,
            borderRadius: '50%',
            background: '#ffb800',
            display: 'inline-block',
            animation: 'pulseGlow 1s ease-in-out infinite',
          }} />
        )}
        {busy ? 'processing...' : 'idle'}
      </span>
    </div>
  );
}