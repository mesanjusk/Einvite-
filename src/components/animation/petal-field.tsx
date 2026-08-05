const PETAL_COLOR_VARS = [
  "var(--inv-secondary)",
  "var(--inv-accent)",
  "var(--inv-primary)",
];

function seededPetals(count: number, seed: number) {
  let s = seed;
  const rand = () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    left: `${rand() * 100}%`,
    size: 8 + rand() * 10,
    duration: 9 + rand() * 8,
    delay: -rand() * 16,
    drift: `${(rand() - 0.5) * 80}px`,
    color: PETAL_COLOR_VARS[i % PETAL_COLOR_VARS.length],
  }));
}

export function PetalField({ count = 14, seed = 42 }: { count?: number; seed?: number }) {
  const petals = seededPetals(count, seed);
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-[1] overflow-hidden"
    >
      {petals.map((p) => (
        <span
          key={p.id}
          style={
            {
              position: "absolute",
              top: 0,
              left: p.left,
              width: p.size,
              height: p.size * 0.7,
              borderRadius: "60% 40% 55% 45% / 60% 55% 45% 40%",
              background: p.color,
              opacity: 0.7,
              "--drift": p.drift,
              animation: `petal-fall ${p.duration}s linear ${p.delay}s infinite`,
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  );
}
