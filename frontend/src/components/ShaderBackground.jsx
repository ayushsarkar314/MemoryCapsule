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
    if (!vertexShader || !fragmentShader) return;

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

  if (reducedMotion) {
    return <div className="lp-static-bg-fallback" style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, #331a40 0%, #9470a6 50%, #73408c 100%)' }} />;
  }

  return <canvas ref={canvasRef} className="lp-shader-canvas" />;
}
