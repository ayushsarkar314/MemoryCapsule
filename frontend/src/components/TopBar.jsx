import React, { useState, useEffect } from 'react';

export default function TopBar({ auth, user }) {
  const [time, setTime] = useState('');

  useEffect(() => {
    const tick = () => {
      const n = new Date();
      const t = n.toLocaleTimeString('en-GB');
      const d = n.toLocaleDateString('en-GB');
      setTime(`${t}  //  ${d}`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '8px 16px',
      borderBottom: '1px solid #00ff9f1a',
      background: '#000',
      flexShrink: 0,
      userSelect: 'none',
    }}>
      {/* Window dots */}
      <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
        <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#ff3c6e', display: 'inline-block' }} />
        <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#ffb800', display: 'inline-block' }} />
        <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#00ff9f', display: 'inline-block' }} />
      </div>

      {/* Title */}
      <div style={{
        fontFamily: "'Orbitron', monospace",
        fontSize: '11px',
        letterSpacing: '3px',
        color: '#00ccff',
        textTransform: 'uppercase',
      }}>
        VAULT.OS v2.0
        {auth && user && (
          <span style={{ color: '#00ff9f55', marginLeft: '16px' }}>
            // {user.toUpperCase()}
          </span>
        )}
      </div>

      {/* Clock + status */}
      <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
        <span style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '5px',
          fontSize: '11px',
          color: auth ? '#00ff9f' : '#ff3c6e',
          fontFamily: "'Share Tech Mono', monospace",
        }}>
          <span style={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            background: auth ? '#00ff9f' : '#ff3c6e',
            display: 'inline-block',
            animation: 'pulseGlow 2s ease-in-out infinite',
          }} />
          {auth ? 'VAULT OPEN' : 'LOCKED'}
        </span>
        <span style={{
          fontSize: '11px',
          color: '#00ff9f44',
          fontFamily: "'Share Tech Mono', monospace",
        }}>
          {time}
        </span>
      </div>
    </div>
  );
}