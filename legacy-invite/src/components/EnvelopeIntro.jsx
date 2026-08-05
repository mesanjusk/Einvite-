import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'

function Flourish({ style }) {
  return (
    <svg
      width="120"
      height="90"
      viewBox="0 0 120 90"
      style={{ position: 'absolute', opacity: 0.35, ...style }}
    >
      <g fill="none" stroke="#e8c777" strokeWidth="1.5">
        <path d="M4 4 C 30 10, 40 30, 60 34" />
        <circle cx="60" cy="34" r="10" />
        <path d="M60 34 C 66 24, 78 20, 88 26" />
        <path d="M60 34 C 58 46, 66 54, 78 52" />
        <path d="M20 20 q6 -6 12 0 q -6 6 -12 0 Z" />
      </g>
    </svg>
  )
}

export default function EnvelopeIntro({ onComplete }) {
  const [opened, setOpened] = useState(false)

  useEffect(() => {
    if (sessionStorage.getItem('invited')) onComplete()
  }, [])

  const handleTap = () => {
    setOpened(true)
    setTimeout(() => {
      sessionStorage.setItem('invited', 'true')
      onComplete()
    }, 1600)
  }

  return (
    <motion.div
      onClick={handleTap}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6 }}
      style={{
        position: 'fixed',
        inset: 0,
        background:
          'radial-gradient(120% 100% at 50% 0%, #8a3a3a 0%, var(--maroon) 45%, var(--maroon-dark) 100%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        overflow: 'hidden',
      }}
    >
      <Flourish style={{ top: 24, left: 12 }} />
      <Flourish style={{ top: 24, right: 12, transform: 'scaleX(-1)' }} />
      <Flourish
        style={{ bottom: 24, left: 12, transform: 'scaleY(-1)' }}
      />
      <Flourish
        style={{ bottom: 24, right: 12, transform: 'scale(-1,-1)' }}
      />

      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.8 }}
        style={{
          fontFamily: 'var(--font-script)',
          fontSize: '26px',
          color: '#f5e6c8',
          marginBottom: '28px',
        }}
      >
        Tap to Reveal
      </motion.p>

      {/* Wax seal */}
      <motion.div
        animate={
          opened
            ? { y: -60, scale: 1.15, opacity: 0 }
            : { y: [0, -6, 0] }
        }
        transition={
          opened
            ? { duration: 0.9, ease: 'easeIn' }
            : { y: { repeat: Infinity, duration: 3.2, ease: 'easeInOut' } }
        }
        style={{
          width: '150px',
          height: '150px',
          borderRadius: '50%',
          background:
            'radial-gradient(circle at 35% 30%, #fbf3e2, #eaddc0 70%, #d8c69f 100%)',
          boxShadow:
            'inset 0 2px 6px rgba(255,255,255,0.6), inset 0 -6px 14px rgba(90,60,20,0.35), 0 12px 24px rgba(0,0,0,0.35)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
        }}
      >
        <svg
          width="132"
          height="132"
          viewBox="0 0 132 132"
          style={{ position: 'absolute' }}
        >
          <circle
            cx="66"
            cy="66"
            r="58"
            fill="none"
            stroke="#b89a63"
            strokeWidth="1"
            strokeDasharray="2 4"
            opacity="0.6"
          />
        </svg>
        <span
          style={{
            fontFamily: 'var(--font-script)',
            fontSize: '38px',
            color: 'var(--maroon)',
          }}
        >
          B&amp;G
        </span>
      </motion.div>

      <motion.p
        animate={opened ? { opacity: 0 } : { opacity: [0.5, 1, 0.5] }}
        transition={{ repeat: Infinity, duration: 2.5 }}
        style={{
          marginTop: '32px',
          fontSize: '11px',
          letterSpacing: '0.35em',
          color: '#e8c777',
        }}
      >
        ✦
      </motion.p>
    </motion.div>
  )
}
