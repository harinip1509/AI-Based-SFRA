import { motion } from 'framer-motion'

const steps = [
  { num: '01', label: 'Upload Data',     icon: '⬆', desc: 'FRA files, any manufacturer',  active: false },
  { num: '02', label: 'Standardize',     icon: '⚡', desc: 'Normalize & format signals',   active: false },
  { num: '03', label: 'AI Analysis',     icon: '🧠', desc: 'Deep learning extraction',     active: true  },
  { num: '04', label: 'Fault Detection', icon: '🔍', desc: 'Multi-class classification',   active: false },
  { num: '05', label: 'Insights',        icon: '📊', desc: 'Actionable diagnostic report', active: false },
]

// Node dimensions
const NODE_SIZE = 82   // px — square node
const NODE_R    = NODE_SIZE / 2  // half-width, used to compute dot centres

export default function Process() {
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
              color: '#6C63FF',
              background: 'rgba(108,99,255,0.08)',
              border: '1px solid rgba(108,99,255,0.22)',
              margin: '0 auto 20px',
            }}
          >
            How It Works
          </div>
          <h2 className="section-title">From Raw Signal to Diagnosis</h2>
        </motion.div>

        {/* ── Flow layout ──────────────────────────────────────────────────────
            Strategy:
              • The connector track is a BLOCK element (not absolute) so it
                participates in layout and sets the row height.
              • Nodes are absolutely positioned ON TOP of the track row,
                centred vertically on it.
              • No z-index battles: nodes have a solid background so the line
                never bleeds through them.
        ─────────────────────────────────────────────────────────────────────── */}
        <div style={{ position: 'relative' }}>

          {/* ── Connector track row  (block, sets height for absolute children) ── */}
          <div style={{
            position: 'relative',
            height: `${NODE_SIZE}px`,
            display: 'flex',
            alignItems: 'center',
          }}>

            {/* Static gradient track — full 100% width, centred vertically */}
            <div style={{
              position: 'absolute',
              top: '50%',
              left: 0,
              right: 0,
              height: '2px',
              transform: 'translateY(-50%)',
              borderRadius: '2px',
              background: 'linear-gradient(90deg,rgba(0,212,255,0.22),rgba(108,99,255,0.95) 50%,rgba(0,212,255,0.22))',
              boxShadow: '0 0 8px rgba(108,99,255,0.45), 0 0 18px rgba(0,212,255,0.22)',
              zIndex: 0,
            }} />

            {/* Continuous glow sweep — behind nodes (no overlap) */}
            <div style={{
              position: 'absolute',
              top: '50%',
              left: 0,
              right: 0,
              height: '10px',
              transform: 'translateY(-50%)',
              overflow: 'hidden',
              zIndex: 1,
              pointerEvents: 'none',
              borderRadius: '8px',
            }}>
              {/**
               * Two staggered sweeps = seamless loop (no visible jump).
               * Wide travel range ensures it reaches the last step.
               */}
              <motion.div
                animate={{ x: ['-70%', '170%'] }}
                transition={{ duration: 1.45, repeat: Infinity, ease: 'linear' }}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '46%',
                  height: '100%',
                  background: 'linear-gradient(90deg,transparent,rgba(0,212,255,1),rgba(180,240,255,0.85),rgba(0,212,255,1),transparent)',
                  filter: 'blur(3px)',
                  opacity: 0.95,
                }}
              />
              <motion.div
                animate={{ x: ['-70%', '170%'] }}
                transition={{ duration: 1.45, repeat: Infinity, ease: 'linear', delay: 0.725 }}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '46%',
                  height: '100%',
                  background: 'linear-gradient(90deg,transparent,rgba(0,212,255,1),rgba(180,240,255,0.85),rgba(0,212,255,1),transparent)',
                  filter: 'blur(3px)',
                  opacity: 0.75,
                }}
              />
            </div>

            {/* ── Nodes — flex children so they auto-space across full width ── */}
            <div style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              zIndex: 2,                  /* above track (z:0) and sweep (z:1) */
            }}>
              {steps.map((step, i) => (
                <motion.div
                  key={step.num}
                  initial={{ opacity: 0, scale: 0.7 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.45, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] }}
                  whileHover={{ scale: 1.12, y: -5 }}
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
                    // Solid opaque background so the connector line is hidden behind node
                    background: step.active
                      ? 'linear-gradient(145deg,#0D2A3A,#0A1F30)'
                      : 'linear-gradient(145deg,#0D1B2A,#091525)',
                    border: step.active
                      ? '1.5px solid rgba(0,212,255,0.75)'
                      : '1.5px solid rgba(0,212,255,0.22)',
                    boxShadow: step.active
                      ? '0 0 20px rgba(0,212,255,0.5), 0 0 40px rgba(0,212,255,0.2), inset 0 0 12px rgba(0,212,255,0.08)'
                      : '0 0 0 1px rgba(0,212,255,0.08), inset 0 0 8px rgba(0,212,255,0.04)',
                    animation: step.active ? 'node-pulse 2.5s ease-in-out infinite' : 'none',
                    transition: 'box-shadow 0.3s ease, border-color 0.3s ease',
                  }}
                >
                  <span style={{ fontSize: '26px', lineHeight: 1 }}>{step.icon}</span>
                  <span style={{
                    fontSize: '10px', fontWeight: 800, letterSpacing: '0.1em',
                    color: step.active ? '#00D4FF' : 'rgba(0,212,255,0.5)',
                  }}>
                    {step.num}
                  </span>

                  {/* Pulsing outer ring for the active node */}
                  {step.active && (
                    <motion.div
                      animate={{ scale: [1, 1.5, 1], opacity: [0.45, 0, 0.45] }}
                      transition={{ duration: 2.2, repeat: Infinity }}
                      style={{
                        position: 'absolute', inset: '-10px',
                        borderRadius: '28px',
                        border: '1.5px solid rgba(0,212,255,0.4)',
                        pointerEvents: 'none',
                      }}
                    />
                  )}
                </motion.div>
              ))}
            </div>
          </div>

          {/* ── Labels row — sits below the connector row, no overlap ── */}
          <div style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            marginTop: '22px',
          }}>
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
                <div style={{
                  fontSize: '13px', fontWeight: 700,
                  color: step.active ? '#fff' : 'rgba(255,255,255,0.75)',
                  marginBottom: '5px',
                }}>
                  {step.label}
                </div>
                <div style={{
                  fontSize: '11px',
                  color: 'rgba(255,255,255,0.37)',
                  lineHeight: 1.55,
                }}>
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
