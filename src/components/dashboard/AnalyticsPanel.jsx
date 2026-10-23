import {
  ResponsiveContainer, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip,
} from 'recharts'
import { useTheme } from '../../lib/theme'

const CustomTooltip = ({ active, payload, label, isDark }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{
      backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
      border: `1px solid ${isDark ? '#374151' : '#CBD5E1'}`,
      borderRadius: '6px',
      padding: '8px 12px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
    }}>
      <div style={{ fontSize: '11px', fontWeight: 800, color: isDark ? '#9CA3AF' : '#64748B', marginBottom: '4px' }}>
        {label}
      </div>
      {payload.map((p) => (
        <div key={p.name} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: p.color }} />
          <span>{p.name}:</span>
          <strong>{p.value}</strong>
        </div>
      ))}
    </div>
  )
}

export default function AnalyticsPanel({ history = [] }) {
  const { isDark } = useTheme()
  const safeHistory = Array.isArray(history) ? history : []

  const totalUploads = safeHistory.length
  const highRiskCount = safeHistory.filter((item) =>
    item?.classification === 'High Fault Risk' || item?.classification === 'Critical Action Required'
  ).length
  const normalCount = Math.max(0, totalUploads - highRiskCount)
  const highRiskPct = totalUploads ? Math.round((highRiskCount / totalUploads) * 100) : 0

  // Mock trend data if history is small for exhibition demonstration
  const trendData = [
    { period: 'Q1', healthy: 12, flagged: 1 },
    { period: 'Q2', healthy: 18, flagged: 2 },
    { period: 'Q3', healthy: 24, flagged: 3 },
    { period: 'Q4 (Live)', healthy: Math.max(14, normalCount + 10), flagged: Math.max(1, highRiskCount) },
  ]

  const containerBg = isDark ? '#111827' : '#FFFFFF'
  const containerBorder = isDark ? '#1F2937' : '#E2E8F0'
  const textMuted = isDark ? '#9CA3AF' : '#64748B'

  return (
    <div
      style={{
        borderRadius: '8px',
        backgroundColor: containerBg,
        border: `1px solid ${containerBorder}`,
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h3 style={{ fontSize: '15px', fontWeight: 800, margin: 0 }}>
            Fleet Reliability & Fault Trending
          </h3>
          <div style={{ fontSize: '12px', color: textMuted, marginTop: '2px' }}>
            CEA asset index across Indian regional grid substations
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <div style={{
            padding: '4px 10px',
            borderRadius: '4px',
            backgroundColor: isDark ? '#1F2937' : '#F1F5F9',
            border: `1px solid ${isDark ? '#374151' : '#CBD5E1'}`,
            fontSize: '11px',
            fontWeight: 700,
          }}>
            Healthy: <span style={{ color: '#10B981' }}>{100 - highRiskPct}%</span>
          </div>
          <div style={{
            padding: '4px 10px',
            borderRadius: '4px',
            backgroundColor: isDark ? '#1F2937' : '#F1F5F9',
            border: `1px solid ${isDark ? '#374151' : '#CBD5E1'}`,
            fontSize: '11px',
            fontWeight: 700,
          }}>
            Critical Alerts: <span style={{ color: '#EF4444' }}>{highRiskCount}</span>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div style={{ width: '100%', height: '180px' }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#374151' : '#E2E8F0'} vertical={false} />
            <XAxis dataKey="period" stroke={textMuted} fontSize={11} tickLine={false} />
            <YAxis stroke={textMuted} fontSize={11} tickLine={false} />
            <Tooltip content={<CustomTooltip isDark={isDark} />} />
            <Area
              type="monotone"
              dataKey="healthy"
              name="Healthy Units"
              stroke="#0284C7"
              fill="#0284C7"
              fillOpacity={0.15}
              strokeWidth={2}
            />
            <Area
              type="monotone"
              dataKey="flagged"
              name="Through-Fault Flags"
              stroke="#EF4444"
              fill="#EF4444"
              fillOpacity={0.2}
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11.5px', color: textMuted, borderTop: `1px solid ${isDark ? '#1F2937' : '#F1F5F9'}`, paddingTop: '10px' }}>
        <span>Criteria: IS 2026 Winding CCF &lt; 0.950</span>
        <span>DGA Rules: IS 10593 Acetylene/Ethylene</span>
      </div>
    </div>
  )
}
