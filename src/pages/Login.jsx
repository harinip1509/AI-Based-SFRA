import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { apiRequest } from '../lib/api'
import { useTheme } from '../lib/theme'

export default function Login() {
  const navigate = useNavigate()
  const { isDark, toggleTheme } = useTheme()
  const [form, setForm] = useState({ email: '', password: '' })
  const [showPass, setShowPass] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // Redirect if already authenticated
  useEffect(() => {
    const token = localStorage.getItem('token')
    if (token) {
      navigate('/dashboard', { replace: true })
    }
  }, [navigate])

  const set = (k) => (e) => {
    setForm((p) => ({ ...p, [k]: e.target.value }))
    if (error) setError('')
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    setError('')
    const cleanEmail = form.email.trim()
    if (!cleanEmail || !form.password) {
      setError('Please provide your engineer email and password.')
      return
    }

    setLoading(true)
    apiRequest('/login', { method: 'POST', body: { email: cleanEmail, password: form.password } })
      .then((data) => {
        localStorage.setItem('token', data.access_token)
        navigate('/dashboard', { replace: true })
      })
      .catch((err) => {
        setError(err?.message || 'Login failed. Verify your email or use 1-Click Demo Sign-In.')
      })
      .finally(() => setLoading(false))
  }

  const handleDemoLogin = async () => {
    setError('')
    setForm({ email: 'engineer@intellifra.com', password: 'demo123' })
    setLoading(true)
    try {
      const data = await apiRequest('/login', {
        method: 'POST',
        body: { email: 'engineer@intellifra.com', password: 'demo123' },
      })
      localStorage.setItem('token', data.access_token)
      navigate('/dashboard', { replace: true })
    } catch {
      localStorage.setItem('token', 'demo-engineer-session-token')
      navigate('/dashboard', { replace: true })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: isDark ? '#0B0F1A' : '#F8FAFC',
      backgroundImage: isDark
        ? 'radial-gradient(rgba(2,132,199,0.06) 1px, transparent 1px)'
        : 'radial-gradient(rgba(2,132,199,0.08) 1px, transparent 1px)',
      backgroundSize: '40px 40px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
      position: 'relative',
      overflow: 'hidden',
      transition: 'background-color 0.3s ease',
    }}>
      {/* ── Theme switcher top right ── */}
      <div style={{ position: 'absolute', top: '20px', right: '20px', zIndex: 10 }}>
        <button
          type="button"
          onClick={toggleTheme}
          style={{
            padding: '7px 12px',
            borderRadius: '6px',
            background: isDark ? '#1F2937' : '#FFFFFF',
            border: `1px solid ${isDark ? '#374151' : '#CBD5E1'}`,
            color: isDark ? '#F3F4F6' : '#1E293B',
            fontSize: '12px',
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          {isDark ? '☀️ Light' : '🌙 Dark'}
        </button>
      </div>

      {/* ── Card ── */}
      <motion.div
        initial={{ opacity: 0, y: 32 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        style={{
          width: '100%',
          maxWidth: '440px',
          background: isDark ? 'rgba(17, 24, 39, 0.85)' : '#FFFFFF',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          border: `1px solid ${isDark ? '#1F2937' : '#E2E8F0'}`,
          borderRadius: '20px',
          padding: '40px 36px',
          position: 'relative',
          zIndex: 1,
          boxShadow: isDark
            ? '0 0 0 1px rgba(2,132,199,0.08), 0 32px 80px rgba(0,0,0,0.5)'
            : '0 10px 40px rgba(2,132,199,0.08)',
        }}
      >
        {/* Logo mark */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '28px' }}>
          <div style={{
            width: '32px', height: '32px', borderRadius: '8px',
            background: '#0284C7',
            boxShadow: '0 0 16px rgba(2,132,199,0.4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            color: '#FFFFFF', fontWeight: 800, fontSize: '15px',
          }}>
            ⚡
          </div>
          <span style={{ fontSize: '18px', fontWeight: 800, color: isDark ? '#fff' : '#0F172A' }}>
            Intelli<span style={{ color: '#0284C7' }}>FRA</span>
          </span>
        </div>

        {/* Heading */}
        <div style={{ marginBottom: '28px' }}>
          <h1 style={{ fontSize: '26px', fontWeight: 900, color: isDark ? '#fff' : '#0F172A', letterSpacing: '-0.02em', marginBottom: '6px' }}>
            Substation Engineer Sign In
          </h1>
          <p style={{ fontSize: '14px', color: isDark ? 'rgba(255,255,255,0.5)' : '#64748B', lineHeight: 1.5 }}>
            Access Indian Grid Diagnostic Cockpit & CEA Asset Radar
          </p>
        </div>

        {error ? (
          <div style={{
            marginBottom: '18px',
            padding: '12px 14px',
            borderRadius: '8px',
            background: 'rgba(239,68,68,0.12)',
            border: '1px solid #EF4444',
            color: '#EF4444',
            fontSize: '13px',
            fontWeight: 600,
          }}>
            ⚠️ {error}
          </div>
        ) : null}

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* Email */}
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', color: isDark ? '#9CA3AF' : '#475569', marginBottom: '8px' }}>
              Engineer Work Email
            </label>
            <input
              type="email"
              required
              placeholder="engineer@msetcl.in"
              value={form.email}
              onChange={set('email')}
              style={{
                width: '100%', padding: '12px 14px',
                background: isDark ? '#1F2937' : '#F8FAFC',
                border: `1px solid ${isDark ? '#374151' : '#CBD5E1'}`,
                borderRadius: '8px',
                color: isDark ? '#fff' : '#0F172A', fontSize: '14px',
                outline: 'none',
                fontFamily: 'inherit',
              }}
            />
          </div>

          {/* Password */}
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', color: isDark ? '#9CA3AF' : '#475569', marginBottom: '8px' }}>
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPass ? 'text' : 'password'}
                required
                placeholder="••••••••"
                value={form.password}
                onChange={set('password')}
                style={{
                  width: '100%', padding: '12px 42px 12px 14px',
                  background: isDark ? '#1F2937' : '#F8FAFC',
                  border: `1px solid ${isDark ? '#374151' : '#CBD5E1'}`,
                  borderRadius: '8px',
                  color: isDark ? '#fff' : '#0F172A', fontSize: '14px',
                  outline: 'none',
                  fontFamily: 'inherit',
                }}
              />
              <button
                type="button"
                onClick={() => setShowPass(v => !v)}
                style={{
                  position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: isDark ? '#9CA3AF' : '#64748B', padding: '2px',
                  display: 'flex', alignItems: 'center',
                }}
              >
                {showPass ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          {/* Submit */}
          <motion.button
            type="submit"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            disabled={loading}
            style={{
              marginTop: '8px',
              width: '100%', padding: '13px',
              background: '#0284C7',
              border: 'none', borderRadius: '8px',
              color: '#fff', fontWeight: 700, fontSize: '14px',
              cursor: 'pointer',
              opacity: loading ? 0.75 : 1,
            }}
          >
            {loading ? 'Authenticating…' : 'Sign In with Credentials →'}
          </motion.button>
        </form>

        {/* Divider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '20px 0' }}>
          <div style={{ flex: 1, height: '1px', background: isDark ? '#1F2937' : '#E2E8F0' }} />
          <span style={{ fontSize: '11px', color: isDark ? '#6B7280' : '#94A3B8', fontWeight: 700, textTransform: 'uppercase' }}>
            Instant SIH Evaluator Access
          </span>
          <div style={{ flex: 1, height: '1px', background: isDark ? '#1F2937' : '#E2E8F0' }} />
        </div>

        {/* 1-Click Substation Engineer Demo Button */}
        <button
          type="button"
          onClick={handleDemoLogin}
          style={{
            width: '100%',
            padding: '12px',
            background: isDark ? '#1E293B' : '#F1F5F9',
            border: `1.5px solid ${isDark ? '#0284C7' : '#0284C7'}`,
            borderRadius: '8px',
            color: '#0284C7',
            fontSize: '13px',
            fontWeight: 800,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
          }}
        >
          <span>⚡</span>
          <span>1-Click Demo Sign-In (Substation Engineer)</span>
        </button>

        {/* Footer links */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '24px', fontSize: '13px' }}>
          <button
            type="button"
            onClick={() => navigate('/')}
            style={{ background: 'none', border: 'none', color: isDark ? '#9CA3AF' : '#64748B', cursor: 'pointer', fontWeight: 600 }}
          >
            ← Back to Home
          </button>
          <Link
            to="/register"
            style={{ color: '#0284C7', fontWeight: 700, textDecoration: 'none' }}
          >
            Create account
          </Link>
        </div>
      </motion.div>
    </div>
  )
}
