import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import './HowItWorksPage.css';

/* ─── WebGL Shader Background ────────────────────────────────── */
function ShaderBackground() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const gl = canvas.getContext('webgl');
    if (!gl) return;

    const vsSource = `
      attribute vec4 aVertexPosition;
      varying vec2 v_texCoord;
      void main() {
        gl_Position = aVertexPosition;
        v_texCoord = aVertexPosition.xy * 0.5 + 0.5;
      }
    `;

    const fsSource = `
      precision highp float;
      varying vec2 v_texCoord;
      uniform float u_time;
      uniform vec2 u_resolution;

      void main() {
        vec2 uv = v_texCoord;
        float movement  = sin(uv.x * 2.5 + u_time * 0.4) * cos(uv.y * 1.5 - u_time * 0.3);
        float movement2 = sin(uv.y * 3.5 + u_time * 0.3) * cos(uv.x * 4.5 - u_time * 0.2);
        vec3 deepPlum   = vec3(0.20, 0.10, 0.25);
        vec3 softPurple = vec3(0.58, 0.44, 0.65);
        vec3 vividPurple= vec3(0.45, 0.25, 0.55);
        vec3 creamGlow  = vec3(0.99, 0.97, 0.95);
        vec3 color = mix(deepPlum, softPurple, uv.y + movement * 0.3);
        color = mix(color, vividPurple, uv.x + movement2 * 0.2);
        float glow = 1.0 - length(uv - vec2(0.8, 0.9));
        color += creamGlow * pow(max(0.0, glow), 3.5) * 0.4;
        float grain = fract(sin(dot(uv + u_time * 0.01, vec2(12.9898, 78.233))) * 43758.5453);
        color += (grain - 0.5) * 0.015;
        gl_FragColor = vec4(color, 1.0);
      }
    `;

    function compileShader(gl, type, source) {
      const shader = gl.createShader(type);
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      return shader;
    }

    const vertexShader   = compileShader(gl, gl.VERTEX_SHADER, vsSource);
    const fragmentShader = compileShader(gl, gl.FRAGMENT_SHADER, fsSource);
    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    gl.useProgram(program);

    const posLoc = gl.getAttribLocation(program, 'aVertexPosition');
    const resLoc = gl.getUniformLocation(program, 'u_resolution');
    const timeLoc = gl.getUniformLocation(program, 'u_time');

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
      -1, -1,  1, -1,  -1, 1,
      -1,  1,  1, -1,   1, 1,
    ]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(posLoc);
    gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

    let rafId;
    function render(time) {
      time *= 0.001;
      const dw = canvas.clientWidth;
      const dh = canvas.clientHeight;
      if (canvas.width !== dw || canvas.height !== dh) {
        canvas.width = dw;
        canvas.height = dh;
      }
      gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
      gl.uniform2f(resLoc, gl.canvas.width, gl.canvas.height);
      gl.uniform1f(timeLoc, time);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
      rafId = requestAnimationFrame(render);
    }
    rafId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(rafId);
  }, []);

  return <canvas ref={canvasRef} className="hiw-shader-canvas" />;
}

/* ─── Countdown Clock display ─────────────────────────────── */
function CountdownDisplay({ days = 142 }) {
  return (
    <div className="hiw-countdown-chip">
      <span className="material-symbols-outlined hiw-countdown-icon">hourglass_empty</span>
      <span className="hiw-countdown-text">Opens in {days} days</span>
    </div>
  );
}

