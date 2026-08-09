import { useEffect, useRef, useState } from 'react';

export default function ShaderBackground() {
  const canvasRef = useRef(null);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    // Check prefers-reduced-motion preference
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (mediaQuery.matches) {
      setReducedMotion(true);
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    function syncSize() {
      if (!canvas) return;
      const w = canvas.clientWidth || window.innerWidth || 1280;
      const h = canvas.clientHeight || window.innerHeight || 720;
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }
    }

    let observer;
    if (typeof ResizeObserver !== 'undefined') {
      observer = new ResizeObserver(syncSize);
      observer.observe(canvas);
    }
    syncSize();

    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (!gl) return;

    const vs = `attribute vec2 a_position;
varying vec2 v_texCoord;
void main() {
  v_texCoord = a_position * 0.5 + 0.5;
  gl_Position = vec4(a_position, 0.0, 1.0);
}`;

    const fs = `precision highp float;

varying vec2 v_texCoord;

uniform float u_time;
uniform vec2 u_resolution;
uniform vec2 u_mouse;

// Helper for random noise
float hash(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
}

void main() {
    vec2 uv = v_texCoord;
    vec2 centered_uv = (uv - 0.5) * 2.0;
    centered_uv.x *= u_resolution.x / u_resolution.y;

    // Base deep purple/magenta background colors from the image
    vec3 color1 = vec3(0.05, 0.0, 0.1); // Deep dark purple
    vec3 color2 = vec3(0.2, 0.0, 0.3); // Rich mid purple
    vec3 color3 = vec3(0.4, 0.0, 0.5); // Bright purple glow

    // Atmospheric glow movement
    float glow = sin(u_time * 0.5 + uv.x * 2.0) * 0.5 + 0.5;
    vec3 bg_color = mix(color1, color2, glow * 0.5);
    bg_color = mix(bg_color, color3, (1.0 - length(centered_uv * 0.5)) * 0.3);

    // Star/Particle system
    float stars = 0.0;
    for (float i = 0.0; i < 40.0; i++) {
        vec2 p = vec2(hash(vec2(i, 1.0)), hash(vec2(i, 2.0)));
        
        // Soft drift movement
        p.y = fract(p.y - u_time * 0.02 * (hash(vec2(i, 3.0)) + 0.5));
        p.x = fract(p.x + sin(u_time * 0.1 + i) * 0.02);

        vec2 star_uv = (uv - p);
        star_uv.x *= u_resolution.x / u_resolution.y;
        
        float dist = length(star_uv);
        
        // Star size and twinkling
        float size = 0.002 + 0.003 * hash(vec2(i, 4.0));
        float twinkle = sin(u_time * 2.0 + i * 10.0) * 0.5 + 0.5;
        
        // Soft glowing stars
        stars += (size / dist) * twinkle * (0.8 + 0.2 * hash(vec2(i, 5.0)));
    }

    // Combine layers
    vec3 final_color = bg_color + stars * vec3(1.0, 0.6, 1.0); // Pinkish-white stars

    // Vignette
    float vignette = 1.0 - length(centered_uv * 0.4);
    final_color *= smoothstep(0.0, 0.8, vignette);

    gl_FragColor = vec4(final_color, 1.0);
}`;

    function compileShader(type, src) {
      const s = gl.createShader(type);
      gl.shaderSource(s, src);
      gl.compileShader(s);
      return s;
    }

    const vert = compileShader(gl.VERTEX_SHADER, vs);
    const frag = compileShader(gl.FRAGMENT_SHADER, fs);
    if (!vert || !frag) return;

    const prog = gl.createProgram();
    gl.attachShader(prog, vert);
    gl.attachShader(prog, frag);
    gl.linkProgram(prog);
    gl.useProgram(prog);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);

    const pos = gl.getAttribLocation(prog, 'a_position');
    gl.enableVertexAttribArray(pos);
    gl.vertexAttribPointer(pos, 2, gl.FLOAT, false, 0, 0);

    const uTime = gl.getUniformLocation(prog, 'u_time');
    const uRes = gl.getUniformLocation(prog, 'u_resolution');
    const uMouse = gl.getUniformLocation(prog, 'u_mouse');

    let mouse = { x: canvas.width / 2, y: canvas.height / 2 };

    const handleMouseMove = (event) => {
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      if (rect.width && rect.height) {
        const nx = (event.clientX - rect.left) / rect.width;
        const ny = 1.0 - (event.clientY - rect.top) / rect.height;
        mouse.x = nx * canvas.width;
        mouse.y = ny * canvas.height;
      }
    };

    window.addEventListener('mousemove', handleMouseMove);

    let animationFrameId;
    function render(t) {
      syncSize();
      gl.viewport(0, 0, canvas.width, canvas.height);
      if (uTime) gl.uniform1f(uTime, t * 0.001);
      if (uRes) gl.uniform2f(uRes, canvas.width, canvas.height);
      if (uMouse) gl.uniform2f(uMouse, mouse.x, mouse.y);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      animationFrameId = requestAnimationFrame(render);
    }

    animationFrameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('mousemove', handleMouseMove);
      if (observer) observer.disconnect();
      gl.deleteBuffer(buf);
      gl.deleteProgram(prog);
      gl.deleteShader(vert);
      gl.deleteShader(frag);
    };
  }, []);

  if (reducedMotion) {
    return <div className="lp-static-bg-fallback" style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, #0d001a 0%, #33004d 100%)' }} />;
  }

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        display: 'block'
      }}
    />
  );
}
