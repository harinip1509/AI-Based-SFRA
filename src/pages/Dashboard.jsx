import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiRequest } from '../lib/api'
import { useTheme } from '../lib/theme'
import DashboardNavbar from '../components/dashboard/DashboardNavbar'
import EngineerQuickDock from '../components/dashboard/EngineerQuickDock'
import StatusCards from '../components/dashboard/StatusCards'
import UploadPanel from '../components/dashboard/UploadPanel'
import AnalyticsPanel from '../components/dashboard/AnalyticsPanel'
import RecentAnalysis from '../components/dashboard/RecentAnalysis'
import AlertsPanel from '../components/dashboard/AlertsPanel'

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

export default function Dashboard() {
  const navigate = useNavigate()
  const { isDark } = useTheme()
  const [user, setUser] = useState({ name: 'Engineer', email: 'user@intellifra.ai' })
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)

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
        // If profile fetch fails but token exists, keep session alive in offline demo mode
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
      setLoading(true)
      try {
        const token = localStorage.getItem('token')
        if (!token) return
        const data = await apiRequest('/fra/history', { token })
        const list = normalizeHistory(data)
        if (!cancelled) setHistory(list.length ? list : fallbackHistory)
      } catch {
        if (!cancelled) setHistory(fallbackHistory)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    loadHistory()
    return () => { cancelled = true }
  }, [fallbackHistory])

  useEffect(() => {
    const onHistoryUpdated = (event) => {
      const nextItems = event?.detail
      setHistory(normalizeHistory(nextItems))
    }
    window.addEventListener('fra-history-updated', onHistoryUpdated)
    return () => window.removeEventListener('fra-history-updated', onHistoryUpdated)
  }, [])

  const handleLogout = () => {
    localStorage.removeItem('token')
    navigate('/login', { replace: true })
  }

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        backgroundColor: isDark ? '#0B0F19' : '#F8FAFC',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: isDark ? '#9CA3AF' : '#64748B',
        fontSize: '14px',
        fontWeight: 600,
      }}>
        Loading substation diagnostic dashboard...
      </div>
    )
  }

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: isDark ? '#0B0F19' : '#F8FAFC',
      color: isDark ? '#F9FAFB' : '#0F172A',
      transition: 'background-color 0.2s, color 0.2s',
    }}>
      <DashboardNavbar user={user} onLogout={handleLogout} history={history} />

      <main style={{
        padding: '24px',
        maxWidth: '1360px',
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
      }}>
        {/* Engineering System Banner */}
        <div style={{
          backgroundColor: isDark ? '#111827' : '#FFFFFF',
          border: `1.5px solid ${isDark ? '#1F2937' : '#E2E8F0'}`,
          borderRadius: '8px',
          padding: '16px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
        }}>
          <div>
            <div style={{
              fontSize: '11px',
              fontWeight: 800,
              color: '#0284C7',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              fontFamily: "'JetBrains Mono', monospace",
            }}>
              CENTRAL ELECTRICITY AUTHORITY (CEA) • POWER GRID ASSET INTEGRITY
            </div>
            <div style={{ fontSize: '18px', fontWeight: 800, marginTop: '2px' }}>
              Substation Asset Health & FRA Diagnostic Cockpit
            </div>
            <div style={{ fontSize: '13px', color: isDark ? '#9CA3AF' : '#64748B', marginTop: '2px' }}>
              Online interpretation per IS 2026 (Winding Movement) & IS 10593 (Through-Fault DGA Escalation)
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              onClick={() => navigate('/substations')}
              style={{
                padding: '9px 16px',
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
              🛰️ Indian Substation Radar →
            </button>
            <button
              type="button"
              onClick={() => navigate('/upload')}
              style={{
                padding: '9px 16px',
                borderRadius: '6px',
                backgroundColor: isDark ? '#1F2937' : '#F1F5F9',
                border: `1px solid ${isDark ? '#374151' : '#CBD5E1'}`,
                color: isDark ? '#E5E7EB' : '#1E293B',
                fontSize: '13px',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              + Ingest Measurement
            </button>
          </div>
        </div>

        {/* YONO Style Quick Operations Dock for Substation Engineers */}
        <EngineerQuickDock history={history} />

        {/* Status KPI Cards */}
        <StatusCards history={history} />

        {/* Ingestion Panel */}
        <UploadPanel />

        {/* Analytics & Alerts Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px' }}>
          <AnalyticsPanel history={history} />
          <AlertsPanel history={history} />
        </div>

        {/* Recent Records Table */}
        <RecentAnalysis history={history} />

        {/* ========================================================================= */}
        {/* NATIONAL GRID RELIABILITY, CEA STATS & ASSET MANAGEMENT CALENDAR           */}
        {/* ========================================================================= */}

        {/* 1. All-India Regional Grid Reliability Overview */}
        <div style={{
          backgroundColor: isDark ? '#111827' : '#FFFFFF',
          border: `1.5px solid ${isDark ? '#1F2937' : '#E2E8F0'}`,
          borderRadius: '8px',
          padding: '20px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
            <div>
              <div style={{ fontSize: '11px', fontWeight: 800, color: '#0284C7', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Transmission Reliability Index (POSOCO / NLDC Baseline)
              </div>
              <h3 style={{ fontSize: '16px', fontWeight: 800, margin: '2px 0 0' }}>
                All-India Regional Substation Fleet Reliability
              </h3>
            </div>
            <span style={{ fontSize: '11px', padding: '3px 8px', borderRadius: '4px', backgroundColor: isDark ? '#1F2937' : '#F1F5F9', color: '#10B981', fontWeight: 700 }}>
              National Availability: 99.82%
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
            {[
              { region: 'Western Grid (WR)', bays: '1,420 Bays', healthy: '96.4%', alert: '3.6%', transco: 'MSETCL / GETCO / PGCIL' },
              { region: 'Northern Grid (NR)', bays: '1,680 Bays', healthy: '95.1%', alert: '4.9%', transco: 'UPPTCL / PSTCL / PGCIL' },
              { region: 'Southern Grid (SR)', bays: '1,310 Bays', healthy: '97.2%', alert: '2.8%', transco: 'TANTRANSCO / KPTCL / APTRANSCO' },
              { region: 'Eastern Grid (ER)', bays: '940 Bays', healthy: '94.8%', alert: '5.2%', transco: 'WBSETCL / OPTCL / DVC' },
              { region: 'North-Eastern (NER)', bays: '380 Bays', healthy: '93.5%', alert: '6.5%', transco: 'AEGCL / MePTCL / PGCIL' },
            ].map((r, idx) => (
              <div key={idx} style={{
                padding: '14px',
                borderRadius: '6px',
                backgroundColor: isDark ? '#1F2937' : '#F8FAFC',
                border: `1px solid ${isDark ? '#374151' : '#E2E8F0'}`,
              }}>
                <div style={{ fontSize: '13px', fontWeight: 800, color: '#0284C7' }}>{r.region}</div>
                <div style={{ fontSize: '11px', color: isDark ? '#9CA3AF' : '#64748B', marginTop: '1px' }}>{r.transco}</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px' }}>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: '#10B981' }}>Healthy: {r.healthy}</span>
                  <span style={{ fontSize: '11px', color: isDark ? '#9CA3AF' : '#64748B' }}>{r.bays}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 2. CEA Annual Failure Root-Cause Analysis */}
        <div style={{
          backgroundColor: isDark ? '#111827' : '#FFFFFF',
          border: `1.5px solid ${isDark ? '#1F2937' : '#E2E8F0'}`,
          borderRadius: '8px',
          padding: '20px',
        }}>
          <div style={{ marginBottom: '14px' }}>
            <div style={{ fontSize: '11px', fontWeight: 800, color: '#F59E0B', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Central Electricity Authority Field Investigation Data
            </div>
            <h3 style={{ fontSize: '16px', fontWeight: 800, margin: '2px 0 0' }}>
              Transformer Failure Root Cause Statistics (Indian 400 kV / 765 kV Fleet)
            </h3>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
            {[
              {
                title: 'Through-Fault Short-Circuit Forces',
                pct: '42%',
                color: '#EF4444',
                desc: 'Overhead transmission line lightning strikes & flashovers induce severe radial hoop stress and axial winding compression (addressed by IntelliFRA mid-band CCF & C2H4 fusion).',
              },
              {
                title: 'Bushing Deterioration & Test-Tap Moisture',
                pct: '28%',
                color: '#F59E0B',
                desc: 'Dielectric breakdown from monsoon moisture ingress, cracked porcelain, and loose earthing flats (filtered by IntelliFRA > 1 MHz monsoon noise logic).',
              },
              {
                title: 'On-Load Tap Changer (OLTC) Failures',
                pct: '18%',
                color: '#3B82F6',
                desc: 'Transition resistor burns, contact wear, and diverter switch timing asymmetry detected by high-frequency lead shifts.',
              },
              {
                title: 'Core Ground Rupture & Insulation Aging',
                pct: '12%',
                color: '#10B981',
                desc: 'Multiple core ground points and paper insulation depolymerization (DP < 250) flagged by low-band SFRA & CO2/CO ratios.',
              },
            ].map((f, idx) => (
              <div key={idx} style={{
                padding: '16px',
                borderRadius: '6px',
                backgroundColor: isDark ? '#1F2937' : '#F8FAFC',
                border: `1px solid ${isDark ? '#374151' : '#E2E8F0'}`,
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '13px', fontWeight: 800 }}>{f.title}</span>
                  <span style={{ fontSize: '16px', fontWeight: 900, color: f.color }}>{f.pct}</span>
                </div>
                <div style={{ width: '100%', height: '4px', backgroundColor: isDark ? '#374151' : '#E2E8F0', borderRadius: '2px', margin: '8px 0' }}>
                  <div style={{ width: f.pct, height: '100%', backgroundColor: f.color, borderRadius: '2px' }} />
                </div>
                <p style={{ fontSize: '12px', color: isDark ? '#9CA3AF' : '#64748B', margin: 0, lineHeight: 1.4 }}>
                  {f.desc}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* 3. Condition-Based Maintenance (CBM) Scheduling Planner */}
        <div style={{
          backgroundColor: isDark ? '#111827' : '#FFFFFF',
          border: `1.5px solid ${isDark ? '#1F2937' : '#E2E8F0'}`,
          borderRadius: '8px',
          padding: '20px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
            <div>
              <div style={{ fontSize: '11px', fontWeight: 800, color: '#10B981', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Substation Asset Operations
              </div>
              <h3 style={{ fontSize: '16px', fontWeight: 800, margin: '2px 0 0' }}>
                Condition-Based Maintenance (CBM) Schedule Calendar
              </h3>
            </div>
            <button
              onClick={() => navigate('/upload')}
              style={{
                backgroundColor: '#0284C7',
                color: '#fff',
                border: 'none',
                padding: '6px 12px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
              }}
              className="hover:bg-blue-600 active:scale-95"
            >
              + Schedule Emergency Sweep
            </button>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', textAlign: 'left' }}>
              <thead>
                <tr style={{ backgroundColor: isDark ? '#1F2937' : '#F1F5F9', borderBottom: `2px solid ${isDark ? '#374151' : '#E2E8F0'}` }}>
                  <th style={{ padding: '8px 12px' }}>Asset Identifier</th>
                  <th style={{ padding: '8px 12px' }}>Substation Location</th>
                  <th style={{ padding: '8px 12px' }}>Voltage / MVA</th>
                  <th style={{ padding: '8px 12px' }}>Scheduled Action</th>
                  <th style={{ padding: '8px 12px' }}>Due Date</th>
                  <th style={{ padding: '8px 12px' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { id: 'TR-400KV-315MVA-BHEL-01', loc: 'Kalwa 400 kV GIS (MSETCL)', rating: '400/220 kV • 315 MVA', action: 'Routine 36-Month SFRA Fingerprint', due: 'Nov 15, 2026', tag: 'Scheduled', color: '#10B981' },
                  { id: 'TR-400KV-315MVA-BHEL-02', loc: 'Padgha 765 kV HVDC (PGCIL)', rating: '765/400 kV • 500 MVA', action: 'Post-Through-Fault Impedance & DGA', due: 'URGENT (24h)', tag: 'Critical Alert', color: '#EF4444' },
                  { id: 'TR-220KV-160MVA-TATA-01', loc: 'Trombay 220 kV (TPC)', rating: '220/110 kV • 160 MVA', action: 'Monsoon Bushing Tap Ground Audit', due: 'Oct 28, 2026', tag: 'Investigate', color: '#F59E0B' },
                  { id: 'TR-400KV-500MVA-PGCIL-01', loc: 'Chakan 400 kV GIS (PGCIL)', rating: '400/220 kV • 500 MVA', action: 'Quarterly IS 10593 Gas Chromatography', due: 'Dec 02, 2026', tag: 'Normal', color: '#10B981' },
                ].map((row, idx) => (
                  <tr key={idx} style={{ borderBottom: `1px solid ${isDark ? '#1F2937' : '#E2E8F0'}` }}>
                    <td style={{ padding: '10px 12px', fontWeight: 700 }}>{row.id}</td>
                    <td style={{ padding: '10px 12px', color: isDark ? '#9CA3AF' : '#64748B' }}>{row.loc}</td>
                    <td style={{ padding: '10px 12px' }}>{row.rating}</td>
                    <td style={{ padding: '10px 12px', color: '#0284C7', fontWeight: 600 }}>{row.action}</td>
                    <td style={{ padding: '10px 12px', fontWeight: 700 }}>{row.due}</td>
                    <td style={{ padding: '10px 12px' }}>
                      <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '4px', backgroundColor: `${row.color}20`, color: row.color, fontWeight: 800 }}>
                        {row.tag}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  )
}
