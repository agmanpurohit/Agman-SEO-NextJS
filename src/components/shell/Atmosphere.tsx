"use client";

import { useEffect, useRef } from "react";
import { prefersReducedMotion } from "@/lib/gsap";

/**
 * Atmospheric WebGL backdrop: slow drifting fog, a faint ember light that follows the
 * pointer, and very fine "index" scan lines. Deliberately quiet so it never competes
 * with text. Desktop/tablet with a fine pointer only; everyone else gets a static
 * CSS gradient. Renders at reduced resolution and pauses when the tab is hidden.
 */
const frag = /* glsl */ `
precision mediump float;
uniform float uTime;
uniform vec2 uRes;
uniform vec2 uMouse;
uniform float uScroll;
varying vec2 vUv;

float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7))) * 43758.5453); }
float noise(vec2 p){
  vec2 i = floor(p), f = fract(p);
  vec2 u = f*f*(3.0-2.0*f);
  return mix(mix(hash(i), hash(i+vec2(1,0)), u.x), mix(hash(i+vec2(0,1)), hash(i+vec2(1,1)), u.x), u.y);
}
float fbm(vec2 p){ float v = 0.0, a = 0.5; for(int i=0;i<4;i++){ v += a*noise(p); p *= 2.02; a *= 0.5; } return v; }

void main(){
  vec2 uv = vUv;
  float aspect = uRes.x / uRes.y;
  vec2 p = vec2(uv.x * aspect, uv.y);
  float t = uTime * 0.035;

  float fog = fbm(p * 1.6 + vec2(t, -t * 0.6) + uScroll * 0.15);
  fog = smoothstep(0.35, 0.95, fog);

  vec2 m = vec2(uMouse.x * aspect, uMouse.y);
  float d = length(p - m);
  float light = exp(-d * d * 3.2);

  float top = smoothstep(1.2, 0.0, length(p - vec2(0.15 * aspect, 1.15)));

  vec3 ink = vec3(0.039, 0.039, 0.043);
  vec3 bone = vec3(0.925, 0.91, 0.88);
  vec3 ember = vec3(1.0, 0.353, 0.122);

  vec3 col = ink;
  col += bone * fog * 0.028;
  col += bone * top * 0.035;
  col += ember * light * (0.06 + fog * 0.05);

  float lines = smoothstep(0.92, 1.0, sin((uv.y + uScroll * 0.05) * uRes.y * 0.09) * 0.5 + 0.5);
  col += bone * lines * 0.006;

  float vig = smoothstep(1.25, 0.25, length(uv - 0.5) * 1.4);
  col *= mix(0.65, 1.0, vig);

  gl_FragColor = vec4(col, 1.0);
}`;

const vert = /* glsl */ `
attribute vec2 position;
attribute vec2 uv;
varying vec2 vUv;
void main(){ vUv = uv; gl_Position = vec4(position, 0.0, 1.0); }`;

export function Atmosphere() {
  const host = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = host.current;
    if (!el) return;
    const capable =
      window.matchMedia("(hover: hover) and (pointer: fine) and (min-width: 768px)").matches && !prefersReducedMotion();
    if (!capable) return;

    let disposed = false;
    let cleanup = () => {};

    // Load OGL only when it will actually be used.
    import("ogl").then(({ Renderer, Program, Mesh, Triangle }) => {
      if (disposed) return;
      const renderer = new Renderer({ dpr: 0.5, alpha: false, antialias: false, powerPreference: "low-power" });
      const gl = renderer.gl;
      gl.canvas.style.width = "100%";
      gl.canvas.style.height = "100%";
      el.appendChild(gl.canvas);

      const program = new Program(gl, {
        vertex: vert,
        fragment: frag,
        uniforms: {
          uTime: { value: 0 },
          uRes: { value: [1, 1] },
          uMouse: { value: [0.7, 0.6] },
          uScroll: { value: 0 },
        },
      });
      const mesh = new Mesh(gl, { geometry: new Triangle(gl), program });

      const resize = () => {
        renderer.setSize(window.innerWidth, window.innerHeight);
        program.uniforms.uRes.value = [window.innerWidth, window.innerHeight];
      };
      resize();

      const target = { x: 0.7, y: 0.6 };
      const cur = { x: 0.7, y: 0.6 };
      const onMove = (e: PointerEvent) => {
        target.x = e.clientX / window.innerWidth;
        target.y = 1 - e.clientY / window.innerHeight;
      };

      let raf = 0;
      let last = performance.now();
      const loop = (now: number) => {
        raf = requestAnimationFrame(loop);
        // ~30fps is plenty for slow fog and keeps the GPU cool.
        if (now - last < 32) return;
        last = now;
        cur.x += (target.x - cur.x) * 0.06;
        cur.y += (target.y - cur.y) * 0.06;
        program.uniforms.uTime.value = now / 1000;
        program.uniforms.uMouse.value = [cur.x, cur.y];
        program.uniforms.uScroll.value = window.scrollY / window.innerHeight;
        renderer.render({ scene: mesh });
      };
      raf = requestAnimationFrame(loop);

      const onVis = () => {
        cancelAnimationFrame(raf);
        if (!document.hidden) raf = requestAnimationFrame(loop);
      };

      window.addEventListener("resize", resize);
      window.addEventListener("pointermove", onMove, { passive: true });
      document.addEventListener("visibilitychange", onVis);
      el.dataset.live = "true";

      cleanup = () => {
        cancelAnimationFrame(raf);
        window.removeEventListener("resize", resize);
        window.removeEventListener("pointermove", onMove);
        document.removeEventListener("visibilitychange", onVis);
        gl.getExtension("WEBGL_lose_context")?.loseContext();
        gl.canvas.remove();
      };
    });

    return () => {
      disposed = true;
      cleanup();
    };
  }, []);

  return (
    <div
      ref={host}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10"
      style={{
        background:
          "radial-gradient(120% 80% at 15% 0%, rgba(236,232,225,0.05), transparent 55%), radial-gradient(60% 50% at 85% 70%, rgba(255,90,31,0.05), transparent 70%), #0a0a0b",
      }}
    />
  );
}
