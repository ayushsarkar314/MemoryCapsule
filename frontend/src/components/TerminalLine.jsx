import React from 'react';

// ── COLOR MAP ────────────────────────────────────────────────
const COLOR = {
  green:  '#00ff9f',
  cyan:   '#00ccff',
  pink:   '#ff3c6e',
  amber:  '#ffb800',
  purple: '#cc44ff',
  white:  '#e0e0e0',
  dim:    '#ffffff22',
  muted:  '#555555',
  cmd:    null, // handled specially
  text:   '#c8ffd4',
  empty:  'transparent',
  progress: '#00ccff',
};

const styles = {
  base: {
    fontFamily: "'Share Tech Mono', monospace",
    fontSize: '13px',
    lineHeight: '1.75',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-all',
    animation: 'slideIn 0.08s ease-out both',
    minHeight: '1.75em',
  },
};

export default function TerminalLine({ text, type }) {
  if (type === 'empty') {
    return <div style={{ ...styles.base, minHeight: '0.6em' }} />;
  }

  if (type === 'progress') {
    return (
      <div style={{ ...styles.base, color: COLOR.cyan }}>
        {text || ''}
      </div>
    );
  }

  if (type === 'cmd') {
    // "vault@user:~$ command" — colour the prompt dim, command bright
    const dollar = text.indexOf('$ ');
    if (dollar !== -1) {
      const promptPart  = text.slice(0, dollar + 2);
      const commandPart = text.slice(dollar + 2);
      return (
        <div style={{ ...styles.base }}>
          <span style={{ color: '#00ff9f55' }}>{promptPart}</span>
          <span style={{ color: COLOR.green }}>{commandPart}</span>
        </div>
      );
    }
  }

  return (
    <div style={{ ...styles.base, color: COLOR[type] || COLOR.white }}>
      {text}
    </div>
  );
}