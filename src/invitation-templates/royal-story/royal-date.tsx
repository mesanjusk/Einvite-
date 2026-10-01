"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CalendarDays, Sparkles } from "lucide-react";

import { EditableDate } from "@/components/invite/editable";
import { useInviteEdit } from "@/components/invite/edit-context";
import type { InviteData } from "@/components/invite/types";

function ScratchDate({ invite }: { invite: InviteData }) {
  const edit = useInviteEdit();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dragging = useRef(false);
  const strokes = useRef(0);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || edit?.active) return;

    const rect = canvas.getBoundingClientRect();
    const dpr = Math.max(1, Math.min(window.devicePixelRatio || 1, 2));
    canvas.width = Math.round(rect.width * dpr);
    canvas.height = Math.round(rect.height * dpr);

    const context = canvas.getContext("2d");
    if (!context) return;
    context.scale(dpr, dpr);

    const gradient = context.createLinearGradient(0, 0, rect.width, rect.height);
    gradient.addColorStop(0, "#d9bd82");
    gradient.addColorStop(0.5, "#b98a43");
    gradient.addColorStop(1, "#8a5b22");
    context.fillStyle = gradient;
    context.fillRect(0, 0, rect.width, rect.height);
    context.fillStyle = "#4e1b28";
    context.font = "700 12px sans-serif";
    context.textAlign = "center";
    context.fillText("SCRATCH TO REVEAL", rect.width / 2, rect.height / 2 + 4);
  }, [edit?.active]);

  function scratch(event: React.PointerEvent<HTMLCanvasElement>) {
    if (revealed || edit?.active) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const context = canvas.getContext("2d");
    if (!context) return;

    context.save();
    context.globalCompositeOperation = "destination-out";
    context.beginPath();
    context.arc(
      event.clientX - rect.left,
      event.clientY - rect.top,
      28,
      0,
      Math.PI * 2,
    );
    context.fill();
    context.restore();

    strokes.current += 1;
    if (strokes.current >= 15) setRevealed(true);
  }

  const formatted = invite.weddingDate.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="relative mx-auto mt-8 h-40 w-[290px] overflow-hidden rounded-[28px] border border-[#b68a4c]/50 bg-[#fff8e9] shadow-[0_22px_50px_rgba(85,31,42,.14)]">
      <div className="absolute inset-0 grid place-items-center text-center">
        <div>
          <CalendarDays className="mx-auto mb-2 size-6 text-[#9d6b28]" />
          <EditableDate target={{ kind: "invitation" }} value={invite.weddingDate}>
            <p
              className="text-2xl text-[#651d33]"
              style={{ fontFamily: "var(--inv-font-display)" }}
            >
              {formatted}
            </p>
          </EditableDate>
          <p className="mt-2 text-[10px] tracking-[0.24em] text-[#8b6a4f] uppercase">
            Save the date
          </p>
        </div>
      </div>

      {!edit?.active && (
        <motion.canvas
          ref={canvasRef}
          className="absolute inset-0 size-full touch-none"
          animate={{ opacity: revealed ? 0 : 1 }}
          transition={{ duration: 0.45 }}
          onPointerDown={(event) => {
            dragging.current = true;
            event.currentTarget.setPointerCapture(event.pointerId);
            scratch(event);
          }}
          onPointerMove={(event) => dragging.current && scratch(event)}
          onPointerUp={() => {
            dragging.current = false;
          }}
          onPointerCancel={() => {
            dragging.current = false;
          }}
        />
      )}

      <AnimatePresence>
        {revealed && (
          <motion.div
            className="pointer-events-none absolute inset-0"
            initial={{ opacity: 1 }}
            animate={{ opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.2 }}
            style={{
              background:
                "radial-gradient(circle, rgba(255,226,137,.75), transparent 68%)",
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function useCountdown(date: Date) {
  const target = date.getTime();
  const [remaining, setRemaining] = useState(() =>
    Math.max(0, target - Date.now()),
  );

  useEffect(() => {
    const tick = () => setRemaining(Math.max(0, target - Date.now()));
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [target]);

  const days = Math.floor(remaining / 86_400_000);
  const hours = Math.floor((remaining / 3_600_000) % 24);
  const minutes = Math.floor((remaining / 60_000) % 60);
  const seconds = Math.floor((remaining / 1000) % 60);

  return { days, hours, minutes, seconds };
}

export function RoyalDateSection({ invite }: { invite: InviteData }) {
  const time = useCountdown(invite.weddingDate);

  return (
    <div
      className="relative min-h-svh overflow-hidden px-5 py-16 text-center"
      style={{
        background:
          "linear-gradient(180deg, #4b0d20 0%, #6a1830 48%, #3c0918 100%)",
      }}
    >
      <div className="absolute inset-0 opacity-15 [background-image:radial-gradient(#f1cf82_1px,transparent_1px)] [background-size:28px_28px]" />
      <div className="relative z-10 mx-auto max-w-sm">
        <Sparkles className="mx-auto size-7 text-[#e8c06a]" />
        <p className="mt-4 text-[10px] font-bold tracking-[0.3em] text-[#e8c06a] uppercase">
          One beautiful date
        </p>
        <h2
          className="mt-3 text-4xl text-[#fff5df]"
          style={{ fontFamily: "var(--inv-font-display)" }}
        >
          Mark your calendar
        </h2>

        <ScratchDate invite={invite} />

        <div className="mt-12 grid grid-cols-4 gap-2">
          {[
            ["Days", time.days],
            ["Hours", time.hours],
            ["Min", time.minutes],
            ["Sec", time.seconds],
          ].map(([label, value]) => (
            <div
              key={String(label)}
              className="rounded-2xl border border-[#e8c06a]/35 bg-white/5 px-2 py-4 backdrop-blur"
            >
              <p className="text-2xl font-semibold text-[#fff5df]">
                {String(value).padStart(2, "0")}
              </p>
              <p className="mt-1 text-[9px] tracking-[0.18em] text-[#dcb96e] uppercase">
                {label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
