import { motion } from 'framer-motion'

const problems = [
  'Manual FRA analysis takes hours of expert time',
  'High subjectivity — results vary between engineers',
  'No standardized cross-device data format',
  'Reactive maintenance leads to costly failures',
  'Limited scalability for large transformer fleets',
]
const solutions = [
  'Instant AI-driven analysis in under 2 seconds',
  'Consistent, objective deep learning fault classification',
  'Universal data ingestion from all major device brands',
  'Predictive alerts 30–60 days before failure occurs',
  'Cloud platform scales to thousands of assets simultaneously',
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
  return (
    <section className="section">
      {/* Dual-tone background glow */}
      <div aria-hidden style={{
        position: 'absolute', top: 0, left: 0, width: '50%', height: '100%',
        background: 'radial-gradient(ellipse at 20% 50%, rgba(255,50,50,0.06) 0%, transparent 60%)',
        pointerEvents: 'none', zIndex: 0,
      }} />
      <div aria-hidden style={{
        position: 'absolute', top: 0, right: 0, width: '50%', height: '100%',
        background: 'radial-gradient(ellipse at 80% 50%, rgba(0,212,255,0.07) 0%, transparent 60%)',
        pointerEvents: 'none', zIndex: 0,
      }} />

      <div className="container" style={{ position: 'relative', zIndex: 1 }}>
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
          style={{ textAlign: 'center', marginBottom: '72px' }}
        >
          <h2 className="section-title">The Industry Problem. Our Solution.</h2>
          <p className="section-desc">Transformer diagnostics have been stuck in the past. We changed that.</p>
        </motion.div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0,1fr))', gap: '24px' }}>
          {/* Problems */}
          <motion.div
            initial={{ opacity: 0, x: -44 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
            style={{
              borderRadius: '24px', padding: '40px',
              background: 'linear-gradient(145deg, rgba(255,40,40,0.07) 0%, rgba(255,40,40,0.02) 100%)',
              border: '1px solid rgba(255,60,60,0.18)',
              boxShadow: 'inset 0 0 60px rgba(255,40,40,0.04)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px' }}>
              <div style={{
                width: '36px', height: '36px', borderRadius: '10px', flexShrink: 0,
                background: 'rgba(255,60,60,0.15)', border: '1px solid rgba(255,60,60,0.35)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 0 16px rgba(255,60,60,0.2)',
              }}>
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#FF5555" strokeWidth="1.8">
                  <path d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#FF7070' }}>Industry Challenges</h3>
            </div>

            <motion.div
              variants={listVariants}
              initial="hidden"
              whileInView="visible"
              style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}
            >
              {problems.map((p, i) => (
                <motion.div key={i} variants={itemVariants} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                  <div style={{
                    width: '20px', height: '20px', borderRadius: '50%', flexShrink: 0, marginTop: '2px',
                    background: 'rgba(255,60,60,0.14)', border: '1px solid rgba(255,60,60,0.32)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#FF6060' }} />
                  </div>
                  <span style={{ fontSize: '14px', color: 'rgba(255,185,185,0.78)', lineHeight: 1.65 }}>{p}</span>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>

          {/* Solutions */}
          <motion.div
            initial={{ opacity: 0, x: 44 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
            style={{
              borderRadius: '24px', padding: '40px',
              background: 'linear-gradient(145deg, rgba(0,212,255,0.07) 0%, rgba(108,99,255,0.03) 100%)',
              border: '1px solid rgba(0,212,255,0.18)',
              boxShadow: 'inset 0 0 60px rgba(0,212,255,0.04)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px' }}>
              <div style={{
                width: '36px', height: '36px', borderRadius: '10px', flexShrink: 0,
                background: 'rgba(0,212,255,0.14)', border: '1px solid rgba(0,212,255,0.35)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 0 16px rgba(0,212,255,0.2)',
              }}>
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#00D4FF" strokeWidth="1.8">
                  <path d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#00D4FF' }}>IntelliFRA Solutions</h3>
            </div>

            <motion.div
              variants={listVariants}
              initial="hidden"
              whileInView="visible"
              style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}
            >
              {solutions.map((s, i) => (
                <motion.div key={i} variants={itemVariantsR} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                  <div style={{
                    width: '20px', height: '20px', borderRadius: '50%', flexShrink: 0, marginTop: '2px',
                    background: 'rgba(0,212,255,0.12)', border: '1px solid rgba(0,212,255,0.32)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <svg viewBox="0 0 12 12" width="10" height="10" fill="none">
                      <path d="M2 6l3 3 5-5" stroke="#00D4FF" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <span style={{ fontSize: '14px', color: 'rgba(160,235,255,0.78)', lineHeight: 1.65 }}>{s}</span>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
