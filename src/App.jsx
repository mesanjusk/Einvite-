import { useEffect, useRef, useState } from 'react'
import { useScroll, useSpring, motion, AnimatePresence } from 'framer-motion'
import EnvelopeIntro from './components/EnvelopeIntro'
import HeroSlide from './components/HeroSlide'
import CountdownSlide from './components/CountdownSlide'
import EventSlide from './components/EventSlide'
import FinalSlide from './components/FinalSlide'

const EVENTS = [
  {
    label: 'THE FIRST HUES OF LOVE',
    heading: 'Mehendi',
    headingColor: '#1e5c2a',
    description: 'Begin with henna, music and memories.',
    date: '-- ---- ----',
    time: '--:-- PM onwards',
    venue: 'Venue Name, City',
    dressCode: 'Boho',
    mapsUrl: 'https://maps.google.com/?q=your+venue+name',
  },
  {
    label: 'A SPLASH OF TURMERIC',
    heading: 'Haldi',
    headingColor: '#7a4e00',
    description: 'A morning of blessings, colour and laughter.',
    date: '-- ---- ----',
    time: '--:-- AM onwards',
    venue: 'Venue Name, City',
    dressCode: 'Yellow',
    mapsUrl: 'https://maps.google.com/?q=your+venue+name',
  },
  {
    label: 'AN EVENING TO REMEMBER',
    heading: 'Haldi Dinner',
    headingColor: '#6b1e48',
    description: 'Dinner, dance and celebration under the stars.',
    date: '-- ---- ----',
    time: '--:-- PM onwards',
    venue: 'Venue Name, City',
    dressCode: 'Semi-formal',
    mapsUrl: 'https://maps.google.com/?q=your+venue+name',
  },
  {
    label: 'THE BIG DAY',
    heading: 'The Wedding',
    headingColor: '#5a3200',
    description: 'Join us as we say "I do".',
    date: '12 December 2026',
    time: '--:-- PM onwards',
    venue: 'Venue Name, City',
    dressCode: 'Traditional',
    mapsUrl: 'https://maps.google.com/?q=your+venue+name',
  },
]

function App() {
  const [inviteOpen, setInviteOpen] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [musicStarted, setMusicStarted] = useState(false)
  const audioRef = useRef(null)

  const { scrollYProgress } = useScroll()
  const scaleY = useSpring(scrollYProgress, { stiffness: 120, damping: 30 })

  // Start music when envelope opens
  useEffect(() => {
    if (inviteOpen && !musicStarted) {
      audioRef.current = new Audio('/music.mp3')
      audioRef.current.loop = true
      audioRef.current.volume = 0.3
      audioRef.current.play().catch(() => {})
      setMusicStarted(true)
    }
  }, [inviteOpen])

  // Stop music when tab closes
  useEffect(() => {
    return () => {
      if (audioRef.current) audioRef.current.pause()
    }
  }, [])

  const toggleMute = () => {
    if (audioRef.current) {
      audioRef.current.muted = !isMuted
      setIsMuted(!isMuted)
    }
  }

  return (
    <>
      <motion.div
        style={{
          position: 'fixed',
          right: 0,
          top: 0,
          width: '3px',
          height: '100vh',
          background: 'linear-gradient(180deg, #c9942a, #f0d080)',
          transformOrigin: 'top',
          scaleY,
          zIndex: 9999,
        }}
      />

      <button
        onClick={toggleMute}
        style={{
          position: 'fixed',
          top: '16px',
          right: '16px',
          zIndex: 99999,
          width: '40px',
          height: '40px',
          borderRadius: '50%',
          background: 'rgba(0,0,0,0.35)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255,255,255,0.25)',
          color: 'white',
          fontSize: '16px',
          cursor: 'pointer',
          display: inviteOpen ? 'flex' : 'none',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {isMuted ? '🔇' : '🔊'}
      </button>

      <AnimatePresence>
        {!inviteOpen && (
          <EnvelopeIntro onComplete={() => setInviteOpen(true)} />
        )}
      </AnimatePresence>

      {inviteOpen && (
        <main>
          <HeroSlide />
          <CountdownSlide />
          {EVENTS.map((event) => (
            <EventSlide key={event.heading} {...event} />
          ))}
          <FinalSlide />
        </main>
      )}
    </>
  )
}

export default App
