import { motion } from 'framer-motion'
import { fadeUp, fadeLeft } from '../animations'

export default function EventSlide({
  label,
  heading,
  headingColor,
  description,
  date,
  time,
  venue,
  dressCode,
  mapsUrl,
}) {
  return (
    <section
      style={{
        minHeight: '100svh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: '48px 28px',
        background: 'var(--cream)',
      }}
    >
      <motion.p
        variants={fadeLeft}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-80px' }}
        style={{
          letterSpacing: '0.3em',
          fontSize: '11px',
          color: 'var(--text-medium)',
          margin: '0 0 8px',
        }}
      >
        {label}
      </motion.p>

      <motion.h2
        variants={fadeUp}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-80px' }}
        style={{
          fontFamily: "'Great Vibes', cursive",
          fontSize: '52px',
          color: headingColor,
          margin: '0 0 12px',
        }}
      >
        {heading}
      </motion.h2>

      <motion.p
        variants={fadeUp}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-80px' }}
        style={{
          fontFamily: "'Cormorant Garamond', serif",
          fontStyle: 'italic',
          fontSize: '16px',
          color: 'var(--text-medium)',
          margin: '0 0 24px',
        }}
      >
        {description}
      </motion.p>

      <motion.div
        variants={fadeUp}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-80px' }}
        style={{
          border: `1px solid ${headingColor}33`,
          borderRadius: '14px',
          padding: '20px',
          display: 'grid',
          gap: '10px',
        }}
      >
        <Row label="Date" value={date} />
        <Row label="Time" value={time} />
        <Row label="Venue" value={venue} />
        <Row label="Dress Code" value={dressCode} />
        {mapsUrl && (
          <a
            href={mapsUrl}
            target="_blank"
            rel="noreferrer"
            style={{
              marginTop: '6px',
              textAlign: 'center',
              color: headingColor,
              border: `1px solid ${headingColor}`,
              borderRadius: '999px',
              padding: '10px 16px',
              textDecoration: 'none',
              fontSize: '13px',
              letterSpacing: '0.1em',
            }}
          >
            VIEW ON MAP
          </a>
        )}
      </motion.div>
    </section>
  )
}

function Row({ label, value }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
      <span style={{ color: 'var(--text-medium)' }}>{label}</span>
      <span style={{ color: 'var(--text-dark)', fontWeight: 600 }}>{value}</span>
    </div>
  )
}
