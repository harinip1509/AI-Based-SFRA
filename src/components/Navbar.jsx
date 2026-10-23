import { useNavigate } from 'react-router-dom'
import { useTheme } from '../lib/theme'

export default function Navbar() {
  const navigate = useNavigate()
  const { toggleTheme, isDark, seniorMode, toggleSeniorMode } = useTheme()
  const hasToken = () => Boolean(localStorage.getItem('token'))

  const sectionLinks = [
    { label: 'Capabilities', href: '#features' },
    { label: 'Architecture', href: '#process' },
    { label: 'Technology', href: '#technology' },
    { label: 'About', href: '#about' },
  ]

  return (
    <nav
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 32px',
        height: '62px',
        backgroundColor: isDark ? 'rgba(17, 24, 39, 0.95)' : 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(10px)',
        borderBottom: `1px solid ${isDark ? '#1F2937' : '#E2E8F0'}`,
        color: isDark ? '#F9FAFB' : '#0F172A',
        transition: 'background-color 0.3s ease, border-color 0.3s ease, color 0.3s ease',
      }}
    >
      {/* Brand */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }} onClick={() => navigate('/')}>
        <div style={{
          width: '30px',
          height: '30px',
          borderRadius: '6px',
          background: '#0284C7',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#FFFFFF',
          fontWeight: 800,
          fontSize: '15px',
        }}>
          ⚡
        </div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontSize: '18px', fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1.1 }}>
            Intelli<span style={{ color: '#0284C7' }}>FRA</span>
          </span>
          <span style={{ fontSize: '10px', color: isDark ? '#9CA3AF' : '#64748B', fontWeight: 600, letterSpacing: '0.04em' }}>
            CEA / IS 2026 SUBSTATION ASSET PLATFORM
          </span>
        </div>
      </div>

      {/* Public Landing Section Anchor Links */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {sectionLinks.map(({ label, href }) => (
          <a
            key={label}
            href={href}
            style={{
              padding: '7px 14px',
              borderRadius: '6px',
              background: 'transparent',
              fontSize: '13px',
              fontWeight: 600,
              color: isDark ? '#D1D5DB' : '#475569',
              textDecoration: 'none',
              cursor: 'pointer',
              transition: 'color 0.15s ease',
            }}
            onMouseEnter={e => e.currentTarget.style.color = '#0284C7'}
            onMouseLeave={e => e.currentTarget.style.color = isDark ? '#D1D5DB' : '#475569'}
          >
            {label}
          </a>
        ))}
      </div>

      {/* Actions: Senior Mode, Theme Toggle, Login & Sign Up */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        {/* Senior Mode Toggle (Aa+ / 👁️) */}
        <button
          onClick={toggleSeniorMode}
          title={seniorMode ? 'Disable Senior Field Mode' : 'Enable Senior Field Mode (High-contrast, +20% font scaling for field inspection)'}
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

        {/* Theme Toggle */}
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
          }}
        >
          {isDark ? '☀️ Light' : '🌙 Dark'}
        </button>

        <button
          onClick={() => navigate('/login')}
          style={{
            padding: '7px 14px',
            borderRadius: '6px',
            background: 'transparent',
            border: `1px solid ${isDark ? '#374151' : '#CBD5E1'}`,
            color: isDark ? '#E5E7EB' : '#1E293B',
            fontSize: '13px',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Sign In
        </button>

        <button
          onClick={() => navigate('/register')}
          style={{
            padding: '7px 16px',
            borderRadius: '6px',
            background: '#0284C7',
            border: 'none',
            color: '#FFFFFF',
            fontSize: '13px',
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          Create Account
        </button>
      </div>
    </nav>
  )
}
