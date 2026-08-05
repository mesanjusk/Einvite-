import { motion } from 'framer-motion'
import { fadeUp, stagger } from '../animations'
import { useCountdown } from '../hooks/useCountdown'
import PetalField from './PetalField'

const UNITS = [
  { key: 'days', label: 'Days' },
  { key: 'hours', label: 'Hours' },
  { key: 'minutes', label: 'Mins' },
  { key: 'seconds', label: 'Secs' },
]

export default function CountdownSlide() {
  const { days, hours, minutes, seconds } = useCountdown('2026-12-12')
  const values = { days, hours, minutes, seconds }

  return (
    <section
      style={{
        position: 'relative',
        minHeight: '100svh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '48px 24px',
        background: 'var(--cream)',
        overflow: 'hidden',
      }}
    >
      <PetalField count={12} seed={19} />

      <motion.div
        variants={stagger}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-80px' }}
        style={{
          position: 'relative',
          zIndex: 2,
          background: '#fffdf9',
          borderRadius: '20px',
          border: '1px solid rgba(201,148,42,0.3)',
          boxShadow: '0 20px 45px rgba(90,40,20,0.1)',
          padding: '40px 26px',
          textAlign: 'center',
          width: '100%',
        }}
      >
        <motion.p
          variants={fadeUp}
          style={{
            fontFamily: 'var(--font-body)',
            fontStyle: 'italic',
            color: 'var(--text-medium)',
            fontSize: '15px',
            margin: '0 0 18px',
          }}
        >
          A lifetime of togetherness begins with one sacred step
        </motion.p>

        <motion.h2
          variants={fadeUp}
          style={{ fontSize: '38px', color: 'var(--maroon)', marginBottom: '14px' }}
        >
          The Wedding
        </motion.h2>

        <motion.p
          variants={fadeUp}
          style={{
            letterSpacing: '0.2em',
            fontSize: '14px',
            color: 'var(--gold)',
            marginBottom: '30px',
          }}
        >
          12 &middot; 12 &middot; 2026
        </motion.p>

        <motion.div
          variants={stagger}
          style={{
            display: 'flex',
            gap: '14px',
            justifyContent: 'center',
          }}
        >
          {UNITS.map((unit) => (
            <motion.div key={unit.key} variants={fadeUp} style={{ minWidth: '56px' }}>
              <div
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '30px',
                  color: 'var(--text-dark)',
                  fontWeight: 600,
                  lineHeight: 1,
                }}
              >
                {String(values[unit.key] ?? 0).padStart(2, '0')}
              </div>
              <div
                style={{
                  fontSize: '10px',
                  letterSpacing: '0.15em',
                  color: 'var(--gold)',
                  marginTop: '8px',
                  paddingTop: '6px',
                  borderTop: '1px solid rgba(201,148,42,0.4)',
                }}
              >
                {unit.label.toUpperCase()}
              </div>
            </motion.div>
          ))}
        </motion.div>
      </motion.div>
    </section>
  )
}
