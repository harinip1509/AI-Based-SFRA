import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { apiRequest } from '../lib/api'

function Metric({ label, value }) {
  return (
    <div style={{
      padding: '14px 16px',
      borderRadius: '16px',
      background: 'rgba(255,255,255,0.03)',
      border: '1px solid rgba(255,255,255,0.08)',
    }}>
      <div style={{ fontSize: '11px', fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.45)' }}>
        {label}
      </div>
      <div style={{ marginTop: '8px', fontSize: '18px', fontWeight: 900, letterSpacing: '-0.02em', color: '#fff' }}>
        {value}
      </div>
    </div>
  )
}

export default function Results() {
  const navigate = useNavigate()
  const { id } = useParams()
  const [data, setData] = useState(null)
  const [status, setStatus] = useState('loading') // loading | ready | not_found | error

  useEffect(() => {
    let cancelled = false
    const run = async () => {
      try {
        setStatus('loading')
        const token = localStorage.getItem('token')
        if (!token) {
          navigate('/login')
          return
        }
        const res = await apiRequest(`/fra/results/${id}`, { token })
        if (!cancelled) {
          setData(res)
          setStatus('ready')
        }
      } catch (e) {
        const msg = e?.message?.toLowerCase?.() || ''
        if (msg.includes('not authenticated') || msg.includes('invalid token')) {
          localStorage.removeItem('token')
          navigate('/login')
          return
        }
        if (!cancelled) {
          setStatus(e?.status === 404 ? 'not_found' : 'error')
        }
      }
    }
    run()
    return () => { cancelled = true }
  }, [id, navigate])

  const chartData = useMemo(() => {
    const series = (data?.series || []).slice(0, 200)
    return series.map((v, i) => ({ i, v }))
  }, [data])

  if (status === 'loading') {
    return (
      <div style={{ minHeight: '100vh', background: '#0B0F1A', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.7)', fontFamily: "'Inter', system-ui, sans-serif" }}>
        Loading results…
      </div>
    )
  }

  if (status === 'not_found') {
    return (
      <div style={{ minHeight: '100vh', background: '#0B0F1A', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.7)', fontFamily: "'Inter', system-ui, sans-serif" }}>
        Result not found.
        <button
          type="button"
          onClick={() => navigate('/upload')}
          style={{ marginLeft: '12px', padding: '10px 14px', borderRadius: '12px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.75)', cursor: 'pointer', fontWeight: 600 }}
        >
          Upload new file
        </button>
      </div>
    )
  }

  if (!data) {
    return (
      <div style={{ minHeight: '100vh', background: '#0B0F1A', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.7)', fontFamily: "'Inter', system-ui, sans-serif" }}>
        Something went wrong loading results.
        <button
          type="button"
          onClick={() => navigate('/upload')}
          style={{ marginLeft: '12px', padding: '10px 14px', borderRadius: '12px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.75)', cursor: 'pointer', fontWeight: 600 }}
        >
          Try again
        </button>
      </div>
    )
  }

  const classificationStyles = {
    Normal: {
      bg: 'rgba(0,212,255,0.10)',
      border: 'rgba(0,212,255,0.25)',
      text: 'rgba(0,212,255,0.95)',
      dot: '#00D4FF',
      glow: '0 0 10px rgba(0,212,255,0.55)',
    },
    'Minor Deviation': {
      bg: 'rgba(255,200,0,0.12)',
      border: 'rgba(255,200,0,0.35)',
      text: 'rgba(255,225,120,0.95)',
      dot: '#FFC800',
      glow: '0 0 10px rgba(255,200,0,0.55)',
    },
    'Moderate Fault': {
      bg: 'rgba(255,140,0,0.12)',
      border: 'rgba(255,140,0,0.35)',
      text: 'rgba(255,185,110,0.95)',
      dot: '#FF8C00',
      glow: '0 0 10px rgba(255,140,0,0.55)',
    },
    'High Fault Risk': {
      bg: 'rgba(255,60,60,0.12)',
      border: 'rgba(255,60,60,0.28)',
      text: 'rgba(255,160,160,0.95)',
      dot: '#FF6060',
      glow: '0 0 10px rgba(255,60,60,0.55)',
    },
  }
  const style = classificationStyles[data.classification] || classificationStyles.Normal

  const fmt = (n) => (typeof n === 'number' ? n.toFixed(4) : String(n ?? '—'))
  const signalExplanations = []
  if (data?.signals?.std_flag) signalExplanations.push('High variance detected.')
  if (data?.signals?.range_flag) signalExplanations.push('Wide signal range detected.')
  if (data?.signals?.energy_flag) signalExplanations.push('High energy levels detected.')
  if (data?.signals?.spectral_flag) signalExplanations.push('Frequency irregularities detected.')
  if (data?.explanation) signalExplanations.unshift(String(data.explanation))
  const explanationLines = signalExplanations.slice(0, 3)
  const confidencePct = typeof data?.confidence === 'number' ? `${(data.confidence * 100).toFixed(1)}%` : '—'
  const anomalyValue = typeof data?.anomaly_score === 'number' ? data.anomaly_score.toFixed(4) : '—'
  const probabilityEntries = Object.entries(data?.probabilities || {}).sort((a, b) => Number(b[1]) - Number(a[1]))

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0B0F1A',
      backgroundImage: 'radial-gradient(rgba(0,212,255,0.04) 1px, transparent 1px)',
      backgroundSize: '40px 40px',
      padding: '28px',
      fontFamily: "'Inter', system-ui, sans-serif",
      color: '#fff',
    }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap', marginBottom: '18px' }}>
          <div>
            <div style={{ fontSize: '12px', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(0,212,255,0.8)', fontWeight: 800 }}>
              Results
            </div>
            <h1 style={{ fontSize: '28px', fontWeight: 900, letterSpacing: '-0.03em', marginTop: '10px' }}>
              {data.filename}
            </h1>
            <div style={{ marginTop: '10px', display: 'inline-flex', alignItems: 'center', gap: '10px', padding: '8px 12px', borderRadius: '999px', background: style.bg, border: `1px solid ${style.border}` }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: style.dot, boxShadow: style.glow }} />
              <span style={{ fontSize: '12px', fontWeight: 900, letterSpacing: '0.08em', textTransform: 'uppercase', color: style.text }}>
                {data.classification}
              </span>
              <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.45)', marginLeft: '4px' }}>
                ({data.points} points)
              </span>
            </div>
            {explanationLines.length > 0 ? (
              <div style={{ marginTop: '10px', color: 'rgba(255,255,255,0.62)', fontSize: '12px', lineHeight: 1.5 }}>
                {explanationLines.map((line) => (
                  <div key={line}>{line}</div>
                ))}
              </div>
            ) : null}
            <div style={{ marginTop: '10px', color: 'rgba(255,255,255,0.52)', fontSize: '12px', lineHeight: 1.45 }}>
              Confidence: {confidencePct} | Anomaly score: {anomalyValue}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              type="button"
              onClick={() => window.print()}
              style={{
                padding: '10px 14px',
                borderRadius: '12px',
                background: 'rgba(0,212,255,0.08)',
                border: '1px solid rgba(0,212,255,0.25)',
                color: '#00D4FF',
                cursor: 'pointer',
                fontWeight: 700,
              }}
            >
              📄 Print Diagnostic Sheet
            </button>
            <button
              type="button"
              onClick={() => navigate('/upload')}
              style={{
                padding: '10px 14px',
                borderRadius: '12px',
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: 'rgba(255,255,255,0.75)',
                cursor: 'pointer',
                fontWeight: 600,
              }}
            >
              Upload another
            </button>
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              style={{
                padding: '10px 14px',
                borderRadius: '12px',
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: 'rgba(255,255,255,0.75)',
                cursor: 'pointer',
                fontWeight: 600,
              }}
            >
              Dashboard
            </button>
          </div>
        </div>

        {/* IEEE Std C57.149 Sub-Band Breakdown */}
        {data.subbands ? (
          <div style={{ marginBottom: '16px' }}>
            <div style={{ fontSize: '11px', fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(0,212,255,0.85)', marginBottom: '8px' }}>
              IEEE Std C57.149-2012 Frequency Sub-Band Diagnostics
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px' }}>
              {Object.entries(data.subbands).map(([key, band]) => {
                const isNominal = band.status.includes('Normal') || band.status.includes('Nominal')
                const isModerate = band.status.includes('Moderate')
                const badgeColor = isNominal ? '#10B981' : (isModerate ? '#F59E0B' : '#EF4444')
                const badgeBg = isNominal ? 'rgba(16,185,129,0.1)' : (isModerate ? 'rgba(245,158,11,0.1)' : 'rgba(239,68,68,0.1)')
                return (
                  <div key={key} style={{
                    padding: '14px 16px',
                    borderRadius: '16px',
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.08)',
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ fontSize: '12px', fontWeight: 800, color: '#fff' }}>{band.name}</div>
                      <span style={{ fontSize: '11px', fontWeight: 700, padding: '3px 8px', borderRadius: '999px', background: badgeBg, color: badgeColor }}>
                        {band.status}
                      </span>
                    </div>
                    <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.45)', marginTop: '4px' }}>
                      {band.governing_physics}
                    </div>
                    <div style={{ display: 'flex', gap: '14px', marginTop: '10px', fontSize: '11px', color: 'rgba(255,255,255,0.65)' }}>
                      <div>Mean: <strong style={{ color: '#fff' }}>{band.mean} dB</strong></div>
                      <div>Std: <strong style={{ color: '#fff' }}>{band.std} dB</strong></div>
                      <div>Range: <strong style={{ color: '#fff' }}>{band.range} dB</strong></div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ) : null}

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
          gap: '12px',
          marginBottom: '14px',
        }}>
          <Metric label="Mean" value={fmt(data.mean)} />
          <Metric label="Max" value={fmt(data.max)} />
          <Metric label="Min" value={fmt(data.min)} />
          <Metric label="Std Dev" value={fmt(data.std)} />
          <Metric label="Peak-to-Peak" value={fmt(data.peak_to_peak)} />
          <Metric label="Energy" value={fmt(data.energy)} />
          <Metric label="Spectral Energy" value={fmt(data.spectral_energy)} />
        </div>
        {probabilityEntries.length > 0 ? (
          <div style={{ marginBottom: '12px', color: 'rgba(255,255,255,0.56)', fontSize: '12px' }}>
            {probabilityEntries.map(([label, val]) => `${label}: ${(Number(val) * 100).toFixed(1)}%`).join(' | ')}
          </div>
        ) : null}

        <div style={{ display: 'grid', gridTemplateColumns: data.plot_image ? '1fr 1fr' : '1fr', gap: '16px', marginBottom: '16px' }}>
          {/* Interactive Recharts Series */}
          <div style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '24px',
            padding: '18px 18px 10px',
            backdropFilter: 'blur(18px)',
          }}>
            <div style={{ fontSize: '12px', fontWeight: 900, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.45)', marginBottom: '10px' }}>
              Interactive Response ({data.series?.length || 0} pts)
            </div>

            <div style={{ width: '100%', height: '340px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 8, right: 16, bottom: 8, left: 0 }}>
                  <defs>
                    <linearGradient id="fraLine" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#00D4FF" stopOpacity={1} />
                      <stop offset="100%" stopColor="#6C63FF" stopOpacity={1} />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="i"
                    tick={{ fill: 'rgba(255,255,255,0.35)', fontSize: 11 }}
                    axisLine={{ stroke: 'rgba(255,255,255,0.12)' }}
                    tickLine={{ stroke: 'rgba(255,255,255,0.12)' }}
                  />
                  <YAxis
                    tick={{ fill: 'rgba(255,255,255,0.35)', fontSize: 11 }}
                    axisLine={{ stroke: 'rgba(255,255,255,0.12)' }}
                    tickLine={{ stroke: 'rgba(255,255,255,0.12)' }}
                  />
                  <Tooltip
                    contentStyle={{
                      background: 'rgba(10,15,26,0.92)',
                      border: '1px solid rgba(255,255,255,0.12)',
                      borderRadius: '14px',
                      boxShadow: '0 20px 60px rgba(0,0,0,0.45)',
                      color: '#fff',
                    }}
                    labelStyle={{ color: 'rgba(255,255,255,0.55)' }}
                    itemStyle={{ color: '#00D4FF' }}
                  />
                  <Line
                    type="monotone"
                    dataKey="v"
                    stroke="url(#fraLine)"
                    strokeWidth={2.2}
                    dot={false}
                    isAnimationActive={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Publication-Grade Visual Engineering Plot */}
          {data.plot_image ? (
            <div style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '24px',
              padding: '18px',
              backdropFilter: 'blur(18px)',
              display: 'flex',
              flexDirection: 'column',
            }}>
              <div style={{ fontSize: '12px', fontWeight: 900, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(0,212,255,0.85)', marginBottom: '10px' }}>
                IEEE C57.149 Calibrated Plot (20 Hz - 2 MHz)
              </div>
              <img
                src={data.plot_image}
                alt="SFRA Engineering Plot"
                style={{ width: '100%', height: 'auto', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)', objectFit: 'contain' }}
              />
            </div>
          ) : null}
        </div>

        {/* Visual Question Answering (ControlVisionQA) Inspector */}
        {data.vqa_pairs && data.vqa_pairs.length > 0 ? (
          <div style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '24px',
            padding: '20px',
            backdropFilter: 'blur(18px)',
            marginBottom: '20px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
              <div>
                <div style={{ fontSize: '11px', fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(0,212,255,0.85)' }}>
                  Visual Question Answering & Engineering Properties
                </div>
                <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)', marginTop: '2px' }}>
                  Automated engineering reasoning across stability, pole dynamics, and physical structural integrity.
                </div>
              </div>
              <span style={{ fontSize: '11px', fontWeight: 700, padding: '4px 10px', borderRadius: '999px', background: 'rgba(0,212,255,0.1)', color: '#00D4FF', border: '1px solid rgba(0,212,255,0.2)' }}>
                {data.vqa_pairs.length} QA Inferences
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '10px' }}>
              {data.vqa_pairs.map((qa, idx) => (
                <div key={idx} style={{
                  padding: '12px 14px',
                  borderRadius: '12px',
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid rgba(255,255,255,0.06)',
                }}>
                  <div style={{ fontSize: '11.5px', color: 'rgba(255,255,255,0.5)', fontWeight: 600 }}>
                    Q: {qa.question}
                  </div>
                  <div style={{ fontSize: '13px', color: '#00D4FF', fontWeight: 800, marginTop: '4px' }}>
                    {qa.answer}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}

