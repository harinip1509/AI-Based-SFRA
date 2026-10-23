import { motion, useScroll, useTransform } from 'framer-motion'
import { useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTheme } from '../lib/theme'

export function CTA() {
  const { isDark } = useTheme()
  const ref = useRef(null)
  const navigate = useNavigate()
  const hasToken = () => Boolean(localStorage.getItem('token'))
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] })
  const scale = useTransform(scrollYProgress, [0, 0.5], [0.96, 1])

  return (
    <section id="about" ref={ref} className="section" style={{ paddingTop: '100px', paddingBottom: '100px', overflow: 'hidden' }}>
      <div
        aria-hidden
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          zIndex: 0,
          background: isDark
            ? 'radial-gradient(ellipse at 50% 60%, rgba(2,132,199,0.15) 0%, rgba(37,99,235,0.06) 40%, transparent 70%)'
            : 'radial-gradient(ellipse at 50% 60%, rgba(2,132,199,0.08) 0%, rgba(37,99,235,0.03) 40%, transparent 70%)',
        }}
      />

      <motion.div style={{ scale }} className="container">
        <div style={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '10px',
              marginBottom: '32px',
              padding: '7px 22px',
              borderRadius: '100px',
              background: isDark ? 'rgba(2,132,199,0.1)' : 'rgba(2,132,199,0.08)',
              border: `1px solid ${isDark ? 'rgba(2,132,199,0.25)' : 'rgba(2,132,199,0.3)'}`,
              backdropFilter: 'blur(12px)',
            }}
          >
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#0284C7', animation: 'pulse-dot 2s infinite', flexShrink: 0 }} />
            <span style={{ fontSize: '11px', fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: isDark ? 'rgba(255,255,255,0.85)' : '#0369A1' }}>
              Field-Deployable Platform
            </span>
          </motion.div>

          {/* Headline */}
          <motion.h2
            initial={{ opacity: 0, y: 32 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.75, ease: [0.16, 1, 0.3, 1] }}
            style={{
              fontSize: 'clamp(36px, 5.5vw, 60px)',
              fontWeight: 900,
              lineHeight: 1.15,
              letterSpacing: '-0.03em',
              marginBottom: '20px',
              color: isDark ? '#FFFFFF' : '#0F172A',
            }}
          >
            Advance Substation Reliability
            <br />
            <span
              className="glow-text"
              style={{
                background: 'linear-gradient(135deg, #0284C7 0%, #2563EB 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              with AI-Powered SFRA Diagnostics
            </span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            style={{
              fontSize: '16px',
              color: isDark ? 'rgba(255,255,255,0.55)' : '#475569',
              marginBottom: '44px',
              maxWidth: '520px',
              margin: '0 auto 44px',
              lineHeight: 1.75,
            }}
          >
            Equipping electrical utility testing teams, maintenance divisions, and substation engineers with instantaneous, objective transformer analytics.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', justifyContent: 'center' }}
          >
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
              className="btn-primary"
              onClick={() => navigate('/login')}
              style={{
                color: '#fff',
                fontWeight: 700,
                padding: '15px 34px',
                borderRadius: '8px',
                fontSize: '15px',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              Sign In to Platform →
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate('/register')}
              style={{
                color: isDark ? '#F1F5F9' : '#0F172A',
                fontWeight: 700,
                padding: '15px 30px',
                borderRadius: '8px',
                fontSize: '15px',
                background: isDark ? '#1E293B' : '#FFFFFF',
                border: `1.5px solid ${isDark ? '#334155' : '#CBD5E1'}`,
                cursor: 'pointer',
                boxShadow: isDark ? 'none' : '0 2px 8px rgba(0,0,0,0.06)',
              }}
            >
              Create Account
            </motion.button>
          </motion.div>
        </div>
      </motion.div>
    </section>
  )
}

export function Footer() {
  const { isDark } = useTheme()

  const hrefByLabel = {
    Features: '#features',
    Technology: '#technology',
    About: '#about',
  }

  return (
    <footer style={{ position: 'relative', paddingBottom: '48px' }}>
      {/* Glow divider */}
      <div
        style={{
          height: '1px',
          background: isDark
            ? 'linear-gradient(90deg, transparent 0%, rgba(2,132,199,0.5) 30%, rgba(37,99,235,0.6) 70%, transparent 100%)'
            : 'linear-gradient(90deg, transparent 0%, rgba(2,132,199,0.3) 30%, rgba(37,99,235,0.3) 70%, transparent 100%)',
          boxShadow: isDark ? '0 0 20px rgba(2,132,199,0.3)' : 'none',
          marginBottom: '48px',
        }}
      />

      <div className="container">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '48px', flexWrap: 'wrap', marginBottom: '40px' }}>
          {/* Brand */}
          <div style={{ maxWidth: '300px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
              <div
                style={{
                  width: '30px',
                  height: '30px',
                  borderRadius: '6px',
                  background: '#0284C7',
                  boxShadow: '0 0 14px rgba(2,132,199,0.45)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  color: '#FFFFFF',
                  fontWeight: 800,
                  fontSize: '15px',
                }}
              >
                ⚡
              </div>
              <span style={{ fontSize: '18px', fontWeight: 800, color: isDark ? '#FFFFFF' : '#0F172A' }}>
                Intelli<span style={{ color: '#0284C7' }}>FRA</span>
              </span>
            </div>
            <p style={{ fontSize: '13px', color: isDark ? 'rgba(255,255,255,0.45)' : '#64748B', lineHeight: 1.7 }}>
              AI-powered transformer diagnostics platform complying with IS 2026, CBIP 317, and IEEE C57.149 standards. Built for the Indian power sector.
            </p>
          </div>

          {/* Links */}
          <div style={{ display: 'flex', gap: '56px', flexWrap: 'wrap' }}>
            {[
              { heading: 'Overview', color: '#0284C7', items: ['Features', 'Technology', 'About'] },
              { heading: 'Compliance', color: '#2563EB', items: ['CBIP 317', 'IS 2026', 'IEEE C57.149', 'CEA Norms'] },
            ].map((col) => (
              <div key={col.heading}>
                <div style={{ fontSize: '11px', fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: col.color, marginBottom: '16px' }}>
                  {col.heading}
                </div>
                {col.items.map((l) => (
                  hrefByLabel[l] ? (
                    <a
                      key={l}
                      href={hrefByLabel[l]}
                      style={{
                        display: 'block',
                        fontSize: '14px',
                        color: isDark ? 'rgba(255,255,255,0.5)' : '#64748B',
                        marginBottom: '10px',
                        cursor: 'pointer',
                        textDecoration: 'none',
                        transition: 'color 0.2s',
                      }}
                      onMouseEnter={e => e.currentTarget.style.color = '#0284C7'}
                      onMouseLeave={e => e.currentTarget.style.color = isDark ? 'rgba(255,255,255,0.5)' : '#64748B'}
                    >
                      {l}
                    </a>
                  ) : (
                    <div
                      key={l}
                      style={{
                        fontSize: '14px',
                        color: isDark ? 'rgba(255,255,255,0.5)' : '#64748B',
                        marginBottom: '10px',
                        cursor: 'pointer',
                        transition: 'color 0.2s',
                      }}
                      onMouseEnter={e => e.currentTarget.style.color = '#0284C7'}
                      onMouseLeave={e => e.currentTarget.style.color = isDark ? 'rgba(255,255,255,0.5)' : '#64748B'}
                    >
                      {l}
                    </div>
                  )
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Bottom */}
        <div
          style={{
            borderTop: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : '#E2E8F0'}`,
            paddingTop: '24px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '16px',
          }}
        >
          <span style={{ fontSize: '13px', color: isDark ? 'rgba(255,255,255,0.35)' : '#94A3B8' }}>
            © 2026 IntelliFRA · Smart India Hackathon (SIH) Transformer Asset Intelligence
          </span>
          <div style={{ display: 'flex', gap: '24px' }}>
            {['Privacy Policy', 'Standard Terms', 'Grid Security'].map((l) => (
              <span
                key={l}
                style={{
                  fontSize: '13px',
                  color: isDark ? 'rgba(255,255,255,0.35)' : '#94A3B8',
                  cursor: 'pointer',
                  transition: 'color 0.2s',
                }}
                onMouseEnter={e => e.currentTarget.style.color = '#0284C7'}
                onMouseLeave={e => e.currentTarget.style.color = isDark ? 'rgba(255,255,255,0.35)' : '#94A3B8'}
              >
                {l}
              </span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}
