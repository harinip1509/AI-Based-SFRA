import { useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { useTheme } from '../../lib/theme'

export default function UploadPanel() {
  const navigate = useNavigate()
  const { isDark } = useTheme()
  const [dragging, setDragging] = useState(false)

  const latestResultId = (() => {
    try {
      const raw = JSON.parse(localStorage.getItem('fra_history') || '[]')
      return Array.isArray(raw) && raw[0]?.id ? raw[0].id : null
    } catch {
      return null
    }
  })()

  const panelBg = isDark ? '#111827' : '#FFFFFF'
  const panelBorder = isDark ? '#1F2937' : '#E2E8F0'
  const textMuted = isDark ? '#9CA3AF' : '#64748B'

  return (
    <div
      style={{
        borderRadius: '8px',
        backgroundColor: panelBg,
        border: `1.5px solid ${dragging ? '#0284C7' : panelBorder}`,
        padding: '24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '24px',
        transition: 'border-color 0.15s, background-color 0.15s',
      }}
      onDragOver={e => { e.preventDefault(); setDragging(true) }}
      onDragLeave={() => setDragging(false)}
      onDrop={e => { e.preventDefault(); setDragging(false); navigate('/upload') }}
    >
      {/* Left: Drag Box */}
      <div
        onClick={() => navigate('/upload')}
        style={{
          flex: '0 0 200px',
          height: '130px',
          borderRadius: '6px',
          border: `1.5px dashed ${dragging ? '#0284C7' : (isDark ? '#374151' : '#CBD5E1')}`,
          backgroundColor: isDark ? '#1F2937' : '#F8FAFC',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          cursor: 'pointer',
          textAlign: 'center',
          padding: '12px',
        }}
      >
        <span style={{ fontSize: '24px' }}>📁</span>
        <div style={{ fontSize: '12.5px', fontWeight: 700, color: isDark ? '#F3F4F6' : '#1E293B' }}>
          {dragging ? 'Drop File to Load' : 'Click to Upload SFRA'}
        </div>
        <div style={{ fontSize: '11px', color: textMuted }}>
          CSV, TXT, or Plot Images
        </div>
      </div>

      {/* Middle: Standards & Details */}
      <div style={{ flex: '1 1 340px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
          <span style={{
            padding: '2px 8px',
            borderRadius: '4px',
            background: '#0284C7',
            color: '#FFFFFF',
            fontSize: '11px',
            fontWeight: 800,
            letterSpacing: '0.04em',
          }}>
            CEA / IS 2026 BENCHMARK
          </span>
          <span style={{ fontSize: '12px', color: textMuted }}>
            Multi-Modal SFRA + DGA + PD Diagnostic Suite
          </span>
        </div>

        <h2 style={{ fontSize: '18px', fontWeight: 800, margin: '0 0 6px 0', lineHeight: 1.3 }}>
          Ingest Transformer Sweep & Dissolved Gas Telemetry
        </h2>
        <p style={{ fontSize: '13.5px', color: textMuted, margin: 0, lineHeight: 1.5 }}>
          Cross-references frequency response with IS 10593 gas concentrations and overhead through-fault stress history.
          Filters monsoon earthing noise at &gt;1 MHz automatically.
        </p>

        <div style={{ display: 'flex', gap: '10px', marginTop: '16px', flexWrap: 'wrap' }}>
          <button
            onClick={() => navigate('/upload')}
            style={{
              padding: '9px 18px',
              borderRadius: '6px',
              backgroundColor: '#0284C7',
              border: 'none',
              color: '#FFFFFF',
              fontSize: '13px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <span>⚡ Launch Diagnostic Ingestion</span>
          </button>

          <button
            onClick={() => navigate('/substations')}
            style={{
              padding: '9px 16px',
              borderRadius: '6px',
              backgroundColor: isDark ? '#1F2937' : '#F1F5F9',
              border: `1px solid ${isDark ? '#374151' : '#CBD5E1'}`,
              color: isDark ? '#E5E7EB' : '#1E293B',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <span>🛰️ Substation Radar</span>
          </button>

          {latestResultId ? (
            <button
              onClick={() => navigate(`/results/${latestResultId}`)}
              style={{
                padding: '9px 16px',
                borderRadius: '6px',
                backgroundColor: isDark ? '#1F2937' : '#F1F5F9',
                border: `1px solid ${isDark ? '#374151' : '#CBD5E1'}`,
                color: '#0284C7',
                fontSize: '13px',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              View Recent Result →
            </button>
          ) : null}
        </div>
      </div>

      {/* Right: Technical specifications */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        padding: '12px 18px',
        borderRadius: '6px',
        backgroundColor: isDark ? '#1F2937' : '#F8FAFC',
        border: `1px solid ${isDark ? '#374151' : '#E2E8F0'}`,
        minWidth: '180px',
      }}>
        <div style={{ fontSize: '11px', fontWeight: 800, color: textMuted, textTransform: 'uppercase' }}>
          Diagnostic Pipeline
        </div>
        <div style={{ fontSize: '12.5px', fontWeight: 600 }}>
          • IEEE C57.149 3-Zone CCF
        </div>
        <div style={{ fontSize: '12.5px', fontWeight: 600 }}>
          • IS 10593 Gas Cross-Ref
        </div>
        <div style={{ fontSize: '12.5px', fontWeight: 600 }}>
          • Monsoon Noise Suppressor
        </div>
        <div style={{ fontSize: '12.5px', fontWeight: 600 }}>
          • Optical SFRA Digitizer
        </div>
      </div>
    </div>
  )
}
