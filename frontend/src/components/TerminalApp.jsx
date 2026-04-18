import React, { useEffect, useRef } from 'react';
import '../index.css';
import { useTerminal } from '../hooks/useTerminal';
import TopBar from './TopBar';
import TerminalLine from './TerminalLine';
import InputRow from './InputRow';
import StatusBar from './StatusBar';

export default function TerminalApp({ onExit }) {
  const { lines, auth, user, createStep, busy, run, exitRequested, resetExit, loginTime } = useTerminal();
  const screenRef = useRef(null);

  // Trigger onExit callback when exit command is typed
  useEffect(() => {
    if (exitRequested && onExit) {
      resetExit();
      onExit();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exitRequested]);

  useEffect(() => {
    if (screenRef.current) {
      screenRef.current.scrollTop = screenRef.current.scrollHeight;
    }
  }, [lines]);

  return (
    <div className="terminal-theme-wrapper" style={{ height: "100vh", background: "#000", animation: 'flicker 12s ease-in-out infinite', display: 'flex', flexDirection: 'column' }}>
      <TopBar auth={auth} user={user} />

      <div 
        ref={screenRef} 
        style={{ flex: 1, overflowY: "auto", padding: '16px 20px', boxShadow: 'inset 0 0 60px #00ff9f08' }}
        onClick={() => document.querySelector('input')?.focus()}
      >
        {lines.map((l) => (
          <TerminalLine key={l.id} text={l.text} type={l.type} />
        ))}
        {!busy && (
          <span style={{
            display: 'inline-block',
            width: '8px',
            height: '13px',
            background: '#00ff9f',
            verticalAlign: 'text-bottom',
            marginLeft: '2px',
            animation: 'blink 1s step-end infinite',
            opacity: 0.8,
          }} />
        )}
      </div>

      <InputRow auth={auth} user={user} busy={busy} onSubmit={run} />
      <StatusBar createStep={createStep} busy={busy} auth={auth} user={user} loginTime={loginTime} />
    </div>
  );
}