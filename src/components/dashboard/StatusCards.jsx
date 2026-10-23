import { useNavigate } from 'react-router-dom'
import { useTheme } from '../../lib/theme'

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
  const navigate = useNavigate()
  const { isDark } = useTheme()
  const safeHistory = Array.isArray(history) ? history : []
  const latest = safeHistory[0]
  const highRiskCount = safeHistory.filter((item) =>
    item?.classification === 'High Fault Risk' || item?.classification === 'Critical Action Required'
  ).length

  const cards = [
    {
      id: 'system',
      title: 'CEA ASSET HEALTH ENGINE',
      value: 'Operational',
      sub: 'IS 2026 / IS 10593 Active',
      statusColor: '#10B981',
      badge: 'Online',
      onClick: () => navigate('/substations'),
      actionText: 'Explore Substation Radar →',
    },
    {
      id: 'latest',
      title: 'LATEST TRANSFORMER SWEEP',
      value: latest ? formatRelative(latest.timestamp) : 'No Records',
      sub: latest?.filename || 'Click to run initial SFRA sweep',
      statusColor: latest?.classification === 'High Fault Risk' ? '#EF4444' : '#0284C7',
      badge: latest ? (latest.classification || 'Evaluated') : 'Awaiting Data',
      onClick: () => (latest?.id ? navigate(`/results/${latest.id}`) : navigate('/upload')),
      actionText: latest?.id ? 'Open Diagnostic Report →' : 'Upload Measurement →',
    },
    {
      id: 'records',
      title: 'BENCHMARKED ASSETS',
      value: String(safeHistory.length),
      sub: `${highRiskCount} flagged for through-fault review`,
      statusColor: highRiskCount > 0 ? '#F59E0B' : '#0284C7',
      badge: `${safeHistory.length} Sweeps`,
      onClick: () => navigate('/upload'),
      actionText: 'Ingest New Asset Sweep →',
    },
    {
      id: 'filter',
      title: 'MONSOON & SITE FILTER',
      value: 'Armed (>1 MHz)',
      sub: 'False-alarm earthing suppression',
      statusColor: '#38BDF8',
      badge: 'CEA Std',
      onClick: () => navigate('/substations'),
      actionText: 'Inspect Substation Flats →',
    },
  ]

  const cardBg = isDark ? '#111827' : '#FFFFFF'
  const cardBorder = isDark ? '#1F2937' : '#E2E8F0'
  const textMuted = isDark ? '#9CA3AF' : '#64748B'

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px' }}>
      {cards.map((card) => (
        <div
          key={card.id}
          onClick={card.onClick}
          style={{
            padding: '20px',
            borderRadius: '8px',
            backgroundColor: cardBg,
            border: `1px solid ${cardBorder}`,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            cursor: 'pointer',
            transition: 'border-color 0.15s, box-shadow 0.15s',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.borderColor = '#0284C7'
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.06)'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.borderColor = cardBorder
            e.currentTarget.style.boxShadow = 'none'
          }}
        >
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <span style={{ fontSize: '11px', fontWeight: 800, letterSpacing: '0.06em', color: textMuted }}>
                {card.title}
              </span>
              <span style={{
                fontSize: '11px',
                fontWeight: 700,
                color: card.statusColor,
                background: isDark ? 'rgba(255,255,255,0.04)' : '#F1F5F9',
                padding: '2px 8px',
                borderRadius: '4px',
                border: `1px solid ${isDark ? '#374151' : '#CBD5E1'}`,
              }}>
                {card.badge}
              </span>
            </div>

            <div style={{ fontSize: '24px', fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1.2 }}>
              {card.value}
            </div>

            <div style={{ fontSize: '13px', color: textMuted, marginTop: '4px', lineHeight: 1.4 }}>
              {card.sub}
            </div>
          </div>

          <div style={{
            marginTop: '16px',
            paddingTop: '10px',
            borderTop: `1px solid ${isDark ? '#1F2937' : '#F1F5F9'}`,
            fontSize: '12px',
            fontWeight: 700,
            color: '#0284C7',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <span>{card.actionText}</span>
          </div>
        </div>
      ))}
    </div>
  )
}
