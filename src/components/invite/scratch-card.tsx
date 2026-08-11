"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";

/**
 * A scratch-off card: draws an opaque canvas layer over `children`, and
 * erases it as the guest drags a finger/cursor across it. Once enough of
 * the layer is cleared, the whole thing fades away and stays gone —
 * mirrors the "scratch to reveal the wedding date" interaction.
 */
export function ScratchCard({
  children,
  label = "Scratch",
  revealThreshold = 0.5,
  onReveal,
  className,
}: {
  children: React.ReactNode;
  label?: string;
  revealThreshold?: number;
  onReveal?: () => void;
  className?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDrawing = useRef(false);
  const revealed = useRef(false);
  const [cleared, setCleared] = useState(false);

  const paintCover = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const { width, height } = container.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.scale(dpr, dpr);

    const computed = getComputedStyle(container);
    const accent = computed.getPropertyValue("--inv-accent").trim() || "#b8836a";
    const primary = computed.getPropertyValue("--inv-primary").trim() || "#7a2e2e";
    const body = computed.getPropertyValue("--inv-font-body").trim() || "sans-serif";

    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, accent);
    gradient.addColorStop(1, primary);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    ctx.fillStyle = "rgba(255,255,255,0.9)";
    ctx.font = `600 12px ${body}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(label.toUpperCase(), width / 2, height / 2);
  }, [label]);

  useEffect(() => {
    paintCover();
    window.addEventListener("resize", paintCover);
    return () => window.removeEventListener("resize", paintCover);
  }, [paintCover]);

  function scratchAt(clientX: number, clientY: number) {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.globalCompositeOperation = "destination-out";
    ctx.beginPath();
    ctx.arc(x, y, 22, 0, Math.PI * 2);
    ctx.fill();
  }

  function checkCleared() {
    const canvas = canvasRef.current;
    if (!canvas || revealed.current) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const { width, height } = canvas;
    const sampleStep = 8;
    let transparent = 0;
    let total = 0;
    const data = ctx.getImageData(0, 0, width, height).data;
    for (let i = 3; i < data.length; i += 4 * sampleStep) {
      total += 1;
      if (data[i] < 40) transparent += 1;
    }

    if (total > 0 && transparent / total >= revealThreshold) {
      revealed.current = true;
      setCleared(true);
      onReveal?.();
    }
  }

  function handlePointerDown(e: React.PointerEvent<HTMLCanvasElement>) {
    if (revealed.current) return;
    isDrawing.current = true;
    e.currentTarget.setPointerCapture(e.pointerId);
    scratchAt(e.clientX, e.clientY);
  }

  function handlePointerMove(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!isDrawing.current || revealed.current) return;
    scratchAt(e.clientX, e.clientY);
  }

  function handlePointerUp() {
    if (!isDrawing.current) return;
    isDrawing.current = false;
    checkCleared();
  }

  return (
    <div ref={containerRef} className={className} style={{ position: "relative" }}>
      <div className="flex size-full items-center justify-center">{children}</div>
      {!cleared && (
        <motion.canvas
          ref={canvasRef}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 size-full touch-none rounded-[inherit]"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
        />
      )}
    </div>
  );
}
