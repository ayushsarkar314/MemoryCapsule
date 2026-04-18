import React from 'react';

const STEP_LABELS = {
  0: '',
  1: 'Step 1/3 — Select type: text / image / audio / video',
  2: 'Step 2/3 — Enter content or description',
  3: 'Step 3/3 — Select rule: 1) time  2) one-view  3) 7-day expiry',
};

export default function StatusBar({ createStep, busy }) {
  const stepHint = STEP_LABELS[createStep] || '';

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '5px 16px',
      borderTop: '1px solid #00ff9f11',
      background: '#000',
      flexShrink: 0,
      userSelect: 'none',
      minHeight: '26px',
    }}>
      {/* Left: wizard hint */}
      <span style={{
        fontFamily: "'Share Tech Mono', monospace",
        fontSize: '11px',
        color: createStep > 0 ? '#ffb800' : '#00ff9f33',
        transition: 'color 0.2s',
      }}>
        {stepHint || '// VAULT.OS  ready'}
      </span>

      {/* Right: busy indicator */}
      <span style={{
        fontFamily: "'Share Tech Mono', monospace",
        fontSize: '11px',
        color: busy ? '#ffb800' : '#00ff9f33',
        display: 'flex',
        alignItems: 'center',
        gap: '5px',
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