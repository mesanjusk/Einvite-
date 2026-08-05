"use client";

import { useEffect, useRef } from "react";

const FALLBACK_COLORS = ["#c9942a", "#7a2e2e", "#e8c777", "#8a3a5c", "#5c7a3a"];

function readCssVarColors(el: HTMLElement) {
  const styles = getComputedStyle(el);
  const vars = ["--inv-primary", "--inv-accent", "--inv-secondary"]
    .map((name) => styles.getPropertyValue(name).trim())
    .filter(Boolean);
  return vars.length > 0 ? vars : FALLBACK_COLORS;
}

export function ConfettiBurst({ duration = 2200 }: { duration?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const colors = readCssVarColors(canvas);

    const particles = Array.from({ length: 90 }, () => ({
      x: w / 2,
      y: h * 0.4,
      vx: (Math.random() - 0.5) * 11,
      vy: Math.random() * -9 - 3,
      size: 4 + Math.random() * 4,
      color: colors[Math.floor(Math.random() * colors.length)],
      rotation: Math.random() * 360,
      rotSpeed: (Math.random() - 0.5) * 18,
    }));

    const gravity = 0.32;
    const start = performance.now();
    let raf: number;

    const tick = (now: number) => {
      const elapsed = now - start;
      ctx.clearRect(0, 0, w, h);
      particles.forEach((p) => {
        p.vy += gravity;
        p.x += p.vx;
        p.y += p.vy;
        p.rotation += p.rotSpeed;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = Math.max(0, 1 - elapsed / duration);
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
        ctx.restore();
      });
      if (elapsed < duration) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [duration]);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none absolute inset-0 z-[5] size-full"
    />
  );
}
