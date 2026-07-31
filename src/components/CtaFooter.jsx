import { motion, useScroll, useTransform } from 'framer-motion'
import { useRef } from 'react'
import { useNavigate } from 'react-router-dom'

export function CTA() {
  const ref = useRef(null)
  const navigate = useNavigate()
  const hasToken = () => Boolean(localStorage.getItem('token'))
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] })
  const scale = useTransform(scrollYProgress, [0, 0.5], [0.96, 1])

  return (
    <section id="about" ref={ref} className="section" style={{ paddingTop: '130px', paddingBottom: '130px', overflow: 'hidden' }}>
      {/* Layered background */}
      <div aria-hidden style={{
        position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0,
        background: 'radial-gradient(ellipse at 50% 60%, rgba(108,99,255,0.18) 0%, rgba(0,212,255,0.08) 40%, transparent 70%)',
      }} />
      <div aria-hidden style={{
        position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0,
        backgroundImage: 'linear-gradient(rgba(0,212,255,0.06) 1px,transparent 1px),linear-gradient(90deg,rgba(0,212,255,0.06) 1px,transparent 1px)',
        backgroundSize: '56px 56px',
        maskImage: 'radial-gradient(ellipse at 50% 50%, black 20%, transparent 75%)',
        WebkitMaskImage: 'radial-gradient(ellipse at 50% 50%, black 20%, transparent 75%)',
      }} />
      {/* Glowing orb */}
      <div aria-hidden style={{
        position: 'absolute', top: '50%', left: '50%',
        transform: 'translate(-50%,-50%)',
        width: '400px', height: '400px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(108,99,255,0.15) 0%, transparent 70%)',
        filter: 'blur(40px)',
        pointerEvents: 'none', zIndex: 0,
      }} />

      <motion.div style={{ scale }} className="container" style_={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
        <div style={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '10px',
              marginBottom: '36px', padding: '8px 22px', borderRadius: '100px',
              background: 'rgba(0,212,255,0.09)', border: '1px solid rgba(0,212,255,0.28)',
              backdropFilter: 'blur(12px)',
            }}
          >
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#00D4FF', animation: 'pulse-dot 2s infinite', flexShrink: 0 }} />
            <span style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.75)' }}>
              Ready to Deploy
            </span>
          </motion.div>

          {/* Headline */}
          <motion.h2
            initial={{ opacity: 0, y: 32 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.75, ease: [0.16, 1, 0.3, 1] }}
            style={{
              fontSize: 'clamp(36px, 5.5vw, 64px)',
              fontWeight: 900, lineHeight: 1.12,
              letterSpacing: '-0.03em',
              marginBottom: '24px', color: '#fff',
            }}
          >
            Start analyzing transformer health
            <br />
            <span
              className="glow-text"
              style={{
                background: 'linear-gradient(135deg, #00D4FF 0%, #6C63FF 100%)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
              }}
            >with AI today</span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            style={{ fontSize: '16px', color: 'rgba(255,255,255,0.48)', marginBottom: '52px', maxWidth: '480px', margin: '0 auto 52px', lineHeight: 1.75 }}
          >
            Join power utilities and industrial operators who trust IntelliFRA
            for mission-critical transformer diagnostics.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            style={{ display: 'flex', flexWrap: 'wrap', gap: '18px', justifyContent: 'center' }}
          >
            <motion.button
              whileHover={{ scale: 1.06 }}
              whileTap={{ scale: 0.97 }}
              className="btn-primary"
              onClick={() => navigate(hasToken() ? '/dashboard' : '/register')}
              style={{ color: '#fff', fontWeight: 700, padding: '18px 44px', borderRadius: '14px', fontSize: '16px', letterSpacing: '0.02em' }}
            >
              Create Account — It's Free
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.06 }}
              whileTap={{ scale: 0.97 }}
              className="btn-glass"
              onClick={() => navigate(hasToken() ? '/dashboard' : '/login')}
              style={{ color: '#fff', fontWeight: 500, padding: '18px 44px', borderRadius: '14px', fontSize: '16px', backdropFilter: 'blur(16px)' }}
            >
              Login →
            </motion.button>
          </motion.div>
        </div>
      </motion.div>
    </section>
  )
}

