import { motion } from 'framer-motion'

const containerVariants = { hidden: {}, visible: { transition: { staggerChildren: 0.1 } } }
const cardVariants = { hidden: { opacity: 0, y: 24 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } } }

const formatRelative = (timestamp) => {
  if (!timestamp) return '—'
  const base = typeof timestamp === 'number' ? timestamp : new Date(timestamp).getTime()
  const diff = Date.now() - base
  if (!Number.isFinite(diff) || diff < 0) return 'Just now'
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

export default function StatusCards({ history = [] }) {
  const safeHistory = Array.isArray(history) ? history : []
  const latest = safeHistory[0]
  const highRiskCount = safeHistory.filter((item) => item?.classification === 'High Fault Risk').length
  const cards = [
    {
      id: 'status',
      label: 'System Status',
      value: 'Online',
      sub: 'All systems operational',
      accent: '#00D4FF',
      rgb: '0,212,255',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M22 12h-4l-3 9L9 3l-3 9H2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ),
      badge: { text: 'Live', color: '#00D4FF' },
      pulse: true,
    },
    {
      id: 'last',
      label: 'Last Analysis',
      value: latest ? formatRelative(latest.timestamp) : 'No data',
      sub: latest?.filename || 'Upload first FRA file',
      accent: '#6C63FF',
      rgb: '108,99,255',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <circle cx="12" cy="12" r="10"/><polyline points="12,6 12,12 16,14" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ),
      badge: { text: latest?.classification === 'High Fault Risk' ? 'High Risk' : 'Latest', color: '#00D4FF' },
    },
    {
      id: 'total',
      label: 'Total Analyses',
      value: String(safeHistory.length),
      sub: `${highRiskCount} high risk`,
      accent: '#00D4FF',
      rgb: '0,212,255',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ),
      badge: { text: `${safeHistory.length}`, color: '#6C63FF' },
    },
    {
      id: 'upload',
      label: 'Last Upload',
      value: latest ? formatRelative(latest.timestamp) : 'No uploads',
      sub: latest?.filename || 'Waiting for first upload',
      accent: '#6C63FF',
      rgb: '108,99,255',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ),
      badge: { text: latest ? 'Saved' : 'Idle', color: '#00D4FF' },
    },
  ]

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0,1fr))', gap: '16px' }}>
      {cards.map((card) => (
        <motion.div
          key={card.id}
          variants={cardVariants}
          whileHover={{ y: -5, scale: 1.02 }}
          transition={{ type: 'spring', stiffness: 300, damping: 22 }}
          style={{
            padding: '24px',
            borderRadius: '18px',
            background: 'rgba(255,255,255,0.025)',
            border: `1px solid rgba(${card.rgb},0.15)`,
            backdropFilter: 'blur(20px)',
            position: 'relative',
            overflow: 'hidden',
            cursor: 'default',
            transition: 'box-shadow 0.3s ease, border-color 0.3s ease',
          }}
        >
          <div aria-hidden style={{
            position: 'absolute', top: '-20px', right: '-20px',
            width: '80px', height: '80px', borderRadius: '50%',
            background: `radial-gradient(circle, rgba(${card.rgb},0.18) 0%, transparent 70%)`,
            pointerEvents: 'none',
          }} />

          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div style={{
              width: '40px', height: '40px', borderRadius: '12px',
              background: `rgba(${card.rgb},0.12)`,
              border: `1px solid rgba(${card.rgb},0.22)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: card.accent,
              boxShadow: `0 0 16px rgba(${card.rgb},0.15)`,
            }}>
              {card.icon}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              {card.pulse ? <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: card.accent, boxShadow: `0 0 8px ${card.accent}`, animation: 'pulse-dot 2s infinite', flexShrink: 0 }} /> : null}
              <span style={{
                fontSize: '11px', fontWeight: 700, letterSpacing: '0.06em',
                padding: '3px 10px', borderRadius: '100px',
                background: `rgba(${card.rgb},0.12)`,
                border: `1px solid rgba(${card.rgb},0.25)`,
                color: card.badge.color,
              }}>
                {card.badge.text}
              </span>
            </div>
          </div>

          <div style={{
            fontSize: '26px', fontWeight: 900, letterSpacing: '-0.02em',
            background: `linear-gradient(135deg, #fff 0%, ${card.accent} 100%)`,
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
            marginBottom: '4px', lineHeight: 1.1,
          }}>
            {card.value}
          </div>

          <div style={{ fontSize: '12px', fontWeight: 600, color: 'rgba(255,255,255,0.5)', marginBottom: '3px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            {card.label}
          </div>
          <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.32)', lineHeight: 1.4 }}>
            {card.sub}
          </div>
        </motion.div>
      ))}
    </motion.div>
  )
}

