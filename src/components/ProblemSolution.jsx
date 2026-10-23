import { motion } from 'framer-motion'
import { useTheme } from '../lib/theme'

const problems = [
  'Manual SFRA visual inspection takes hours of specialized engineer time',
  'High subjectivity — interpretations conflict between field testing teams',
  'Fragmented data silos between SFRA, DGA oil lab tests, and PD monitors',
  'Delayed intervention leads to catastrophic winding short-circuits',
  'Absence of centralized GIS mapping for substation transformers',
]

const solutions = [
  'Instant AI-driven diagnostic evaluation in under 2 seconds',
  'Objective neural network classification based on CBIP 317 standard',
  'Multi-modal automated fusion of SFRA, Duval DGA, and PD telemetry',
  'Early detection of incipient axial & radial mechanical deformation',
  'Live Indian Substation Radar with real-time geodesic proximity routing',
]

const listVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
}
const itemVariants = {
  hidden:  { opacity: 0, x: -16 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.45, ease: 'easeOut' } },
}
const itemVariantsR = {
  hidden:  { opacity: 0, x: 16 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.45, ease: 'easeOut' } },
}

export default function ProblemSolution() {
  const { isDark } = useTheme()

  return (
    <section className="section">
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
            Comparative Impact
          </div>
          <h2 className="section-title">The Field Problem. Our Solution.</h2>
          <p className="section-desc">Indian substation diagnostics have been manual and reactive. We modernize them.</p>
        </motion.div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
          {/* Problems */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            style={{
              borderRadius: '20px',
              padding: '36px',
              background: isDark
                ? 'linear-gradient(145deg, rgba(239,68,68,0.08) 0%, rgba(239,68,68,0.02) 100%)'
                : 'linear-gradient(145deg, rgba(254,242,242,0.95) 0%, rgba(254,226,226,0.5) 100%)',
              border: `1.5px solid ${isDark ? 'rgba(239,68,68,0.25)' : 'rgba(239,68,68,0.35)'}`,
              boxShadow: isDark ? 'none' : '0 4px 20px rgba(239,68,68,0.06)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '28px' }}>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  flexShrink: 0,
                  background: isDark ? 'rgba(239,68,68,0.18)' : '#FEE2E2',
                  border: '1px solid rgba(239,68,68,0.4)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#DC2626" strokeWidth="2">
                  <path d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <h3 style={{ fontSize: '17px', fontWeight: 800, color: '#DC2626' }}>Traditional Field Challenges</h3>
            </div>

            <motion.div
              variants={listVariants}
              initial="hidden"
              whileInView="visible"
              style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}
            >
              {problems.map((p, i) => (
                <motion.div key={i} variants={itemVariants} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                  <div
                    style={{
                      width: '18px',
                      height: '18px',
                      borderRadius: '50%',
                      flexShrink: 0,
                      marginTop: '3px',
                      background: isDark ? 'rgba(239,68,68,0.2)' : '#FEE2E2',
                      border: '1px solid #DC2626',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#DC2626' }} />
                  </div>
                  <span
                    style={{
                      fontSize: '14px',
                      color: isDark ? '#FECACA' : '#7F1D1D',
                      fontWeight: 500,
                      lineHeight: 1.6,
                    }}
                  >
                    {p}
                  </span>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>

          {/* Solutions */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            style={{
              borderRadius: '20px',
              padding: '36px',
              background: isDark
                ? 'linear-gradient(145deg, rgba(2,132,199,0.08) 0%, rgba(37,99,235,0.03) 100%)'
                : 'linear-gradient(145deg, rgba(240,249,255,0.95) 0%, rgba(224,242,254,0.5) 100%)',
              border: `1.5px solid ${isDark ? 'rgba(2,132,199,0.25)' : 'rgba(2,132,199,0.35)'}`,
              boxShadow: isDark ? 'none' : '0 4px 20px rgba(2,132,199,0.06)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '28px' }}>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  flexShrink: 0,
                  background: isDark ? 'rgba(2,132,199,0.18)' : '#E0F2FE',
                  border: '1px solid rgba(2,132,199,0.4)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#0284C7" strokeWidth="2">
                  <path d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <h3 style={{ fontSize: '17px', fontWeight: 800, color: '#0284C7' }}>IntelliFRA Platform Solutions</h3>
            </div>

            <motion.div
              variants={listVariants}
              initial="hidden"
              whileInView="visible"
              style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}
            >
              {solutions.map((s, i) => (
                <motion.div key={i} variants={itemVariantsR} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                  <div
                    style={{
                      width: '18px',
                      height: '18px',
                      borderRadius: '50%',
                      flexShrink: 0,
                      marginTop: '3px',
                      background: isDark ? 'rgba(2,132,199,0.2)' : '#E0F2FE',
                      border: '1px solid #0284C7',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <svg viewBox="0 0 12 12" width="10" height="10" fill="none">
                      <path d="M2 6l3 3 5-5" stroke="#0284C7" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <span
                    style={{
                      fontSize: '14px',
                      color: isDark ? '#BAE6FD' : '#0369A1',
                      fontWeight: 600,
                      lineHeight: 1.6,
                    }}
                  >
                    {s}
                  </span>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
