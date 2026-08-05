import { motion } from 'framer-motion'
import { fadeUp, stagger } from '../animations'
import PetalField from './PetalField'

function CornerBracket({ style }) {
  return (
    <svg
      width="28"
      height="28"
      viewBox="0 0 28 28"
      style={{ position: 'absolute', ...style }}
    >
      <path
        d="M1 27 V5 Q1 1 5 1 H27"
        fill="none"
        stroke="var(--gold)"
        strokeWidth="1.5"
      />
    </svg>
  )
}

export default function HeroSlide() {
  return (
    <section
      style={{
        position: 'relative',
        minHeight: '100svh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '32px 20px',
        background:
          'radial-gradient(120% 80% at 50% 0%, var(--blush) 0%, var(--cream) 55%)',
        overflow: 'hidden',
      }}
    >
      <PetalField count={10} seed={7} />

      <motion.div
        variants={stagger}
        initial="hidden"
        animate="visible"
        style={{
          position: 'relative',
          zIndex: 2,
          background: 'rgba(255,252,246,0.9)',
          borderRadius: '20px',
          border: '1px solid rgba(201,148,42,0.35)',
          boxShadow: '0 20px 45px rgba(90,40,20,0.12)',
          padding: '40px 26px',
          textAlign: 'center',
        }}
      >
        <CornerBracket style={{ top: -12, left: -12 }} />
        <CornerBracket
          style={{ top: -12, right: -12, transform: 'scaleX(-1)' }}
        />
        <CornerBracket
          style={{ bottom: -12, left: -12, transform: 'scaleY(-1)' }}
        />
        <CornerBracket
          style={{ bottom: -12, right: -12, transform: 'scale(-1,-1)' }}
        />

        <motion.div
          variants={fadeUp}
          style={{
            width: '54px',
            height: '54px',
            margin: '0 auto 18px',
            borderRadius: '50%',
            border: '1px solid var(--gold)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: 'var(--font-script)',
            fontSize: '22px',
            color: 'var(--gold)',
          }}
        >
          B&amp;G
        </motion.div>

        <motion.p
          variants={fadeUp}
          style={{
            fontFamily: 'var(--font-body)',
            fontStyle: 'italic',
            color: 'var(--text-medium)',
            fontSize: '15px',
            lineHeight: 1.6,
            margin: '0 0 22px',
          }}
        >
          Together with our families, we joyfully invite you to celebrate
          the union of
        </motion.p>

        <motion.h1
          variants={fadeUp}
          style={{
            fontSize: '42px',
            color: 'var(--maroon)',
            lineHeight: 1.15,
          }}
        >
          Bride&rsquo;s Name
        </motion.h1>

        <motion.div
          variants={fadeUp}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '14px',
            margin: '10px 0',
          }}
        >
          <span style={{ width: '36px', height: '1px', background: 'rgba(201,148,42,0.5)' }} />
          <span
            style={{
              fontFamily: 'var(--font-script)',
              fontSize: '26px',
              color: 'var(--gold)',
            }}
          >
            &amp;
          </span>
          <span style={{ width: '36px', height: '1px', background: 'rgba(201,148,42,0.5)' }} />
        </motion.div>

        <motion.h1
          variants={fadeUp}
          style={{
            fontSize: '42px',
            color: 'var(--maroon)',
            lineHeight: 1.15,
            marginBottom: '22px',
          }}
        >
          Groom&rsquo;s Name
        </motion.h1>

        <motion.p
          variants={fadeUp}
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: '14px',
            color: 'var(--text-medium)',
          }}
        >
          Daughter of Mr. &amp; Mrs. Bride-Parents
          <br />
          Son of Mr. &amp; Mrs. Groom-Parents
        </motion.p>
      </motion.div>

      <motion.div
        animate={{ y: [0, 8, 0] }}
        transition={{ repeat: Infinity, duration: 2 }}
        style={{
          position: 'absolute',
          bottom: '18px',
          left: 0,
          right: 0,
          textAlign: 'center',
          fontSize: '11px',
          letterSpacing: '0.3em',
          color: 'var(--maroon)',
          zIndex: 2,
        }}
      >
        SCROLL TO SEE MORE
      </motion.div>
    </section>
  )
}
