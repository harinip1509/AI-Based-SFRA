import { motion } from 'framer-motion'
import { useTheme } from '../lib/theme'

const techs = [
  {
    title: 'Machine Learning',
    subtitle: 'CNN + Transformer Models',
    desc: 'Multi-label fault classifiers trained on 50,000+ FRA sweeps using 1D convolutional residual networks and attention pooling.',
    icon: (
      <svg viewBox="0 0 48 48" width="40" height="40" fill="none">
        <circle cx="24" cy="24" r="6"   stroke="#0284C7" strokeWidth="1.8"/>
        <circle cx="8"  cy="12" r="3.5" stroke="#2563EB" strokeWidth="1.6"/>
        <circle cx="40" cy="12" r="3.5" stroke="#2563EB" strokeWidth="1.6"/>
        <circle cx="8"  cy="36" r="3.5" stroke="#2563EB" strokeWidth="1.6"/>
        <circle cx="40" cy="36" r="3.5" stroke="#2563EB" strokeWidth="1.6"/>
        <line x1="11" y1="14" x2="19" y2="20" stroke="#0284C7" strokeWidth="1.4" opacity="0.7"/>
        <line x1="37" y1="14" x2="29" y2="20" stroke="#0284C7" strokeWidth="1.4" opacity="0.7"/>
        <line x1="11" y1="34" x2="19" y2="28" stroke="#0284C7" strokeWidth="1.4" opacity="0.7"/>
        <line x1="37" y1="34" x2="29" y2="28" stroke="#0284C7" strokeWidth="1.4" opacity="0.7"/>
      </svg>
    ),
    accent: '#0284C7',
    rgb: '2,132,199',
  },
  {
    title: 'Spectral Signal Processing',
    subtitle: 'FFT + CBIP Sub-Banding',
    desc: 'High-resolution frequency response analysis using adaptive windowing, cross-correlation metrics, and logarithmic spline interpolation.',
    icon: (
      <svg viewBox="0 0 48 48" width="40" height="40" fill="none">
        <polyline points="2,30 7,20 13,36 20,10 27,38 33,18 39,28 46,22"
          stroke="#2563EB" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
        <line x1="2"  y1="40" x2="46" y2="40" stroke="#2563EB" strokeWidth="1" opacity="0.35"/>
        <line x1="2"  y1="8"  x2="2"  y2="40" stroke="#2563EB" strokeWidth="1" opacity="0.35"/>
      </svg>
    ),
    accent: '#2563EB',
    rgb: '37,99,235',
  },
  {
    title: 'Universal Ingestion',
    subtitle: 'Cross-Vendor Normalization',
    desc: 'Automatic parsing and normalization of FRA data from Omicron, Doble, Megger, DV-Win, and standard utility test records.',
    icon: (
      <svg viewBox="0 0 48 48" width="40" height="40" fill="none">
        <rect x="5"  y="9"  width="16" height="11" rx="3" stroke="#0284C7" strokeWidth="1.8"/>
        <rect x="5"  y="28" width="16" height="11" rx="3" stroke="#0284C7" strokeWidth="1.8"/>
        <rect x="27" y="18" width="16" height="12" rx="3" stroke="#2563EB" strokeWidth="1.8"/>
        <line x1="21" y1="14" x2="27" y2="22" stroke="#0284C7" strokeWidth="1.4" opacity="0.7"/>
        <line x1="21" y1="34" x2="27" y2="26" stroke="#0284C7" strokeWidth="1.4" opacity="0.7"/>
      </svg>
    ),
    accent: '#0284C7',
    rgb: '2,132,199',
  },
  {
    title: 'GIS Proximity Radar',
    subtitle: 'Indian Transmission Grid',
    desc: 'Haversine geodesic mapping with real-time routing to nearest 765 kV / 400 kV substations across MSETCL, Tata Power, and PGCIL.',
    icon: (
      <svg viewBox="0 0 48 48" width="40" height="40" fill="none">
        <circle cx="24" cy="24" r="18" stroke="#0284C7" strokeWidth="1.6" strokeDasharray="4 2"/>
        <circle cx="24" cy="24" r="10" stroke="#2563EB" strokeWidth="1.6"/>
        <circle cx="24" cy="24" r="3" fill="#0284C7"/>
        <line x1="24" y1="6" x2="24" y2="42" stroke="#0284C7" strokeWidth="1" opacity="0.4"/>
        <line x1="6" y1="24" x2="42" y2="24" stroke="#0284C7" strokeWidth="1" opacity="0.4"/>
      </svg>
    ),
    accent: '#0284C7',
    rgb: '2,132,199',
  },
]

export default function Technology() {
  const { isDark } = useTheme()

  return (
    <section id="technology" className="section">
      <div className="container" style={{ position: 'relative', zIndex: 1 }}>
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
          style={{ textAlign: 'center', marginBottom: '64px' }}
        >
          <div
            className="section-label"
            style={{
              color: '#0284C7',
              background: isDark ? 'rgba(2,132,199,0.1)' : 'rgba(2,132,199,0.08)',
              border: `1px solid ${isDark ? 'rgba(2,132,199,0.25)' : 'rgba(2,132,199,0.3)'}`,
              margin: '0 auto 20px',
            }}
          >
            Engineering Foundation
          </div>
          <h2 className="section-title">The Technology Architecture</h2>
          <p className="section-desc">Four core pillars of industrial signal processing working in harmony.</p>
        </motion.div>

        {/* 2×2 grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '22px' }}>
          {techs.map((t, i) => (
            <motion.div
              key={t.title}
              className="glass-card"
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] }}
              whileHover={{ scale: 1.02, y: -4 }}
              style={{ padding: '32px', display: 'flex', gap: '24px', alignItems: 'flex-start', cursor: 'default' }}
            >
              {/* Icon container */}
              <div
                style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '14px',
                  flexShrink: 0,
                  background: isDark
                    ? `linear-gradient(145deg, rgba(${t.rgb},0.2) 0%, rgba(${t.rgb},0.06) 100%)`
                    : `linear-gradient(145deg, rgba(${t.rgb},0.12) 0%, rgba(${t.rgb},0.04) 100%)`,
                  border: `1px solid rgba(${t.rgb},0.3)`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: `0 0 20px rgba(${t.rgb},0.12)`,
                }}
              >
                {t.icon}
              </div>

              {/* Text */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: '11px',
                    fontWeight: 800,
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase',
                    color: t.accent,
                    marginBottom: '6px',
                  }}
                >
                  {t.subtitle}
                </div>
                <h3
                  style={{
                    fontSize: '17px',
                    fontWeight: 800,
                    color: isDark ? '#FFFFFF' : '#0F172A',
                    marginBottom: '8px',
                    letterSpacing: '-0.01em',
                  }}
                >
                  {t.title}
                </h3>
                <p
                  style={{
                    fontSize: '13.5px',
                    color: isDark ? 'rgba(255,255,255,0.6)' : '#475569',
                    lineHeight: 1.65,
                  }}
                >
                  {t.desc}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
