import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTheme } from '../lib/theme'

// Verified transformer assets matched to the user's state breakdown and Indian map
const FLEET_ASSETS = [
  // Delhi (Normal)
  {
    id: 'tr_del_01',
    name: 'Mandola 400 kV GIS',
    state: 'Delhi',
    lat: 28.7900,
    lon: 77.2900,
    status: 'Normal',
    color: '#22C55E',
    transformers: 1,
    tag: 'TR-400KV-315MVA-BHEL-DEL',
    mva: 315,
  },
  // Gujarat (Moderate Fault)
  {
    id: 'tr_guj_01',
    name: 'Mundra 400 kV Substation',
    state: 'Gujarat',
    lat: 22.8390,
    lon: 69.7240,
    status: 'Moderate Fault',
    color: '#F97316',
    transformers: 1,
    tag: 'TR-400KV-600MVA-SIEMENS-GUJ',
    mva: 600,
  },
  // Karnataka (Minor Deviation)
  {
    id: 'tr_kar_01',
    name: 'Hoodi 400 kV Grid Hub',
    state: 'Karnataka',
    lat: 12.9915,
    lon: 77.7165,
    status: 'Minor Deviation',
    color: '#EAB308',
    transformers: 1,
    tag: 'TR-400KV-500MVA-BHEL-BLR',
    mva: 500,
  },
  // Maharashtra (High Fault Risk - 6 Units in Mumbai/MMR cluster)
  {
    id: 'tr_mh_kalwa',
    name: 'Kalwa 400/220 kV Gateway',
    state: 'Maharashtra',
    lat: 19.1983,
    lon: 72.9989,
    status: 'High Fault Risk',
    color: '#EF4444',
    transformers: 2,
    tag: 'TX_MUM_02 (Hitachi 315 MVA)',
    mva: 315,
  },
  {
    id: 'tr_mh_trombay',
    name: 'Trombay 220 kV Thermal',
    state: 'Maharashtra',
    lat: 19.0028,
    lon: 72.8994,
    status: 'High Fault Risk',
    color: '#EF4444',
    transformers: 1,
    tag: 'TX_TMB_01 (CG Power 160 MVA)',
    mva: 160,
  },
  {
    id: 'tr_mh_dharavi',
    name: 'Dharavi 220 kV Central Hub',
    state: 'Maharashtra',
    lat: 19.0434,
    lon: 72.8570,
    status: 'Normal',
    color: '#22C55E',
    transformers: 1,
    tag: 'TPC-DHR-TR-01 (90 MVA)',
    mva: 90,
  },
  {
    id: 'tr_mh_padgha',
    name: 'Padghe 765/400 kV EHV',
    state: 'Maharashtra',
    lat: 19.3482,
    lon: 73.1611,
    status: 'Normal',
    color: '#22C55E',
    transformers: 1,
    tag: 'TR-765KV-500MVA-BHEL',
    mva: 500,
  },
  {
    id: 'tr_mh_wadala',
    name: 'Wadala 220 kV Substation',
    state: 'Maharashtra',
    lat: 19.0222,
    lon: 72.8697,
    status: 'Normal',
    color: '#22C55E',
    transformers: 1,
    tag: 'TX_MUM_04 (BHEL 50 MVA)',
    mva: 50,
  },
  // Tamil Nadu (Moderate Fault)
  {
    id: 'tr_tn_01',
    name: 'Sriperumbudur 400 kV GIS',
    state: 'Tamil Nadu',
    lat: 12.9675,
    lon: 79.9419,
    status: 'Moderate Fault',
    color: '#F97316',
    transformers: 1,
    tag: 'TR-400KV-315MVA-CG-TN',
    mva: 315,
  },
  // Telangana (Minor Deviation)
  {
    id: 'tr_ts_01',
    name: 'Malkaram 400 kV Substation',
    state: 'Telangana',
    lat: 17.3100,
    lon: 78.5800,
    status: 'Minor Deviation',
    color: '#EAB308',
    transformers: 1,
    tag: 'TR-400KV-315MVA-TEL',
    mva: 315,
  },
  // West Bengal (High Fault Risk)
  {
    id: 'tr_wb_01',
    name: 'Kolkata EHV Substation',
    state: 'West Bengal',
    lat: 22.5726,
    lon: 88.3639,
    status: 'High Fault Risk',
    color: '#EF4444',
    transformers: 1,
    tag: 'TR-400KV-315MVA-WB',
    mva: 315,
  },
]

// State summary table matching user's reference image
const STATE_SUMMARIES = [
  { state: 'Delhi', count: 1, worstClass: 'Normal', color: '#22C55E' },
  { state: 'Gujarat', count: 1, worstClass: 'Moderate Fault', color: '#F97316' },
  { state: 'Karnataka', count: 1, worstClass: 'Minor Deviation', color: '#EAB308' },
  { state: 'Maharashtra', count: 6, worstClass: 'High Fault Risk', color: '#EF4444' },
  { state: 'Tamil Nadu', count: 1, worstClass: 'Moderate Fault', color: '#F97316' },
  { state: 'Telangana', count: 1, worstClass: 'Minor Deviation', color: '#EAB308' },
  { state: 'West Bengal', count: 1, worstClass: 'High Fault Risk', color: '#EF4444' },
]

