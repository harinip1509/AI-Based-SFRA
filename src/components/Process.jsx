import { motion } from 'framer-motion'
import { useTheme } from '../lib/theme'

const steps = [
  { num: '01', label: 'Upload Data',     icon: '⬆', desc: 'Raw SFRA & DGA records',  active: false },
  { num: '02', label: 'Standardize',     icon: '⚡', desc: 'CBIP 317 logarithmic grid', active: false },
  { num: '03', label: 'AI Analysis',     icon: '🧠', desc: 'Deep CNN feature maps',    active: true  },
  { num: '04', label: 'Fault Detection', icon: '🔍', desc: 'Sub-band classification',  active: false },
  { num: '05', label: 'Field Report',    icon: '📊', desc: 'CEA actionable advisory',   active: false },
]

const NODE_SIZE = 82

export default function Process() {
  const { isDark } = useTheme()

  return (
    <section className="section" style={{ paddingTop: '80px', paddingBottom: '80px' }}>
      <div className="container">
        <div className="neon-line" style={{ marginBottom: '80px' }} />

        {/* ── Header ── */}
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
          style={{ textAlign: 'center', marginBottom: '72px' }}
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
            Workflow Architecture
          </div>
          <h2 className="section-title">From Raw Sweep to Diagnostic Action</h2>
          <p className="section-desc">
            End-to-end automated pipeline adhering to IS 2026 and CBIP Publication 317.
          </p>
        </motion.div>

        {/* ── Flow layout ── */}
        <div style={{ position: 'relative' }}>
          {/* ── Connector track row ── */}
          <div
            style={{
              position: 'relative',
              height: `${NODE_SIZE}px`,
              display: 'flex',
              alignItems: 'center',
            }}
          >
            {/* Static gradient track */}
            <div
              style={{
                position: 'absolute',
                top: '50%',
                left: 0,
                right: 0,
                height: '2px',
                transform: 'translateY(-50%)',
                borderRadius: '2px',
                background: isDark
                  ? 'linear-gradient(90deg, rgba(2,132,199,0.22), rgba(37,99,235,0.95) 50%, rgba(2,132,199,0.22))'
                  : 'linear-gradient(90deg, rgba(2,132,199,0.2), rgba(2,132,199,0.7) 50%, rgba(2,132,199,0.2))',
              }}
            />

            {/* ── Nodes ── */}
            <div
              style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                zIndex: 2,
              }}
            >
              {steps.map((step, i) => (
                <motion.div
                  key={step.num}
                  initial={{ opacity: 0, scale: 0.7 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.45, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] }}
                  whileHover={{ scale: 1.12, y: -4 }}
                  style={{
                    width:  `${NODE_SIZE}px`,
                    height: `${NODE_SIZE}px`,
                    borderRadius: '20px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '5px',
                    cursor: 'default',
                    flexShrink: 0,
                    position: 'relative',
                    background: step.active
                      ? (isDark ? 'linear-gradient(145deg,#0D2A3A,#0A1F30)' : '#E0F2FE')
                      : (isDark ? 'linear-gradient(145deg,#0D1B2A,#091525)' : '#FFFFFF'),
                    border: step.active
                      ? '2px solid #0284C7'
                      : `1.5px solid ${isDark ? 'rgba(2,132,199,0.3)' : '#CBD5E1'}`,
                    boxShadow: step.active
                      ? '0 0 20px rgba(2,132,199,0.4), 0 0 40px rgba(2,132,199,0.2)'
                      : (isDark ? 'none' : '0 4px 12px rgba(0,0,0,0.05)'),
                    animation: step.active ? 'node-pulse 2.5s ease-in-out infinite' : 'none',
                    transition: 'all 0.3s ease',
                  }}
                >
                  <span style={{ fontSize: '26px', lineHeight: 1 }}>{step.icon}</span>
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: 800,
                      letterSpacing: '0.1em',
                      color: step.active ? '#0284C7' : (isDark ? 'rgba(255,255,255,0.6)' : '#64748B'),
                    }}
                  >
                    {step.num}
                  </span>

                  {/* Pulsing outer ring for the active node */}
                  {step.active && (
                    <motion.div
                      animate={{ scale: [1, 1.4, 1], opacity: [0.45, 0, 0.45] }}
                      transition={{ duration: 2.2, repeat: Infinity }}
                      style={{
                        position: 'absolute',
                        inset: '-8px',
                        borderRadius: '26px',
                        border: '1.5px solid #0284C7',
                        pointerEvents: 'none',
                      }}
                    />
                  )}
                </motion.div>
              ))}
            </div>
          </div>

          {/* ── Labels row ── */}
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
              marginTop: '22px',
            }}
          >
            {steps.map((step, i) => (
              <motion.div
                key={`label-${step.num}`}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.15 + i * 0.08 }}
                style={{
                  width: `${NODE_SIZE}px`,
                  flexShrink: 0,
                  textAlign: 'center',
                }}
              >
                <div
                  style={{
                    fontSize: '13px',
                    fontWeight: 700,
                    color: step.active
                      ? (isDark ? '#FFFFFF' : '#0284C7')
                      : (isDark ? 'rgba(255,255,255,0.85)' : '#1E293B'),
                    marginBottom: '5px',
                  }}
                >
                  {step.label}
                </div>
                <div
                  style={{
                    fontSize: '11px',
                    color: isDark ? 'rgba(255,255,255,0.45)' : '#64748B',
                    lineHeight: 1.5,
                  }}
                >
                  {step.desc}
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="neon-line" style={{ marginTop: '80px' }} />
      </div>
    </section>
  )
}
