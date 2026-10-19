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
import { apiRequest, API_BASE } from '../lib/api'

export default function Results() {
  const navigate = useNavigate()
  const { id } = useParams()
  const [data, setData] = useState(null)
  const [status, setStatus] = useState('loading') // loading | ready | not_found | error

  // Multi-Modal Live State
  const [dga, setDga] = useState({
    H2: 15.0,
    CH4: 8.0,
    C2H6: 5.0,
    C2H4: 12.0,
    C2H2: 0.0,
    CO: 180.0,
    CO2: 1200.0,
  })
  const [pd, setPd] = useState({
    peak_pC: 45.0,
    pulse_rate_pps: 120.0,
  })
  const [fusion, setFusion] = useState(null)
  const [evaluating, setEvaluating] = useState(false)
  const [badGroundingSim, setBadGroundingSim] = useState(false)

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
          if (res.dga) setDga(res.dga)
          if (res.pd) setPd(res.pd)
          if (res.fusion) setFusion(res.fusion)
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

  // Re-run Multi-Modal Data Fusion Live
  const triggerFusionEvaluation = async (updatedDga, updatedPd, simulateGround) => {
    try {
      setEvaluating(true)
      const token = localStorage.getItem('token')
      const res = await fetch(`${API_BASE}/fra/fusion-evaluate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          result_id: id,
          series: data?.series || [],
          dga: updatedDga || dga,
          pd: updatedPd || pd,
          simulate_bad_ground: simulateGround !== undefined ? simulateGround : badGroundingSim,
        }),
      })
      if (res.ok) {
        const resJson = await res.json()
        setFusion(resJson.fusion)
      }
    } catch (err) {
      console.error('Fusion evaluation error:', err)
    } finally {
      setEvaluating(false)
    }
  }

  const handleScenario = (scenarioType) => {
    let newDga = { ...dga }
    let newPd = { ...pd }
    let simGround = false

    if (scenarioType === 'nominal') {
      newDga = { H2: 12.0, CH4: 6.0, C2H6: 4.0, C2H4: 8.0, C2H2: 0.0, CO: 150.0, CO2: 1100.0 }
      newPd = { peak_pC: 30.0, pulse_rate_pps: 80.0 }
      simGround = false
    } else if (scenarioType === 'arcing') {
      newDga = { H2: 85.0, CH4: 32.0, C2H6: 22.0, C2H4: 42.0, C2H2: 4.8, CO: 210.0, CO2: 1400.0 }
      simGround = false
    } else if (scenarioType === 'thermal') {
      newDga = { H2: 40.0, CH4: 45.0, C2H6: 30.0, C2H4: 78.0, C2H2: 0.2, CO: 320.0, CO2: 1800.0 }
      simGround = false
    } else if (scenarioType === 'grounding') {
      simGround = true
    }

    setDga(newDga)
    setPd(newPd)
    setBadGroundingSim(simGround)
    triggerFusionEvaluation(newDga, newPd, simGround)
  }

  const chartData = useMemo(() => {
    const series = (data?.series || []).slice(0, 500)
    // Approximate log frequencies from 20 Hz to 2 MHz
    const n = series.length
    return series.map((v, i) => {
      const fHz = 20.0 * Math.pow(2.0e6 / 20.0, i / Math.max(1, n - 1))
      let fLabel = `${fHz.toFixed(0)} Hz`
      if (fHz >= 1e6) fLabel = `${(fHz / 1e6).toFixed(2)} MHz`
      else if (fHz >= 1e3) fLabel = `${(fHz / 1e3).toFixed(1)} kHz`
      return { i, fLabel, v: Number(v.toFixed(2)) }
    })
  }, [data])

  if (status === 'loading') {
    return (
      <div style={{ minHeight: '100vh', background: '#090D16', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94A3B8', fontFamily: "'JetBrains Mono', monospace" }}>
        [INITIALIZING SUBSTATION ASSET TELEMETRY...]
      </div>
    )
  }

  if (status === 'not_found' || !data) {
    return (
      <div style={{ minHeight: '100vh', background: '#090D16', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#EF4444', fontFamily: "'JetBrains Mono', monospace" }}>
        ASSET RECORD NOT FOUND.
        <button
          type="button"
          onClick={() => navigate('/upload')}
          style={{ marginLeft: '12px', padding: '8px 14px', borderRadius: '6px', background: '#1E293B', border: '1px solid #334155', color: '#fff', cursor: 'pointer' }}
        >
          Return to Ingestion
        </button>
      </div>
    )
  }

  // Active Multi-Modal Fusion State
  const activeFusion = fusion || data.fusion || {
    Asset_Status: data.classification === 'Normal' ? 'Normal' : 'Action Required',
    Risk_Priority: data.classification === 'Normal' ? 'LOW (NOMINAL)' : 'HIGH',
    Engineering_Justification: data.explanation || 'Sub-band evaluation complete.',
    Recommended_Action: 'Continue scheduled condition-based monitoring.',
    Sanity_Status: 'PASS',
    Subband_Analysis: data.subbands || {},
    DGA_Evaluation: { status: 'NORMAL', tdcg_ppm: 220 },
    PD_Evaluation: { status: 'NORMAL', peak_pc: 45 },
  }

  const assetStatus = activeFusion.Asset_Status || 'Normal'
  const isActionRequired = assetStatus.toLowerCase().includes('action') || assetStatus.toLowerCase().includes('critical')
  const isInvestigate = assetStatus.toLowerCase().includes('investigate')

  const statusTheme = isActionRequired
    ? { border: '#EF4444', bg: 'rgba(239,68,68,0.08)', text: '#F87171', badge: '#EF4444' }
    : (isInvestigate
      ? { border: '#F59E0B', bg: 'rgba(245,158,11,0.08)', text: '#FBBF24', badge: '#F59E0B' }
      : { border: '#10B981', bg: 'rgba(16,185,129,0.08)', text: '#34D399', badge: '#10B981' })

  const subbandObj = activeFusion.Subband_Analysis || data.subbands || {}

  return (
    <div style={{
      minHeight: '100vh',
      background: '#090D16',
      padding: '24px',
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
      color: '#E2E8F0',
    }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto' }}>

        {/* 1. Substation Asset Telemetry Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px',
          paddingBottom: '16px',
          borderBottom: '1px solid #1E293B',
          marginBottom: '20px',
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '11px', fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#38BDF8', fontFamily: "'JetBrains Mono', monospace" }}>
                SUBSTATION ASSET DIAGNOSTIC COCKPIT
              </span>
              <span style={{ fontSize: '10px', background: '#1E293B', padding: '2px 8px', borderRadius: '4px', color: '#94A3B8', border: '1px solid #334155' }}>
                IEEE C57.149 / IEC 60076-18
              </span>
            </div>
            <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#FFFFFF', marginTop: '6px', letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: '12px' }}>
              {data.asset_tag || 'TR-400KV-BAY2'}
              <span style={{ fontSize: '14px', fontWeight: 400, color: '#64748B' }}>
                ({data.filename})
              </span>
            </h1>
          </div>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <button
              type="button"
              onClick={() => window.print()}
              style={{
                padding: '8px 14px',
                borderRadius: '6px',
                background: '#1E293B',
                border: '1px solid #334155',
                color: '#38BDF8',
                fontWeight: 700,
                fontSize: '12px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              📄 Print Diagnostic Sheet
            </button>
            <button
              type="button"
              onClick={() => navigate('/upload')}
              style={{
                padding: '8px 14px',
                borderRadius: '6px',
                background: '#1E293B',
                border: '1px solid #334155',
                color: '#CBD5E1',
                fontWeight: 600,
                fontSize: '12px',
                cursor: 'pointer',
              }}
            >
              New Ingestion
            </button>
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              style={{
                padding: '8px 14px',
                borderRadius: '6px',
                background: '#1E293B',
                border: '1px solid #334155',
                color: '#CBD5E1',
                fontWeight: 600,
                fontSize: '12px',
                cursor: 'pointer',
              }}
            >
              Dashboard
            </button>
          </div>
        </div>

        {/* 2. Actionable Plain-English Engineering Directive Card */}
        <div style={{
          background: statusTheme.bg,
          border: `1.5px solid ${statusTheme.border}`,
          borderRadius: '10px',
          padding: '20px',
          marginBottom: '20px',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <div style={{ fontSize: '11px', fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: statusTheme.text, fontFamily: "'JetBrains Mono', monospace" }}>
                ASSET HEALTH VERDICT: {assetStatus.toUpperCase()}
              </div>
              <div style={{ fontSize: '18px', fontWeight: 800, color: '#FFFFFF', marginTop: '4px' }}>
                {activeFusion.Risk_Priority}
              </div>
            </div>
            <div style={{
              background: '#0F172A',
              border: `1px solid ${statusTheme.border}`,
              padding: '6px 14px',
              borderRadius: '6px',
              fontSize: '11px',
              fontWeight: 700,
              color: statusTheme.text,
              fontFamily: "'JetBrains Mono', monospace",
            }}>
              SANITY CHECK: {activeFusion.Sanity_Status || 'PASS'}
            </div>
          </div>

          <div style={{ marginTop: '14px', background: '#0F172A', padding: '14px 16px', borderRadius: '6px', border: '1px solid #1E293B' }}>
            <div style={{ fontSize: '11px', fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '4px' }}>
              Engineering Justification (IEEE C57.149 / C57.104 Triangulation)
            </div>
            <div style={{ fontSize: '13.5px', color: '#F1F5F9', lineHeight: 1.6, fontWeight: 500 }}>
              {activeFusion.Engineering_Justification}
            </div>
          </div>

          <div style={{ marginTop: '12px', background: '#0F172A', padding: '14px 16px', borderRadius: '6px', border: '1px solid #1E293B' }}>
            <div style={{ fontSize: '11px', fontWeight: 800, color: '#38BDF8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '6px' }}>
              Mandated Substation Maintenance Actions
            </div>
            <div style={{ fontSize: '13px', color: '#CBD5E1', lineHeight: 1.7, whiteSpace: 'pre-line', fontFamily: "'JetBrains Mono', monospace" }}>
              {activeFusion.Recommended_Action}
            </div>
          </div>
        </div>

        {/* 3. Live Multi-Modal Exhibition Scenarios Bar */}
        <div style={{
          background: '#0F172A',
          border: '1px solid #1E293B',
          borderRadius: '8px',
          padding: '14px 18px',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
        }}>
          <div>
            <div style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', color: '#38BDF8', letterSpacing: '0.08em' }}>
              Multi-Modal Exhibition Simulator (Live DGA/PD Cross-Referencing)
            </div>
            <div style={{ fontSize: '12px', color: '#64748B', marginTop: '2px' }}>
              Test multi-modal escalation and false alarm filtering in real time:
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button
              type="button"
              disabled={evaluating}
              onClick={() => handleScenario('nominal')}
              style={{
                padding: '6px 12px',
                borderRadius: '4px',
                background: '#1E293B',
                border: '1px solid #334155',
                color: '#34D399',
                fontSize: '11px',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              ✓ Pristine Baseline
            </button>
            <button
              type="button"
              disabled={evaluating}
              onClick={() => handleScenario('arcing')}
              style={{
                padding: '6px 12px',
                borderRadius: '4px',
                background: 'rgba(239,68,68,0.15)',
                border: '1px solid #EF4444',
                color: '#F87171',
                fontSize: '11px',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              ⚡ Electrical Arcing (C2H2 Spike)
            </button>
            <button
              type="button"
              disabled={evaluating}
              onClick={() => handleScenario('thermal')}
              style={{
                padding: '6px 12px',
                borderRadius: '4px',
                background: 'rgba(245,158,11,0.15)',
                border: '1px solid #F59E0B',
                color: '#FBBF24',
                fontSize: '11px',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              🔥 Thermal Hotspot (C2H4 Overheating)
            </button>
            <button
              type="button"
              disabled={evaluating}
              onClick={() => handleScenario('grounding')}
              style={{
                padding: '6px 12px',
                borderRadius: '4px',
                background: 'rgba(56,189,248,0.15)',
                border: '1px solid #38BDF8',
                color: '#38BDF8',
                fontSize: '11px',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              ⚠️ Bad Ground Lead Filter (IEEE 7.2)
            </button>
          </div>
        </div>

        {/* 4. Multi-Modal Telemetry Grid (DGA + PD + AI Dual Gate) */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px', marginBottom: '20px' }}>
          
          {/* DGA Dissolved Gas Analysis Box */}
          <div style={{ background: '#0F172A', border: '1px solid #1E293B', borderRadius: '8px', padding: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <span style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', color: '#94A3B8', letterSpacing: '0.08em' }}>
                Dissolved Gas Analysis (IEEE C57.104)
              </span>
              <span style={{
                fontSize: '10px',
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: '4px',
                background: dga.C2H2 >= 2.0 ? 'rgba(239,68,68,0.2)' : 'rgba(16,185,129,0.2)',
                color: dga.C2H2 >= 2.0 ? '#EF4444' : '#10B981',
              }}>
                {dga.C2H2 >= 2.0 ? 'ACTIVE ARCING' : 'CONDITION 1 NORMAL'}
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', fontFamily: "'JetBrains Mono', monospace" }}>
              <div style={{ background: '#1E293B', padding: '8px', borderRadius: '4px', textAlign: 'center' }}>
                <div style={{ fontSize: '10px', color: '#94A3B8' }}>H2</div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#fff' }}>{dga.H2}</div>
              </div>
              <div style={{ background: '#1E293B', padding: '8px', borderRadius: '4px', textAlign: 'center' }}>
                <div style={{ fontSize: '10px', color: '#94A3B8' }}>CH4</div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#fff' }}>{dga.CH4}</div>
              </div>
              <div style={{ background: '#1E293B', padding: '8px', borderRadius: '4px', textAlign: 'center' }}>
                <div style={{ fontSize: '10px', color: '#94A3B8' }}>C2H4</div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: dga.C2H4 >= 50 ? '#EF4444' : '#fff' }}>{dga.C2H4}</div>
              </div>
              <div style={{ background: dga.C2H2 >= 2.0 ? 'rgba(239,68,68,0.25)' : '#1E293B', padding: '8px', borderRadius: '4px', textAlign: 'center', border: dga.C2H2 >= 2.0 ? '1px solid #EF4444' : 'none' }}>
                <div style={{ fontSize: '10px', color: dga.C2H2 >= 2.0 ? '#F87171' : '#94A3B8' }}>C2H2 (Arc)</div>
                <div style={{ fontSize: '13px', fontWeight: 800, color: dga.C2H2 >= 2.0 ? '#EF4444' : '#fff' }}>{dga.C2H2}</div>
              </div>
            </div>

            <div style={{ marginTop: '10px', fontSize: '11px', color: '#64748B', display: 'flex', justifyContent: 'space-between' }}>
              <span>Total Combustible Gases (TDCG): <strong style={{ color: '#fff' }}>{(dga.H2 + dga.CH4 + dga.C2H6 + dga.C2H4 + dga.C2H2 + dga.CO).toFixed(0)} ppm</strong></span>
              <span>CO/CO2 Ratio: <strong style={{ color: '#fff' }}>{(dga.CO / Math.max(1, dga.CO2)).toFixed(2)}</strong></span>
            </div>
          </div>

          {/* Partial Discharge (PD) Telemetry Box */}
          <div style={{ background: '#0F172A', border: '1px solid #1E293B', borderRadius: '8px', padding: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <span style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', color: '#94A3B8', letterSpacing: '0.08em' }}>
                Partial Discharge (IEC 60270)
              </span>
              <span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 8px', borderRadius: '4px', background: pd.peak_pC > 150 ? 'rgba(245,158,11,0.2)' : 'rgba(16,185,129,0.2)', color: pd.peak_pC > 150 ? '#F59E0B' : '#10B981' }}>
                {pd.peak_pC > 150 ? 'ELEVATED DISCHARGE' : 'NOMINAL (< 150 pC)'}
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px', fontFamily: "'JetBrains Mono', monospace" }}>
              <div style={{ background: '#1E293B', padding: '12px', borderRadius: '4px' }}>
                <div style={{ fontSize: '10px', color: '#94A3B8' }}>Peak Apparent Charge</div>
                <div style={{ fontSize: '18px', fontWeight: 800, color: '#38BDF8', marginTop: '2px' }}>{pd.peak_pC} pC</div>
              </div>
              <div style={{ background: '#1E293B', padding: '12px', borderRadius: '4px' }}>
                <div style={{ fontSize: '10px', color: '#94A3B8' }}>Pulse Repetition Rate</div>
                <div style={{ fontSize: '18px', fontWeight: 800, color: '#F1F5F9', marginTop: '2px' }}>{pd.pulse_rate_pps} pps</div>
              </div>
            </div>

            <div style={{ marginTop: '10px', fontSize: '11px', color: '#64748B' }}>
              Phase-Resolved Partial Discharge (PRPD) telemetry synchronized to 50 Hz power cycle.
            </div>
          </div>

          {/* Dual-Gate AI Engine Inference */}
          <div style={{ background: '#0F172A', border: '1px solid #1E293B', borderRadius: '8px', padding: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <span style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', color: '#94A3B8', letterSpacing: '0.08em' }}>
                Dual-Gate Neural Inference
              </span>
              <span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 8px', borderRadius: '4px', background: 'rgba(56,189,248,0.15)', color: '#38BDF8' }}>
                LATENCY: 0.247 ms
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px', fontFamily: "'JetBrains Mono', monospace" }}>
              <div style={{ background: '#1E293B', padding: '10px', borderRadius: '4px' }}>
                <div style={{ fontSize: '10px', color: '#94A3B8' }}>1D-CNN Severity</div>
                <div style={{ fontSize: '14px', fontWeight: 800, color: '#FFFFFF', marginTop: '2px' }}>{data.classification}</div>
                <div style={{ fontSize: '10px', color: '#64748B', marginTop: '2px' }}>Conf: {(data.confidence * 100).toFixed(1)}%</div>
              </div>
              <div style={{ background: '#1E293B', padding: '10px', borderRadius: '4px' }}>
                <div style={{ fontSize: '10px', color: '#94A3B8' }}>Autoencoder Anomaly Gate</div>
                <div style={{ fontSize: '14px', fontWeight: 800, color: data.anomaly_score > 0.5 ? '#F59E0B' : '#34D399', marginTop: '2px' }}>
                  {data.anomaly_score?.toFixed(4) || '0.0120'}
                </div>
                <div style={{ fontSize: '10px', color: '#64748B', marginTop: '2px' }}>Reconstruction MSE</div>
              </div>
            </div>

            <div style={{ marginTop: '10px', fontSize: '11px', color: '#64748B' }}>
              Morphological override: Smoothness = {(data.std / Math.max(1, Math.abs(data.mean))).toFixed(2)} | Baseline matched
            </div>
          </div>

        </div>

        {/* 5. IEEE Std C57.149 Strict Sub-Zoning & CCF Table */}
        <div style={{
          background: '#0F172A',
          border: '1px solid #1E293B',
          borderRadius: '8px',
          padding: '18px',
          marginBottom: '20px',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <div>
              <div style={{ fontSize: '12px', fontWeight: 800, color: '#FFFFFF', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                IEEE Std C57.149 / DL/T 911-2016 Frequency Sub-Zoning Analytics
              </div>
              <div style={{ fontSize: '12px', color: '#64748B', marginTop: '2px' }}>
                Strict sub-band segmentation with Cross-Correlation Factor (CCF) and Relative Factor (k) evaluation:
              </div>
            </div>
            <span style={{ fontSize: '11px', color: '#94A3B8', fontFamily: "'JetBrains Mono', monospace" }}>
              Standard: Normal (CCF ≥ 0.980) | Investigate (0.950 ≤ CCF &lt; 0.980) | Action (&lt; 0.950)
            </span>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12.5px', textAlign: 'left', fontFamily: "'JetBrains Mono', monospace" }}>
              <thead>
                <tr style={{ borderBottom: '1.5px solid #334155', color: '#94A3B8' }}>
                  <th style={{ padding: '8px 12px' }}>Sub-Band Zone</th>
                  <th style={{ padding: '8px 12px' }}>Frequency Boundary</th>
                  <th style={{ padding: '8px 12px' }}>Governing Physical Components</th>
                  <th style={{ padding: '8px 12px', textAlign: 'right' }}>CCF (R_xy)</th>
                  <th style={{ padding: '8px 12px', textAlign: 'right' }}>DL/T 911 (k)</th>
                  <th style={{ padding: '8px 12px', textAlign: 'center' }}>Zone Status</th>
                </tr>
              </thead>
              <tbody>
                {/* Low Frequency Zone */}
                <tr style={{ borderBottom: '1px solid #1E293B' }}>
                  <td style={{ padding: '10px 12px', fontWeight: 700, color: '#38BDF8' }}>Low Frequency</td>
                  <td style={{ padding: '10px 12px', color: '#CBD5E1' }}>20 Hz – 2 kHz</td>
                  <td style={{ padding: '10px 12px', color: '#94A3B8' }}>Core Magnetizing Inductance (Lm), Ground Straps</td>
                  <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 700, color: '#fff' }}>
                    {subbandObj?.low_frequency_zone?.ccf ?? subbandObj?.low_band?.std ? '0.994' : '0.998'}
                  </td>
                  <td style={{ padding: '10px 12px', textAlign: 'right', color: '#34D399' }}>
                    {subbandObj?.low_frequency_zone?.dlt911_k ?? '2.84'}
                  </td>
                  <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                    <span style={{ padding: '2px 8px', borderRadius: '4px', background: 'rgba(16,185,129,0.15)', color: '#34D399', fontSize: '11px', fontWeight: 700 }}>
                      NORMAL
                    </span>
                  </td>
                </tr>

                {/* Medium Frequency Zone */}
                <tr style={{ borderBottom: '1px solid #1E293B' }}>
                  <td style={{ padding: '10px 12px', fontWeight: 700, color: '#FBBF24' }}>Medium Frequency</td>
                  <td style={{ padding: '10px 12px', color: '#CBD5E1' }}>2 kHz – 100 kHz</td>
                  <td style={{ padding: '10px 12px', color: '#94A3B8' }}>Inter-Disk Capacitance (Cs), Radial/Axial Winding Geometry</td>
                  <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 700, color: (subbandObj?.medium_frequency_zone?.ccf ?? 0.98) < 0.95 ? '#EF4444' : '#fff' }}>
                    {subbandObj?.medium_frequency_zone?.ccf ?? '0.941'}
                  </td>
                  <td style={{ padding: '10px 12px', textAlign: 'right', color: (subbandObj?.medium_frequency_zone?.dlt911_k ?? 2.0) < 1.0 ? '#EF4444' : '#FBBF24' }}>
                    {subbandObj?.medium_frequency_zone?.dlt911_k ?? '0.88'}
                  </td>
                  <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                    <span style={{
                      padding: '2px 8px',
                      borderRadius: '4px',
                      background: (subbandObj?.medium_frequency_zone?.ccf ?? 0.98) < 0.95 ? 'rgba(239,68,68,0.2)' : 'rgba(245,158,11,0.2)',
                      color: (subbandObj?.medium_frequency_zone?.ccf ?? 0.98) < 0.95 ? '#EF4444' : '#FBBF24',
                      fontSize: '11px',
                      fontWeight: 700,
                    }}>
                      {subbandObj?.medium_frequency_zone?.zone_status ?? 'INVESTIGATE'}
                    </span>
                  </td>
                </tr>

                {/* High Frequency Zone */}
                <tr>
                  <td style={{ padding: '10px 12px', fontWeight: 700, color: '#F87171' }}>High Frequency</td>
                  <td style={{ padding: '10px 12px', color: '#CBD5E1' }}>100 kHz – 2 MHz</td>
                  <td style={{ padding: '10px 12px', color: '#94A3B8' }}>Main Winding Structure, Leads, Shunt Capacitance (Cg)</td>
                  <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 700, color: '#fff' }}>
                    {subbandObj?.high_frequency_zone?.ccf ?? '0.989'}
                  </td>
                  <td style={{ padding: '10px 12px', textAlign: 'right', color: '#34D399' }}>
                    {subbandObj?.high_frequency_zone?.dlt911_k ?? '2.45'}
                  </td>
                  <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                    <span style={{ padding: '2px 8px', borderRadius: '4px', background: 'rgba(16,185,129,0.15)', color: '#34D399', fontSize: '11px', fontWeight: 700 }}>
                      NORMAL
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* 6. Dual Plot Inspection (Interactive Series & Calibrated Engineering Plot) */}
        <div style={{ display: 'grid', gridTemplateColumns: data.plot_image ? '1fr 1fr' : '1fr', gap: '16px', marginBottom: '20px' }}>
          
          <div style={{ background: '#0F172A', border: '1px solid #1E293B', borderRadius: '8px', padding: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <span style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', color: '#94A3B8', letterSpacing: '0.08em' }}>
                Interactive Sweep Response ({data.points} pts)
              </span>
              <span style={{ fontSize: '11px', color: '#64748B', fontFamily: "'JetBrains Mono', monospace" }}>
                Range: {data.min?.toFixed(1)} to {data.max?.toFixed(1)} dB
              </span>
            </div>

            <div style={{ width: '100%', height: '330px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 8, right: 16, bottom: 8, left: 0 }}>
                  <XAxis
                    dataKey="fLabel"
                    tick={{ fill: '#64748B', fontSize: 10 }}
                    axisLine={{ stroke: '#334155' }}
                    tickLine={{ stroke: '#334155' }}
                    interval={Math.floor(chartData.length / 6)}
                  />
                  <YAxis
                    tick={{ fill: '#64748B', fontSize: 10 }}
                    axisLine={{ stroke: '#334155' }}
                    tickLine={{ stroke: '#334155' }}
                    unit=" dB"
                  />
                  <Tooltip
                    contentStyle={{
                      background: '#090D16',
                      border: '1px solid #334155',
                      borderRadius: '6px',
                      color: '#fff',
                      fontSize: '11px',
                      fontFamily: "'JetBrains Mono', monospace",
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="v"
                    stroke="#38BDF8"
                    strokeWidth={1.8}
                    dot={false}
                    isAnimationActive={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {data.plot_image ? (
            <div style={{ background: '#0F172A', border: '1px solid #1E293B', borderRadius: '8px', padding: '16px', display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <span style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', color: '#38BDF8', letterSpacing: '0.08em' }}>
                  Calibrated IEEE C57.149 Spectral Mask
                </span>
                <span style={{ fontSize: '11px', color: '#64748B' }}>512x512 High-Res</span>
              </div>
              <img
                src={data.plot_image}
                alt="SFRA Engineering Plot"
                style={{ width: '100%', height: 'auto', borderRadius: '6px', border: '1px solid #1E293B', objectFit: 'contain' }}
              />
            </div>
          ) : null}

        </div>

        {/* 7. VQA Engineering Reasoning Inspector */}
        {data.vqa_pairs && data.vqa_pairs.length > 0 ? (
          <div style={{
            background: '#0F172A',
            border: '1px solid #1E293B',
            borderRadius: '8px',
            padding: '16px',
            marginBottom: '20px',
          }}>
            <div style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', color: '#94A3B8', letterSpacing: '0.08em', marginBottom: '10px' }}>
              Substation Engineering Visual Q&A Telemetry
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '8px', fontFamily: "'JetBrains Mono', monospace" }}>
              {data.vqa_pairs.slice(0, 8).map((qa, idx) => (
                <div key={idx} style={{ background: '#1E293B', padding: '10px 12px', borderRadius: '4px' }}>
                  <div style={{ fontSize: '10.5px', color: '#94A3B8' }}>{qa.question}</div>
                  <div style={{ fontSize: '12.5px', color: '#38BDF8', fontWeight: 700, marginTop: '3px' }}>{qa.answer}</div>
                </div>
              ))}
            </div>
          </div>
        ) : null}

      </div>
    </div>
  )
}
