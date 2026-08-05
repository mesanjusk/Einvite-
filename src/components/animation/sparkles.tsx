function seededSparkles(count: number, seed: number) {
  let s = seed;
  const rand = () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    top: `${rand() * 100}%`,
    left: `${rand() * 100}%`,
    size: 3 + rand() * 4,
    duration: 2 + rand() * 2.5,
    delay: rand() * 4,
  }));
}

export function Sparkles({ count = 10, seed = 7 }: { count?: number; seed?: number }) {
  const sparkles = seededSparkles(count, seed);
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-[1]">
      {sparkles.map((s) => (
        <span
          key={s.id}
          style={{
            position: "absolute",
            top: s.top,
            left: s.left,
            width: s.size,
            height: s.size,
            borderRadius: "9999px",
            background: "var(--inv-accent)",
            boxShadow: "0 0 6px var(--inv-accent)",
            animation: `sparkle-twinkle ${s.duration}s ease-in-out ${s.delay}s infinite`,
          }}
        />
      ))}
    </div>
  );
}
