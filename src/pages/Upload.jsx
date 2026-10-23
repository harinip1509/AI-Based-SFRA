import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { API_BASE, apiRequest } from '../lib/api'
import { useTheme } from '../lib/theme'
import DashboardNavbar from '../components/dashboard/DashboardNavbar'

const MAX_FILE_BYTES = 10 * 1024 * 1024 // 10MB
const parseTimestamp = (value) => {
  if (!value) return 0
  if (typeof value === 'number') return value
  const asNumber = Number(value)
  if (Number.isFinite(asNumber) && asNumber > 0) return asNumber
  const asDate = new Date(value).getTime()
  return Number.isFinite(asDate) ? asDate : 0
}

const normalizeHistory = (items) =>
  (Array.isArray(items) ? items : [])
    .filter((item) => item?.id)
    .sort((a, b) => parseTimestamp(b?.timestamp) - parseTimestamp(a?.timestamp))
    .slice(0, 10)

export default function Upload() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { isDark } = useTheme()

  const [user, setUser] = useState({ name: 'Engineer', email: 'user@intellifra.ai' })
  const [history, setHistory] = useState([])

  const [file, setFile] = useState(null)
  const [assetTag, setAssetTag] = useState('TR-400KV-315MVA-BHEL-01')
  const [substationBay, setSubstationBay] = useState('Bay 401 (Kalwa 400 kV GIS)')
  const [includeDga, setIncludeDga] = useState(false)
  const [c2h2, setC2h2] = useState('0.0')
  const [c2h4, setC2h4] = useState('12.0')
  const [h2, setH2] = useState('15.0')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [checklist, setChecklist] = useState({
    earth_flat: true,
    shield_ground: true,
    bushing_clean: true,
    ct_ground: true,
    tap_fixed: true,
    isolator_gap: true,
  })

  // Load user profile & history to harmonize with Dashboard
  useEffect(() => {
    let cancelled = false
    const run = async () => {
      try {
        const token = localStorage.getItem('token')
        if (!token) {
          navigate('/login', { replace: true })
          return
        }
        const data = await apiRequest('/profile', { token })
        if (!cancelled) setUser({ name: data?.name || 'Engineer', email: data?.email || 'user@intellifra.ai' })
      } catch {
        if (!cancelled) setUser({ name: 'Substation Engineer', email: 'engineer@intellifra.com' })
      }
    }
    run()
    return () => { cancelled = true }
  }, [navigate])

  const fallbackHistory = useMemo(() => {
    try {
      const raw = JSON.parse(localStorage.getItem('fra_history') || '[]')
      return normalizeHistory(raw)
    } catch {
      return []
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    const loadHistory = async () => {
      try {
        const token = localStorage.getItem('token')
        if (!token) return
        const data = await apiRequest('/fra/history', { token })
        const list = normalizeHistory(data)
        if (!cancelled) setHistory(list.length ? list : fallbackHistory)
      } catch {
        if (!cancelled) setHistory(fallbackHistory)
      }
    }
    loadHistory()
    return () => { cancelled = true }
  }, [fallbackHistory])

  const handleLogout = () => {
    localStorage.removeItem('token')
    navigate('/login', { replace: true })
  }

  const loadPreset = async (fileName, asset, bay, dgaOptions = null) => {
    try {
      let res
      try {
        res = await fetch(`/samples/${fileName}`)
      } catch {
        res = await fetch(`./samples/${fileName}`)
      }
      if (!res.ok) {
        res = await fetch(`./samples/${fileName}`)
      }
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const blob = await res.blob()
      const sampleFile = new File([blob], fileName, { type: blob.type || 'text/csv' })
      setFile(sampleFile)
      if (asset) setAssetTag(asset)
      if (bay) setSubstationBay(bay)
      if (dgaOptions) {
        setIncludeDga(true)
        if (dgaOptions.c2h2) setC2h2(dgaOptions.c2h2)
        if (dgaOptions.c2h4) setC2h4(dgaOptions.c2h4)
        if (dgaOptions.h2) setH2(dgaOptions.h2)
      } else {
        setIncludeDga(false)
      }
      setError('')
    } catch (err) {
      setError('Could not load sample file: ' + (err?.message || 'Check connection'))
    }
  }

  useEffect(() => {
    const qTag = searchParams.get('asset_tag')
    const qBay = searchParams.get('bay')
    if (qTag) setAssetTag(qTag)
    if (qBay) setSubstationBay(qBay)
  }, [searchParams])

  const fileLabel = useMemo(() => file?.name || 'Click or Drag SFRA Sweep File (.csv, .txt) or Curve Plot (.png, .jpg)', [file])

  const onSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!file) {
      setError('Please select an SFRA sweep file (.csv, .txt) or plot screenshot (.png, .jpg)')
      return
    }

    const ext = (file.name.split('.').pop() || '').toLowerCase()
    if (!['csv', 'txt', 'png', 'jpg', 'jpeg'].includes(ext)) {
      setError('Unsupported file type. Supported formats: .csv, .txt, .png, .jpg, .jpeg')
      return
    }
    if (file.size > MAX_FILE_BYTES) {
      setError('File must be smaller than 10MB')
      return
    }

    const token = localStorage.getItem('token') || 'demo-engineer-session-token'

    setLoading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('asset_tag', `${assetTag} [${substationBay}]`)

      if (includeDga) {
        const dgaData = {
          H2: parseFloat(h2) || 15.0,
          CH4: 8.0,
          C2H6: 5.0,
          C2H4: parseFloat(c2h4) || 12.0,
          C2H2: parseFloat(c2h2) || 0.0,
          CO: 180.0,
          CO2: 1200.0,
        }
        formData.append('dga_json', JSON.stringify(dgaData))
      }

      const candidateBases = [
        API_BASE,
        'http://127.0.0.1:8000',
        'http://localhost:8000',
      ].filter(Boolean)
      const uniqueBases = Array.from(new Set(candidateBases))

      let res = null
      let lastErr = null

      for (const base of uniqueBases) {
        try {
          const attempt = await fetch(`${base}/fra/upload`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` },
            body: formData,
          })
          if (attempt.ok || (attempt.status >= 400 && attempt.status < 500)) {
            res = attempt
            break
          }
          res = attempt
        } catch (err) {
          lastErr = err
        }
      }

      if (!res && lastErr) throw lastErr

      const data = await res?.json().catch(() => null)
      if (!res?.ok) {
        const msg = data?.detail || `Upload processing failed (HTTP ${res?.status || 500})`
        throw new Error(msg)
      }

      try {
        const prev = JSON.parse(localStorage.getItem('fra_history') || '[]')
        const next = [{
          id: data.id,
          filename: data.filename,
          classification: data.classification,
          timestamp: data.timestamp || Date.now(),
        }, ...(Array.isArray(prev) ? prev : [])]
          .filter((item) => item?.id)
          .sort((a, b) => parseTimestamp(b?.timestamp) - parseTimestamp(a?.timestamp))
          .slice(0, 10)
        localStorage.setItem('fra_history', JSON.stringify(next))
        window.dispatchEvent(new CustomEvent('fra-history-updated', { detail: next }))
      } catch {
        // ignore history write errors
      }

      navigate(`/results/${data.id}`)
    } catch (err) {
      setError(err?.message || 'Processing error. Please verify the file format.')
    } finally {
      setLoading(false)
    }
  }

  const pageBg = isDark ? '#0B0F19' : '#F8FAFC'
  const cardBg = isDark ? '#111827' : '#FFFFFF'
  const cardBorder = isDark ? '#1F2937' : '#E2E8F0'
  const inputBg = isDark ? '#1F2937' : '#FFFFFF'
  const inputBorder = isDark ? '#374151' : '#CBD5E1'
  const textMain = isDark ? '#F9FAFB' : '#0F172A'
  const textMuted = isDark ? '#9CA3AF' : '#64748B'

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: pageBg,
      color: textMain,
      transition: 'background-color 0.2s, color 0.2s',
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    }}>
      {/* 1. Unified Dashboard Top Navigation */}
      <DashboardNavbar user={user} onLogout={handleLogout} history={history} />

      {/* 2. Main Dashboard Shell matching Dashboard.jsx */}
      <main style={{
        padding: '24px',
        maxWidth: '1360px',
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
      }}>

        {/* Back to Dashboard Breadcrumb + Context Bar */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
        }}>
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 16px',
              borderRadius: '8px',
              background: isDark ? '#1F2937' : '#FFFFFF',
              border: `1.5px solid ${isDark ? '#374151' : '#CBD5E1'}`,
              color: textMain,
              fontSize: '13px',
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: isDark ? 'none' : '0 2px 6px rgba(0,0,0,0.05)',
            }}
            className="hover:border-blue-500 active:scale-95"
          >
            <span style={{ fontSize: '16px', lineHeight: 1 }}>←</span>
            <span>Back to Dashboard Overview</span>
          </button>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              onClick={() => navigate('/substations')}
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                backgroundColor: isDark ? '#1F2937' : '#F1F5F9',
                border: `1px solid ${isDark ? '#374151' : '#CBD5E1'}`,
                color: '#0284C7',
                fontSize: '13px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              🛰️ Indian Substation Radar →
            </button>
          </div>
        </div>

        {/* Engineering System Banner */}
        <div style={{
          backgroundColor: cardBg,
          border: `1.5px solid ${cardBorder}`,
          borderRadius: '8px',
          padding: '18px 22px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '14px',
        }}>
          <div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '11px',
              fontWeight: 800,
              color: '#0284C7',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              fontFamily: "'JetBrains Mono', monospace",
            }}>
              <span>CENTRAL ELECTRICITY AUTHORITY (CEA) • EHV TRANSFORMER DIAGNOSTICS</span>
              <span style={{ background: isDark ? '#1F2937' : '#F1F5F9', border: `1px solid ${cardBorder}`, padding: '2px 8px', borderRadius: '4px', color: textMuted }}>
                IS 2026 / IS 10593 / IEEE C57.149
              </span>
            </div>
            <h1 style={{ fontSize: '20px', fontWeight: 800, color: textMain, marginTop: '4px' }}>
              Ingest Frequency Sweep & Multi-Modal Transformer Telemetry
            </h1>
            <div style={{ fontSize: '13px', color: textMuted, marginTop: '3px' }}>
              Accepts test exports (<strong style={{ color: textMain }}>.csv, .txt</strong>) or visual sweep plots (<strong style={{ color: textMain }}>.png, .jpg</strong>). Evaluates 3-band CCF, hoop buckling, and DGA flashover triggers.
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <span style={{
              padding: '6px 12px',
              borderRadius: '6px',
              background: 'rgba(16,185,129,0.12)',
              border: '1px solid #10B981',
              color: '#10B981',
              fontSize: '12px',
              fontWeight: 800,
            }}>
              ● Dual-Gate AI Online
            </span>
          </div>
        </div>

        {/* Two-Column Responsive Grid matching Cockpit layout */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(460px, 1fr))',
          gap: '20px',
          alignItems: 'start',
        }}>

          {/* LEFT COLUMN: Main Ingestion Form & Benchmark Presets */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

            <div style={{
              backgroundColor: cardBg,
              border: `1.5px solid ${cardBorder}`,
              borderRadius: '8px',
              padding: '24px',
            }}>
              {error ? (
                <div style={{
                  marginBottom: '18px',
                  padding: '12px 16px',
                  borderRadius: '6px',
                  background: 'rgba(239,68,68,0.12)',
                  border: '1.5px solid #EF4444',
                  color: '#EF4444',
                  fontSize: '13px',
                  fontWeight: 700,
                }}>
                  ⚠️ {error}
                </div>
              ) : null}

              <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

                {/* Asset Identification Details */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 800, color: isDark ? '#CBD5E1' : '#334155', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>
                      Transformer Asset ID
                    </label>
                    <input
                      type="text"
                      value={assetTag}
                      onChange={(e) => setAssetTag(e.target.value)}
                      placeholder="e.g. TR-400KV-315MVA-BHEL-01"
                      style={{
                        width: '100%',
                        padding: '11px 13px',
                        borderRadius: '6px',
                        background: inputBg,
                        border: `1px solid ${inputBorder}`,
                        color: textMain,
                        fontSize: '13.5px',
                        fontFamily: "'JetBrains Mono', monospace",
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 800, color: isDark ? '#CBD5E1' : '#334155', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>
                      Substation Bay / Location
                    </label>
                    <input
                      type="text"
                      value={substationBay}
                      onChange={(e) => setSubstationBay(e.target.value)}
                      placeholder="e.g. Bay 401 (Kalwa 400 kV GIS)"
                      style={{
                        width: '100%',
                        padding: '11px 13px',
                        borderRadius: '6px',
                        background: inputBg,
                        border: `1px solid ${inputBorder}`,
                        color: textMain,
                        fontSize: '13.5px',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>
                </div>

                {/* 1-Click Indian Field Benchmark Presets */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <label style={{ fontSize: '12px', fontWeight: 800, color: isDark ? '#CBD5E1' : '#334155', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Indian Field Benchmark Presets:
                    </label>
                    <span style={{ fontSize: '11px', color: '#0284C7', fontWeight: 700 }}>
                      ⚡ 1-Click Auto-Fill
                    </span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                    <button
                      type="button"
                      onClick={() => loadPreset('TX_MUM_04_Field_Sweep.csv', 'TX_MUM_04', 'Bay 401 (Wadala 50 MVA)')}
                      style={{
                        padding: '10px 12px',
                        borderRadius: '6px',
                        background: isDark ? '#1E293B' : '#FFFFFF',
                        border: '1.5px solid #0284C7',
                        color: isDark ? '#38BDF8' : '#0284C7',
                        fontSize: '12px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        textAlign: 'left',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        boxShadow: isDark ? 'none' : '0 2px 6px rgba(0,0,0,0.05)',
                      }}
                      className="hover:border-blue-400 active:scale-95"
                    >
                      <span style={{ fontSize: '16px' }}>⚡</span>
                      <div>
                        <div>TX_MUM_04 Sweep</div>
                        <div style={{ fontSize: '10.5px', color: textMuted, fontWeight: 500 }}>BHEL 50 MVA • Phase A</div>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => loadPreset('TX_MUM_02_Field_Sweep.csv', 'TX_MUM_02', 'Bay 402 (Kalwa 315 MVA)', { c2h4: '48.0', c2h2: '2.4', h2: '35.0' })}
                      style={{
                        padding: '10px 12px',
                        borderRadius: '6px',
                        background: isDark ? '#1E293B' : '#FFFFFF',
                        border: '1.5px solid #8B5CF6',
                        color: isDark ? '#C4B5FD' : '#7C3AED',
                        fontSize: '12px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        textAlign: 'left',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        boxShadow: isDark ? 'none' : '0 2px 6px rgba(0,0,0,0.05)',
                      }}
                      className="hover:border-purple-400 active:scale-95"
                    >
                      <span style={{ fontSize: '16px' }}>⚡</span>
                      <div>
                        <div>TX_MUM_02 Sweep</div>
                        <div style={{ fontSize: '10.5px', color: textMuted, fontWeight: 500 }}>Hitachi 315 MVA • Phase B</div>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => loadPreset('TX_TMB_01_Field_Sweep.csv', 'TX_TMB_01', 'Bay 201 (Trombay 160 MVA)')}
                      style={{
                        padding: '10px 12px',
                        borderRadius: '6px',
                        background: isDark ? '#1E293B' : '#FFFFFF',
                        border: '1.5px solid #F59E0B',
                        color: isDark ? '#FBBF24' : '#D97706',
                        fontSize: '12px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        textAlign: 'left',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        boxShadow: isDark ? 'none' : '0 2px 6px rgba(0,0,0,0.05)',
                      }}
                      className="hover:border-amber-400 active:scale-95"
                    >
                      <span style={{ fontSize: '16px' }}>⚡</span>
                      <div>
                        <div>TX_TMB_01 Sweep</div>
                        <div style={{ fontSize: '10.5px', color: textMuted, fontWeight: 500 }}>CG Power 160 MVA • Phase C</div>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => loadPreset('sample_sfra_curve_plot.png', 'TX_PGCIL_01', 'Bay 405 (Chakan 500 MVA)')}
                      style={{
                        padding: '10px 12px',
                        borderRadius: '6px',
                        background: isDark ? '#1E293B' : '#FFFFFF',
                        border: '1.5px solid #10B981',
                        color: isDark ? '#34D399' : '#059669',
                        fontSize: '12px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        textAlign: 'left',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        boxShadow: isDark ? 'none' : '0 2px 6px rgba(0,0,0,0.05)',
                      }}
                      className="hover:border-emerald-400 active:scale-95"
                    >
                      <span style={{ fontSize: '16px' }}>📸</span>
                      <div>
                        <div>Plot Screenshot</div>
                        <div style={{ fontSize: '10.5px', color: textMuted, fontWeight: 500 }}>Optical CV Digitizer</div>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Standard Format Badge & Template Download */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '8px',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  backgroundColor: isDark ? '#1F2937' : '#F1F5F9',
                  border: `1px solid ${cardBorder}`,
                  fontSize: '11.5px',
                }}>
                  <div style={{ color: textMuted }}>
                    <strong style={{ color: textMain }}>Accepted Standard:</strong> CSV / TXT or Plot screenshot (.png, .jpg)
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const template = `# TEST METADATA\nTransformer_ID,TX_MUM_04\nManufacturer,BHEL\nCapacity_MVA,50\nTest_Date,2026-10-20\nPhase_Tested,Phase_A\nConnection_Type,Open-Circuit\n# DATA MATRIX\nFrequency_Hz,Magnitude_dB,Phase_Degrees\n20.00,-35.42,-12.4\n25.12,-35.10,-11.8\n100.00,-39.80,-14.2\n1000.00,-48.50,-32.1\n10000.00,-22.10,25.4\n100000.00,-12.35,45.2\n2000000.00,-58.90,-165.1\n`
                      const blob = new Blob([template], { type: 'text/csv' })
                      const url = URL.createObjectURL(blob)
                      const a = document.createElement('a')
                      a.href = url
                      a.download = 'SFRA_Standard_Test_Template.csv'
                      a.click()
                    }}
                    style={{
                      backgroundColor: 'transparent',
                      border: '1px solid #0284C7',
                      color: '#0284C7',
                      padding: '3px 8px',
                      borderRadius: '4px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      fontSize: '11px',
                    }}
                    className="hover:bg-blue-500 hover:text-white active:scale-95"
                  >
                    📥 Download Template CSV
                  </button>
                </div>

                {/* Dropzone File Selection */}
                <div>
                  <label style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '12px',
                    padding: '30px 20px',
                    borderRadius: '8px',
                    background: isDark ? '#1E293B' : '#F8FAFC',
                    border: file ? '2px solid #0284C7' : `2px dashed ${isDark ? '#334155' : '#CBD5E1'}`,
                    cursor: 'pointer',
                    textAlign: 'center',
                    transition: 'all 0.2s',
                  }}>
                    <div style={{ fontSize: '32px' }}>
                      {file ? '📄' : '📁'}
                    </div>
                    <div>
                      <div style={{ fontSize: '14.5px', fontWeight: 700, color: file ? '#0284C7' : textMain }}>
                        {fileLabel}
                      </div>
                      <div style={{ fontSize: '12px', color: textMuted, marginTop: '4px' }}>
                        Doble, Omicron, Megger test exports (.csv, .txt) or plot screenshot (.png, .jpg)
                      </div>
                    </div>
                    <span style={{
                      padding: '7px 16px',
                      borderRadius: '6px',
                      background: isDark ? '#0F172A' : '#FFFFFF',
                      border: `1px solid ${inputBorder}`,
                      color: '#0284C7',
                      fontSize: '12.5px',
                      fontWeight: 700,
                      boxShadow: isDark ? 'none' : '0 2px 6px rgba(0,0,0,0.05)',
                    }}>
                      Browse Computer
                    </span>
                    <input
                      type="file"
                      accept=".csv,.txt,.png,.jpg,.jpeg"
                      style={{ display: 'none' }}
                      onChange={(e) => setFile(e.target.files?.[0] || null)}
                    />
                  </label>
                </div>

                {/* Multi-Modal DGA Data Linker */}
                <div style={{
                  background: isDark ? '#1E293B' : '#F8FAFC',
                  border: `1px solid ${cardBorder}`,
                  borderRadius: '8px',
                  padding: '14px 16px',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ fontSize: '13.5px', fontWeight: 700, color: textMain }}>
                        Attach Dissolved Gas Analysis (DGA) Telemetry
                      </div>
                      <div style={{ fontSize: '12px', color: textMuted, marginTop: '2px' }}>
                        Cross-references mechanical winding response with thermal and arcing gases (IEEE C57.104).
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={includeDga}
                      onChange={(e) => setIncludeDga(e.target.checked)}
                      style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: '#0284C7' }}
                    />
                  </div>

                  {includeDga ? (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginTop: '14px', paddingTop: '14px', borderTop: `1px solid ${cardBorder}` }}>
                      <div>
                        <label style={{ fontSize: '11px', color: textMuted, display: 'block', marginBottom: '4px', fontWeight: 700 }}>
                          Acetylene C2H2 (Arcing, ppm)
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          value={c2h2}
                          onChange={(e) => setC2h2(e.target.value)}
                          style={{ width: '100%', padding: '8px', borderRadius: '4px', background: inputBg, border: `1px solid ${inputBorder}`, color: textMain, fontSize: '13px' }}
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: '11px', color: textMuted, display: 'block', marginBottom: '4px', fontWeight: 700 }}>
                          Ethylene C2H4 (Thermal, ppm)
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          value={c2h4}
                          onChange={(e) => setC2h4(e.target.value)}
                          style={{ width: '100%', padding: '8px', borderRadius: '4px', background: inputBg, border: `1px solid ${inputBorder}`, color: textMain, fontSize: '13px' }}
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: '11px', color: textMuted, display: 'block', marginBottom: '4px', fontWeight: 700 }}>
                          Hydrogen H2 (Discharge, ppm)
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          value={h2}
                          onChange={(e) => setH2(e.target.value)}
                          style={{ width: '100%', padding: '8px', borderRadius: '4px', background: inputBg, border: `1px solid ${inputBorder}`, color: textMain, fontSize: '13px' }}
                        />
                      </div>
                    </div>
                  ) : null}
                </div>

                {/* Submit Action Button */}
                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    padding: '14px 20px',
                    borderRadius: '8px',
                    background: loading ? '#475569' : '#0284C7',
                    border: 'none',
                    color: '#FFFFFF',
                    fontSize: '14.5px',
                    fontWeight: 800,
                    cursor: loading ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '10px',
                    boxShadow: '0 4px 14px rgba(2,132,199,0.3)',
                  }}
                  className="hover:bg-blue-600 active:scale-98"
                >
                  {loading ? 'Processing Dual-Gate AI Inference & IEEE C57.149 Math...' : '⚡ Analyze Transformer Frequency Response'}
                </button>

              </form>
            </div>

            {/* Central Electricity Authority Guidelines Card */}
            <div style={{
              backgroundColor: isDark ? '#1E293B' : '#E0F2FE',
              border: `1.5px solid ${isDark ? '#334155' : '#BAE6FD'}`,
              borderRadius: '8px',
              padding: '18px 20px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                <span style={{ fontSize: '20px' }}>🏛️</span>
                <div>
                  <h4 style={{ fontSize: '14.5px', fontWeight: 800, color: isDark ? '#38BDF8' : '#0369A1', margin: 0 }}>
                    Central Electricity Authority (CEA) Mandatory Grid Protocols
                  </h4>
                  <div style={{ fontSize: '12px', color: isDark ? '#94A3B8' : '#0284C7' }}>
                    Sec 63 Regulations for 400 kV & 765 kV Inter-State Transmission Assets
                  </div>
                </div>
              </div>
              <p style={{ fontSize: '12.5px', color: isDark ? '#E2E8F0' : '#0F172A', margin: 0, lineHeight: 1.6 }}>
                Under CEA guidelines, SFRA and DGA analysis must be completed: (1) Prior to initial commissioning; (2) Within 48 hours of any through-fault event (&gt; 15 kA or 5+ cumulative trips); (3) Following major seismic activity or relocation; (4) Cyclically every 36 months for Condition-Based Maintenance (CBM).
              </p>
            </div>

          </div>

          {/* RIGHT COLUMN: Field QA Checklist & Technical Standards */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

            {/* Field Engineer Pre-Flight Verification Checklist */}
            <div style={{
              backgroundColor: cardBg,
              border: `1.5px solid ${cardBorder}`,
              borderRadius: '8px',
              padding: '20px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <div>
                  <div style={{ fontSize: '11px', fontWeight: 800, color: '#10B981', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                    Field Quality Assurance
                  </div>
                  <h3 style={{ fontSize: '16px', fontWeight: 800, color: textMain, margin: '2px 0 0' }}>
                    Pre-Flight Field Verification Checklist
                  </h3>
                </div>
                <span style={{ fontSize: '12px', color: '#10B981', fontWeight: 800, background: 'rgba(16,185,129,0.1)', padding: '3px 8px', borderRadius: '4px' }}>
                  {Object.values(checklist).filter(Boolean).length} / 6 Verified
                </span>
              </div>

              <p style={{ fontSize: '12.5px', color: textMuted, marginBottom: '14px', lineHeight: 1.5 }}>
                Prevents false positive fault alarms from test-lead inductance or coastal humidity prior to taking an EHV transformer out of service (IEEE C57.149 Sec 7):
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '9px' }}>
                {[
                  { id: 'earth_flat', label: 'Earthing Flat Integrity', desc: 'Rusted copper oxide removed; ground continuity measured < 0.1 Ω to substation earth grid.' },
                  { id: 'shield_ground', label: 'Coaxial Braid Shield Grounding', desc: 'Test leads grounded directly to bushing turret tank flange via shortest flat braid.' },
                  { id: 'bushing_clean', label: 'Bushing Test-Tap Decontamination', desc: 'Bushing porcelain sheds cleaned with isopropyl alcohol to prevent dielectric surface leakage.' },
                  { id: 'ct_ground', label: 'Secondary CT & Tertiary Terminals', desc: 'All secondary CTs shorted and grounded; tertiary stabilizing delta grounded to avoid resonance.' },
                  { id: 'tap_fixed', label: 'OLTC Nominal Position Locked', desc: 'Tap Changer locked at nominal position (e.g. Tap 5 / 9) matching baseline sweep.' },
                  { id: 'isolator_gap', label: 'Switchyard Busbar Isolation', desc: 'Overhead droppers disconnected or isolators opened > 1.5 m to eliminate 50 Hz stray pickup.' },
                ].map((item) => (
                  <label
                    key={item.id}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '10px',
                      padding: '10px 12px',
                      borderRadius: '6px',
                      backgroundColor: isDark ? '#1F2937' : '#F8FAFC',
                      border: `1px solid ${checklist[item.id] ? '#10B981' : cardBorder}`,
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={checklist[item.id]}
                      onChange={(e) => setChecklist({ ...checklist, [item.id]: e.target.checked })}
                      style={{ marginTop: '2px', width: '15px', height: '15px', accentColor: '#10B981', cursor: 'pointer' }}
                    />
                    <div>
                      <div style={{ fontSize: '12.5px', fontWeight: 700, color: textMain }}>
                        {item.label}
                      </div>
                      <div style={{ fontSize: '11px', color: textMuted, marginTop: '2px', lineHeight: 1.4 }}>
                        {item.desc}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* IEEE C57.149 & IS 2026 3-Band Frequency Zoning Framework */}
            <div style={{
              backgroundColor: cardBg,
              border: `1.5px solid ${cardBorder}`,
              borderRadius: '8px',
              padding: '20px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <div>
                  <div style={{ fontSize: '11px', fontWeight: 800, color: '#0284C7', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                    Engineering Standard Reference
                  </div>
                  <h3 style={{ fontSize: '16px', fontWeight: 800, color: textMain, margin: '2px 0 0' }}>
                    IEEE C57.149 & IS 2026 3-Band Frequency Framework
                  </h3>
                </div>
                <span style={{ fontSize: '11px', padding: '3px 8px', borderRadius: '4px', backgroundColor: isDark ? '#1F2937' : '#F1F5F9', color: textMuted, border: `1px solid ${cardBorder}` }}>
                  Active
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ padding: '12px', borderRadius: '6px', backgroundColor: isDark ? '#1F2937' : '#F8FAFC', border: `1px solid ${cardBorder}` }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <span style={{ padding: '1px 6px', borderRadius: '3px', backgroundColor: '#3B82F6', color: '#fff', fontSize: '10.5px', fontWeight: 800 }}>
                      Band 1
                    </span>
                    <span style={{ fontWeight: 700, fontSize: '12.5px', color: textMain }}>
                      Low Frequency (&lt; 2 kHz)
                    </span>
                  </div>
                  <div style={{ fontSize: '11.5px', fontWeight: 700, color: '#38BDF8', marginBottom: '2px' }}>
                    Core & Inductance Domain (Lm)
                  </div>
                  <p style={{ fontSize: '11.5px', color: textMuted, margin: 0, lineHeight: 1.45 }}>
                    Dominated by magnetizing inductance ($L_m$). Detects core displacement, residual magnetism, broken core grounding flats, or magnetic circuit shorting.
                  </p>
                  <div style={{ marginTop: '6px', fontSize: '10.5px', color: textMuted }}>
                    Norm: <strong>CCF &ge; 0.980</strong>
                  </div>
                </div>

                <div style={{ padding: '12px', borderRadius: '6px', backgroundColor: isDark ? '#1F2937' : '#F8FAFC', border: `1px solid ${cardBorder}` }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <span style={{ padding: '1px 6px', borderRadius: '3px', backgroundColor: '#8B5CF6', color: '#fff', fontSize: '10.5px', fontWeight: 800 }}>
                      Band 2
                    </span>
                    <span style={{ fontWeight: 700, fontSize: '12.5px', color: textMain }}>
                      Medium Frequency (2 kHz – 100 kHz)
                    </span>
                  </div>
                  <div style={{ fontSize: '11.5px', fontWeight: 700, color: '#A78BFA', marginBottom: '2px' }}>
                    Winding Structure & Inter-Disk Zone (Cs, Ls)
                  </div>
                  <p style={{ fontSize: '11.5px', color: textMuted, margin: 0, lineHeight: 1.45 }}>
                    Dominated by series capacitance ($C_s$) and leakage inductance ($L_s$). Primary indicator of <strong>radial hoop buckling</strong>, axial disk tilting, or through-fault movement.
                  </p>
                  <div style={{ marginTop: '6px', fontSize: '10.5px', color: textMuted }}>
                    Norm: <strong>CCF &ge; 0.950</strong> (CEA Critical Alert)
                  </div>
                </div>

                <div style={{ padding: '12px', borderRadius: '6px', backgroundColor: isDark ? '#1F2937' : '#F8FAFC', border: `1px solid ${cardBorder}` }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <span style={{ padding: '1px 6px', borderRadius: '3px', backgroundColor: '#EC4899', color: '#fff', fontSize: '10.5px', fontWeight: 800 }}>
                      Band 3
                    </span>
                    <span style={{ fontWeight: 700, fontSize: '12.5px', color: textMain }}>
                      High Frequency (100 kHz – 2 MHz)
                    </span>
                  </div>
                  <div style={{ fontSize: '11.5px', fontWeight: 700, color: '#F472B6', marginBottom: '2px' }}>
                    Main Winding Structure & Leads Zone (Cg)
                  </div>
                  <p style={{ fontSize: '11.5px', color: textMuted, margin: 0, lineHeight: 1.45 }}>
                    Dominated by ground capacitance ($C_g$) and tap-changer leads. Susceptible to test lead earthing impedance and coastal humidity.
                  </p>
                  <div style={{ marginTop: '6px', fontSize: '10.5px', color: textMuted }}>
                    Norm: <strong>CCF &ge; 0.965</strong> (Monsoon Filter Active)
                  </div>
                </div>
              </div>
            </div>

            {/* IS 10593:2006 Gas Limits Reference Table */}
            <div style={{
              backgroundColor: cardBg,
              border: `1.5px solid ${cardBorder}`,
              borderRadius: '8px',
              padding: '20px',
            }}>
              <div style={{ marginBottom: '12px' }}>
                <div style={{ fontSize: '11px', fontWeight: 800, color: '#F59E0B', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                  Chemical Diagnostic Reference
                </div>
                <h3 style={{ fontSize: '16px', fontWeight: 800, color: textMain, margin: '2px 0 0' }}>
                  IS 10593 Dissolved Gas Thresholds (&gt; 100 MVA)
                </h3>
              </div>

              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11.5px', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ backgroundColor: isDark ? '#1F2937' : '#F1F5F9', borderBottom: `1.5px solid ${cardBorder}` }}>
                      <th style={{ padding: '8px 10px', color: textMain, fontWeight: 700 }}>Gas</th>
                      <th style={{ padding: '8px 10px', color: textMain, fontWeight: 700 }}>IS 10593 Limit</th>
                      <th style={{ padding: '8px 10px', color: textMain, fontWeight: 700 }}>Action Severity</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { name: 'C2H2 (Acetylene)', limit: '2 ppm', severity: 'CRITICAL (Outage)' },
                      { name: 'C2H4 (Ethylene)', limit: '50 ppm', severity: 'HIGH (Derate Load)' },
                      { name: 'CH4 (Methane)', limit: '120 ppm', severity: 'INVESTIGATE (30d)' },
                      { name: 'H2 (Hydrogen)', limit: '100 ppm', severity: 'MONITOR (PD Test)' },
                    ].map((row, idx) => (
                      <tr key={idx} style={{ borderBottom: `1px solid ${cardBorder}` }}>
                        <td style={{ padding: '7px 10px', fontWeight: 700, color: textMain }}>{row.name}</td>
                        <td style={{ padding: '7px 10px', color: '#0284C7', fontWeight: 700 }}>{row.limit}</td>
                        <td style={{ padding: '7px 10px', color: row.severity.includes('CRITICAL') ? '#EF4444' : row.severity.includes('HIGH') ? '#F59E0B' : textMuted, fontWeight: 700 }}>
                          {row.severity}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>

        </div>

      </main>
    </div>
  )
}
