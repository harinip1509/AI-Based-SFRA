import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTheme } from '../../lib/theme'

export default function AlertsPanel({ history = [] }) {
  const navigate = useNavigate()
  const { isDark } = useTheme()
  const [dismissed, setDismissed] = useState(new Set())

  const highRiskItems = (Array.isArray(history) ? history : [])
    .filter(item => (item?.classification === 'High Fault Risk' || item?.classification === 'Critical Action Required') && !dismissed.has(item.id))

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
        height: '100%',
        boxSizing: 'border-box',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '15px', fontWeight: 800 }}>
            Active Asset Alerts & Through-Fault Triggers
          </span>
          <span
            style={{
              fontSize: '11px',
              fontWeight: 700,
              padding: '2px 8px',
              borderRadius: '4px',
              backgroundColor: highRiskItems.length > 0 ? 'rgba(239,68,68,0.1)' : 'rgba(16,185,129,0.1)',
              color: highRiskItems.length > 0 ? '#EF4444' : '#10B981',
              border: `1px solid ${highRiskItems.length > 0 ? '#EF4444' : '#10B981'}`,
            }}
          >
            {highRiskItems.length} Action Needed
          </span>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', flex: 1 }}>
        {highRiskItems.length === 0 ? (
          <div
            style={{
              padding: '24px',
              textAlign: 'center',
              backgroundColor: isDark ? '#1F2937' : '#F8FAFC',
              borderRadius: '6px',
              border: `1px solid ${isDark ? '#374151' : '#E2E8F0'}`,
              color: textMuted,
              fontSize: '13px',
              margin: 'auto 0',
            }}
          >
            <div style={{ fontSize: '20px', marginBottom: '6px' }}>🛡️</div>
            <div style={{ fontWeight: 700, color: isDark ? '#F3F4F6' : '#1E293B', marginBottom: '4px' }}>
              No Active Through-Fault Breaches
            </div>
            <div>All monitored transformers operating within CEA / IS 2026 normal CCF tolerances (&gt; 0.95).</div>
            <button
              onClick={() => navigate('/upload')}
              style={{
                marginTop: '12px',
                padding: '6px 14px',
                borderRadius: '4px',
                backgroundColor: '#0284C7',
                border: 'none',
                color: '#FFFFFF',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Test Radial Deformation Preset →
            </button>
          </div>
        ) : (
          highRiskItems.map((item) => (
            <div
              key={item.id}
              style={{
                padding: '14px',
                borderRadius: '6px',
                backgroundColor: 'rgba(239, 68, 68, 0.08)',
                border: '1.5px solid #EF4444',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '11px', fontWeight: 800, color: '#EF4444', letterSpacing: '0.05em' }}>
                  CRITICAL ALERT • IS 2026 DEFORMATION
                </span>
                <span style={{ fontSize: '11px', color: textMuted, fontFamily: 'monospace' }}>
                  {item.filename}
                </span>
              </div>

              <div style={{ fontSize: '13px', fontWeight: 600 }}>
                Mid-frequency CCF &lt; 0.95 with active through-fault stress indicator.
              </div>

              <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                <button
                  onClick={() => navigate(`/results/${item.id}`)}
                  style={{
                    padding: '5px 12px',
                    borderRadius: '4px',
                    backgroundColor: '#EF4444',
                    border: 'none',
                    color: '#FFFFFF',
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  Open Diagnostic Sheet →
                </button>
                <button
                  onClick={() => setDismissed(prev => new Set([...prev, item.id]))}
                  style={{
                    padding: '5px 12px',
                    borderRadius: '4px',
                    backgroundColor: 'transparent',
                    border: `1px solid ${isDark ? '#374151' : '#CBD5E1'}`,
                    color: textMuted,
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Acknowledge
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
