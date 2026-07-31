import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'

export default function DashboardNavbar({ user = { name: 'Engineer', email: 'user@intellifra.ai' }, onLogout, history = [] }) {
  const navigate = useNavigate()
  const handleAnalyses = () => {
    if (Array.isArray(history) && history.length > 0 && history[0]?.id) {
      navigate(`/results/${history[0].id}`)
      return
    }
    navigate('/upload')
  }

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 40,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 32px',
        height: '64px',
        background: 'rgba(11,15,26,0.85)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        boxShadow: '0 4px 32px rgba(0,0,0,0.3)',
      }}
    >
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div style={{
          width: '32px', height: '32px', borderRadius: '8px',
          background: 'linear-gradient(135deg,#00D4FF,#6C63FF)',
          boxShadow: '0 0 16px rgba(0,212,255,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          <svg viewBox="0 0 24 24" width="17" height="17" fill="none">
            <path d="M12 2L2 7l10 5 10-5-10-5z" stroke="#fff" strokeWidth="1.6" strokeLinejoin="round"/>
            <path d="M2 17l10 5 10-5M2 12l10 5 10-5" stroke="#fff" strokeWidth="1.6" strokeLinejoin="round"/>
          </svg>
        </div>
        <span style={{ fontSize: '18px', fontWeight: 800, color: '#fff', letterSpacing: '-0.02em' }}>
          Intelli<span style={{ color: '#00D4FF' }}>FRA</span>
        </span>
        <div style={{
          marginLeft: '6px', padding: '3px 10px', borderRadius: '100px',
          background: 'rgba(0,212,255,0.1)', border: '1px solid rgba(0,212,255,0.22)',
          fontSize: '10px', fontWeight: 700, letterSpacing: '0.1em',
          textTransform: 'uppercase', color: '#00D4FF',
        }}>
          Dashboard
        </div>
      </div>

      {/* Center nav links */}
      <nav style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
        {[
          { label: 'Overview', path: '/dashboard', active: true },
          { label: 'Analyses', path: '/dashboard', onClick: handleAnalyses },
          { label: 'Upload', path: '/upload' },
        ].map(({ label, path, active, onClick }) => (
          <button
            key={label}
            onClick={onClick || (() => navigate(path))}
            style={{
              padding: '7px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: 500,
              background: active ? 'rgba(0,212,255,0.1)' : 'transparent',
              border: active ? '1px solid rgba(0,212,255,0.2)' : '1px solid transparent',
              color: active ? '#00D4FF' : 'rgba(255,255,255,0.5)',
              cursor: 'pointer', transition: 'all 0.2s',
              fontFamily: 'inherit',
            }}
            onMouseEnter={e => { if (!active) { e.currentTarget.style.color = '#fff'; e.currentTarget.style.background = 'rgba(255,255,255,0.05)' } }}
            onMouseLeave={e => { if (!active) { e.currentTarget.style.color = 'rgba(255,255,255,0.5)'; e.currentTarget.style.background = 'transparent' } }}
          >
            {label}
          </button>
        ))}
      </nav>

      {/* Right — user + logout */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {/* Notification bell */}
        <button style={{
          width: '36px', height: '36px', borderRadius: '10px',
          background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', position: 'relative', color: 'rgba(255,255,255,0.6)',
          transition: 'all 0.2s',
        }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(0,212,255,0.1)'; e.currentTarget.style.borderColor = 'rgba(0,212,255,0.3)'; e.currentTarget.style.color = '#00D4FF' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = 'rgba(255,255,255,0.6)' }}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <div style={{
            position: 'absolute', top: '7px', right: '7px',
            width: '7px', height: '7px', borderRadius: '50%',
            background: '#FF4444', border: '1.5px solid #0B0F1A',
          }} />
        </button>

        {/* User avatar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '6px 12px 6px 6px', borderRadius: '12px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{
            width: '28px', height: '28px', borderRadius: '8px', flexShrink: 0,
            background: 'linear-gradient(135deg,rgba(0,212,255,0.3),rgba(108,99,255,0.4))',
            border: '1px solid rgba(0,212,255,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '11px', fontWeight: 700, color: '#fff',
          }}>
            {user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
          </div>
          <div>
            <div style={{ fontSize: '12px', fontWeight: 600, color: '#fff', lineHeight: 1.2 }}>{user.name}</div>
            <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.38)', lineHeight: 1.2 }}>{user.email}</div>
          </div>
        </div>

        {/* Logout */}
        <motion.button
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.97 }}
          onClick={onLogout || (() => navigate('/login'))}
          style={{
            padding: '8px 16px', borderRadius: '10px', fontSize: '13px', fontWeight: 600,
            background: 'rgba(255,60,60,0.08)', border: '1px solid rgba(255,60,60,0.2)',
            color: 'rgba(255,120,120,0.85)', cursor: 'pointer', fontFamily: 'inherit',
            display: 'flex', alignItems: 'center', gap: '6px',
            transition: 'all 0.2s',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,60,60,0.15)'; e.currentTarget.style.borderColor = 'rgba(255,60,60,0.4)' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,60,60,0.08)'; e.currentTarget.style.borderColor = 'rgba(255,60,60,0.2)' }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Logout
        </motion.button>
      </div>
    </motion.header>
  )
}

