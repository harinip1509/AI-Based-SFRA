import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { API_BASE, apiRequest } from '../lib/api'
import { useTheme } from '../lib/theme'
import DashboardNavbar from '../components/dashboard/DashboardNavbar'
import IndianSubstationMap from '../components/IndianSubstationMap'

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

// Preset Indian Power Grid Hubs for quick 1-click navigation
const INDIAN_GRID_PRESETS = [
  { name: 'Mumbai (Wadala / Vidyalankar)', lat: 19.0222, lon: 72.8697 },
  { name: 'Central Mumbai (Dharavi / BKC)', lat: 19.0550, lon: 72.8620 },
  { name: 'South Mumbai (Carnac / Colaba)', lat: 18.9482, lon: 72.8422 },
  { name: 'Eastern Suburbs (Vikhroli 400 kV)', lat: 19.1085, lon: 72.9320 },
  { name: 'Western Suburbs (Borivali / Aarey)', lat: 19.2290, lon: 72.8680 },
  { name: 'Thane / Kalwa (400 kV Gateway)', lat: 19.1983, lon: 72.9989 },
  { name: 'Navi Mumbai (Kharghar / Nerul)', lat: 19.0435, lon: 73.0645 },
  { name: 'Padgha (765 kV / ±500 kV HVDC)', lat: 19.3482, lon: 73.1611 },
  { name: 'Pune (Chakan Auto-Cluster 400 kV)', lat: 18.7610, lon: 73.8550 },
  { name: 'Delhi / NCR (Mandola 400 kV Gate)', lat: 28.7900, lon: 77.2900 },
  { name: 'Bengaluru (Hoodi 400 kV Grid)', lat: 12.9915, lon: 77.7165 },
  { name: 'Hyderabad (Malkaram 400 kV)', lat: 17.3100, lon: 78.5800 },
]

