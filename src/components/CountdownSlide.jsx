import { motion } from 'framer-motion'
import { fadeUp, stagger } from '../animations'
import { useCountdown } from '../hooks/useCountdown'

const UNITS = [
  { key: 'days', label: 'Days' },
  { key: 'hours', label: 'Hours' },
  { key: 'minutes', label: 'Minutes' },
  { key: 'seconds', label: 'Seconds' },
]

export default function CountdownSlide() {
  const { days, hours, minutes, seconds } = useCountdown('2026-12-12')
  const values = { days, hours, minutes, seconds }

  return (
    <section style={{ position: 'relative', minHeight: '100svh' }}>
      <img
        src="/couple2.jpg"
        loading="eager"
        fetchPriority="high"
        decoding="async"
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          objectPosition: 'center 10%',
        }}
      />
      <div
        style={{
          position: 'relative',
          zIndex: 2,
          background: 'rgba(15,8,2,0.45)',
          minHeight: '100svh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '48px 24px',
          textAlign: 'center',
        }}
      >
        <motion.p
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
          style={{
            color: 'var(--gold)',
            letterSpacing: '0.3em',
            fontSize: '13px',
            marginBottom: '8px',
          }}
        >
          COUNTING DOWN TO
        </motion.p>
        <motion.h2
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
          style={{
            fontFamily: "'Cormorant Garamond', serif",
            color: '#fff',
            fontWeight: 400,
            fontSize: '26px',
            margin: '0 0 32px',
          }}
        >
          12 December 2026 · Your City
        </motion.h2>

        <motion.div
          variants={stagger}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
          style={{
            display: 'flex',
            gap: '16px',
            justifyContent: 'center',
            flexWrap: 'wrap',
          }}
        >
          {UNITS.map((unit) => (
            <motion.div
              key={unit.key}
              variants={fadeUp}
              style={{
                background: 'rgba(253,248,240,0.1)',
                border: '1px solid rgba(201,148,42,0.5)',
                borderRadius: '12px',
                padding: '14px 16px',
                minWidth: '68px',
              }}
            >
              <div
                style={{
                  fontFamily: "'Cormorant Garamond', serif",
                  fontSize: '32px',
                  color: 'var(--gold)',
                  lineHeight: 1,
                }}
              >
                {String(values[unit.key] ?? 0).padStart(2, '0')}
              </div>
              <div
                style={{
                  fontSize: '10px',
                  letterSpacing: '0.15em',
                  color: '#f0e3c8',
                  marginTop: '6px',
                }}
              >
                {unit.label.toUpperCase()}
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
