import React, { useState, useRef } from 'react';

export default function InputRow({ auth, user, busy, onSubmit }) {
  const [value, setValue]     = useState('');
  const [history, setHistory] = useState([]);
  const [histIdx, setHistIdx] = useState(-1);
  const inputRef              = useRef(null);

  const prompt = auth && user
    ? `vault@${user}:~$`
    : 'vault@ghost:~$';

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      const cmd = value.trim();
      if (cmd) {
        setHistory(prev => [cmd, ...prev]);
        setHistIdx(-1);
        onSubmit(cmd);
        setValue('');
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const next = Math.min(histIdx + 1, history.length - 1);
      setHistIdx(next);
      setValue(history[next] || '');
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      const next = Math.max(histIdx - 1, -1);
      setHistIdx(next);
      setValue(next === -1 ? '' : history[next]);
    } else if (e.key === 'Tab') {
      e.preventDefault();
      // Simple tab-complete for common commands
      const completions = [
        'help', 'login ', 'list capsules', 'open capsule ',
        'create capsule', 'ghostwall', 'send capsule ',
        'status capsule ', 'vault stats', 'whoami', 'logout', 'clear',
      ];
      const match = completions.find(c => c.startsWith(value) && c !== value);
      if (match) setValue(match);
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        padding: '10px 16px',
        borderTop: '1px solid #00ff9f22',
        background: '#000',
        flexShrink: 0,
        cursor: 'text',
      }}
      onClick={() => inputRef.current?.focus()}
    >
      <span style={{
        fontFamily: "'Share Tech Mono', monospace",
        fontSize: '13px',
        color: '#00ff9f88',
        whiteSpace: 'nowrap',
        userSelect: 'none',
      }}>
        {prompt}
      </span>

      <input
        ref={inputRef}
        autoFocus
        value={value}
        onChange={e => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={busy}
        spellCheck={false}
        autoComplete="off"
        autoCorrect="off"
        placeholder={busy ? '' : "type a command..."}
        style={{
          flex: 1,
          background: 'transparent',
          border: 'none',
          outline: 'none',
          color: '#00ff9f',
          fontFamily: "'Share Tech Mono', monospace",
          fontSize: '13px',
          caretColor: '#00ff9f',
          opacity: busy ? 0.4 : 1,
        }}
      />

      {/* Blinking cursor when busy */}
      {busy && (
        <span style={{
          width: '8px',
          height: '14px',
          background: '#00ff9f',
          display: 'inline-block',
          animation: 'blink 1s step-end infinite',
          opacity: 0.7,
        }} />
      )}
    </div>
  );
}