/* ─── Main Page ───────────────────────────────────────────── */
export default function HowItWorksPage() {
  const orbitRef = useRef(null);

  useEffect(() => {
    /* Scroll reveal */
    const reveals = document.querySelectorAll('.hiw-reveal');
    const onScroll = () => {
      const vh = window.innerHeight;
      reveals.forEach(el => {
        if (el.getBoundingClientRect().top < vh - 80) {
          el.classList.add('hiw-reveal--active');
        }
      });
    };
    window.addEventListener('scroll', onScroll);
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div className="hiw-root">
      {/* Fixed WebGL Shader background */}
      <div className="hiw-bg">
        <ShaderBackground />
        <div className="hiw-bg-overlay" />
      </div>

      {/* ── TopBar ── */}
      <header className="hiw-header">
        <div className="hiw-header-inner">
          <Link to="/" className="hiw-brand">Memory Capsule</Link>
          <nav className="hiw-nav">
            <Link to="/" className="hiw-nav-link">Home</Link>
            <span className="hiw-nav-link hiw-nav-link--active">How It Works</span>
            <Link to="/ghost" className="hiw-nav-link">Ghost Wall</Link>
          </nav>
          <Link to="/login" className="hiw-cta-btn">Create a Capsule</Link>
          <button className="hiw-mobile-menu">
            <span className="material-symbols-outlined">menu</span>
          </button>
        </div>
      </header>

      <main className="hiw-main">
        {/* ── Hero ── */}
        <section className="hiw-hero hiw-reveal hiw-reveal--active">
          <div className="hiw-hero-bg-tint" />
          <h1 className="hiw-hero-heading">How Memory Capsule works.</h1>
          <p className="hiw-hero-sub">Create it. Seal it. Give it a moment. Let time take care of the rest.</p>
          {/* Glowing Capsule */}
          <div className="hiw-capsule-wrap">
            <div className="hiw-capsule-glow" />
            <div className="hiw-capsule-panel hiw-glass-panel">
              <span className="material-symbols-outlined hiw-capsule-icon" style={{ fontVariationSettings: "'FILL' 1" }}>lock_clock</span>
            </div>
          </div>
          {/* Timeline strip */}
          <div className="hiw-timeline-strip">
            {['CREATE', 'SEALED', 'WAITING', 'UNLOCKED', 'EXPERIENCED', 'DISAPPEARS'].map((step, i, arr) => (
              <span key={step} className="hiw-timeline-item">
                <span className="hiw-timeline-label">{step}</span>
                {i < arr.length - 1 && (
                  <span className="material-symbols-outlined hiw-timeline-arrow">arrow_right_alt</span>
                )}
              </span>
            ))}
          </div>
        </section>

        {/* ── 01 Create ── */}
        <section className="hiw-section hiw-reveal">
          <h2 className="hiw-section-heading">01 — Create a memory</h2>
          <div className="hiw-create-grid">
            {/* Media type tiles */}
            <div className="hiw-media-tiles">
              {[
                { icon: 'subject', label: 'TEXT' },
                { icon: 'image', label: 'IMAGE' },
                { icon: 'mic', label: 'VOICE' },
                { icon: 'videocam', label: 'VIDEO' },
              ].map(m => (
                <div key={m.label} className="hiw-media-tile hiw-glass-panel">
                  <span className="material-symbols-outlined hiw-media-icon" style={{ fontVariationSettings: "'FILL' 1" }}>{m.icon}</span>
                  <span className="hiw-media-label">{m.label}</span>
                </div>
              ))}
            </div>
            {/* UI Preview */}
            <div className="hiw-compose-preview hiw-glass-panel">
              <div className="hiw-compose-glow" />
              <div className="hiw-compose-fields">
                <div className="hiw-compose-field">
                  <input
                    className="hiw-compose-input hiw-compose-title"
                    defaultValue="Letter to my future self"
                    readOnly
                    placeholder="Title your capsule..."
                  />
                </div>
                <div className="hiw-compose-field">
                  <textarea
                    className="hiw-compose-input"
                    defaultValue="I hope when you read this, you finally took that trip to Kyoto..."
                    readOnly
                    rows={3}
                    placeholder="Write your memory here..."
                  />
                </div>
                <div className="hiw-compose-photo">
                  <img
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuCaXC6rjXHUFmr0zCRWnrQf8KDrXl0LSgFIwL--kWjne25UorUGPZO-qdHXU0BdARXtFotuFYAZJv_3sDA_afXxG0HAUSkfZwtMZqcrEj8GcqcOCnaLyPRtuZ55PzzbRpT-x8_MK5BraracccqlSz36LiqhT7rWEXOEwSfPZRgVMJufVFnDBwvNhjLCBkXkVd-9og-TVdo1STegUrfFR4hsDh5m10TgAfnsl4b_sS8dWcVEX9QxVVoU"
                    alt="Cherry blossoms"
                    className="hiw-compose-photo-img"
                  />
                  <div className="hiw-compose-play hiw-glass-panel">
                    <span className="material-symbols-outlined">play_arrow</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── 02 Choose Fate ── */}
        <section className="hiw-section hiw-section--border hiw-reveal">
          <div className="hiw-section-center-head">
            <h2 className="hiw-section-heading">02 — Choose its fate</h2>
            <p className="hiw-section-sub">You decide when the memory can be experienced.</p>
          </div>
          <div className="hiw-fate-grid">
            <div className="hiw-fate-card hiw-glass-panel">
              <div className="hiw-fate-glow hiw-fate-glow--primary" />
              <span className="material-symbols-outlined hiw-fate-icon hiw-fate-icon--primary" style={{ fontVariationSettings: "'FILL' 1" }}>calendar_clock</span>
              <h3 className="hiw-fate-title hiw-fate-title--primary">Future Unlock</h3>
              <p className="hiw-fate-desc">Set a specific date in the future when this capsule will open.</p>
              <div className="hiw-fate-badge">Locked until Feb 14, 2030</div>
            </div>
            <div className="hiw-fate-card hiw-glass-panel">
              <div className="hiw-fate-glow hiw-fate-glow--tertiary" />
              <span className="material-symbols-outlined hiw-fate-icon hiw-fate-icon--tertiary" style={{ fontVariationSettings: "'FILL' 1" }}>visibility_off</span>
              <h3 className="hiw-fate-title hiw-fate-title--tertiary">One-Time View</h3>
              <p className="hiw-fate-desc">Can only be opened once. After it is closed, it disappears forever.</p>
              <div className="hiw-fate-flow">
                <span>Sealed</span>
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>arrow_right_alt</span>
                <span>Opened</span>
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>arrow_right_alt</span>
                <span className="hiw-fate-destroyed">Destroyed</span>
              </div>
            </div>
            <div className="hiw-fate-card hiw-glass-panel">
              <div className="hiw-fate-glow hiw-fate-glow--secondary" />
              <span className="material-symbols-outlined hiw-fate-icon hiw-fate-icon--secondary" style={{ fontVariationSettings: "'FILL' 1" }}>hourglass_bottom</span>
              <h3 className="hiw-fate-title hiw-fate-title--secondary">Time Limited</h3>
              <p className="hiw-fate-desc">Remains open for a set duration, then vanishes into the void.</p>
              <div className="hiw-fate-flow">
                <span>7 Days</span>
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>arrow_right_alt</span>
                <span className="hiw-fate-expired">Expired</span>
              </div>
            </div>
          </div>
        </section>

        {/* ── 03 Keep or Send ── */}
        <section className="hiw-section hiw-reveal">
          <div className="hiw-send-grid">
            <div>
              <h2 className="hiw-section-heading">03 — Keep it or send it</h2>
              <p className="hiw-section-sub hiw-send-sub">Some memories are just for you. Others are meant for someone else.</p>
              <div className="hiw-vault-preview hiw-glass-panel">
                <div className="hiw-vault-header">
                  <h3 className="hiw-vault-title">MY VAULT</h3>
                  <div className="hiw-vault-tabs">
                    <span className="hiw-vault-tab hiw-vault-tab--active">All</span>
                    <span className="hiw-vault-tab">Locked</span>
                    <span className="hiw-vault-tab">Unlocked</span>
                  </div>
                </div>
                <div className="hiw-vault-items">
                  <div className="hiw-vault-item">
                    <div className="hiw-vault-item-icon hiw-vault-item-icon--locked">
                      <span className="material-symbols-outlined">lock</span>
                    </div>
                    <div>
                      <div className="hiw-vault-item-title">To myself in 5 years</div>
                      <div className="hiw-vault-item-sub">Unlocks 2029</div>
                    </div>
                  </div>
                  <div className="hiw-vault-item">
                    <div className="hiw-vault-item-icon hiw-vault-item-icon--open">
                      <span className="material-symbols-outlined">lock_open</span>
                    </div>
                    <div>
                      <div className="hiw-vault-item-title">Graduation Day</div>
                      <div className="hiw-vault-item-sub">Unlocked yesterday</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="hiw-send-card-wrap">
              <div className="hiw-send-card-glow" />
              <div className="hiw-send-card hiw-glass-panel">
                <div className="hiw-send-icon-wrap">
                  <span className="material-symbols-outlined hiw-send-icon" style={{ fontVariationSettings: "'FILL' 1" }}>mail</span>
                </div>
                <h3 className="hiw-send-title">SEND TO A FRIEND</h3>
                <p className="hiw-send-desc">Send this memory to a specific person's vault.</p>
                <div className="hiw-send-form">
                  <div className="hiw-send-label">To</div>
                  <div className="hiw-send-recipient">Maya</div>
                  <div className="hiw-send-footer">
                    <span className="hiw-send-status">
                      <span className="material-symbols-outlined" style={{ fontSize: 18 }}>lock_clock</span> Status: Sealed
                    </span>
                    <button className="hiw-send-btn">Send</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── 04 Wait ── */}
        <section className="hiw-wait-section hiw-reveal">
          <div className="hiw-wait-bg" />
          <h2 className="hiw-wait-heading">04 — Then, you wait.</h2>
          <div className="hiw-wait-orb" ref={orbitRef}>
            <div className="hiw-wait-orb-glow" />
            <div className="hiw-wait-orb-inner">
              <span className="material-symbols-outlined hiw-wait-lock" style={{ fontVariationSettings: "'FILL' 1" }}>lock</span>
            </div>
            <div className="hiw-wait-orbit">
              <div className="hiw-wait-dot" />
            </div>
          </div>
          <CountdownDisplay days={142} />
        </section>

        {/* ── 05 Lifecycle ── */}
        <section className="hiw-section hiw-reveal">
          <div className="hiw-section-center-head">
            <h2 className="hiw-section-heading">05 — Automatic Lifecycle</h2>
            <p className="hiw-section-sub">Your capsule follows the rules you gave it.</p>
          </div>
          {/* Progress Bar */}
          <div className="hiw-lifecycle-bar hiw-glass-panel">
            {[
              { label: 'CREATED', active: true },
              { label: 'SEALED', active: true },
              { label: 'WAITING', active: true, current: true },
              { label: 'UNLOCKED', active: false },
              { label: 'VIEWED', active: false },
              { label: 'EXPIRED', active: false },
            ].map((s) => (
              <div key={s.label} className={`hiw-lc-step ${s.current ? 'hiw-lc-step--current' : ''} ${!s.active ? 'hiw-lc-step--inactive' : ''}`}>
                <div className={`hiw-lc-dot ${s.current ? 'hiw-lc-dot--current' : s.active ? 'hiw-lc-dot--done' : 'hiw-lc-dot--pending'}`}>
                  {s.current && <div className="hiw-lc-dot-ping" />}
                </div>
                <span className="hiw-lc-label">{s.label}</span>
              </div>
            ))}
          </div>
          {/* Feature Cards */}
          <div className="hiw-lc-cards">
            {[
              { icon: 'event_available', color: 'primary', title: 'Scheduled Unlock', desc: 'Capsules open automatically on the exact date and time specified.' },
              { icon: 'visibility_off', color: 'tertiary', title: 'One-Time View', desc: 'Self-destructs immediately after the recipient closes it.' },
              { icon: 'timer', color: 'secondary', title: 'Auto-Expiry', desc: 'Memories fade away after their designated timeframe ends.' },
              { icon: 'delete_sweep', color: 'muted', title: 'Automatic Cleanup', desc: 'Expired capsules are securely deleted from our servers, leaving no trace.' },
            ].map(c => (
              <div key={c.title} className="hiw-lc-card">
                <span className={`material-symbols-outlined hiw-lc-card-icon hiw-lc-card-icon--${c.color}`}>{c.icon}</span>
                <h4 className="hiw-lc-card-title">{c.title}</h4>
                <p className="hiw-lc-card-desc">{c.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── 06 The Moment Arrives ── */}
        <section className="hiw-section hiw-moment-section hiw-reveal">
          <div className="hiw-section-center-head">
            <h2 className="hiw-section-heading">06 — The moment arrives.</h2>
          </div>
          <div className="hiw-unlock-flow">
            <div className="hiw-unlock-step hiw-unlock-step--locked">
              <div className="hiw-unlock-orb">
                <span className="material-symbols-outlined">lock</span>
              </div>
              <span className="hiw-unlock-label">LOCKED</span>
            </div>
            <span className="material-symbols-outlined hiw-unlock-arrow">arrow_forward</span>
            <div className="hiw-unlock-step hiw-unlock-step--notif">
              <div className="hiw-unlock-orb hiw-unlock-orb--notif">
                <div className="hiw-unlock-ping" />
                <span className="material-symbols-outlined">notifications_active</span>
              </div>
              <span className="hiw-unlock-label hiw-unlock-label--notif">TIME REACHED</span>
            </div>
            <span className="material-symbols-outlined hiw-unlock-arrow">arrow_forward</span>
            <div className="hiw-unlock-step">
              <div className="hiw-unlock-orb hiw-unlock-orb--open">
                <span className="material-symbols-outlined">lock_open</span>
              </div>
              <span className="hiw-unlock-label hiw-unlock-label--open">UNLOCKED</span>
            </div>
          </div>
          {/* Preview Card */}
          <div className="hiw-opened-card hiw-glass-panel">
            <div className="hiw-opened-top-bar" />
            <div className="hiw-opened-glow" />
            <div className="hiw-opened-meta">
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>mail_open</span> Opened just now
            </div>
            <h3 className="hiw-opened-title">To myself in 5 years</h3>
            <blockquote className="hiw-opened-quote">
              "You made it this far. I hope you're proud. I hope you finally took that trip, and I hope you learned to stop worrying so much about things you can't control..."
            </blockquote>
            <div className="hiw-opened-photo">
              <img
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuADJ39YiRuiburbGOWa6HgOw4rBd7qP-3CX_p_sklih2QJqV8SAHCw1XeRvaFT99Ot6j9Z_z2JfVhQkiH_y304-EbgmoAcZicwn235xggTwoPm34KEa1clRbZSE5MTGFFTrxEqRAc1Nm_rV-fABBEYpsb7-Y8SLUovHhyU02G2A5B7WNa2ed1w_k61_nTS-i4ptFeQxhtloSZVmASssUJczbrcT4PbW7vAheM09Z6g0VbCgcMqTqXBo"
                alt="Serene landscape"
                className="hiw-opened-photo-img"
              />
            </div>
          </div>
        </section>

        {/* ── 07 Disappear ── */}
        <section className="hiw-disappear-section hiw-reveal">
          <div className="hiw-disappear-overlay" />
          <div className="hiw-disappear-content">
            <h2 className="hiw-disappear-heading">07 — And sometimes, it's gone.</h2>
            <p className="hiw-disappear-quote">
              Temporary doesn't mean meaningless.<br />
              <span className="hiw-disappear-quote-sub">Sometimes it means more.</span>
            </p>
            <div className="hiw-disappear-grid">
              <div className="hiw-disappear-item">
                <div className="hiw-disappear-flow">
                  <span>VIEWED</span>
                  <span className="material-symbols-outlined" style={{ fontSize: 18 }}>arrow_right_alt</span>
                  <span className="hiw-disappear-destroyed">DESTROYED</span>
                </div>
                <div className="hiw-disappear-icon-wrap">
                  <span className="material-symbols-outlined hiw-disappear-icon-bg">blur_on</span>
                  <span className="material-symbols-outlined hiw-disappear-icon">auto_delete</span>
                </div>
              </div>
              <div className="hiw-disappear-item">
                <div className="hiw-disappear-flow">
                  <span>EXPIRED</span>
                  <span className="material-symbols-outlined" style={{ fontSize: 18 }}>arrow_right_alt</span>
                  <span className="hiw-disappear-gone">GONE</span>
                </div>
                <div className="hiw-disappear-icon-wrap hiw-disappear-icon-wrap--faded">
                  <span className="material-symbols-outlined hiw-disappear-icon">cloud_off</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── 08 Ghost Wall ── */}
        <section className="hiw-ghost-section hiw-reveal">
          <div className="hiw-ghost-particle hiw-ghost-particle--1" />
          <div className="hiw-ghost-particle hiw-ghost-particle--2" />
          <div className="hiw-ghost-particle hiw-ghost-particle--3" />
          <div className="hiw-ghost-content">
            <h2 className="hiw-ghost-heading">Say something. Leave no trace.</h2>
            <p className="hiw-ghost-sub">The Ghost Wall is a public space for anonymous, ephemeral thoughts.</p>
            <div className="hiw-ghost-bubbles">
              <div className="hiw-dark-glass hiw-ghost-bubble hiw-ghost-bubble--1">"I hope tomorrow is better."</div>
              <div className="hiw-dark-glass hiw-ghost-bubble hiw-ghost-bubble--2">"Forgiving myself for the time it took."</div>
              <div className="hiw-dark-glass hiw-ghost-bubble hiw-ghost-bubble--3">"Today felt like a beginning."</div>
            </div>
            <Link to="/ghost" className="hiw-ghost-link">
              Enter the Ghost Wall <span className="material-symbols-outlined" style={{ fontSize: 18 }}>arrow_forward</span>
            </Link>
          </div>
        </section>

        {/* ── 09 Your Vault ── */}
        <section className="hiw-section hiw-vault-section hiw-reveal">
          <div className="hiw-section-center-head">
            <h2 className="hiw-section-heading">09 — Your memories have a place to live.</h2>
            <p className="hiw-section-sub">A secure, beautiful space to view your future, present, and past.</p>
          </div>
          <div className="hiw-vault-showcase hiw-glass-panel">
            <div className="hiw-vault-showcase-header">
              <div>
                <h3 className="hiw-vault-showcase-title">Personal Vault</h3>
                <p className="hiw-vault-showcase-sub">12 Active Capsules</p>
              </div>
              <div className="hiw-vault-pills">
                <button className="hiw-vault-pill hiw-vault-pill--active">All</button>
                <button className="hiw-vault-pill">Locked</button>
                <button className="hiw-vault-pill">Unlocked</button>
              </div>
            </div>
            <div className="hiw-vault-cards">
              {/* Locked */}
              <div className="hiw-vc-card">
                <div className="hiw-vc-lock"><span className="material-symbols-outlined">lock</span></div>
                <div className="hiw-vc-icon hiw-vc-icon--primary"><span className="material-symbols-outlined">calendar_month</span></div>
                <h4 className="hiw-vc-title">Graduation 2026</h4>
                <p className="hiw-vc-sub">Contains 1 video, 3 photos</p>
                <div className="hiw-vc-progress-track">
                  <div className="hiw-vc-progress-fill" style={{ width: '30%' }} />
                </div>
                <p className="hiw-vc-days">Unlocks in 412 days</p>
              </div>
              {/* Unlocked */}
              <div className="hiw-vc-card hiw-vc-card--unlocked">
                <div className="hiw-vc-lock hiw-vc-lock--open"><span className="material-symbols-outlined">lock_open_right</span></div>
                <div className="hiw-vc-icon hiw-vc-icon--tertiary"><span className="material-symbols-outlined">mail</span></div>
                <h4 className="hiw-vc-title">Letter from Sarah</h4>
                <p className="hiw-vc-sub">Text memory</p>
                <span className="hiw-vc-new">New</span>
              </div>
              {/* Expired */}
              <div className="hiw-vc-card hiw-vc-card--expired">
                <div className="hiw-vc-lock hiw-vc-lock--expired"><span className="material-symbols-outlined">history</span></div>
                <div className="hiw-vc-icon hiw-vc-icon--muted"><span className="material-symbols-outlined">mic</span></div>
                <h4 className="hiw-vc-title">Late night thoughts</h4>
                <p className="hiw-vc-sub">Voice memo</p>
                <div className="hiw-vc-expired">
                  <span className="material-symbols-outlined" style={{ fontSize: 16 }}>delete</span> Expired Jan 12
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── 10 Privacy ── */}
        <section className="hiw-section hiw-reveal">
          <div className="hiw-section-center-head">
            <h2 className="hiw-section-heading">10 — Your memories belong to you.</h2>
            <p className="hiw-privacy-banner">
              No likes. No followers. No permanent feed.<br />
              <span className="hiw-privacy-banner-sub">No pressure to perform.</span>
            </p>
          </div>
          <div className="hiw-privacy-grid">
            {[
              { icon: 'shield', label: 'PRIVATE', desc: 'End-to-end encryption ensures only you and your intended recipients can access your memories.' },
              { icon: 'key', label: 'CONTROLLED ACCESS', desc: 'You define the exact conditions under which a capsule can be opened.' },
              { icon: 'sync', label: 'AUTOMATED LIFECYCLE', desc: 'System automatically enforces time-locks, expirations, and secure deletion.' },
              { icon: 'group_off', label: 'CONTROLLED SHARING', desc: 'Send directly to one person. No public broadcasts, no algorithms.' },
            ].map(p => (
              <div key={p.label} className="hiw-privacy-card hiw-glass-panel">
                <div className="hiw-privacy-icon-wrap">
                  <span className="material-symbols-outlined hiw-privacy-icon" style={{ fontVariationSettings: "'FILL' 1" }}>{p.icon}</span>
                </div>
                <h4 className="hiw-privacy-label">{p.label}</h4>
                <p className="hiw-privacy-desc">{p.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Final CTA ── */}
        <section className="hiw-final-cta hiw-reveal">
          <div className="hiw-final-cta-bg" />
          <div className="hiw-final-cta-glow" />
          <div className="hiw-final-cta-content">
            <h2 className="hiw-final-cta-heading">Give a memory a future.</h2>
            <div className="hiw-final-cta-actions">
              <Link to="/login" className="hiw-final-btn hiw-final-btn--primary">
                Create Your First Capsule <span className="material-symbols-outlined">arrow_forward</span>
              </Link>
              <Link to="/" className="hiw-final-btn hiw-final-btn--ghost">
                Back to Home
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* ── Footer ── */}
      <footer className="hiw-footer">
        <div className="hiw-footer-brand">Memory Capsule</div>
        <div className="hiw-footer-copy">© 2024 Memory Capsule. Digital Heirlooms for the Soul.</div>
        <div className="hiw-footer-links">
          <a href="#" className="hiw-footer-link">Terms of Service</a>
          <a href="#" className="hiw-footer-link">Privacy Policy</a>
          <a href="#" className="hiw-footer-link">Contact Support</a>
        </div>
      </footer>
    </div>
  );
}
