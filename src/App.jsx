import { useEffect, useRef, useState } from 'react'
import { useScroll, useSpring, motion, AnimatePresence } from 'framer-motion'
import EnvelopeIntro from './components/EnvelopeIntro'
import HeroSlide from './components/HeroSlide'
import CountdownSlide from './components/CountdownSlide'
import EventSlide from './components/EventSlide'
import FinalSlide from './components/FinalSlide'
import SaveTheDateSlide from './components/SaveTheDateSlide'
import { WEDDING_DATE_DISPLAY } from './weddingConfig'

const EVENTS = [
  {
    label: 'THE FIRST HUES OF LOVE',
    heading: 'Mehendi',
    headingColor: '#5c7a3a',
    quote: 'Begin with henna, music and memories.',
    date: '-- ---- ----',
    time: '--:-- PM onwards',
    venue: 'Venue Name, City',
    dressCode: 'Boho florals',
    dressColors: ['#5c7a3a', '#e8c777'],
    mapsUrl: 'https://maps.google.com/?q=your+venue+name',
    seed: 3,
  },
  {
    label: 'A SPLASH OF TURMERIC',
    heading: 'Haldi',
    headingColor: '#b5842a',
    quote: 'A morning of blessings, colour and laughter.',
    date: '-- ---- ----',
    time: '--:-- AM onwards',
    venue: 'Venue Name, City',
    dressCode: 'Shades of yellow',
    dressColors: ['#f2c14e', '#e8c777'],
    mapsUrl: 'https://maps.google.com/?q=your+venue+name',
    seed: 11,
  },
  {
    label: 'AN EVENING TO REMEMBER',
    heading: 'Haldi Dinner',
    headingColor: '#8a3a5c',
    quote: 'Dinner, dance and celebration under the stars.',
    date: '-- ---- ----',
    time: '--:-- PM onwards',
    venue: 'Venue Name, City',
    dressCode: 'Semi-formal',
    dressColors: ['#8a3a5c', '#c9942a'],
    mapsUrl: 'https://maps.google.com/?q=your+venue+name',
    seed: 17,
  },
  {
    label: 'THE BIG DAY',
    heading: 'The Wedding',
    headingColor: 'var(--maroon)',
    quote: 'The sacred vows to begin our forever.',
    date: WEDDING_DATE_DISPLAY,
    time: '--:-- PM onwards',
    venue: 'Venue Name, City',
    dressCode: 'Maroon · Gold · Ivory — traditional Indian',
    dressColors: ['var(--maroon)', 'var(--gold)', '#f5ecd8'],
    mapsUrl: 'https://maps.google.com/?q=your+venue+name',
    seed: 23,
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
          background: 'linear-gradient(180deg, var(--gold), var(--gold-light))',
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
          background: 'rgba(122,46,46,0.85)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(232,199,119,0.5)',
          color: '#f5e6c8',
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
          <SaveTheDateSlide />
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
