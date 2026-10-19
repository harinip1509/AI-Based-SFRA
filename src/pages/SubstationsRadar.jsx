import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { API_BASE } from '../lib/api'

// Preset Indian Power Grid Hubs for quick 1-click navigation
const INDIAN_GRID_PRESETS = [
  { name: 'Mumbai / MMR (Vidyalankar / Wadala)', lat: 19.0222, lon: 72.8697 },
  { name: 'Thane / Padgha (765 kV / HVDC Hub)', lat: 19.3482, lon: 73.1611 },
  { name: 'Navi Mumbai (Kharghar 400 kV)', lat: 19.0435, lon: 73.0645 },
  { name: 'Pune (Chakan Auto-Cluster 400 kV)', lat: 18.7610, lon: 73.8550 },
  { name: 'Delhi / NCR (Mandola 400 kV Gate)', lat: 28.7900, lon: 77.2900 },
  { name: 'Bengaluru (Hoodi 400 kV Grid)', lat: 12.9915, lon: 77.7165 },
  { name: 'Hyderabad (Malkaram 400 kV)', lat: 17.3100, lon: 78.5800 },
]

export default function SubstationsRadar() {
  const navigate = useNavigate()
  const [coords, setCoords] = useState({ lat: 19.0222, lon: 72.8697 })
  const [locationName, setLocationName] = useState('Mumbai / MMR (Default Substation Anchor)')
  const [substations, setSubstations] = useState([])
  const [loading, setLoading] = useState(true)
  const [locating, setLocating] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  const fetchSubstations = async (lat, lon) => {
    try {
      setLoading(true)
      setErrorMsg('')
      const res = await fetch(`${API_BASE}/fra/nearby-substations?latitude=${lat}&longitude=${lon}&limit=5`)
      if (!res.ok) throw new Error('Failed to retrieve Indian substation assets.')
      const data = await res.json()
      setSubstations(data.substations || [])
    } catch (err) {
      setErrorMsg(err.message || 'Error fetching grid assets.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSubstations(coords.lat, coords.lon)
  }, [coords])

  // Browser HTML5 Geolocation API
  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      setErrorMsg('Geolocation is not supported by your browser. Please select a preset grid region below.')
      return
    }

    setLocating(true)
    setErrorMsg('')
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords
        setCoords({ lat: latitude, lon: longitude })
        setLocationName(`Detected GPS: ${latitude.toFixed(4)}° N, ${longitude.toFixed(4)}° E`)
        setLocating(false)
      },
      (err) => {
        setLocating(false)
        let msg = 'Could not access device GPS. Defaulting to Western Grid (Mumbai/MMR).'
        if (err.code === 1) msg = 'Location permission was denied. You can select an Indian grid preset below.'
        setErrorMsg(msg)
      },
      { timeout: 10000, enableHighAccuracy: true }
    )
  }

  const handleSelectPreset = (preset) => {
    setCoords({ lat: preset.lat, lon: preset.lon })
    setLocationName(preset.name)
  }

  const handleInspectAsset = (assetId, bay) => {
    navigate(`/upload?asset_tag=${encodeURIComponent(assetId)}&bay=${encodeURIComponent(bay)}`)
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#090D16',
      padding: '28px 24px',
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
      color: '#E2E8F0',
    }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto' }}>

        {/* Navigation Bar */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px',
          paddingBottom: '20px',
          borderBottom: '1px solid #1E293B',
          marginBottom: '24px',
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '11px', fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#38BDF8', fontFamily: "'JetBrains Mono', monospace" }}>
                INDIAN NATIONAL POWER GRID • ASSET RADAR
              </span>
              <span style={{ fontSize: '10px', background: '#1E293B', padding: '2px 8px', borderRadius: '4px', color: '#94A3B8', border: '1px solid #334155' }}>
                POWERGRID / MSETCL / TATA POWER / GETCO
              </span>
            </div>
            <h1 style={{ fontSize: '26px', fontWeight: 800, color: '#FFFFFF', marginTop: '6px', letterSpacing: '-0.02em' }}>
              Nearby Transformer & Substation Locator
            </h1>
            <div style={{ fontSize: '14px', color: '#94A3B8', marginTop: '4px' }}>
              Detects your coordinates in India and identifies nearby 765 kV / 400 kV / 220 kV power transformers, MVA ratings, manufacturer tags, and health status.
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              type="button"
              onClick={() => navigate('/upload')}
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
              + Ingest SFRA Sweep
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

        {/* GPS Location & Grid Presets Control Bar */}
        <div style={{
          background: '#0F172A',
          border: '1px solid #1E293B',
          borderRadius: '10px',
          padding: '20px',
          marginBottom: '24px',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
            <div>
              <div style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', color: '#94A3B8', letterSpacing: '0.08em' }}>
                CURRENT GEOGRAPHIC ANCHOR
              </div>
              <div style={{ fontSize: '18px', fontWeight: 800, color: '#FFFFFF', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                📍 {locationName}
              </div>
              <div style={{ fontSize: '12px', color: '#64748B', fontFamily: "'JetBrains Mono', monospace", marginTop: '2px' }}>
                Coordinates: {coords.lat.toFixed(4)}° N, {coords.lon.toFixed(4)}° E
              </div>
            </div>

            <button
              type="button"
              disabled={locating}
              onClick={handleDetectLocation}
              style={{
                padding: '12px 20px',
                borderRadius: '6px',
                background: '#0284C7',
                border: 'none',
                color: '#FFFFFF',
                fontWeight: 700,
                fontSize: '13px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 2px 8px rgba(2,132,199,0.3)',
              }}
            >
              {locating ? '🛰️ Locating Device...' : '🛰️ Detect My Live GPS Location'}
            </button>
          </div>

          {errorMsg ? (
            <div style={{ marginTop: '12px', padding: '10px 14px', borderRadius: '6px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', color: '#F87171', fontSize: '13px' }}>
              {errorMsg}
            </div>
          ) : null}

          {/* Quick Indian Grid Region Presets */}
          <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #1E293B' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px' }}>
              Quick Indian Grid Presets:
            </div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {INDIAN_GRID_PRESETS.map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSelectPreset(preset)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '4px',
                    background: locationName === preset.name ? '#0284C7' : '#1E293B',
                    border: '1px solid #334155',
                    color: locationName === preset.name ? '#FFFFFF' : '#CBD5E1',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  {preset.name.split('(')[0].trim()}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Substation & Transformer Assets List */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#94A3B8', fontSize: '15px', fontFamily: "'JetBrains Mono', monospace" }}>
            [SCANNING INDIAN TRANSMISSION ASSET INVENTORY FOR NEAREST SUBSTATIONS...]
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {substations.map((sub) => (
              <div
                key={sub.substation_id}
                style={{
                  background: '#0F172A',
                  border: '1.5px solid #1E293B',
                  borderRadius: '10px',
                  padding: '20px',
                }}
              >
                {/* Substation Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', paddingBottom: '14px', borderBottom: '1px solid #1E293B' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontSize: '11px', fontWeight: 800, padding: '2px 8px', borderRadius: '4px', background: 'rgba(56,189,248,0.15)', color: '#38BDF8', fontFamily: "'JetBrains Mono', monospace" }}>
                        {sub.utility}
                      </span>
                      <span style={{ fontSize: '12px', color: '#94A3B8' }}>
                        {sub.city}
                      </span>
                    </div>
                    <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#FFFFFF', marginTop: '6px' }}>
                      {sub.substation_name}
                    </h2>
                    <div style={{ fontSize: '13px', color: '#64748B', marginTop: '2px' }}>
                      Voltage Class: <strong style={{ color: '#E2E8F0' }}>{sub.voltage_class}</strong> | Total Substation Capacity: <strong style={{ color: '#E2E8F0' }}>{sub.total_capacity_mva} MVA</strong>
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '12px', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase' }}>
                      Proximity
                    </div>
                    <div style={{ fontSize: '22px', fontWeight: 900, color: '#38BDF8', fontFamily: "'JetBrains Mono', monospace" }}>
                      {sub.distance_km} km
                    </div>
                    <div style={{ fontSize: '11px', color: '#64748B' }}>
                      Geodesic Distance
                    </div>
                  </div>
                </div>

                {/* Transformer Asset Inventory in this Substation */}
                <div style={{ marginTop: '16px' }}>
                  <div style={{ fontSize: '12px', fontWeight: 800, color: '#CBD5E1', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '12px' }}>
                    Installed Power Transformer Assets ({sub.transformers?.length || 0} units):
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '14px' }}>
                    {sub.transformers.map((tr) => {
                      const isInvestigate = tr.status.includes('INVESTIGATE')
                      const badgeBg = isInvestigate ? 'rgba(245,158,11,0.15)' : 'rgba(16,185,129,0.15)'
                      const badgeColor = isInvestigate ? '#F59E0B' : '#10B981'

                      return (
                        <div
                          key={tr.asset_id}
                          style={{
                            background: '#1E293B',
                            border: `1px solid ${isInvestigate ? 'rgba(245,158,11,0.35)' : '#334155'}`,
                            borderRadius: '8px',
                            padding: '16px',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between',
                          }}
                        >
                          <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span style={{ fontSize: '13px', fontWeight: 800, color: '#FFFFFF', fontFamily: "'JetBrains Mono', monospace" }}>
                                {tr.asset_id}
                              </span>
                              <span style={{ fontSize: '11px', fontWeight: 800, padding: '3px 8px', borderRadius: '4px', background: badgeBg, color: badgeColor }}>
                                {tr.status.split('(')[0].trim()}
                              </span>
                            </div>
                            <div style={{ fontSize: '12px', color: '#38BDF8', fontWeight: 700, marginTop: '2px' }}>
                              {tr.bay}
                            </div>

                            <div style={{ marginTop: '12px', fontSize: '13px', color: '#F1F5F9', fontWeight: 600 }}>
                              {tr.rating}
                            </div>

                            <div style={{ marginTop: '10px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', fontSize: '11.5px', color: '#94A3B8' }}>
                              <div>Make: <strong style={{ color: '#E2E8F0' }}>{tr.make.split(',')[0]}</strong></div>
                              <div>Commissioned: <strong style={{ color: '#E2E8F0' }}>{tr.commissioning_year}</strong></div>
                              <div>Cooling: <strong style={{ color: '#E2E8F0' }}>{tr.cooling}</strong></div>
                              <div>Vector Group: <strong style={{ color: '#E2E8F0' }}>{tr.vector_group}</strong></div>
                              <div>Oil Volume: <strong style={{ color: '#E2E8F0' }}>{tr.oil_capacity_liters?.toLocaleString()} L</strong></div>
                              <div>Health Index: <strong style={{ color: badgeColor }}>{tr.health_index} / 100</strong></div>
                            </div>

                            <div style={{ marginTop: '10px', padding: '8px', borderRadius: '4px', background: '#0F172A', fontSize: '11px', color: '#CBD5E1' }}>
                              <div>Last SFRA: <strong style={{ color: '#38BDF8' }}>{tr.last_sfra_date}</strong></div>
                              <div style={{ marginTop: '2px' }}>DGA: <strong style={{ color: isInvestigate ? '#F59E0B' : '#10B981' }}>{tr.dga_condition}</strong></div>
                            </div>
                          </div>

                          <div style={{ marginTop: '14px', display: 'flex', gap: '8px' }}>
                            <button
                              type="button"
                              onClick={() => handleInspectAsset(tr.asset_id, tr.bay)}
                              style={{
                                flex: 1,
                                padding: '8px 12px',
                                borderRadius: '4px',
                                background: '#0284C7',
                                border: 'none',
                                color: '#FFFFFF',
                                fontSize: '12px',
                                fontWeight: 700,
                                cursor: 'pointer',
                                textAlign: 'center',
                              }}
                            >
                              ⚡ Test SFRA on this Unit
                            </button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>

              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  )
}
