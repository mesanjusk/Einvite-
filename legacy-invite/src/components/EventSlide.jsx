import { motion } from 'framer-motion'
import { fadeUp, stagger } from '../animations'
import PetalField from './PetalField'

export default function EventSlide({
  label,
  heading,
  headingColor,
  quote,
  date,
  time,
  venue,
  dressCode,
  dressColors = [],
  mapsUrl,
  seed = 1,
}) {
  return (
    <section
      style={{
        position: 'relative',
        minHeight: '100svh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '48px 22px',
        background: 'var(--cream)',
        overflow: 'hidden',
      }}
    >
      <PetalField count={10} seed={seed} />

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
          padding: '36px 26px',
          textAlign: 'center',
          width: '100%',
        }}
      >
        <motion.p
          variants={fadeUp}
          className="eyebrow"
          style={{ color: 'var(--gold)', marginBottom: '10px' }}
        >
          {label}
        </motion.p>

        <motion.h2
          variants={fadeUp}
          style={{ fontSize: '46px', color: headingColor, marginBottom: '16px' }}
        >
          {heading}
        </motion.h2>

        <motion.p
          variants={fadeUp}
          style={{
            fontFamily: 'var(--font-body)',
            fontStyle: 'italic',
            color: 'var(--text-medium)',
            fontSize: '15px',
            margin: '0 0 26px',
          }}
        >
          &ldquo;{quote}&rdquo;
        </motion.p>

        {dressColors.length > 0 && (
          <motion.div variants={fadeUp} style={{ marginBottom: '24px' }}>
            <p className="eyebrow" style={{ color: 'var(--gold)', marginBottom: '10px' }}>
              DRESS CODE
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginBottom: '8px' }}>
              {dressColors.map((c) => (
                <span
                  key={c}
                  style={{
                    width: '18px',
                    height: '18px',
                    borderRadius: '50%',
                    background: c,
                    border: '1px solid rgba(0,0,0,0.1)',
                  }}
                />
              ))}
            </div>
            <p style={{ fontFamily: 'var(--font-body)', fontStyle: 'italic', fontSize: '14px', color: 'var(--text-medium)', margin: 0 }}>
              {dressCode}
            </p>
          </motion.div>
        )}

        <motion.div
          variants={fadeUp}
          style={{
            borderTop: '1px dashed rgba(122,46,46,0.25)',
            paddingTop: '18px',
            marginBottom: '20px',
          }}
        >
          <p style={{ margin: '0 0 4px', fontSize: '15px', color: 'var(--text-dark)' }}>
            {date} &middot; {time}
          </p>
          <p style={{ margin: 0, fontSize: '15px', color: 'var(--text-dark)' }}>{venue}</p>
        </motion.div>

        {mapsUrl && (
          <motion.a
            variants={fadeUp}
            href={mapsUrl}
            target="_blank"
            rel="noreferrer"
            className="pill-button"
            style={{
              background: 'var(--maroon)',
              color: '#fdf0e2',
              width: '100%',
            }}
          >
            📍 GET DIRECTIONS
          </motion.a>
        )}
      </motion.div>
    </section>
  )
}
