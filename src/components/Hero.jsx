import { Canvas } from '@react-three/fiber'
import { Suspense, useEffect, useRef, useState } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import WaveScene from './WaveScene'
import { mouse } from './waveMouse'

function HeroCanvas() {
  return (
    <Canvas
      camera={{ position: [0, 0, 8], fov: 62 }}
      dpr={[1, 2]}
      performance={{ min: 0.5 }}
      gl={{ antialias: true, alpha: false, powerPreference: 'high-performance', toneMapping: 3 }}
      style={{ width: '100%', height: '100%', display: 'block' }}
    >
      <Suspense fallback={null}>
        <WaveScene />
      </Suspense>
    </Canvas>
  )
}

export default function Hero() {
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
        <HeroCanvas />
      </div>

      {/* z1 — overlays */}
      <div aria-hidden style={{
        position: 'absolute', inset: 0, zIndex: 1, pointerEvents: 'none',
        background: 'linear-gradient(100deg, rgba(11,15,26,0.96) 0%, rgba(11,15,26,0.72) 38%, rgba(11,15,26,0.28) 65%, rgba(11,15,26,0.05) 100%)',
      }}/>
      <div aria-hidden style={{
        position: 'absolute', inset: 0, zIndex: 1, pointerEvents: 'none',
        background: 'linear-gradient(to top, rgba(11,15,26,1) 0%, rgba(11,15,26,0.65) 10%, transparent 32%)',
      }}/>
      <div aria-hidden style={{
        position: 'absolute', inset: 0, zIndex: 1, pointerEvents: 'none',
        background: 'linear-gradient(to bottom, rgba(11,15,26,0.55) 0%, transparent 16%)',
      }}/>
      <div aria-hidden style={{
        position: 'absolute', top: 0, left: 0, width: '58%', height: '100%', zIndex: 1, pointerEvents: 'none',
        background: 'radial-gradient(ellipse at 18% 55%, rgba(108,99,255,0.24) 0%, transparent 55%)',
      }}/>
      <div aria-hidden style={{
        position: 'absolute', top: 0, left: 0, width: '50%', height: '100%', zIndex: 1, pointerEvents: 'none',
        background: 'radial-gradient(ellipse at 14% 48%, rgba(0,212,255,0.15) 0%, transparent 46%)',
      }}/>
      {/* Scan line */}
      <div aria-hidden style={{
        position: 'absolute', left: 0, right: 0, height: '1px', zIndex: 2, top: 0, pointerEvents: 'none',
        background: 'linear-gradient(90deg, transparent, rgba(0,212,255,0.45), transparent)',
        animation: 'scan-line 8s linear infinite',
      }}/>

      {/* z10 — UI */}
      <motion.div style={{ y: contentY, opacity: contentOpacity, position: 'relative', zIndex: 10, height: '100%', display: 'flex', alignItems: 'center' }}>
        <div className="container">
          <div style={{ maxWidth: '620px' }}>

            {/* Status badge */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.15, ease: 'easeOut' }}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '10px',
                marginBottom: '36px', padding: '7px 20px', borderRadius: '100px',
                background: 'rgba(0,212,255,0.08)', border: '1px solid rgba(0,212,255,0.25)',
                backdropFilter: 'blur(12px)',
              }}
            >
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', flexShrink: 0, background: '#00D4FF', animation: 'pulse-dot 2s ease-in-out infinite' }}/>
              <span style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.75)' }}>
                AI System Active · v2.4.1
              </span>
            </motion.div>

            {/* H1 */}
            <motion.div
              initial={{ opacity: 0, y: 44 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.85, delay: 0.28, ease: [0.16, 1, 0.3, 1] }}
            >
              <h1 style={{ fontSize: 'clamp(62px,9vw,104px)', fontWeight: 900, lineHeight: 0.95, letterSpacing: '-3px', marginBottom: 0, whiteSpace: 'nowrap' }}>
                <span style={{ color: '#fff' }}>Intelli</span>
                <span className="glow-text" style={{
                  background: 'linear-gradient(135deg, #00D4FF 0%, #6C63FF 100%)',
                  WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
                }}>FRA</span>
              </h1>
              <div style={{
                width: 'min(520px, 100%)', height: '3px',
                background: 'linear-gradient(90deg, #00D4FF, #6C63FF, transparent)',
                borderRadius: '2px', margin: '20px 0 28px',
                boxShadow: '0 0 16px rgba(0,212,255,0.6)',
              }}/>
            </motion.div>

            {/* Subtitle */}
            <motion.p
              initial={{ opacity: 0, y: 28 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.42, ease: 'easeOut' }}
              style={{ fontSize: 'clamp(18px,2.2vw,24px)', fontWeight: 400, color: 'rgba(255,255,255,0.88)', marginBottom: '16px', letterSpacing: '0.01em', lineHeight: 1.4 }}
            >
              AI-Powered Transformer Intelligence
            </motion.p>

            {/* Description */}
            <motion.p
              initial={{ opacity: 0, y: 22 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.54, ease: 'easeOut' }}
              style={{ fontSize: '15px', lineHeight: 1.8, color: 'rgba(255,255,255,0.48)', marginBottom: '44px', maxWidth: '500px' }}
            >
              Real-time fault detection, signal analysis, and predictive diagnostics for industrial power transformers — powered by deep learning and advanced signal processing.
            </motion.p>

            {/* Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.68, ease: 'easeOut' }}
              style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', marginBottom: '60px' }}
            >
              <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }} className="btn-primary"
                onClick={() => navigate(hasToken() ? '/dashboard' : '/register')}
                style={{ color: '#fff', fontWeight: 700, padding: '16px 36px', borderRadius: '14px', fontSize: '15px', letterSpacing: '0.02em' }}>
                Get Started →
              </motion.button>
              <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }} className="btn-glass"
                onClick={() => navigate(hasToken() ? '/dashboard' : '/login')}
                style={{ color: '#fff', fontWeight: 500, padding: '16px 36px', borderRadius: '14px', fontSize: '15px', backdropFilter: 'blur(16px)' }}>
                Watch Demo
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
                <motion.div key={s.label}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.9 + i * 0.1 }}
                  style={{
                    paddingRight: i < stats.length-1 ? '36px' : 0,
                    marginRight:  i < stats.length-1 ? '36px' : 0,
                    borderRight:  i < stats.length-1 ? '1px solid rgba(255,255,255,0.1)' : 'none',
                  }}
                >
                  <div style={{ fontSize: '28px', fontWeight: 900, lineHeight: 1, background: 'linear-gradient(135deg,#fff 0%,#00D4FF 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                    {s.val}
                  </div>
                  <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.38)', marginTop: '6px', letterSpacing: '0.04em' }}>{s.label}</div>
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
        style={{ position: 'absolute', bottom: '36px', left: '50%', transform: 'translateX(-50%)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', zIndex: 10 }}
      >
        <span style={{ fontSize: '10px', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.28)' }}>Scroll</span>
        <motion.div
          animate={{ y: [0, 6, 0] }}
          transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
          style={{
          width: '26px',
          height: '46px',
          borderRadius: '999px',
          border: '1px solid rgba(0,212,255,0.25)',
          background: 'rgba(0,212,255,0.04)',
          boxShadow: '0 0 18px rgba(0,212,255,0.18)',
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
              background: '#00D4FF',
              boxShadow: '0 0 10px rgba(0,212,255,0.8)',
            }}
          />
          <motion.div
            animate={{ opacity: [0.15, 0.35, 0.15] }}
            transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
            style={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(to bottom, transparent 0%, rgba(0,212,255,0.22) 55%, transparent 100%)',
            }}
          />
        </motion.div>

        {/* chevrons */}
        <div aria-hidden style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', marginTop: '2px', opacity: 0.65 }}>
          {[0, 1].map((i) => (
            <motion.div
              key={i}
              animate={{ y: [0, 6, 0], opacity: [0.15, 0.85, 0.15] }}
              transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut', delay: i * 0.18 }}
              style={{
                width: '10px',
                height: '10px',
                transform: 'rotate(45deg)',
                borderRight: '2px solid rgba(0,212,255,0.55)',
                borderBottom: '2px solid rgba(0,212,255,0.55)',
                filter: 'drop-shadow(0 0 10px rgba(0,212,255,0.35))',
              }}
            />
          ))}
        </div>
      </motion.div>
    </section>
  )
}
