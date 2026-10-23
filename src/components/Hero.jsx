import { Canvas } from '@react-three/fiber'
import { Suspense, useEffect, useRef, useState } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import WaveScene from './WaveScene'
import { mouse } from './waveMouse'
import { useTheme } from '../lib/theme'

function HeroCanvas({ isDark }) {
  return (
    <Canvas
      camera={{ position: [0, 0, 8], fov: 62 }}
      dpr={[1, 2]}
      performance={{ min: 0.5 }}
      gl={{ antialias: true, alpha: false, powerPreference: 'high-performance', toneMapping: 3 }}
      style={{ width: '100%', height: '100%', display: 'block' }}
    >
      <Suspense fallback={null}>
        <WaveScene isDark={isDark} />
      </Suspense>
    </Canvas>
  )
}

export default function Hero() {
  const { isDark } = useTheme()
  const sectionRef = useRef(null)
  const { scrollY } = useScroll()
  const navigate = useNavigate()
  const hasToken = () => Boolean(localStorage.getItem('token'))
  const contentY       = useTransform(scrollY, [0, 600], [0, -80])
  const contentOpacity = useTransform(scrollY, [0, 400], [1, 0])

  useEffect(() => {
    const onMove = (e) => {
      mouse.targetX =  (e.clientX / window.innerWidth)  * 2 - 1
      mouse.targetY = -((e.clientY / window.innerHeight) * 2 - 1)
    }
    window.addEventListener('mousemove', onMove)
    return () => window.removeEventListener('mousemove', onMove)
  }, [])

  const [metrics, setMetrics] = useState({ accuracy: '94.4%', latency: '1.2ms' })

  useEffect(() => {
    fetch('/api/fra/metrics')
      .then(res => res.json())
      .then(data => {
        if (data && data.cnn_val_accuracy) {
          const acc = (data.cnn_val_accuracy * 100).toFixed(1) + '%'
          const lat = (data.mean_latency_ms || 1.2).toFixed(1) + 'ms'
          setMetrics({ accuracy: acc, latency: lat })
        }
      })
      .catch(() => {})
  }, [])

  const stats = [
    { val: metrics.accuracy, label: 'Detection Accuracy' },
    { val: metrics.latency,  label: 'Inference Latency'  },
    { val: '500+',  label: 'Assets Monitored'   },
  ]

  return (
    <section
      ref={sectionRef}
      style={{
        position: 'relative',
        width: '100%',
        height: '100vh',
        minHeight: '680px',
        overflow: 'hidden',
        zIndex: 0,
      }}
    >
      {/* z0 — R3F canvas */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
        <HeroCanvas isDark={isDark} />
      </div>

      {/* z1 — dynamic theme overlays */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: 1,
          pointerEvents: 'none',
          background: isDark
            ? 'linear-gradient(100deg, rgba(11,15,26,0.96) 0%, rgba(11,15,26,0.72) 38%, rgba(11,15,26,0.28) 65%, rgba(11,15,26,0.05) 100%)'
            : 'linear-gradient(100deg, rgba(248,250,252,0.96) 0%, rgba(248,250,252,0.78) 38%, rgba(248,250,252,0.30) 65%, rgba(248,250,252,0.05) 100%)',
          transition: 'background 0.35s ease',
        }}
      />
      <div
        aria-hidden
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: 1,
          pointerEvents: 'none',
          background: isDark
            ? 'linear-gradient(to top, rgba(11,15,26,1) 0%, rgba(11,15,26,0.65) 10%, transparent 32%)'
            : 'linear-gradient(to top, rgba(248,250,252,1) 0%, rgba(248,250,252,0.65) 10%, transparent 32%)',
          transition: 'background 0.35s ease',
        }}
      />
      <div
        aria-hidden
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: 1,
          pointerEvents: 'none',
          background: isDark
            ? 'linear-gradient(to bottom, rgba(11,15,26,0.55) 0%, transparent 16%)'
            : 'linear-gradient(to bottom, rgba(248,250,252,0.55) 0%, transparent 16%)',
          transition: 'background 0.35s ease',
        }}
      />
      <div
        aria-hidden
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '58%',
          height: '100%',
          zIndex: 1,
          pointerEvents: 'none',
          background: isDark
            ? 'radial-gradient(ellipse at 18% 55%, rgba(108,99,255,0.24) 0%, transparent 55%)'
            : 'radial-gradient(ellipse at 18% 55%, rgba(2,132,199,0.12) 0%, transparent 55%)',
          transition: 'background 0.35s ease',
        }}
      />
      <div
        aria-hidden
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '50%',
          height: '100%',
          zIndex: 1,
          pointerEvents: 'none',
          background: isDark
            ? 'radial-gradient(ellipse at 14% 48%, rgba(0,212,255,0.15) 0%, transparent 46%)'
            : 'radial-gradient(ellipse at 14% 48%, rgba(14,165,233,0.10) 0%, transparent 46%)',
          transition: 'background 0.35s ease',
        }}
      />

      {/* Scan line */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          height: '1px',
          zIndex: 2,
          top: 0,
          pointerEvents: 'none',
          background: 'linear-gradient(90deg, transparent, rgba(2,132,199,0.5), transparent)',
          animation: 'scan-line 8s linear infinite',
        }}
      />

      {/* z10 — UI */}
      <motion.div
        style={{
          y: contentY,
          opacity: contentOpacity,
          position: 'relative',
          zIndex: 10,
          height: '100%',
          display: 'flex',
          alignItems: 'center',
        }}
      >
        <div className="container">
          <div style={{ maxWidth: '640px' }}>

            {/* Status badge */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.15, ease: 'easeOut' }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '10px',
                marginBottom: '36px',
                padding: '7px 20px',
                borderRadius: '100px',
                background: isDark ? 'rgba(0,212,255,0.08)' : 'rgba(2,132,199,0.1)',
                border: `1px solid ${isDark ? 'rgba(0,212,255,0.25)' : 'rgba(2,132,199,0.3)'}`,
                backdropFilter: 'blur(12px)',
              }}
            >
              <span
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  flexShrink: 0,
                  background: '#0284C7',
                  animation: 'pulse-dot 2s ease-in-out infinite',
                }}
              />
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 800,
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  color: isDark ? 'rgba(255,255,255,0.85)' : '#0369A1',
                }}
              >
                AI System Active · CEA Standard Model
              </span>
            </motion.div>

            {/* H1 */}
            <motion.div
              initial={{ opacity: 0, y: 44 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.85, delay: 0.28, ease: [0.16, 1, 0.3, 1] }}
            >
              <h1
                style={{
                  fontSize: 'clamp(58px,8.5vw,96px)',
                  fontWeight: 900,
                  lineHeight: 0.95,
                  letterSpacing: '-3px',
                  marginBottom: 0,
                  whiteSpace: 'nowrap',
                }}
              >
                <span style={{ color: isDark ? '#FFFFFF' : '#0F172A' }}>Intelli</span>
                <span
                  className="glow-text"
                  style={{
                    background: 'linear-gradient(135deg, #0284C7 0%, #2563EB 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                  }}
                >
                  FRA
                </span>
              </h1>
              <div
                style={{
                  width: 'min(520px, 100%)',
                  height: '3px',
                  background: 'linear-gradient(90deg, #0284C7, #2563EB, transparent)',
                  borderRadius: '2px',
                  margin: '20px 0 28px',
                  boxShadow: '0 0 16px rgba(2,132,199,0.5)',
                }}
              />
            </motion.div>

            {/* Subtitle */}
            <motion.p
              initial={{ opacity: 0, y: 28 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.42, ease: 'easeOut' }}
              style={{
                fontSize: 'clamp(18px,2.2vw,24px)',
                fontWeight: 600,
                color: isDark ? 'rgba(255,255,255,0.92)' : '#1E293B',
                marginBottom: '16px',
                letterSpacing: '-0.01em',
                lineHeight: 1.4,
              }}
            >
              AI-Powered Indian Power Transformer Intelligence
            </motion.p>

            {/* Description */}
            <motion.p
              initial={{ opacity: 0, y: 22 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.54, ease: 'easeOut' }}
              style={{
                fontSize: '15px',
                lineHeight: 1.8,
                color: isDark ? 'rgba(255,255,255,0.55)' : '#475569',
                marginBottom: '40px',
                maxWidth: '520px',
              }}
            >
              Real-time fault detection, frequency response analysis, and multi-modal predictive diagnostics for utility transmission transformers — built for Indian grid conditions.
            </motion.p>

            {/* Buttons: Authentication only */}
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.68, ease: 'easeOut' }}
              style={{ display: 'flex', flexWrap: 'wrap', gap: '14px', marginBottom: '52px' }}
            >
              <motion.button
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.97 }}
                className="btn-primary"
                onClick={() => navigate('/login')}
                style={{
                  color: '#fff',
                  fontWeight: 700,
                  padding: '14px 28px',
                  borderRadius: '8px',
                  fontSize: '14px',
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
                  padding: '14px 24px',
                  borderRadius: '8px',
                  fontSize: '14px',
                  background: isDark ? '#1E293B' : '#FFFFFF',
                  border: `1.5px solid ${isDark ? '#334155' : '#CBD5E1'}`,
                  cursor: 'pointer',
                  boxShadow: isDark ? 'none' : '0 2px 8px rgba(0,0,0,0.06)',
                }}
              >
                Create Account
              </motion.button>
            </motion.div>

            {/* Stats */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1, delay: 0.9 }}
              style={{ display: 'flex', flexWrap: 'wrap' }}
            >
              {stats.map((s, i) => (
                <motion.div
                  key={s.label}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.9 + i * 0.1 }}
                  style={{
                    paddingRight: i < stats.length - 1 ? '36px' : 0,
                    marginRight: i < stats.length - 1 ? '36px' : 0,
                    borderRight: i < stats.length - 1 ? `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}` : 'none',
                  }}
                >
                  <div
                    style={{
                      fontSize: '28px',
                      fontWeight: 900,
                      lineHeight: 1,
                      color: isDark ? '#FFFFFF' : '#0F172A',
                    }}
                  >
                    {s.val}
                  </div>
                  <div
                    style={{
                      fontSize: '11px',
                      color: isDark ? 'rgba(255,255,255,0.45)' : '#64748B',
                      marginTop: '6px',
                      letterSpacing: '0.04em',
                      fontWeight: 600,
                    }}
                  >
                    {s.label}
                  </div>
                </motion.div>
              ))}
            </motion.div>

          </div>
        </div>
      </motion.div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.6, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        style={{
          position: 'absolute',
          bottom: '36px',
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '8px',
          zIndex: 10,
        }}
      >
        <span
          style={{
            fontSize: '10px',
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: isDark ? 'rgba(255,255,255,0.38)' : '#64748B',
            fontWeight: 700,
          }}
        >
          Scroll
        </span>
        <motion.div
          animate={{ y: [0, 6, 0] }}
          transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
          style={{
            width: '26px',
            height: '46px',
            borderRadius: '999px',
            border: `1px solid ${isDark ? 'rgba(2,132,199,0.35)' : 'rgba(2,132,199,0.5)'}`,
            background: isDark ? 'rgba(2,132,199,0.06)' : 'rgba(2,132,199,0.08)',
            boxShadow: '0 0 18px rgba(2,132,199,0.18)',
            position: 'relative',
            overflow: 'hidden',
            backdropFilter: 'blur(10px)',
          }}
        >
          <motion.div
            animate={{ y: [8, 30, 8], opacity: [0.35, 1, 0.35] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: [0.45, 0, 0.55, 1] }}
            style={{
              position: 'absolute',
              left: '50%',
              transform: 'translateX(-50%)',
              width: '5px',
              height: '5px',
              borderRadius: '999px',
              background: '#0284C7',
              boxShadow: '0 0 10px rgba(2,132,199,0.8)',
            }}
          />
        </motion.div>
      </motion.div>
    </section>
  )
}
