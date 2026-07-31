import { motion, AnimatePresence } from 'framer-motion'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

const severityConfig = {
  critical: { color: '#FF5555', rgb: '255,85,85', bg: 'rgba(255,60,60,0.07)', border: 'rgba(255,60,60,0.22)', label: 'Critical' },
}

function AlertRow({ alert, onDismiss }) {
  const navigate = useNavigate()
  const cfg = severityConfig[alert.severity]

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 12, height: 0, marginBottom: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      style={{
        padding: '16px 20px',
        borderRadius: '14px',
        background: cfg.bg,
        border: `1px solid ${cfg.border}`,
        display: 'flex',
        alignItems: 'flex-start',
        gap: '14px',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '3px', background: cfg.color, boxShadow: `0 0 8px ${cfg.color}`, borderRadius: '3px 0 0 3px' }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', padding: '2px 8px', borderRadius: '100px', background: `rgba(${cfg.rgb},0.15)`, border: `1px solid rgba(${cfg.rgb},0.3)`, color: cfg.color }}>
            {cfg.label}
          </span>
          <span style={{ fontSize: '11px', fontFamily: 'monospace', color: `rgba(${cfg.rgb},0.8)`, fontWeight: 600 }}>
            {alert.filename}
          </span>
          <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.28)', marginLeft: 'auto' }}>
            {alert.time}
          </span>
        </div>
        <div style={{ fontSize: '13.5px', fontWeight: 600, color: '#fff', marginBottom: '4px', lineHeight: 1.3 }}>
          {alert.title}
        </div>
        <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.45)', lineHeight: 1.55 }}>
          {alert.detail}
        </div>
        <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => navigate(`/results/${alert.id}`)}
            style={{ padding: '5px 14px', borderRadius: '7px', fontSize: '11.5px', fontWeight: 600, background: `rgba(${cfg.rgb},0.12)`, border: `1px solid rgba(${cfg.rgb},0.3)`, color: cfg.color, cursor: 'pointer', fontFamily: 'inherit' }}
          >
            View Analysis →
          </motion.button>
          <button
            onClick={() => onDismiss(alert.id)}
            style={{ padding: '5px 14px', borderRadius: '7px', fontSize: '11.5px', fontWeight: 500, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.45)', cursor: 'pointer', fontFamily: 'inherit' }}
          >
            Dismiss
          </button>
        </div>
      </div>
    </motion.div>
  )
}

const formatRelative = (timestamp) => {
  if (!timestamp) return 'Just now'
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

export default function AlertsPanel({ history = [] }) {
  const mapped = (Array.isArray(history) ? history : [])
    .filter((item) => item?.classification === 'High Fault Risk')
    .slice(0, 3)
    .map((item) => ({
      id: item.id,
      severity: 'critical',
      title: 'High Fault Risk Detected',
      detail: 'This upload crossed the configured FRA threshold. Review analysis details.',
      filename: item.filename || 'Unknown file',
      time: formatRelative(item.timestamp),
    }))

  const [alerts, setAlerts] = useState(mapped)
  useEffect(() => {
    setAlerts(mapped)
  }, [history])
  const dismiss = (id) => setAlerts(prev => prev.filter(a => a.id !== id))
  const criticalCount = alerts.filter(a => a.severity === 'critical').length

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
      style={{ borderRadius: '20px', background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)', backdropFilter: 'blur(20px)', overflow: 'hidden' }}
    >
      <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#fff', margin: 0 }}>Active Alerts</h3>
        <div style={{ display: 'flex', gap: '6px', marginLeft: '4px' }}>
          {criticalCount > 0 ? <span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 9px', borderRadius: '100px', background: 'rgba(255,60,60,0.14)', border: '1px solid rgba(255,60,60,0.3)', color: '#FF5555' }}>{criticalCount} Critical</span> : null}
        </div>
        {alerts.length > 0 ? (
          <button onClick={() => setAlerts([])} style={{ marginLeft: 'auto', fontSize: '11.5px', fontWeight: 600, color: 'rgba(255,255,255,0.35)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', padding: '4px 8px', borderRadius: '6px' }}>
            Dismiss all
          </button>
        ) : null}
      </div>
      <div style={{ padding: '16px' }}>
        <AnimatePresence mode="popLayout">
          {alerts.length === 0 ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ padding: '32px', textAlign: 'center' }}>
              <div style={{ fontSize: '14px', fontWeight: 600, color: 'rgba(255,255,255,0.5)' }}>No active alerts</div>
            </motion.div>
          ) : (
            alerts.map(alert => (
              <div key={alert.id} style={{ marginBottom: '10px' }}>
                <AlertRow alert={alert} onDismiss={dismiss} />
              </div>
            ))
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}

