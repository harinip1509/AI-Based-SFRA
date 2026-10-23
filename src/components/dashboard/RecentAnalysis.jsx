import { useNavigate } from 'react-router-dom'
import { useTheme } from '../../lib/theme'

export default function RecentAnalysis({ history = [], title = 'Recent Substation Diagnostic Records' }) {
  const navigate = useNavigate()
  const { isDark } = useTheme()

  const rows = (Array.isArray(history) ? history : [])
    .slice(0, 8)
    .map((item) => ({
      id: item.id,
      filename: item.filename || 'SFRA_Sweep_Measurement',
      classification: item.classification || 'Normal',
      date: item.timestamp ? new Date(typeof item.timestamp === 'number' ? item.timestamp : item.timestamp).toLocaleDateString() : 'Today',
      time: item.timestamp ? new Date(typeof item.timestamp === 'number' ? item.timestamp : item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '',
      isCritical: item.classification === 'High Fault Risk' || item.classification === 'Critical Action Required',
    }))

  const containerBg = isDark ? '#111827' : '#FFFFFF'
  const containerBorder = isDark ? '#1F2937' : '#E2E8F0'
  const textMuted = isDark ? '#9CA3AF' : '#64748B'

  return (
    <div
      style={{
        borderRadius: '8px',
        backgroundColor: containerBg,
        border: `1px solid ${containerBorder}`,
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '16px 20px',
          borderBottom: `1px solid ${containerBorder}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '15px', fontWeight: 800 }}>{title}</span>
          <span
            style={{
              fontSize: '11px',
              fontWeight: 700,
              padding: '2px 8px',
              borderRadius: '4px',
              backgroundColor: isDark ? '#1F2937' : '#F1F5F9',
              border: `1px solid ${isDark ? '#374151' : '#CBD5E1'}`,
              color: textMuted,
            }}
          >
            {rows.length} logs
          </span>
        </div>

        <button
          onClick={() => navigate('/upload')}
          style={{
            fontSize: '12px',
            fontWeight: 700,
            color: '#0284C7',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
          }}
        >
          + Upload New Sweep
        </button>
      </div>

      {/* Table Header */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '2fr 1.2fr 1fr 100px',
          padding: '10px 20px',
          backgroundColor: isDark ? '#1F2937' : '#F8FAFC',
          borderBottom: `1px solid ${containerBorder}`,
          fontSize: '11px',
          fontWeight: 800,
          color: textMuted,
          letterSpacing: '0.05em',
          textTransform: 'uppercase',
        }}
      >
        <div>Measurement File</div>
        <div>Date & Timestamp</div>
        <div>Status / Diagnosis</div>
        <div style={{ textAlign: 'right' }}>Action</div>
      </div>

      {/* Rows */}
      {rows.length === 0 ? (
        <div style={{ padding: '32px', textAlign: 'center', color: textMuted, fontSize: '14px' }}>
          No substation analyses recorded yet. Click <strong>Upload New Sweep</strong> to evaluate an SFRA curve.
        </div>
      ) : (
        rows.map((row, idx) => (
          <div
            key={row.id || idx}
            onClick={() => row.id && navigate(`/results/${row.id}`)}
            style={{
              display: 'grid',
              gridTemplateColumns: '2fr 1.2fr 1fr 100px',
              padding: '14px 20px',
              alignItems: 'center',
              borderBottom: idx < rows.length - 1 ? `1px solid ${isDark ? '#1F2937' : '#F1F5F9'}` : 'none',
              cursor: row.id ? 'pointer' : 'default',
              transition: 'background-color 0.15s',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.backgroundColor = isDark ? '#1E293B' : '#F8FAFC'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.backgroundColor = 'transparent'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '16px' }}>📄</span>
              <span style={{ fontSize: '13.5px', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {row.filename}
              </span>
            </div>

            <div style={{ fontSize: '12.5px', color: textMuted, fontFamily: "'JetBrains Mono', monospace" }}>
              {row.date} {row.time}
            </div>

            <div>
              <span
                style={{
                  fontSize: '11.5px',
                  fontWeight: 700,
                  padding: '3px 8px',
                  borderRadius: '4px',
                  backgroundColor: row.isCritical ? 'rgba(239,68,68,0.1)' : 'rgba(16,185,129,0.1)',
                  color: row.isCritical ? '#EF4444' : '#10B981',
                  border: `1px solid ${row.isCritical ? '#EF4444' : '#10B981'}`,
                }}
              >
                {row.classification}
              </span>
            </div>

            <div style={{ textAlign: 'right' }}>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  if (row.id) navigate(`/results/${row.id}`)
                }}
                style={{
                  padding: '5px 10px',
                  borderRadius: '4px',
                  background: isDark ? '#1F2937' : '#F1F5F9',
                  border: `1px solid ${isDark ? '#374151' : '#CBD5E1'}`,
                  color: '#0284C7',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Open →
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  )
}
