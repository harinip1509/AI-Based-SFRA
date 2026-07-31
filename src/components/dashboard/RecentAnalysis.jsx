import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'

export default function RecentAnalysis({ history = [], title = 'Recent Analyses' }) {
  const navigate = useNavigate()
  const rows = (Array.isArray(history) ? history : [])
    .slice(0, 5)
    .map((item) => ({
      id: item.id,
      filename: item.filename || 'Unknown file',
      classification: item.classification || '—',
      date: item.timestamp ? new Date(typeof item.timestamp === 'number' ? item.timestamp : item.timestamp).toLocaleString() : '—',
      risk: item.classification === 'High Fault Risk' ? 'high' : 'low',
    }))
  const latestId = rows?.[0]?.id || null

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
      style={{
        borderRadius: '20px',
        background: 'rgba(255,255,255,0.025)',
        border: '1px solid rgba(255,255,255,0.07)',
        backdropFilter: 'blur(20px)',
        overflow: 'hidden',
      }}
    >
      <div style={{
        padding: '20px 24px',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#00D4FF', boxShadow: '0 0 8px #00D4FF', animation: 'pulse-dot 2s infinite' }} />
          <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#fff', margin: 0 }}>{title}</h3>
          <span style={{ fontSize: '11px', fontWeight: 700, padding: '2px 10px', borderRadius: '100px', background: 'rgba(108,99,255,0.12)', border: '1px solid rgba(108,99,255,0.25)', color: '#A29BFF' }}>
            {rows.length} records
          </span>
        </div>
        <button
          onClick={() => navigate(latestId ? `/results/${latestId}` : '/upload')}
          style={{
            fontSize: '12px', fontWeight: 600, color: '#00D4FF',
            background: 'none', border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: '4px', fontFamily: 'inherit',
            padding: '6px 10px', borderRadius: '8px', transition: 'background 0.2s',
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,212,255,0.08)'}
          onMouseLeave={e => e.currentTarget.style.background = 'none'}
        >
          View all
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>
      <div style={{
        display: 'grid',
        gridTemplateColumns: '2fr 1fr 1fr 1fr 80px 80px',
        gap: '12px',
        padding: '10px 24px',
        borderBottom: '1px solid rgba(255,255,255,0.04)',
      }}>
        {['File Name', 'Transformer', 'Date', 'Classification', 'Risk', ''].map((h) => (
          <div key={h} style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)' }}>
            {h}
          </div>
        ))}
      </div>
      <div style={{ padding: '0 0 8px' }}>
        {rows.length === 0 ? (
          <div style={{ padding: '24px', color: 'rgba(255,255,255,0.5)' }}>No uploads yet.</div>
        ) : rows.map((row, i) => {
          const high = (row.risk || '').toLowerCase() === 'high'
          return (
            <div
              key={row.id}
              style={{
                display: 'grid',
                gridTemplateColumns: '2fr 1fr 1fr 1fr 80px 80px',
                gap: '12px',
                padding: '14px 24px',
                alignItems: 'center',
                borderBottom: i < rows.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '8px', flexShrink: 0, background: 'rgba(0,212,255,0.08)', border: '1px solid rgba(0,212,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(0,212,255,0.8)" strokeWidth="1.8">
                    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" strokeLinecap="round" strokeLinejoin="round"/>
                    <polyline points="14,2 14,8 20,8" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <span style={{ fontSize: '12.5px', color: 'rgba(255,255,255,0.8)', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {row.filename}
                </span>
              </div>
              <span style={{ fontSize: '12.5px', color: 'rgba(255,255,255,0.55)', fontFamily: 'monospace' }}>{row.transformer || '-'}</span>
              <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>{row.date}</span>
              <span style={{ fontSize: '12.5px', color: 'rgba(255,255,255,0.7)', fontWeight: 500 }}>{row.classification}</span>
              <div>
                <span style={{
                  fontSize: '10px', fontWeight: 700, letterSpacing: '0.06em',
                  padding: '4px 10px', borderRadius: '100px',
                  background: high ? 'rgba(255,60,60,0.12)' : 'rgba(0,212,255,0.1)',
                  border: high ? '1px solid rgba(255,60,60,0.35)' : '1px solid rgba(0,212,255,0.3)',
                  color: high ? '#FF5555' : '#00D4FF', whiteSpace: 'nowrap',
                }}>
                  {high ? 'High Risk' : 'Low Risk'}
                </span>
              </div>
              <div>
                <motion.button
                  whileHover={{ scale: 1.06 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => navigate(`/results/${row.id}`)}
                  style={{
                    padding: '6px 14px', borderRadius: '8px', fontSize: '11.5px', fontWeight: 600,
                    background: 'rgba(0,212,255,0.08)', border: '1px solid rgba(0,212,255,0.2)',
                    color: '#00D4FF', cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap',
                  }}
                >
                  View →
                </motion.button>
              </div>
            </div>
          )
        })}
      </div>
    </motion.div>
  )
}

