import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTerminal } from '../hooks/useTerminal';
import TopBar from '../components/TopBar';
import TerminalLine from '../components/TerminalLine';
import InputRow from '../components/InputRow';
import StatusBar from '../components/StatusBar';

const LandingPage = () => {
  const [isTerminalMode, setIsTerminalMode] = useState(false);
  const navigate = useNavigate();
  
  // Terminal Logic
  const { lines, auth, user, createStep, busy, run, exitRequested, resetExit, loginTime } = useTerminal();
  const terminalEndRef = useRef(null);

  // Close terminal when exit command is typed
  useEffect(() => {
    if (exitRequested) {
      setIsTerminalMode(false);
      resetExit();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exitRequested]);

  useEffect(() => {
    if (isTerminalMode && terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [lines, isTerminalMode]);

  if (isTerminalMode) {
    return (
      <div 
        className="terminal-theme-wrapper"
        style={{ animation: 'flicker 12s ease-in-out infinite' }}
      >
        <div className="terminal-container">
          <TopBar auth={auth} user={user} />
          
          <div 
            className="terminal-lines-area"
            style={{ padding: '16px 20px', boxShadow: 'inset 0 0 60px #00ff9f08' }}
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
            <div ref={terminalEndRef} />
          </div>

          <InputRow auth={auth} user={user} busy={busy} onSubmit={run} />
          <StatusBar createStep={createStep} busy={busy} auth={auth} user={user} loginTime={loginTime} />
        </div>
      </div>
    );
  }

  return (
    <div className="landing-page">
      <button 
        className="btn btn-secondary theme-toggle-btn"
        onClick={() => setIsTerminalMode(true)}
      >
        Terminal Mode
      </button>

      <div className="container landing-hero">
        <h1 className="hero-title">Preserve Your Legacy in the Memory Capsule</h1>
        <p className="hero-subtitle">
          Seal messages, images, and voice notes for the future. Unlock them when the time is right, or let them vanish gracefully into the void.
        </p>
        <div className="hero-actions">
          <button className="btn btn-primary btn-lg" onClick={() => navigate('/register')}>
            Start Creating
          </button>
          <button className="btn btn-secondary btn-lg" onClick={() => navigate('/login')}>
            Sign In
          </button>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
