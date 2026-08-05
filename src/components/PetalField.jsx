const PETAL_COLORS = ['var(--blush)', 'var(--gold-light)', '#e8b4b8']

function seededPetals(count, seed) {
  let s = seed
  const rand = () => {
    s = (s * 9301 + 49297) % 233280
    return s / 233280
  }
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    left: `${rand() * 100}%`,
    size: 8 + rand() * 10,
    duration: 9 + rand() * 8,
    delay: -rand() * 16,
    drift: `${(rand() - 0.5) * 80}px`,
    color: PETAL_COLORS[i % PETAL_COLORS.length],
  }))
}

export default function PetalField({ count = 14, seed = 42 }) {
  const petals = seededPetals(count, seed)
  return (
    <div
      aria-hidden="true"
      style={{
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
        pointerEvents: 'none',
        zIndex: 1,
      }}
    >
      {petals.map((p) => (
        <span
          key={p.id}
          style={{
            position: 'absolute',
            top: 0,
            left: p.left,
            width: p.size,
            height: p.size * 0.7,
            borderRadius: '60% 40% 55% 45% / 60% 55% 45% 40%',
            background: p.color,
            opacity: 0.7,
            '--drift': p.drift,
            animation: `petal-fall ${p.duration}s linear ${p.delay}s infinite`,
          }}
        />
      ))}
    </div>
  )
}
