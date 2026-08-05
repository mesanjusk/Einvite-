import { useState } from 'react'
import { motion } from 'framer-motion'
import ScratchCard from './ScratchCard'
import ConfettiBurst from './ConfettiBurst'
import PetalField from './PetalField'
import { fadeUp, stagger } from '../animations'
import { WEDDING_DATE_ISO } from '../weddingConfig'

function dateParts(iso) {
  const d = new Date(`${iso}T00:00:00`)
  return {
    month: d.toLocaleDateString('en-US', { month: 'long' }).toUpperCase(),
    day: String(d.getDate()).padStart(2, '0'),
    year: String(d.getFullYear()),
  }
}

export default function SaveTheDateSlide() {
  const { month, day, year } = dateParts(WEDDING_DATE_ISO)
  const [revealedCount, setRevealedCount] = useState(0)
  const [burst, setBurst] = useState(false)

  const handleComplete = () => {
    setRevealedCount((count) => {
      const next = count + 1
      if (next === 3) {
        setBurst(true)
        setTimeout(() => setBurst(false), 2200)
      }
      return next
    })
  }

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
      <PetalField count={12} seed={5} />
      {burst && <ConfettiBurst />}

      <motion.div
        variants={stagger}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-80px' }}
        style={{
          position: 'relative',
          zIndex: 2,
          textAlign: 'center',
          width: '100%',
          userSelect: 'none',
          WebkitUserSelect: 'none',
        }}
      >
        <motion.h2 variants={fadeUp} style={{ fontSize: '42px', color: 'var(--maroon)' }}>
          Save the Date
        </motion.h2>
        <motion.p
          variants={fadeUp}
          style={{
            fontFamily: 'var(--font-body)',
            fontStyle: 'italic',
            color: 'var(--text-medium)',
            fontSize: '15px',
            margin: '8px 0 32px',
          }}
        >
          Scratch below to reveal our wedding date
        </motion.p>

        <motion.div
          variants={fadeUp}
          style={{ display: 'flex', gap: '14px', justifyContent: 'center', marginBottom: '20px' }}
        >
          <div>
            <p className="eyebrow" style={{ color: 'var(--gold)', marginBottom: '10px' }}>
              MONTH
            </p>
            <ScratchCard value={month} width={140} height={188} onComplete={handleComplete} />
          </div>
          <div>
            <p className="eyebrow" style={{ color: 'var(--gold)', marginBottom: '10px' }}>
              DAY
            </p>
            <ScratchCard value={day} width={140} height={188} onComplete={handleComplete} />
          </div>
        </motion.div>

        <motion.div variants={fadeUp}>
          <p className="eyebrow" style={{ color: 'var(--gold)', marginBottom: '10px' }}>
            YEAR
          </p>
          <ScratchCard
            value={year}
            width={294}
            height={110}
            onComplete={handleComplete}
          />
        </motion.div>

        {revealedCount === 3 && (
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              marginTop: '28px',
              fontFamily: 'var(--font-body)',
              fontStyle: 'italic',
              fontSize: '15px',
              color: 'var(--maroon)',
            }}
          >
            Mark your calendars — see you there! ✦
          </motion.p>
        )}
      </motion.div>
    </section>
  )
}
