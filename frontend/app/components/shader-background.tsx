"use client";

import { useEffect, useRef } from "react";

export default function ShaderBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Sync the WebGL drawing-buffer size with the CSS-driven layout size.
    function syncSize() {
      if (!canvas) return;
      const w = canvas.clientWidth || 1280;
      const h = canvas.clientHeight || 720;
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }
    }
    
    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== "undefined") {
      resizeObserver = new ResizeObserver(syncSize);
      resizeObserver.observe(canvas);
    }
    syncSize();

    const gl = canvas.getContext("webgl") || (canvas.getContext("experimental-webgl") as WebGLRenderingContext);
    if (!gl) return;

    const vs = `attribute vec2 a_position;
varying vec2 v_texCoord;
void main() {
  v_texCoord = a_position * 0.5 + 0.5;
  gl_Position = vec4(a_position, 0.0, 1.0);
}`;
    const fs = `precision highp float;
uniform float u_time;
uniform vec2 u_resolution;
uniform vec2 u_mouse;
varying vec2 v_texCoord;

void main() {
    vec2 uv = v_texCoord;
    vec2 mouse = u_mouse / u_resolution;
    
    // Background colors inspired by the reference image: deep midnight and emerald glows
    vec3 bgColor = vec3(0.005, 0.015, 0.01); // Very deep dark green/black
    vec3 glowColor = vec3(0.06, 0.72, 0.50); // Emerald/Teal glow
    
    // Create soft, flowing ambient glows
    float dist1 = distance(uv, vec2(0.3 + sin(u_time * 0.1) * 0.2, 0.2 + cos(u_time * 0.15) * 0.2));
    float dist2 = distance(uv, vec2(0.7 + cos(u_time * 0.12) * 0.2, 0.8 + sin(u_time * 0.08) * 0.2));
    float distMouse = distance(uv, mouse);
    
    float glow1 = smoothstep(0.8, 0.0, dist1) * 0.15;
    float glow2 = smoothstep(0.7, 0.0, dist2) * 0.1;
    float mouseGlow = smoothstep(0.4, 0.0, distMouse) * 0.05;
    
    vec3 color = bgColor;
    color = mix(color, glowColor, glow1);
    color = mix(color, glowColor, glow2);
    color += glowColor * mouseGlow;
    
    // Subtle vignette
    float vignette = 1.0 - smoothstep(0.5, 1.5, length(uv - 0.5));
    color *= vignette;
    
    // Add fine noise for texture
    float noise = fract(sin(dot(uv, vec2(12.9898, 78.233))) * 43758.5453);
    color += noise * 0.008;

    gl_FragColor = vec4(color, 1.0);
}`;

    function cs(type: number, src: string) {
      const s = gl.createShader(type);
      if (!s) throw new Error("Failed to create shader");
      gl.shaderSource(s, src);
      gl.compileShader(s);
      return s;
    }

    const prog = gl.createProgram();
    if (!prog) return;
    
    gl.attachShader(prog, cs(gl.VERTEX_SHADER, vs));
    gl.attachShader(prog, cs(gl.FRAGMENT_SHADER, fs));
    gl.linkProgram(prog);
    gl.useProgram(prog);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);

    const pos = gl.getAttribLocation(prog, "a_position");
    gl.enableVertexAttribArray(pos);
    gl.vertexAttribPointer(pos, 2, gl.FLOAT, false, 0, 0);

    const uTime = gl.getUniformLocation(prog, "u_time");
    const uRes = gl.getUniformLocation(prog, "u_resolution");
    const uMouse = gl.getUniformLocation(prog, "u_mouse");

    const mouse = { x: canvas.width / 2, y: canvas.height / 2 };
    
    const handleMouseMove = (event: MouseEvent) => {
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      if (rect.width && rect.height) {
        const nx = (event.clientX - rect.left) / rect.width;
        const ny = 1.0 - (event.clientY - rect.top) / rect.height;
        mouse.x = nx * canvas.width;
        mouse.y = ny * canvas.height;
      }
    };
    window.addEventListener("mousemove", handleMouseMove);

    let animationFrameId: number;
    function render(t: number) {
      if (typeof ResizeObserver === "undefined") syncSize();
      if (!canvas) return;
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
      window.removeEventListener("mousemove", handleMouseMove);
      if (resizeObserver) resizeObserver.disconnect();
    };
  }, []);

  return (
    <div className="fixed inset-0 w-full h-full pointer-events-none z-0">
      <canvas
        ref={canvasRef}
        id="shader-canvas-ANIMATION_10"
        className="block w-full h-full"
      />
    </div>
  );
}
