import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import './LandingPage.css';

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

  return <canvas ref={canvasRef} className="lp-shader-canvas" />;
}

/* ─── Main Landing Page ───────────────────────────────────────── */
export default function LandingPage() {
  /* Scroll reveal */
  useEffect(() => {
    const reveals = document.querySelectorAll('.lp-reveal');
    const onScroll = () => {
      const vh = window.innerHeight;
      reveals.forEach(el => {
        if (el.getBoundingClientRect().top < vh - 100) {
          el.classList.add('lp-reveal--active');
        }
      });
    };
    window.addEventListener('scroll', onScroll);
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div className="lp-root">
      {/* ── Background ── */}
      <div className="lp-bg">
        <ShaderBackground />
        <div className="lp-bg-overlay" />
      </div>

      {/* ── Navigation ── */}
      <nav className="lp-nav">
        <div className="lp-nav-inner">
          <div className="lp-nav-brand">
            <span className="material-symbols-outlined lp-nav-icon">camera_outdoor</span>
            <span className="lp-nav-title">Memory Capsule</span>
          </div>
          <div className="lp-nav-links">
            <Link to="/how-it-works" className="lp-nav-link">How It Works</Link>
            <a href="#ghost" className="lp-nav-link">Ghost Wall</a>
            <a href="#privacy" className="lp-nav-link">Privacy</a>
          </div>
          <Link to="/login" className="lp-nav-cta">
            Create a Capsule
          </Link>
        </div>
      </nav>

      <main className="lp-main">
        {/* ── Hero ── */}
        <section className="lp-hero lp-reveal lp-reveal--active">
          <div className="lp-hero-text">
            <h1 className="lp-hero-heading">
              Some memories are meant for later.
            </h1>
            <p className="lp-hero-sub">
              A private sanctuary for your digital heirlooms. Seal your thoughts, voice, and moments. Set a time. Let them wait.
            </p>
            <div className="lp-hero-actions">
              <Link to="/login" className="lp-btn-primary">
                Create a Memory <span className="material-symbols-outlined">arrow_forward</span>
              </Link>
            </div>
            <div className="lp-hero-badges">
              <span className="lp-badge">
                <span className="material-symbols-outlined">lock</span> Private by design
              </span>
              <span className="lp-badge">
                <span className="material-symbols-outlined">schedule</span> Time-controlled
              </span>
              <span className="lp-badge">
                <span className="material-symbols-outlined">auto_delete</span> Made to disappear
              </span>
            </div>
          </div>

          <div className="lp-hero-card-wrap">
            <div className="lp-glass-card lp-hero-card">
              <div className="lp-card-header">
                <span className="lp-card-status">
                  <span className="material-symbols-outlined">lock</span> SEALED
                </span>
              </div>
              <div className="lp-card-date-block">
                <div className="lp-card-opens-label">Opens</div>
                <div className="lp-card-date">14 Feb 2030</div>
              </div>
              <div className="lp-card-preview">
                <div
                  className="lp-card-preview-img"
                  style={{
                    backgroundImage: `url('https://lh3.googleusercontent.com/aida-public/AB6AXuA-BOHssONVVGkb8sDPczRRInTPW-OnVCXuHxqOjM8CVhFBMtNjNsesC2hvRPeAetng620LQPInGNe9qJz1FPxb17gVbAn4MUMz5cIkU3qlJ5dltkex5l6aGWMYKTt6MszPF8P3ZqV4gx3l9wEOJHMpbNHPchhaChYlflDJgQtZhSjWdHahBIarJQw28efLN4Xd6Pr1f3rcn-nOJBalVRsP0XVHeT3dp7zSsZUJ0O9o4UQssgynTyqZ')`,
                  }}
                />
                <span className="material-symbols-outlined lp-card-heart" style={{ fontVariationSettings: "'FILL' 1" }}>favorite</span>
              </div>
            </div>
            <div className="lp-hero-glow lp-hero-glow--tr" />
            <div className="lp-hero-glow lp-hero-glow--bl" />
          </div>
        </section>

        {/* ── Features Strip ── */}
        <section className="lp-features lp-reveal">
          <div className="lp-features-inner">
            {[
              { icon: 'hourglass_bottom', title: 'Time-Locked', desc: 'Seal memories until a future date you choose.' },
              { icon: 'visibility_off', title: 'One-Time View', desc: 'Open once, then gone forever — truly ephemeral.' },
              { icon: 'shield', title: 'End-to-End Private', desc: 'Only you and your recipient can ever read it.' },
              { icon: 'mail', title: 'Send to Anyone', desc: 'Deliver a sealed memory directly to a friend\'s vault.' },
            ].map(f => (
              <div key={f.title} className="lp-feature-card lp-glass-card">
                <span className="material-symbols-outlined lp-feature-icon" style={{ fontVariationSettings: "'FILL' 1" }}>{f.icon}</span>
                <h3 className="lp-feature-title">{f.title}</h3>
                <p className="lp-feature-desc">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── How It Works Teaser ── */}
        <section className="lp-how-teaser lp-reveal">
          <div className="lp-how-teaser-inner">
            <div className="lp-how-teaser-text">
              <span className="lp-eyebrow">How It Works</span>
              <h2 className="lp-section-heading">Create it. Seal it.<br />Let time take care of the rest.</h2>
              <p className="lp-section-body">
                Choose your content, set your rules, and Memory Capsule handles the rest — locking, unlocking, and securely deleting your memories exactly as you intended.
              </p>
              <Link to="/how-it-works" className="lp-btn-outline">
                See How It Works <span className="material-symbols-outlined">arrow_forward</span>
              </Link>
            </div>
            <div className="lp-how-steps">
              {[
                { num: '01', label: 'CREATE', desc: 'Upload text, image, voice, or video.' },
                { num: '02', label: 'SEAL', desc: 'Set unlock date, one-time view, or duration.' },
                { num: '03', label: 'WAIT', desc: 'Your capsule is locked until the moment arrives.' },
                { num: '04', label: 'EXPERIENCE', desc: 'Open it — then watch it disappear.' },
              ].map((s, i) => (
                <div key={s.num} className="lp-step">
                  <div className="lp-step-num">{s.num}</div>
                  <div>
                    <div className="lp-step-label">{s.label}</div>
                    <div className="lp-step-desc">{s.desc}</div>
                  </div>
                  {i < 3 && <span className="lp-step-arrow material-symbols-outlined">arrow_downward</span>}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Ghost Wall Teaser ── */}
        <section id="ghost" className="lp-ghost-teaser lp-reveal">
          <div className="lp-ghost-inner">
            <h2 className="lp-ghost-heading">Say something.<br />Leave no trace.</h2>
            <p className="lp-ghost-sub">The Ghost Wall is a public space for anonymous, ephemeral thoughts. No account needed.</p>
            <div className="lp-ghost-bubbles">
              <div className="lp-bubble lp-bubble--1">"I hope tomorrow is better."</div>
              <div className="lp-bubble lp-bubble--2">"Forgiving myself for the time it took."</div>
              <div className="lp-bubble lp-bubble--3">"Today felt like a beginning."</div>
            </div>
            <Link to="/ghost" className="lp-btn-ghost-cta">
              Enter the Ghost Wall <span className="material-symbols-outlined">arrow_forward</span>
            </Link>
          </div>
        </section>

        {/* ── Privacy Strip ── */}
        <section id="privacy" className="lp-privacy lp-reveal">
          <div className="lp-privacy-inner">
            <h2 className="lp-privacy-heading">Your memories belong to you.</h2>
            <p className="lp-privacy-sub">No likes. No followers. No permanent feed. No pressure to perform.</p>
            <div className="lp-privacy-grid">
              {[
                { icon: 'shield', label: 'PRIVATE', desc: 'End-to-end encryption. Only you and your recipients can read your memories.' },
                { icon: 'key', label: 'CONTROLLED ACCESS', desc: 'You define the exact conditions under which a capsule can be opened.' },
                { icon: 'sync', label: 'AUTOMATED LIFECYCLE', desc: 'Time-locks, expirations, and secure deletion are enforced automatically.' },
                { icon: 'group_off', label: 'CONTROLLED SHARING', desc: 'Send directly to one person. No public broadcasts, no algorithms.' },
              ].map(p => (
                <div key={p.label} className="lp-privacy-card lp-glass-card">
                  <span className="material-symbols-outlined lp-privacy-icon" style={{ fontVariationSettings: "'FILL' 1" }}>{p.icon}</span>
                  <h4 className="lp-privacy-label">{p.label}</h4>
                  <p className="lp-privacy-desc">{p.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Final CTA ── */}
        <section className="lp-cta lp-reveal">
          <div className="lp-cta-card lp-glass-card">
            <div className="lp-cta-glow" />
            <div className="lp-cta-content">
              <h2 className="lp-cta-heading">What will you leave for later?</h2>
              <p className="lp-cta-sub">Begin your capsule today. For yourself, for someone else, for tomorrow.</p>
              <Link to="/login" className="lp-btn-primary lp-cta-btn">
                Start Sealing
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* ── Footer ── */}
      <footer className="lp-footer">
        <div className="lp-footer-brand">Memory Capsule</div>
        <div className="lp-footer-links">
          <a href="#" className="lp-footer-link">The Manifesto</a>
          <a href="#" className="lp-footer-link">Privacy Sanctum</a>
          <a href="#" className="lp-footer-link">Ethical Tech</a>
          <a href="#" className="lp-footer-link">Terms of Time</a>
        </div>
        <div className="lp-footer-copy">© 2024 Memory Capsule. Memories aren't content.</div>
      </footer>
    </div>
  );
}
