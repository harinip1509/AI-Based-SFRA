import { motion } from 'framer-motion'

const features = [
  {
    icon: (
      <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z"/>
      </svg>
    ),
    title: 'Real-Time Fault Detection',
    desc: 'Detect winding faults, insulation degradation, and core failures within milliseconds using multi-layer CNN architectures.',
    color: '#00D4FF', accent: '0,212,255',
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z"/>
      </svg>
    ),
    title: 'Signal Processing Engine',
    desc: 'Advanced FFT, wavelet transforms, and spectral analysis to extract fault signatures from raw measurement signals.',
    color: '#6C63FF', accent: '108,99,255',
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 2.625c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125"/>
      </svg>
    ),
    title: 'Data Standardization',
    desc: 'Automatic normalization of FRA measurements from any device manufacturer into a unified analysis-ready format.',
    color: '#00D4FF', accent: '0,212,255',
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"/>
      </svg>
    ),
    title: 'Predictive Health Index',
    desc: 'Composite transformer health scoring using ensemble models trained on thousands of historical failure cases.',
    color: '#6C63FF', accent: '108,99,255',
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714a2.25 2.25 0 001.5 2.121"/>
      </svg>
    ),
    title: 'Instant AI Diagnostics',
    desc: 'Upload FRA data and receive a full diagnostic report with fault classification, severity level, and recommended actions.',
    color: '#00D4FF', accent: '0,212,255',
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
        <path d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5"/>
      </svg>
    ),
    title: 'Scalable Cloud Architecture',
    desc: 'Horizontally scalable infrastructure processing thousands of transformer datasets concurrently with sub-second response.',
    color: '#6C63FF', accent: '108,99,255',
  },
]

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.09 } },
}
const cardVariants = {
  hidden:  { opacity: 0, y: 36 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.16, 1, 0.3, 1] } },
}

export default function Features() {
  return (
    <section id="features" className="section">
      <div aria-hidden style={{
        position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0,
        background: 'radial-gradient(ellipse at 50% 40%, rgba(108,99,255,0.08) 0%, transparent 60%)',
      }} />

      <div className="container" style={{ position: 'relative', zIndex: 1 }}>
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
          style={{ textAlign: 'center', marginBottom: '72px' }}
        >
          <div className="section-label" style={{ color: '#00D4FF', background: 'rgba(0,212,255,0.08)', border: '1px solid rgba(0,212,255,0.2)', margin: '0 auto 20px' }}>
            Capabilities
          </div>
          <h2 className="section-title">Built for Industrial Intelligence</h2>
          <p className="section-desc">
            Every feature engineered for precision diagnosis of power transformers at scale.
          </p>
        </motion.div>

        {/* Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0,1fr))', gap: '22px' }}
        >
          {features.map((f) => (
            <motion.div
              key={f.title}
              variants={cardVariants}
              whileHover={{ scale: 1.025, y: -6 }}
              className="glass-card"
              style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '20px', cursor: 'default' }}
            >
              {/* Icon */}
              <div style={{
                width: '52px', height: '52px', borderRadius: '14px', flexShrink: 0,
                background: `linear-gradient(135deg, rgba(${f.accent},0.18) 0%, rgba(${f.accent},0.06) 100%)`,
                border: `1px solid rgba(${f.accent},0.28)`,
                color: f.color,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: `0 0 20px rgba(${f.accent},0.12)`,
              }}>
                {f.icon}
              </div>
              {/* Text */}
              <div style={{ flex: 1 }}>
                <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#fff', marginBottom: '10px', letterSpacing: '-0.01em' }}>{f.title}</h3>
                <p style={{ fontSize: '13.5px', color: 'rgba(255,255,255,0.48)', lineHeight: 1.7 }}>{f.desc}</p>
              </div>
              {/* Bottom accent */}
              <div style={{
                height: '1px',
                background: `linear-gradient(90deg, rgba(${f.accent},0.4), rgba(${f.accent},0.1), transparent)`,
              }} />
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
