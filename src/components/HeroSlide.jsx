import { motion } from 'framer-motion'
import { fadeUp, scaleIn } from '../animations'

const shimmerStyle = {
  background:
    'linear-gradient(90deg, #8B6210, #c9942a, #ffe8a0, #c9942a, #8B6210)',
  backgroundSize: '200% auto',
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
}

export default function HeroSlide() {
  return (
    <section style={{ position: 'relative', height: '100svh' }}>
      {/* Background photo */}
      <img
        src="/couple.jpg"
        loading="eager"
        fetchPriority="high"
        decoding="async"
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          objectPosition: 'center 10%', // keeps faces visible on mobile!
        }}
      />
      <div
        style={{
          position: 'relative',
          zIndex: 2,
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
        }}
      >
        {/* TOP — logo + subtitle */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          style={{ padding: '36px 24px 0', textAlign: 'center' }}
        >
          <div
            style={{
              width: '64px',
              height: '64px',
              margin: '0 auto 12px',
              borderRadius: '50%',
              border: '2px solid var(--gold)',
              background: 'rgba(253,248,240,0.85)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: "'Great Vibes', cursive",
              fontSize: '28px',
              color: 'var(--gold)',
            }}
          >
            B&G
          </div>
          <p
            style={{
              letterSpacing: '0.3em',
              fontSize: '12px',
              color: '#fff',
              textShadow: '0 1px 4px rgba(0,0,0,0.6)',
              margin: 0,
            }}
          >
            WE ARE GETTING MARRIED
          </p>
        </motion.div>

        {/* SPACER — couple faces visible here */}
        <div style={{ flex: 1, minHeight: '180px' }} />

        {/* BOTTOM — frosted glass block */}
        <motion.div
          variants={scaleIn}
          initial="hidden"
          animate="visible"
          style={{
            background: 'rgba(15,8,2,0.22)',
            backdropFilter: 'blur(12px)',
            borderRadius: '16px',
            padding: '16px 24px 36px',
            margin: '0 12px',
            textAlign: 'center',
          }}
        >
          <h1
            style={{
              ...shimmerStyle,
              fontFamily: "'Great Vibes', cursive",
              fontSize: '48px',
              margin: 0,
            }}
          >
            Bride's Name
          </h1>
          <p
            style={{
              color: '#fff',
              letterSpacing: '0.2em',
              margin: '4px 0',
              fontSize: '14px',
            }}
          >
            &amp;
          </p>
          <h1
            style={{
              ...shimmerStyle,
              fontFamily: "'Great Vibes', cursive",
              fontSize: '48px',
              margin: 0,
            }}
          >
            Groom's Name
          </h1>
          <p
            style={{
              color: '#f0e3c8',
              fontFamily: "'Cormorant Garamond', serif",
              fontStyle: 'italic',
              marginTop: '10px',
              fontSize: '15px',
            }}
          >
            Together with our families, we invite you to celebrate our
            wedding
          </p>
        </motion.div>
      </div>
    </section>
  )
}
