import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { API_BASE } from '../lib/api'

const MAX_FILE_BYTES = 10 * 1024 * 1024 // 10MB
const parseTimestamp = (value) => {
  if (!value) return 0
  if (typeof value === 'number') return value
  const asNumber = Number(value)
  if (Number.isFinite(asNumber) && asNumber > 0) return asNumber
  const asDate = new Date(value).getTime()
  return Number.isFinite(asDate) ? asDate : 0
}

export default function Upload() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const [file, setFile] = useState(null)
  const [assetTag, setAssetTag] = useState('TR-400KV-315MVA-BHEL-01')
  const [substationBay, setSubstationBay] = useState('Bay 401 (Kalwa 400 kV GIS)')
  const [includeDga, setIncludeDga] = useState(false)
  const [c2h2, setC2h2] = useState('0.0')
  const [c2h4, setC2h4] = useState('12.0')
  const [h2, setH2] = useState('15.0')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const qTag = searchParams.get('asset_tag')
    const qBay = searchParams.get('bay')
    if (qTag) setAssetTag(qTag)
    if (qBay) setSubstationBay(qBay)
  }, [searchParams])

  const fileLabel = useMemo(() => file?.name || 'Click to Select CSV, TXT, or Plot Image (.png, .jpg)', [file])

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

    const token = localStorage.getItem('token')
    if (!token) {
      navigate('/login', { replace: true })
      return
    }

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

      const res = await fetch(`${API_BASE}/fra/upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      })

      const data = await res.json().catch(() => null)
      if (!res.ok) {
        const msg = data?.detail || 'Upload processing failed'
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

  return (
    <div style={{
      minHeight: '100vh',
      background: '#090D16',
      padding: '32px 24px',
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
      color: '#E2E8F0',
    }}>
      <div style={{ maxWidth: '960px', margin: '0 auto' }}>

        {/* Header with Navigation */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px',
          paddingBottom: '20px',
          borderBottom: '1px solid #1E293B',
          marginBottom: '28px',
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '12px', fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#38BDF8', fontFamily: "'JetBrains Mono', monospace" }}>
                SUBSTATION ASSET INGESTION
              </span>
              <span style={{ fontSize: '11px', background: '#1E293B', padding: '2px 8px', borderRadius: '4px', color: '#94A3B8' }}>
                IEEE C57.149 / IEC 60076-18
              </span>
            </div>
            <h1 style={{ fontSize: '26px', fontWeight: 800, color: '#FFFFFF', marginTop: '6px' }}>
              Ingest Transformer Frequency Sweep
            </h1>
            <div style={{ fontSize: '14px', color: '#94A3B8', marginTop: '4px', lineHeight: 1.5 }}>
              Accepts test set export files (<strong style={{ color: '#E2E8F0' }}>.csv, .txt</strong>) or visual screenshots (<strong style={{ color: '#E2E8F0' }}>.png, .jpg</strong>). Optical curve extraction and IEEE C57.149 sub-band analysis run automatically.
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              type="button"
              onClick={() => navigate('/substations')}
              style={{
                padding: '10px 16px',
                borderRadius: '6px',
                background: '#1E293B',
                border: '1px solid #334155',
                color: '#38BDF8',
                fontWeight: 700,
                fontSize: '13px',
                cursor: 'pointer',
              }}
            >
              🛰️ Substation Radar
            </button>
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              style={{
                padding: '10px 16px',
                borderRadius: '6px',
                background: '#1E293B',
                border: '1px solid #334155',
                color: '#CBD5E1',
                fontWeight: 600,
                fontSize: '13px',
                cursor: 'pointer',
              }}
            >
              Dashboard
            </button>
          </div>
        </div>

        {/* Upload Form Box */}
        <div style={{
          background: '#0F172A',
          border: '1.5px solid #1E293B',
          borderRadius: '12px',
          padding: '32px',
        }}>
          {error ? (
            <div style={{
              marginBottom: '20px',
              padding: '14px 18px',
              borderRadius: '8px',
              background: 'rgba(239,68,68,0.12)',
              border: '1.5px solid #EF4444',
              color: '#FCA5A5',
              fontSize: '14px',
              fontWeight: 600,
            }}>
              ⚠️ {error}
            </div>
          ) : null}

          <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>

            {/* Asset Identification Details */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#CBD5E1', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
                  Transformer Asset ID
                </label>
                <input
                  type="text"
                  value={assetTag}
                  onChange={(e) => setAssetTag(e.target.value)}
                  placeholder="e.g. TR-400KV-315MVA-BHEL-01"
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    borderRadius: '6px',
                    background: '#1E293B',
                    border: '1px solid #334155',
                    color: '#FFFFFF',
                    fontSize: '14px',
                    fontFamily: "'JetBrains Mono', monospace",
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#CBD5E1', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
                  Substation Bay / Location
                </label>
                <input
                  type="text"
                  value={substationBay}
                  onChange={(e) => setSubstationBay(e.target.value)}
                  placeholder="e.g. Bay 401 (Kalwa 400 kV GIS)"
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    borderRadius: '6px',
                    background: '#1E293B',
                    border: '1px solid #334155',
                    color: '#FFFFFF',
                    fontSize: '14px',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
            </div>

            {/* File Selection Box */}
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#CBD5E1', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
                Frequency Sweep File (Raw Sweep or Curve Screenshot)
              </label>

              <label style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '12px',
                padding: '36px 20px',
                borderRadius: '8px',
                background: '#1E293B',
                border: file ? '2px solid #0284C7' : '2px dashed #334155',
                cursor: 'pointer',
                textAlign: 'center',
                transition: 'all 0.2s',
              }}>
                <div style={{ fontSize: '32px' }}>
                  {file ? '📄' : '📁'}
                </div>
                <div>
                  <div style={{ fontSize: '16px', fontWeight: 700, color: file ? '#38BDF8' : '#FFFFFF' }}>
                    {fileLabel}
                  </div>
                  <div style={{ fontSize: '13px', color: '#94A3B8', marginTop: '4px' }}>
                    Supports Doble, Omicron, Megger test exports (.csv, .txt) or plot images (.png, .jpg)
                  </div>
                </div>
                <span style={{
                  padding: '8px 18px',
                  borderRadius: '6px',
                  background: '#0F172A',
                  border: '1px solid #334155',
                  color: '#38BDF8',
                  fontSize: '13px',
                  fontWeight: 700,
                  marginTop: '4px',
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

            {/* Optional Multi-Modal DGA Data Linker */}
            <div style={{
              background: '#1E293B',
              border: '1px solid #334155',
              borderRadius: '8px',
              padding: '16px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: '#FFFFFF' }}>
                    Attach Dissolved Gas Analysis (DGA) Telemetry
                  </div>
                  <div style={{ fontSize: '12.5px', color: '#94A3B8', marginTop: '2px' }}>
                    Cross-references mechanical winding response with thermal and electrical arcing gases (IEEE C57.104).
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={includeDga}
                  onChange={(e) => setIncludeDga(e.target.checked)}
                  style={{ width: '20px', height: '20px', cursor: 'pointer' }}
                />
              </div>

              {includeDga ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #334155' }}>
                  <div>
                    <label style={{ fontSize: '12px', color: '#CBD5E1', display: 'block', marginBottom: '4px' }}>
                      Acetylene C2H2 (Arcing, ppm)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={c2h2}
                      onChange={(e) => setC2h2(e.target.value)}
                      style={{ width: '100%', padding: '8px', borderRadius: '4px', background: '#0F172A', border: '1px solid #475569', color: '#fff' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '12px', color: '#CBD5E1', display: 'block', marginBottom: '4px' }}>
                      Ethylene C2H4 (Thermal, ppm)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={c2h4}
                      onChange={(e) => setC2h4(e.target.value)}
                      style={{ width: '100%', padding: '8px', borderRadius: '4px', background: '#0F172A', border: '1px solid #475569', color: '#fff' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '12px', color: '#CBD5E1', display: 'block', marginBottom: '4px' }}>
                      Hydrogen H2 (Discharge, ppm)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={h2}
                      onChange={(e) => setH2(e.target.value)}
                      style={{ width: '100%', padding: '8px', borderRadius: '4px', background: '#0F172A', border: '1px solid #475569', color: '#fff' }}
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
                padding: '16px 24px',
                borderRadius: '8px',
                background: loading ? '#475569' : '#0284C7',
                border: 'none',
                color: '#FFFFFF',
                fontSize: '15px',
                fontWeight: 800,
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                boxShadow: '0 4px 14px rgba(2,132,199,0.3)',
              }}
            >
              {loading ? 'Processing Dual-Gate AI Inference & IEEE C57.149 Math...' : '⚡ Analyze Transformer Frequency Response'}
            </button>

          </form>
        </div>

      </div>
    </div>
  )
}
