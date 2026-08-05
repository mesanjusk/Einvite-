import { motion } from 'framer-motion'
import { fadeUp, stagger } from '../animations'
import PetalField from './PetalField'

export default function FinalSlide() {
  return (
    <>
      <section
        style={{
          position: 'relative',
          minHeight: '100svh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '48px 24px',
          background: 'var(--cream)',
          overflow: 'hidden',
        }}
      >
        <PetalField count={12} seed={31} />

        <motion.div
          variants={stagger}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
          style={{ position: 'relative', zIndex: 2, textAlign: 'center', width: '100%' }}
        >
          <motion.p variants={fadeUp} className="eyebrow" style={{ color: 'var(--gold)' }}>
            OUR STORY
          </motion.p>
          <motion.h2
            variants={fadeUp}
            style={{ fontSize: '48px', color: 'var(--maroon)', margin: '6px 0 32px' }}
          >
            Forever Us
          </motion.h2>

          <motion.div
            variants={fadeUp}
            style={{
              position: 'relative',
              width: '78%',
              maxWidth: '280px',
              margin: '0 auto',
            }}
          >
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: '#fff',
                borderRadius: '4px',
                transform: 'rotate(4deg)',
                boxShadow: '0 10px 25px rgba(90,40,20,0.15)',
              }}
            />
            <div
              style={{
                position: 'relative',
                background: '#fff',
                borderRadius: '4px',
                padding: '10px 10px 28px',
                boxShadow: '0 14px 30px rgba(90,40,20,0.2)',
                transform: 'rotate(-3deg)',
              }}
            >
              <img
                src="/couple.jpg"
                alt="The couple"
                style={{ borderRadius: '2px', aspectRatio: '4 / 5', objectFit: 'cover' }}
              />
            </div>
          </motion.div>
        </motion.div>
      </section>

      <motion.section
        variants={stagger}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-80px' }}
        style={{
          minHeight: '60svh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          padding: '48px 28px',
          background:
            'radial-gradient(120% 100% at 50% 0%, #8a3a3a 0%, var(--maroon) 45%, var(--maroon-dark) 100%)',
        }}
      >
        <motion.h2
          variants={fadeUp}
          style={{
            fontFamily: 'var(--font-script)',
            fontWeight: 400,
            fontSize: '38px',
            color: '#f5e6c8',
            margin: '0 0 16px',
          }}
        >
          With love, we can&rsquo;t wait to celebrate with you
        </motion.h2>
        <motion.p
          variants={fadeUp}
          style={{
            fontFamily: 'var(--font-body)',
            fontStyle: 'italic',
            fontSize: '15px',
            color: '#e8c777',
          }}
        >
          Bride &amp; Groom
        </motion.p>
      </motion.section>
    </>
  )
}