export default function IndianSubstationMap() {
  const navigate = useNavigate()
  const { isDark } = useTheme()
  const mapContainerRef = useRef(null)
  const mapInstanceRef = useRef(null)
  const [selectedAsset, setSelectedAsset] = useState(null)

  // Initialize real Leaflet Map
  useEffect(() => {
    let map = null

    const initMap = () => {
      const L = window.L
      if (!L || !mapContainerRef.current) return

      // Clean up previous instance if any
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }

      // Create map centered on India (matches user reference image)
      map = L.map(mapContainerRef.current, {
        center: [22.0, 79.2],
        zoom: 4.8,
        minZoom: 4,
        maxZoom: 12,
        zoomControl: true,
        attributionControl: true,
      })

      // Standard OpenStreetMap tiles (exactly as in the reference image)
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 18,
        attribution: '&copy; <a href="https://leafletjs.com/">Leaflet</a> | &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(map)

      // Add circular markers for each transformer
      FLEET_ASSETS.forEach((asset) => {
        const marker = L.circleMarker([asset.lat, asset.lon], {
          radius: 9,
          fillColor: asset.color,
          color: '#FFFFFF',
          weight: 2,
          opacity: 0.95,
          fillOpacity: 0.9,
        }).addTo(map)

        const popupContent = `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 12px; line-height: 1.5; color: #0F172A; min-width: 180px;">
            <div style="font-weight: 800; font-size: 13px; color: #0F172A; margin-bottom: 2px;">
              ${asset.name}
            </div>
            <div style="color: #64748B; font-size: 11px; margin-bottom: 6px;">
              State: <strong>${asset.state}</strong> · ${asset.mva} MVA
            </div>
            <div style="display: flex; align-items: center; justify-content: space-between; padding-top: 6px; border-top: 1px solid #E2E8F0;">
              <span style="color: ${asset.color}; font-weight: 800; font-size: 11.5px;">
                ${asset.status}
              </span>
              <a href="/upload?asset_tag=${encodeURIComponent(asset.tag)}&bay=${encodeURIComponent(asset.name)}" style="color: #0284C7; font-weight: 700; text-decoration: none; font-size: 11px;">
                Inspect FRA →
              </a>
            </div>
          </div>
        `
        marker.bindPopup(popupContent)

        marker.on('click', () => {
          setSelectedAsset(asset)
        })
      })

      mapInstanceRef.current = map
    }

    if (window.L) {
      initMap()
    } else {
      const checkTimer = setInterval(() => {
        if (window.L) {
          clearInterval(checkTimer)
          initMap()
        }
      }, 100)
      return () => clearInterval(checkTimer)
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
  }, [])

  const cardBg = isDark ? '#0D1117' : '#FFFFFF'
  const cardBorder = isDark ? '#1F2937' : '#E2E8F0'
  const textPrimary = isDark ? '#F9FAFB' : '#0F172A'
  const textMuted = isDark ? '#9CA3AF' : '#64748B'
  const rowBorder = isDark ? '#1F2937' : '#F1F5F9'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* ── 1. Map Container Card (Matches Reference Image) ── */}
      <div
        style={{
          borderRadius: '12px',
          overflow: 'hidden',
          backgroundColor: '#FFFFFF',
          border: `1px solid ${cardBorder}`,
          boxShadow: isDark ? '0 4px 24px rgba(0,0,0,0.4)' : '0 4px 20px rgba(0,0,0,0.06)',
          position: 'relative',
        }}
      >
        <div
          ref={mapContainerRef}
          style={{
            width: '100%',
            height: '520px',
            backgroundColor: '#E5E7EB',
          }}
        />
      </div>

      {/* ── 2. Caption Text (Directly Below Map in Reference) ── */}
      <div style={{ padding: '0 4px' }}>
        <p style={{ fontSize: '13px', color: textMuted, margin: 0, lineHeight: 1.5 }}>
          Latest FRA condition class per transformer (asset health, not supply status)
        </p>
        <p style={{ fontSize: '13px', color: textMuted, margin: '2px 0 0', lineHeight: 1.5 }}>
          Shows the transformers you registered. Demo assets are fictional. This is not a national registry.
        </p>
      </div>

      {/* ── 3. "BY STATE" Table Card (Matches Reference Image) ── */}
      <div
        style={{
          backgroundColor: cardBg,
          border: `1px solid ${cardBorder}`,
          borderRadius: '12px',
          padding: '24px',
          boxShadow: isDark ? '0 4px 20px rgba(0,0,0,0.3)' : '0 4px 20px rgba(0,0,0,0.04)',
        }}
      >
        <div
          style={{
            fontSize: '11px',
            fontWeight: 800,
            color: textMuted,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            marginBottom: '16px',
            fontFamily: "'JetBrains Mono', monospace",
          }}
        >
          BY STATE
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: '14px',
              textAlign: 'left',
            }}
          >
            <thead>
              <tr style={{ borderBottom: `1px solid ${rowBorder}` }}>
                <th style={{ padding: '12px 14px', color: textMuted, fontWeight: 600, fontSize: '13px' }}>
                  State
                </th>
                <th style={{ padding: '12px 14px', color: textMuted, fontWeight: 600, fontSize: '13px' }}>
                  Transformers
                </th>
                <th style={{ padding: '12px 14px', color: textMuted, fontWeight: 600, fontSize: '13px' }}>
                  Worst latest class
                </th>
              </tr>
            </thead>
            <tbody>
              {STATE_SUMMARIES.map((item, idx) => (
                <tr
                  key={item.state}
                  style={{
                    borderBottom: idx < STATE_SUMMARIES.length - 1 ? `1px solid ${rowBorder}` : 'none',
                    transition: 'background-color 0.15s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = isDark ? '#161B22' : '#F8FAFC'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent'
                  }}
                >
                  <td style={{ padding: '14px', fontWeight: 600, color: textPrimary }}>
                    {item.state}
                  </td>
                  <td style={{ padding: '14px', color: textPrimary, fontWeight: 500 }}>
                    {item.count}
                  </td>
                  <td style={{ padding: '14px', fontWeight: 700, color: item.color }}>
                    {item.worstClass}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
