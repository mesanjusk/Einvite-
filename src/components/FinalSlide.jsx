import { motion } from 'framer-motion'
import { fadeUp, stagger } from '../animations'

export default function FinalSlide() {
  return (
    <motion.section
      variants={stagger}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-80px' }}
      style={{
        minHeight: '100svh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: '48px 28px',
        background: 'var(--text-dark)',
      }}
    >
      <motion.h2
        variants={fadeUp}
        style={{
          fontFamily: "'Great Vibes', cursive",
          fontSize: '44px',
          color: 'var(--gold)',
          margin: '0 0 16px',
        }}
      >
        With love, we can't wait to celebrate with you
      </motion.h2>
      <motion.p
        variants={fadeUp}
        style={{
          fontFamily: "'Cormorant Garamond', serif",
          fontStyle: 'italic',
          fontSize: '15px',
          color: '#f0e3c8',
        }}
      >
        Bride &amp; Groom
      </motion.p>
    </motion.section>
  )
}
