import { motion } from 'framer-motion'

const techs = [
  {
    title: 'Machine Learning',
    subtitle: 'CNN + Transformer Models',
    desc: 'Multi-label fault classifiers trained on 50,000+ FRA sweeps using convolutional networks and attention mechanisms.',
    icon: (
      <svg viewBox="0 0 48 48" width="44" height="44" fill="none">
        <circle cx="24" cy="24" r="6"   stroke="#00D4FF" strokeWidth="1.6"/>
        <circle cx="8"  cy="12" r="3.5" stroke="#6C63FF" strokeWidth="1.4"/>
        <circle cx="40" cy="12" r="3.5" stroke="#6C63FF" strokeWidth="1.4"/>
        <circle cx="8"  cy="36" r="3.5" stroke="#6C63FF" strokeWidth="1.4"/>
        <circle cx="40" cy="36" r="3.5" stroke="#6C63FF" strokeWidth="1.4"/>
        <line x1="11" y1="14" x2="19" y2="20" stroke="#00D4FF" strokeWidth="1.2" opacity="0.7"/>
        <line x1="37" y1="14" x2="29" y2="20" stroke="#00D4FF" strokeWidth="1.2" opacity="0.7"/>
        <line x1="11" y1="34" x2="19" y2="28" stroke="#00D4FF" strokeWidth="1.2" opacity="0.7"/>
        <line x1="37" y1="34" x2="29" y2="28" stroke="#00D4FF" strokeWidth="1.2" opacity="0.7"/>
      </svg>
    ),
    accent: '#00D4FF', rgb: '0,212,255',
  },
  {
    title: 'Signal Processing',
    subtitle: 'FFT + Wavelet Analysis',
    desc: 'High-resolution frequency response analysis using adaptive windowing, spectral subtraction, and multi-resolution decomposition.',
    icon: (
      <svg viewBox="0 0 48 48" width="44" height="44" fill="none">
        <polyline points="2,30 7,20 13,36 20,10 27,38 33,18 39,28 46,22"
          stroke="#6C63FF" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
        <line x1="2"  y1="40" x2="46" y2="40" stroke="#6C63FF" strokeWidth="0.8" opacity="0.35"/>
        <line x1="2"  y1="8"  x2="2"  y2="40" stroke="#6C63FF" strokeWidth="0.8" opacity="0.35"/>
      </svg>
    ),
    accent: '#6C63FF', rgb: '108,99,255',
  },
  {
    title: 'Data Standardization',
    subtitle: 'Universal Format Engine',
    desc: 'Automatic parsing and normalization of FRA data from Omicron, Doble, DV-Win, and all major industry formats.',
    icon: (
      <svg viewBox="0 0 48 48" width="44" height="44" fill="none">
        <rect x="5"  y="9"  width="16" height="11" rx="3" stroke="#00D4FF" strokeWidth="1.6"/>
        <rect x="5"  y="28" width="16" height="11" rx="3" stroke="#00D4FF" strokeWidth="1.6"/>
        <rect x="27" y="18" width="16" height="12" rx="3" stroke="#6C63FF" strokeWidth="1.6"/>
        <line x1="21" y1="14" x2="27" y2="22" stroke="#00D4FF" strokeWidth="1.2" opacity="0.7"/>
        <line x1="21" y1="34" x2="27" y2="26" stroke="#00D4FF" strokeWidth="1.2" opacity="0.7"/>
      </svg>
    ),
    accent: '#00D4FF', rgb: '0,212,255',
  },
  {
    title: 'Scalable Architecture',
    subtitle: 'Cloud-Native Infrastructure',
    desc: 'Kubernetes-orchestrated microservices with auto-scaling compute, distributed caching, and sub-100ms API response times.',
    icon: (
      <svg viewBox="0 0 48 48" width="44" height="44" fill="none">
        <rect x="16" y="5"  width="16" height="11" rx="3" stroke="#6C63FF" strokeWidth="1.6"/>
        <rect x="3"  y="28" width="14" height="11" rx="3" stroke="#00D4FF" strokeWidth="1.6"/>
        <rect x="31" y="28" width="14" height="11" rx="3" stroke="#00D4FF" strokeWidth="1.6"/>
        <line x1="24" y1="16" x2="10" y2="28" stroke="#6C63FF" strokeWidth="1.2" opacity="0.6"/>
        <line x1="24" y1="16" x2="38" y2="28" stroke="#6C63FF" strokeWidth="1.2" opacity="0.6"/>
        <line x1="24" y1="16" x2="24" y2="28" stroke="#6C63FF" strokeWidth="1.2" opacity="0.4" strokeDasharray="3 2"/>
      </svg>
    ),
    accent: '#6C63FF', rgb: '108,99,255',
  },
]

export default function Technology() {
  return (
    <section id="technology" className="section">
      <div aria-hidden style={{
        position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0,
        background: 'radial-gradient(ellipse at 50% 0%, rgba(108,99,255,0.09) 0%, transparent 55%)',
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
            Under the Hood
          </div>
          <h2 className="section-title">The Technology Stack</h2>
          <p className="section-desc">Four pillars of precision engineering working in concert.</p>
        </motion.div>

        {/* 2×2 grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0,1fr))', gap: '22px' }}>
          {techs.map((t, i) => (
            <motion.div
              key={t.title}
              className="glass-card"
              initial={{ opacity: 0, y: 32 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] }}
              whileHover={{ scale: 1.025, y: -5 }}
              style={{ padding: '32px', display: 'flex', gap: '28px', alignItems: 'flex-start', cursor: 'default' }}
            >
              {/* Icon container */}
              <div style={{
                width: '68px', height: '68px', borderRadius: '18px', flexShrink: 0,
                background: `linear-gradient(145deg, rgba(${t.rgb},0.16) 0%, rgba(${t.rgb},0.06) 100%)`,
                border: `1px solid rgba(${t.rgb},0.25)`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: `0 0 24px rgba(${t.rgb},0.14), inset 0 0 16px rgba(${t.rgb},0.06)`,
              }}>
                {t.icon}
              </div>
              {/* Text */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontSize: '10.5px', fontWeight: 800, letterSpacing: '0.12em',
                  textTransform: 'uppercase', color: t.accent, marginBottom: '7px',
                }}>
                  {t.subtitle}
                </div>
                <h3 style={{ fontSize: '17px', fontWeight: 700, color: '#fff', marginBottom: '10px', letterSpacing: '-0.01em' }}>{t.title}</h3>
                <p style={{ fontSize: '13.5px', color: 'rgba(255,255,255,0.48)', lineHeight: 1.7 }}>{t.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
