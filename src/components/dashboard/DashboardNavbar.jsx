import { useLocation, useNavigate } from 'react-router-dom'
import { useTheme } from '../../lib/theme'

export default function DashboardNavbar({ user = { name: 'Engineer', email: 'user@intellifra.ai' }, onLogout, history = [] }) {
  const navigate = useNavigate()
  const location = useLocation()
  const { toggleTheme, isDark, seniorMode, toggleSeniorMode } = useTheme()

  const handleAnalyses = () => {
    if (Array.isArray(history) && history.length > 0 && history[0]?.id) {
      navigate(`/results/${history[0].id}`)
      return
    }
    navigate('/upload')
  }

  const navLinks = [
    { label: 'Overview', path: '/dashboard' },
    { label: 'Fleet', path: '/substations' },
    { label: 'Upload', path: '/upload' },
    { label: 'Analyses', path: '#', onClick: handleAnalyses },
  ]

  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 40,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
        height: '60px',
        backgroundColor: isDark ? '#111827' : '#FFFFFF',
        borderBottom: `1px solid ${isDark ? '#1F2937' : '#E2E8F0'}`,
        color: isDark ? '#F9FAFB' : '#0F172A',
        transition: 'background-color 0.3s ease, border-color 0.3s ease, color 0.3s ease',
      }}
    >
      {/* Brand & Standard Tag */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <button
          onClick={() => navigate('/')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: 0,
            color: 'inherit',
          }}
        >
          <div style={{
            width: '28px',
            height: '28px',
            borderRadius: '6px',
            background: '#0284C7',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#FFFFFF',
            fontWeight: 800,
            fontSize: '14px',
          }}>
            ⚡
          </div>
          <span style={{ fontSize: '17px', fontWeight: 800, letterSpacing: '-0.02em' }}>
            Intelli<span style={{ color: '#0284C7' }}>FRA</span>
          </span>
        </button>

        <span style={{
          padding: '2px 8px',
          borderRadius: '4px',
          background: isDark ? '#1F2937' : '#F1F5F9',
          border: `1px solid ${isDark ? '#374151' : '#CBD5E1'}`,
          fontSize: '11px',
          fontWeight: 700,
          color: isDark ? '#9CA3AF' : '#475569',
          fontFamily: "'JetBrains Mono', monospace",
        }}>
          CEA / IS 2026
        </span>
      </div>

      {/* Nav links with active pill highlighting */}
      <nav style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        {navLinks.map(({ label, path, onClick }) => {
          const isActive = location.pathname === path

          return (
            <button
              key={label}
              onClick={onClick || (() => navigate(path))}
              style={{
                padding: '6px 16px',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: isActive ? 700 : 500,
                background: isActive
                  ? (isDark ? '#1E293B' : '#E0F2FE')
                  : 'transparent',
                border: isActive
                  ? `1px solid ${isDark ? '#0284C7' : '#BAE6FD'}`
                  : '1px solid transparent',
                color: isActive
                  ? (isDark ? '#38BDF8' : '#0284C7')
                  : (isDark ? '#9CA3AF' : '#475569'),
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={e => {
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = isDark ? '#1F2937' : '#F1F5F9'
                  e.currentTarget.style.color = isDark ? '#FFFFFF' : '#0F172A'
                }
              }}
              onMouseLeave={e => {
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = 'transparent'
                  e.currentTarget.style.color = isDark ? '#9CA3AF' : '#475569'
                }
              }}
            >
              {label}
            </button>
          )
        })}
      </nav>

      {/* Right controls: Senior toggle, Theme toggle & User profile */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        {/* Senior Field Mode Toggle */}
        <button
          onClick={toggleSeniorMode}
          title={seniorMode ? 'Disable Senior Mode' : 'Enable Senior Field Mode (Aa+ Large Font, High Contrast)'}
          style={{
            padding: '6px 12px',
            borderRadius: '6px',
            background: seniorMode ? '#0284C7' : (isDark ? '#1F2937' : '#F1F5F9'),
            border: `1.5px solid ${seniorMode ? '#0284C7' : (isDark ? '#374151' : '#CBD5E1')}`,
            color: seniorMode ? '#FFFFFF' : (isDark ? '#F3F4F6' : '#1E293B'),
            fontSize: '12px',
            fontWeight: 800,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
          }}
        >
          <span>👁️ Aa+</span>
          <span style={{ fontSize: '11px', display: 'inline-block' }}>{seniorMode ? 'Senior ON' : 'Senior'}</span>
        </button>

        {/* Light/Dark Toggle */}
        <button
          onClick={toggleTheme}
          title={`Switch to ${isDark ? 'Light' : 'Dark'} Mode`}
          style={{
            padding: '6px 12px',
            borderRadius: '6px',
            background: isDark ? '#1F2937' : '#F1F5F9',
            border: `1px solid ${isDark ? '#374151' : '#CBD5E1'}`,
            color: isDark ? '#F3F4F6' : '#1E293B',
            fontSize: '12px',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <span>{isDark ? '☀️ Light' : '🌙 Dark'}</span>
        </button>

        {/* User tag & Logout */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '4px 10px',
          borderRadius: '6px',
          background: isDark ? '#1F2937' : '#F1F5F9',
          border: `1px solid ${isDark ? '#374151' : '#E2E8F0'}`,
        }}>
          <div style={{
            width: '24px',
            height: '24px',
            borderRadius: '4px',
            background: '#0284C7',
            color: '#FFFFFF',
            fontSize: '11px',
            fontWeight: 800,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            {user.name.slice(0, 1).toUpperCase()}
          </div>
          <span style={{ fontSize: '13px', fontWeight: 600 }}>{user.name}</span>
        </div>

        <button
          onClick={onLogout}
          style={{
            padding: '6px 12px',
            borderRadius: '6px',
            background: 'transparent',
            border: `1px solid ${isDark ? '#374151' : '#CBD5E1'}`,
            color: isDark ? '#9CA3AF' : '#64748B',
            fontSize: '12px',
            fontWeight: 600,
            cursor: 'pointer',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.color = '#EF4444'
            e.currentTarget.style.borderColor = '#EF4444'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.color = isDark ? '#9CA3AF' : '#64748B'
            e.currentTarget.style.borderColor = isDark ? '#374151' : '#CBD5E1'
          }}
        >
          Sign Out
        </button>
      </div>
    </header>
  )
}
