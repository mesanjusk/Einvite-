import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'

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
    }, 2000)
  }

  return (
    <div
      onClick={handleTap}
      style={{
        position: 'fixed',
        inset: 0,
        background: '#f5ece0',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
      }}
    >
      <motion.img
        src="/envelope.png"
        animate={opened ? { y: 80, opacity: 0 } : { y: [0, -8, 0] }}
        transition={
          opened ? { duration: 0.8 } : { y: { repeat: Infinity, duration: 3 } }
        }
        style={{ width: 'min(320px,85vw)' }}
      />
      <p
        style={{
          color: '#6b4a18',
          letterSpacing: '0.25em',
          fontFamily: 'EB Garamond,serif',
          marginTop: '20px',
        }}
      >
        TAP TO OPEN
      </p>
    </div>
  )
}