export function Footer() {
  const hrefByLabel = {
    Features: '#features',
    Technology: '#technology',
    About: '#about',
  }

  return (
    <footer style={{ position: 'relative', paddingBottom: '52px' }}>
      {/* Glow divider */}
      <div style={{
        height: '1px',
        background: 'linear-gradient(90deg, transparent 0%, rgba(0,212,255,0.6) 30%, rgba(108,99,255,0.65) 70%, transparent 100%)',
        boxShadow: '0 0 20px rgba(0,212,255,0.3), 0 0 40px rgba(108,99,255,0.2)',
        marginBottom: '52px',
      }} />

      <div className="container">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '48px', flexWrap: 'wrap', marginBottom: '44px' }}>
          {/* Brand */}
          <div style={{ maxWidth: '280px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
              <div style={{
                width: '30px', height: '30px', borderRadius: '8px',
                background: 'linear-gradient(135deg,#00D4FF,#6C63FF)',
                boxShadow: '0 0 14px rgba(0,212,255,0.45)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none">
                  <path d="M12 2L2 7l10 5 10-5-10-5z" stroke="#fff" strokeWidth="1.6" strokeLinejoin="round"/>
                  <path d="M2 17l10 5 10-5M2 12l10 5 10-5" stroke="#fff" strokeWidth="1.6" strokeLinejoin="round"/>
                </svg>
              </div>
              <span style={{ fontSize: '18px', fontWeight: 800, color: '#fff' }}>
                Intelli<span style={{ color: '#00D4FF' }}>FRA</span>
              </span>
            </div>
            <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.32)', lineHeight: 1.75 }}>
              AI-powered industrial transformer diagnostics platform. Built for the power sector.
            </p>
          </div>

          {/* Links */}
          <div style={{ display: 'flex', gap: '64px', flexWrap: 'wrap' }}>
            {[
              { heading: 'Product', color: '#00D4FF', items: ['Features','Technology','Pricing','API'] },
              { heading: 'Company', color: '#6C63FF', items: ['About','Research','Contact','Blog'] },
            ].map((col) => (
              <div key={col.heading}>
                <div style={{ fontSize: '11px', fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: col.color, marginBottom: '18px' }}>
                  {col.heading}
                </div>
                {col.items.map((l) => (
                  hrefByLabel[l] ? (
                    <a
                      key={l}
                      href={hrefByLabel[l]}
                      style={{ display: 'block', fontSize: '14px', color: 'rgba(255,255,255,0.38)', marginBottom: '12px', cursor: 'pointer', transition: 'color 0.2s', textDecoration: 'none' }}
                      onMouseEnter={e => e.currentTarget.style.color = '#fff'}
                      onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.38)'}
                    >{l}</a>
                  ) : (
                    <div
                      key={l}
                      style={{ fontSize: '14px', color: 'rgba(255,255,255,0.38)', marginBottom: '12px', cursor: 'pointer', transition: 'color 0.2s' }}
                      onMouseEnter={e => e.currentTarget.style.color = '#fff'}
                      onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.38)'}
                    >{l}</div>
                  )
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Bottom */}
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)', paddingTop: '26px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.25)' }}>© 2024 IntelliFRA. All rights reserved.</span>
          <div style={{ display: 'flex', gap: '26px' }}>
            {['Privacy', 'Terms', 'Security'].map((l) => (
              <span key={l}
                style={{ fontSize: '13px', color: 'rgba(255,255,255,0.25)', cursor: 'pointer', transition: 'color 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.color = 'rgba(255,255,255,0.7)'}
                onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.25)'}
              >{l}</span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}