export default function SubstationsRadar() {
  const navigate = useNavigate()
  const { isDark, toggleTheme, seniorMode, toggleSeniorMode } = useTheme()
  const [user, setUser] = useState({ name: 'Engineer', email: 'user@intellifra.ai' })
  const [history, setHistory] = useState([])
  const [coords, setCoords] = useState({ lat: 19.0222, lon: 72.8697 })
  const [locationName, setLocationName] = useState('Mumbai / MMR (Vidyalankar / Wadala)')
  const [substations, setSubstations] = useState([])
  const [loading, setLoading] = useState(true)
  const [locating, setLocating] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [filterMode, setFilterMode] = useState('all') // 'all', 'mumbai', 'ehv'

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

  // Haversine geodesic distance calculation in km
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371
    const dLat = ((lat2 - lat1) * Math.PI) / 180
    const dLon = ((lon2 - lon1) * Math.PI) / 180
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return Number((R * c).toFixed(1))
  }

  const fetchSubstations = async (lat, lon) => {
    try {
      setLoading(true)
      const candidateBases = [
        API_BASE,
        'http://127.0.0.1:8000',
        'http://localhost:8000',
      ].filter(Boolean)
      const uniqueBases = Array.from(new Set(candidateBases))

      let res = null
      for (const base of uniqueBases) {
        try {
          const attempt = await fetch(
            `${base}/fra/nearby-substations?latitude=${lat}&longitude=${lon}&limit=30`
          )
          if (attempt.ok) {
            res = attempt
            break
          }
        } catch {
          // try next
        }
      }
      if (!res || !res.ok) throw new Error('Failed to retrieve Indian substation assets.')
      const data = await res.json()
      setSubstations(data.substations || [])
    } catch (err) {
      setErrorMsg(err.message || 'Error fetching grid assets.')
    } finally {
      setLoading(false)
    }
  }

  // Automatic Geolocation on Component Mount
  const handleDetectLocation = async (isAuto = false) => {
    setLocating(true)
    setErrorMsg('')

    const tryIpFallback = async () => {
      try {
        const ipRes = await fetch('https://ipapi.co/json/').catch(() => null)
        if (ipRes && ipRes.ok) {
          const ipData = await ipRes.json()
          if (ipData.latitude && ipData.longitude) {
            setCoords({ lat: ipData.latitude, lon: ipData.longitude })
            setLocationName(
              `Live City: ${ipData.city || 'Mumbai'}, ${ipData.region || 'Maharashtra'} (${ipData.latitude.toFixed(4)}° N, ${ipData.longitude.toFixed(4)}° E)`
            )
            setLocating(false)
            return true
          }
        }
      } catch {
        // ignore
      }
      return false
    }

    if (!navigator.geolocation) {
      const ok = await tryIpFallback()
      if (!ok) {
        setErrorMsg('Geolocation not supported by browser. Showing Mumbai/MMR default anchor.')
      }
      setLocating(false)
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords
        setCoords({ lat: latitude, lon: longitude })
        setLocationName(`Live Device GPS: ${latitude.toFixed(4)}° N, ${longitude.toFixed(4)}° E`)
        setLocating(false)
      },
      async (err) => {
        const ok = await tryIpFallback()
        if (!ok) {
          setLocating(false)
          let msg = 'Could not access device GPS. Defaulting to Mumbai/MMR grid anchor.'
          if (err.code === 1) {
            msg = 'Browser location permission denied. You can select any Indian grid preset below.'
          }
          setErrorMsg(msg)
        }
      },
      { timeout: 8000, enableHighAccuracy: true }
    )
  }

  // Automatically trigger location detection once on initial mount
  useEffect(() => {
    handleDetectLocation(true)
  }, [])

  useEffect(() => {
    fetchSubstations(coords.lat, coords.lon)
  }, [coords])

  const handleSelectPreset = (preset) => {
    setCoords({ lat: preset.lat, lon: preset.lon })
    setLocationName(preset.name)
  }

  const handleInspectAsset = (assetId, bay) => {
    navigate(`/upload?asset_tag=${encodeURIComponent(assetId)}&bay=${encodeURIComponent(bay)}`)
  }

  // Real-time processed and sorted substations based on current coordinates
  const processedSubstations = substations
    .map((sub) => {
      const liveDist = calculateDistance(coords.lat, coords.lon, sub.latitude, sub.longitude)
      return { ...sub, liveDistance: liveDist }
    })
    .sort((a, b) => a.liveDistance - b.liveDistance)
    .filter((sub) => {
      if (filterMode === 'mumbai') return sub.is_mumbai
      if (filterMode === 'ehv') {
        return (
          sub.voltage_class.includes('400') ||
          sub.voltage_class.includes('765') ||
          sub.voltage_class.includes('HVDC')
        )
      }
      return true
    })
    .filter((sub) => {
      if (!searchTerm) return true
      const term = searchTerm.toLowerCase()
      const matchSub =
        sub.substation_name.toLowerCase().includes(term) ||
        sub.city.toLowerCase().includes(term) ||
        sub.utility.toLowerCase().includes(term)
      const matchTr = sub.transformers?.some(
        (t) =>
          t.asset_id.toLowerCase().includes(term) ||
          t.make.toLowerCase().includes(term) ||
          t.bay.toLowerCase().includes(term)
      )
      return matchSub || matchTr
    })

  const pageBg = isDark ? '#0B0F19' : '#F8FAFC'
  const cardBg = isDark ? '#111827' : '#FFFFFF'
  const cardBorder = isDark ? '#1F2937' : '#E2E8F0'
  const textMain = isDark ? '#F9FAFB' : '#0F172A'
  const textMuted = isDark ? '#9CA3AF' : '#64748B'

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: pageBg,
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
        color: textMain,
        transition: 'background-color 0.2s, color 0.2s',
      }}
    >
      {/* 1. Unified Dashboard Top Navigation */}
      <DashboardNavbar user={user} onLogout={handleLogout} history={history} />

      {/* 2. Main Shell matching Dashboard.jsx */}
      <main
        style={{
          padding: '24px',
          maxWidth: '1360px',
          margin: '0 auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
        }}
      >
        {/* Back to Dashboard Breadcrumb + Context Bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
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
              onClick={() => navigate('/upload')}
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                backgroundColor: '#0284C7',
                border: 'none',
                color: '#FFFFFF',
                fontSize: '13px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
              }}
              className="hover:bg-blue-600 active:scale-95"
            >
              + Ingest SFRA Measurement →
            </button>
          </div>
        </div>

        {/* Engineering System Banner */}
        <div
          style={{
            backgroundColor: cardBg,
            border: `1.5px solid ${cardBorder}`,
            borderRadius: '8px',
            padding: '18px 22px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '14px',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 800,
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  color: '#0284C7',
                  fontFamily: "'JetBrains Mono', monospace",
                }}
              >
                INDIAN NATIONAL POWER GRID • ASSET RADAR
              </span>
              <span
                style={{
                  fontSize: '10px',
                  background: isDark ? '#1F2937' : '#F1F5F9',
                  padding: '2px 8px',
                  borderRadius: '4px',
                  color: textMuted,
                  border: `1px solid ${cardBorder}`,
                }}
              >
                MSETCL / TATA POWER / ADANI / BEST / POWERGRID
              </span>
            </div>
            <h1
              style={{
                fontSize: '20px',
                fontWeight: 800,
                color: textMain,
                marginTop: '4px',
                letterSpacing: '-0.02em',
              }}
            >
              Nearby Transformer & Substation Locator
            </h1>
            <div style={{ fontSize: '13px', color: textMuted, marginTop: '3px' }}>
              Real-time proximity engine calculates exact geodesic distances to verified receiving stations and power transformers across Mumbai, MMR, and the Indian EHV transmission grid.
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <span
              style={{
                padding: '6px 12px',
                borderRadius: '6px',
                background: 'rgba(2,132,199,0.12)',
                border: '1px solid #0284C7',
                color: '#0284C7',
                fontSize: '12px',
                fontWeight: 800,
              }}
            >
              🛰️ Google Maps Live Integration
            </span>
          </div>
        </div>

        {/* GPS Location & Grid Presets Control Bar */}
        <div
          style={{
            background: isDark ? '#0F172A' : '#FFFFFF',
            border: `1px solid ${cardBorder}`,
            borderRadius: '10px',
            padding: '20px',
            marginBottom: '24px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '14px',
            }}
          >
            <div>
              <div
                style={{
                  fontSize: '11px',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  color: '#94A3B8',
                  letterSpacing: '0.08em',
                }}
              >
                CURRENT ACTIVE GEOGRAPHIC ANCHOR
              </div>
              <div
                style={{
                  fontSize: '18px',
                  fontWeight: 800,
                  color: textMain,
                  marginTop: '2px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                📍 {locationName}
              </div>
              <div
                style={{
                  fontSize: '12px',
                  color: textMuted,
                  fontFamily: "'JetBrains Mono', monospace",
                  marginTop: '2px',
                }}
              >
                Coordinates: {coords.lat.toFixed(4)}° N, {coords.lon.toFixed(4)}° E
              </div>
            </div>

            <button
              type="button"
              disabled={locating}
              onClick={() => handleDetectLocation(false)}
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
              className="hover:bg-blue-600 active:scale-95 transition-all"
            >
              {locating ? '🛰️ Calculating Live Position...' : '🛰️ Detect My Exact Location'}
            </button>
          </div>

          {errorMsg ? (
            <div
              style={{
                marginTop: '12px',
                padding: '10px 14px',
                borderRadius: '6px',
                background: 'rgba(239,68,68,0.1)',
                border: '1px solid rgba(239,68,68,0.25)',
                color: '#F87171',
                fontSize: '13px',
              }}
            >
              {errorMsg}
            </div>
          ) : null}

          {/* Quick Indian Grid Region Presets */}
          <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: `1px solid ${cardBorder}` }}>
            <div
              style={{
                fontSize: '11px',
                fontWeight: 700,
                color: textMuted,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                marginBottom: '8px',
              }}
            >
              Select Specific Grid Anchor (Instant Live Recalculation):
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
                    background: locationName.includes(preset.name.split('(')[0].trim())
                      ? '#0284C7'
                      : isDark
                      ? '#1E293B'
                      : '#F1F5F9',
                    border: `1px solid ${cardBorder}`,
                    color: locationName.includes(preset.name.split('(')[0].trim())
                      ? '#FFFFFF'
                      : textMain,
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                  className="hover:border-blue-400 active:scale-95"
                >
                  {preset.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Interactive Indian Substation & Transmission Grid Map */}
        <IndianSubstationMap
          activeCoords={coords}
          onSelectSubstation={(sub) => {
            setSearchTerm(sub.name.split(' ')[0])
          }}
        />

        {/* Filter & Search Bar */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '12px',
            marginBottom: '18px',
          }}
        >
          {/* Quick Filter Buttons */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button
              onClick={() => setFilterMode('all')}
              style={{
                padding: '6px 14px',
                borderRadius: '6px',
                border: `1px solid ${filterMode === 'all' ? '#0284C7' : cardBorder}`,
                backgroundColor: filterMode === 'all' ? '#0284C7' : isDark ? '#111827' : '#FFFFFF',
                color: filterMode === 'all' ? '#FFFFFF' : textMain,
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
              }}
              className="active:scale-95"
            >
              📍 All Substations ({substations.length})
            </button>
            <button
              onClick={() => setFilterMode('mumbai')}
              style={{
                padding: '6px 14px',
                borderRadius: '6px',
                border: `1px solid ${filterMode === 'mumbai' ? '#0284C7' : cardBorder}`,
                backgroundColor: filterMode === 'mumbai' ? '#0284C7' : isDark ? '#111827' : '#FFFFFF',
                color: filterMode === 'mumbai' ? '#FFFFFF' : textMain,
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
              }}
              className="active:scale-95"
            >
              🏙️ Mumbai & MMR Receiving Stations (13)
            </button>
            <button
              onClick={() => setFilterMode('ehv')}
              style={{
                padding: '6px 14px',
                borderRadius: '6px',
                border: `1px solid ${filterMode === 'ehv' ? '#0284C7' : cardBorder}`,
                backgroundColor: filterMode === 'ehv' ? '#0284C7' : isDark ? '#111827' : '#FFFFFF',
                color: filterMode === 'ehv' ? '#FFFFFF' : textMain,
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
              }}
              className="active:scale-95"
            >
              ⚡ EHV 400 kV / 765 kV Super-Grid
            </button>
          </div>

          {/* Search Input */}
          <div style={{ position: 'relative', minWidth: '280px' }}>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search transformer ID, make, bay, or city..."
              style={{
                width: '100%',
                padding: '8px 12px 8px 32px',
                borderRadius: '6px',
                backgroundColor: isDark ? '#111827' : '#FFFFFF',
                border: `1px solid ${cardBorder}`,
                color: textMain,
                fontSize: '12.5px',
                outline: 'none',
              }}
            />
            <span style={{ position: 'absolute', left: '10px', top: '8px', fontSize: '13px', color: textMuted }}>
              🔍
            </span>
          </div>
        </div>

        {/* Substation & Transformer Assets List */}
        {loading ? (
          <div
            style={{
              textAlign: 'center',
              padding: '60px 0',
              color: '#94A3B8',
              fontSize: '15px',
              fontFamily: "'JetBrains Mono', monospace",
            }}
          >
            [CALCULATING REAL-TIME HAVERSINE GEODESIC DISTANCES FOR INDIAN ASSETS...]
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {processedSubstations.map((sub) => {
              const isNearby = sub.liveDistance <= 10.0
              const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${sub.latitude},${sub.longitude}`
              const osmUrl = `https://www.openstreetmap.org/?mlat=${sub.latitude}&mlon=${sub.longitude}#map=16/${sub.latitude}/${sub.longitude}`

              return (
                <div
                  key={sub.substation_id}
                  style={{
                    background: isDark ? '#0F172A' : '#FFFFFF',
                    border: `1.5px solid ${isNearby ? '#0284C7' : cardBorder}`,
                    borderRadius: '10px',
                    padding: '20px',
                    boxShadow: isNearby ? '0 0 15px rgba(2, 132, 199, 0.15)' : 'none',
                  }}
                >
                  {/* Substation Header */}
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      flexWrap: 'wrap',
                      gap: '12px',
                      paddingBottom: '14px',
                      borderBottom: `1px solid ${cardBorder}`,
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                        <span
                          style={{
                            fontSize: '11px',
                            fontWeight: 800,
                            padding: '2px 8px',
                            borderRadius: '4px',
                            background: 'rgba(56,189,248,0.15)',
                            color: '#38BDF8',
                            fontFamily: "'JetBrains Mono', monospace",
                          }}
                        >
                          {sub.utility}
                        </span>
                        <span style={{ fontSize: '12px', color: textMuted }}>
                          📍 {sub.city}
                        </span>
                        {isNearby && (
                          <span
                            style={{
                              fontSize: '10px',
                              fontWeight: 800,
                              padding: '2px 8px',
                              borderRadius: '4px',
                              backgroundColor: '#10B981',
                              color: '#FFFFFF',
                            }}
                          >
                            ⚡ IMMEDIATE PROXIMITY (&lt; 10 km)
                          </span>
                        )}
                        {sub.is_mumbai && (
                          <span
                            style={{
                              fontSize: '10px',
                              fontWeight: 800,
                              padding: '2px 8px',
                              borderRadius: '4px',
                              backgroundColor: isDark ? '#1F2937' : '#E0F2FE',
                              color: isDark ? '#38BDF8' : '#0369A1',
                              border: `1px solid ${cardBorder}`,
                            }}
                          >
                            🏙️ Mumbai MMR Grid
                          </span>
                        )}
                      </div>
                      <h2
                        style={{
                          fontSize: '20px',
                          fontWeight: 800,
                          color: textMain,
                          marginTop: '6px',
                        }}
                      >
                        {sub.substation_name}
                      </h2>
                      <div style={{ fontSize: '13px', color: textMuted, marginTop: '2px' }}>
                        Voltage Class: <strong style={{ color: textMain }}>{sub.voltage_class}</strong> | Total Capacity: <strong style={{ color: textMain }}>{sub.total_capacity_mva} MVA</strong>
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <div
                        style={{
                          fontSize: '11px',
                          fontWeight: 700,
                          color: textMuted,
                          textTransform: 'uppercase',
                        }}
                      >
                        Distance from Current Location
                      </div>
                      <div
                        style={{
                          fontSize: '24px',
                          fontWeight: 900,
                          color: isNearby ? '#10B981' : '#0284C7',
                          fontFamily: "'JetBrains Mono', monospace",
                        }}
                      >
                        {sub.liveDistance} km
                      </div>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '4px' }}>
                        <a
                          href={googleMapsUrl}
                          target="_blank"
                          rel="noreferrer"
                          style={{
                            fontSize: '11px',
                            color: '#38BDF8',
                            textDecoration: 'none',
                            fontWeight: 700,
                          }}
                          className="hover:underline"
                        >
                          🗺️ Google Maps
                        </a>
                        <span style={{ color: textMuted }}>•</span>
                        <a
                          href={osmUrl}
                          target="_blank"
                          rel="noreferrer"
                          style={{
                            fontSize: '11px',
                            color: '#38BDF8',
                            textDecoration: 'none',
                            fontWeight: 700,
                          }}
                          className="hover:underline"
                        >
                          🌍 OpenStreetMap
                        </a>
                      </div>
                    </div>
                  </div>

                  {/* Transformer Asset Inventory in this Substation */}
                  <div style={{ marginTop: '16px' }}>
                    <div
                      style={{
                        fontSize: '12px',
                        fontWeight: 800,
                        color: textMuted,
                        textTransform: 'uppercase',
                        letterSpacing: '0.08em',
                        marginBottom: '12px',
                      }}
                    >
                      Installed Power Transformer Assets ({sub.transformers?.length || 0} units):
                    </div>

                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
                        gap: '14px',
                      }}
                    >
                      {sub.transformers.map((tr) => {
                        const isInvestigate = tr.status.includes('INVESTIGATE')
                        const badgeBg = isInvestigate
                          ? 'rgba(245,158,11,0.15)'
                          : 'rgba(16,185,129,0.15)'
                        const badgeColor = isInvestigate ? '#F59E0B' : '#10B981'

                        return (
                          <div
                            key={tr.asset_id}
                            style={{
                              background: isDark ? '#1E293B' : '#F8FAFC',
                              border: `1px solid ${isInvestigate ? 'rgba(245,158,11,0.35)' : cardBorder}`,
                              borderRadius: '8px',
                              padding: '16px',
                              display: 'flex',
                              flexDirection: 'column',
                              justifyContent: 'space-between',
                            }}
                          >
                            <div>
                              <div
                                style={{
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  alignItems: 'center',
                                }}
                              >
                                <span
                                  style={{
                                    fontSize: '13px',
                                    fontWeight: 800,
                                    color: textMain,
                                    fontFamily: "'JetBrains Mono', monospace",
                                  }}
                                >
                                  {tr.asset_id}
                                </span>
                                <span
                                  style={{
                                    fontSize: '11px',
                                    fontWeight: 800,
                                    padding: '3px 8px',
                                    borderRadius: '4px',
                                    background: badgeBg,
                                    color: badgeColor,
                                  }}
                                >
                                  {tr.status.split('(')[0].trim()}
                                </span>
                              </div>
                              <div
                                style={{
                                  fontSize: '12px',
                                  color: '#0284C7',
                                  fontWeight: 700,
                                  marginTop: '2px',
                                }}
                              >
                                {tr.bay}
                              </div>

                              <div
                                style={{
                                  marginTop: '12px',
                                  fontSize: '13px',
                                  color: textMain,
                                  fontWeight: 600,
                                }}
                              >
                                {tr.rating}
                              </div>

                              <div
                                style={{
                                  marginTop: '10px',
                                  display: 'grid',
                                  gridTemplateColumns: '1fr 1fr',
                                  gap: '6px',
                                  fontSize: '11.5px',
                                  color: textMuted,
                                }}
                              >
                                <div>
                                  Make: <strong style={{ color: textMain }}>{tr.make.split(',')[0]}</strong>
                                </div>
                                <div>
                                  Commissioned: <strong style={{ color: textMain }}>{tr.commissioning_year}</strong>
                                </div>
                                <div>
                                  Cooling: <strong style={{ color: textMain }}>{tr.cooling}</strong>
                                </div>
                                <div>
                                  Vector: <strong style={{ color: textMain }}>{tr.vector_group}</strong>
                                </div>
                                <div>
                                  Oil: <strong style={{ color: textMain }}>{tr.oil_capacity_liters?.toLocaleString()} L</strong>
                                </div>
                                <div>
                                  Health: <strong style={{ color: badgeColor }}>{tr.health_index} / 100</strong>
                                </div>
                              </div>

                              <div
                                style={{
                                  marginTop: '10px',
                                  padding: '8px',
                                  borderRadius: '4px',
                                  background: isDark ? '#0F172A' : '#E2E8F0',
                                  fontSize: '11px',
                                  color: textMain,
                                }}
                              >
                                <div>
                                  Last SFRA: <strong style={{ color: '#0284C7' }}>{tr.last_sfra_date}</strong>
                                </div>
                                <div style={{ marginTop: '2px' }}>
                                  DGA: <strong style={{ color: isInvestigate ? '#F59E0B' : '#10B981' }}>{tr.dga_condition}</strong>
                                </div>
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
                                className="hover:bg-blue-600 active:scale-95"
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
              )
            })}
          </div>
        )}

        {/* ========================================================================= */}
        {/* SUBSTATION TECHNICAL SPECIFICATIONS, AIS VS GIS & UTILITY DIRECTORY      */}
        {/* ========================================================================= */}

        {/* 1. AIS vs GIS Maintenance & SFRA Protocols */}
        <div
          style={{
            backgroundColor: cardBg,
            border: `1px solid ${cardBorder}`,
            borderRadius: '8px',
            padding: '24px',
            marginTop: '24px',
          }}
        >
          <div style={{ marginBottom: '16px' }}>
            <div
              style={{
                fontSize: '11px',
                fontWeight: 800,
                color: '#0284C7',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
              }}
            >
              Substation Engineering Guidelines
            </div>
            <h3 style={{ fontSize: '18px', fontWeight: 800, color: textMain, margin: '2px 0 0' }}>
              Air-Insulated Substation (AIS) vs Gas-Insulated Substation (GIS) SFRA Protocols
            </h3>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              gap: '16px',
            }}
          >
            <div
              style={{
                padding: '16px',
                borderRadius: '6px',
                backgroundColor: isDark ? '#1E293B' : '#F8FAFC',
                border: `1px solid ${cardBorder}`,
              }}
            >
              <div style={{ fontSize: '14px', fontWeight: 800, color: '#38BDF8', marginBottom: '6px' }}>
                Air-Insulated Switchyard (AIS) Testing Considerations
              </div>
              <ul style={{ fontSize: '12px', color: textMuted, paddingLeft: '16px', margin: 0, lineHeight: 1.6 }}>
                <li>
                  <strong>Overhead Dropper Capacitance:</strong> Droppers must be unbolted from bushing terminals to prevent external overhead line capacitance from suppressing high-frequency resonant poles.
                </li>
                <li>
                  <strong>Monsoon Creepage Leakage:</strong> Outdoor porcelain sheds require isopropyl alcohol wipe-down to prevent conductive surface moisture films from masking tap-changer lead responses.
                </li>
                <li>
                  <strong>Substation Ground Mat:</strong> Instrument ground lead must bond directly to transformer tank base flange, not the outdoor switchyard earth mat.
                </li>
              </ul>
            </div>

            <div
              style={{
                padding: '16px',
                borderRadius: '6px',
                backgroundColor: isDark ? '#1E293B' : '#F8FAFC',
                border: `1px solid ${cardBorder}`,
              }}
            >
              <div style={{ fontSize: '14px', fontWeight: 800, color: '#A78BFA', marginBottom: '6px' }}>
                Gas-Insulated Switchyard (GIS) Testing Considerations
              </div>
              <ul style={{ fontSize: '12px', color: textMuted, paddingLeft: '16px', margin: 0, lineHeight: 1.6 }}>
                <li>
                  <strong>SF6 Bushing Enclosure:</strong> SFRA test signal is injected through dedicated test adapters or SF6-to-air transition bushings with enclosure grounding intact.
                </li>
                <li>
                  <strong>Capacitive Divider Calibration:</strong> Voltage ratio measurements must account for the intrinsic GIS enclosure coaxial capacitance (approx 60 pF/m).
                </li>
                <li>
                  <strong>Switchgear Disconnect:</strong> High-speed earth switches (HSES) and busbar disconnectors must be confirmed open before test frequency sweep injection.
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* 2. Indian State Transmission Utilities Directory */}
        <div
          style={{
            backgroundColor: cardBg,
            border: `1px solid ${cardBorder}`,
            borderRadius: '8px',
            padding: '24px',
            marginTop: '16px',
          }}
        >
          <div style={{ marginBottom: '14px' }}>
            <div
              style={{
                fontSize: '11px',
                fontWeight: 800,
                color: '#10B981',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
              }}
            >
              National Grid Management Network
            </div>
            <h3 style={{ fontSize: '18px', fontWeight: 800, color: textMain, margin: '2px 0 0' }}>
              Indian Power Transmission Companies (TRANSCOs) & Asset Jurisdictions
            </h3>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
              gap: '12px',
            }}
          >
            {[
              { code: 'PGCIL', name: 'Power Grid Corporation of India Ltd', hq: 'Gurugram (National Grid)', lines: '176,000+ ckm', ehv: '765 kV / 400 kV' },
              { code: 'MSETCL', name: 'Maharashtra State Electricity Transmission', hq: 'Mumbai, Maharashtra', lines: '50,000+ ckm', ehv: '765 kV / 400 kV / 220 kV' },
              { code: 'TATA POWER', name: 'Tata Power Transmission & Distribution', hq: 'Mumbai / Trombay', lines: 'Mumbai Bulk Ring', ehv: '220 kV / 110 kV / 33 kV' },
              { code: 'AEML', name: 'Adani Electricity Mumbai Transmission', hq: 'Mumbai / Vikhroli', lines: 'Mumbai Infeed Grid', ehv: '400 kV / 220 kV GIS' },
              { code: 'BEST', name: 'Brihanmumbai Electric Supply & Transport', hq: 'Colaba, Mumbai', lines: 'Island City Ring', ehv: '110 kV / 33 kV / 11 kV' },
              { code: 'GETCO', name: 'Gujarat Energy Transmission Corp', hq: 'Vadodara, Gujarat', lines: '36,000+ ckm', ehv: '400 kV / 220 kV / 66 kV' },
              { code: 'TANTRANSCO', name: 'Tamil Nadu Transmission Corporation', hq: 'Chennai, Tamil Nadu', lines: '38,000+ ckm', ehv: '765 kV / 400 kV / 230 kV' },
              { code: 'KPTCL', name: 'Karnataka Power Transmission Corp', hq: 'Bengaluru, Karnataka', lines: '41,000+ ckm', ehv: '400 kV / 220 kV / 110 kV' },
            ].map((t, idx) => (
              <div
                key={idx}
                style={{
                  padding: '14px',
                  borderRadius: '6px',
                  backgroundColor: isDark ? '#1E293B' : '#F8FAFC',
                  border: `1px solid ${cardBorder}`,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '13px', fontWeight: 800, color: '#0284C7' }}>{t.code}</span>
                  <span
                    style={{
                      fontSize: '10.5px',
                      padding: '2px 6px',
                      borderRadius: '3px',
                      backgroundColor: '#0284C7',
                      color: '#fff',
                      fontWeight: 700,
                    }}
                  >
                    {t.ehv}
                  </span>
                </div>
                <div style={{ fontSize: '12px', fontWeight: 700, color: textMain, marginTop: '4px' }}>
                  {t.name}
                </div>
                <div style={{ fontSize: '11px', color: textMuted, marginTop: '2px' }}>
                  HQ: {t.hq} • {t.lines}
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}
