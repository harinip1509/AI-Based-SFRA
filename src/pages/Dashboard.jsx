import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiRequest } from '../lib/api'
import DashboardNavbar from '../components/dashboard/DashboardNavbar'
import StatusCards from '../components/dashboard/StatusCards'
import UploadPanel from '../components/dashboard/UploadPanel'
import AnalyticsPanel from '../components/dashboard/AnalyticsPanel'
import RecentAnalysis from '../components/dashboard/RecentAnalysis'
import AlertsPanel from '../components/dashboard/AlertsPanel'
import AnimatedSection from '../components/AnimatedSection'

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
  const [user, setUser] = useState({ name: 'Engineer', email: 'user@intellifra.ai' })
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('ALL')

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
        localStorage.removeItem('token')
        navigate('/login', { replace: true })
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
    const savedFilter = localStorage.getItem('fra_dashboard_filter')
    if (savedFilter) setFilter(savedFilter)
  }, [])

  useEffect(() => {
    localStorage.setItem('fra_dashboard_filter', filter)
  }, [filter])

  useEffect(() => {
    let cancelled = false
    const loadHistory = async () => {
      setLoading(true)
      try {
        const token = localStorage.getItem('token')
        if (!token) return
        const data = await apiRequest('/fra/history', { token })
        const list = normalizeHistory(data)
        if (!cancelled) setHistory(list)
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

  const filteredHistory = useMemo(() => {
    if (filter === 'ALL') return history
    return history.filter((item) => item?.classification === filter)
  }, [history, filter])

  const handleLogout = () => {
    localStorage.removeItem('token')
    navigate('/login', { replace: true })
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#0B0F1A', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.7)', fontFamily: "'Inter', system-ui, sans-serif" }}>
        Loading dashboard...
      </div>
    )
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0B0F1A',
      backgroundImage: 'radial-gradient(rgba(0,212,255,0.04) 1px, transparent 1px)',
      backgroundSize: '40px 40px',
      fontFamily: "'Inter', system-ui, sans-serif",
      color: '#fff',
    }}>
      <DashboardNavbar user={user} onLogout={handleLogout} history={filteredHistory} />

      <main style={{ padding: '24px 28px 34px', maxWidth: '1400px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '18px' }}>
        
        {/* Substation Geolocation Radar Banner for Engineers */}
        <div style={{
          background: '#0F172A',
          border: '1.5px solid #0284C7',
          borderRadius: '10px',
          padding: '18px 22px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '14px',
          boxShadow: '0 4px 16px rgba(2,132,199,0.15)',
        }}>
          <div>
            <div style={{ fontSize: '11px', fontWeight: 800, color: '#38BDF8', letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: "'JetBrains Mono', monospace" }}>
              LOCATION-AWARE ASSET DISCOVERY • INDIAN POWER GRID
            </div>
            <div style={{ fontSize: '18px', fontWeight: 800, color: '#FFFFFF', marginTop: '4px' }}>
              🛰️ Substation & Transformer Asset Radar
            </div>
            <div style={{ fontSize: '13.5px', color: '#94A3B8', marginTop: '3px' }}>
              Detects your coordinates in India and identifies nearby 765 kV / 400 kV / 220 kV substations, BHEL/ABB transformer IDs, and live health indices.
            </div>
          </div>
          <button
            type="button"
            onClick={() => navigate('/substations')}
            style={{
              padding: '10px 18px',
              borderRadius: '6px',
              background: '#0284C7',
              border: 'none',
              color: '#FFFFFF',
              fontSize: '13px',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            Launch Substation Radar →
          </button>
        </div>

        <AnimatedSection>
          <StatusCards history={filteredHistory} />
        </AnimatedSection>
        <UploadPanel />
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '18px' }}>
          <AnimatedSection>
            <AnalyticsPanel history={filteredHistory} />
          </AnimatedSection>
          <AnimatedSection>
            <AlertsPanel history={filteredHistory} />
          </AnimatedSection>
        </div>
        <AnimatedSection>
          <RecentAnalysis history={filteredHistory} />
        </AnimatedSection>
        {filteredHistory.length === 0 && (
          <div style={{ color: 'rgba(255,255,255,0.55)', fontSize: '14px' }}>
            No analyses yet
          </div>
        )}
      </main>
    </div>
  )
}

