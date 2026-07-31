import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { apiRequest } from '../lib/api'

export default function Login() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [showPass, setShowPass] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const set = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }))

  const handleSubmit = (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    apiRequest('/login', { method: 'POST', body: { email: form.email, password: form.password } })
      .then((data) => {
        localStorage.setItem('token', data.access_token)
        navigate('/dashboard', { replace: true })
      })
      .catch((err) => setError(err?.message || 'Login failed'))
      .finally(() => setLoading(false))
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0B0F1A',
      backgroundImage: 'radial-gradient(rgba(0,212,255,0.04) 1px, transparent 1px)',
      backgroundSize: '40px 40px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      fontFamily: "'Inter', system-ui, sans-serif",
      position: 'relative',
      overflow: 'hidden',
    }}>

      {/* ── Background glows ── */}
      <div aria-hidden style={{
        position: 'absolute', top: '20%', left: '50%', transform: 'translate(-50%,-50%)',
        width: '600px', height: '600px', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(108,99,255,0.14) 0%, transparent 65%)',
        filter: 'blur(40px)', pointerEvents: 'none',
      }} />
      <div aria-hidden style={{
        position: 'absolute', top: '60%', left: '50%', transform: 'translate(-50%,-50%)',
        width: '500px', height: '300px', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(0,212,255,0.09) 0%, transparent 65%)',
        filter: 'blur(50px)', pointerEvents: 'none',
      }} />

      {/* ── Card ── */}
      <motion.div
        initial={{ opacity: 0, y: 32 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        style={{
          width: '100%',
          maxWidth: '440px',
          background: 'rgba(255,255,255,0.03)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '24px',
          padding: '48px 40px',
          position: 'relative',
          zIndex: 1,
          boxShadow: '0 0 0 1px rgba(0,212,255,0.05), 0 32px 80px rgba(0,0,0,0.4)',
        }}
      >
        {/* Back */}
        <button
          type="button"
          onClick={() => (window.history.length > 1 ? navigate(-1) : navigate('/'))}
          style={{
            position: 'absolute',
            bottom: '16px',
            left: '16px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 10px',
            borderRadius: '12px',
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.08)',
            color: 'rgba(255,255,255,0.7)',
            cursor: 'pointer',
            fontSize: '13px',
            fontWeight: 600,
            backdropFilter: 'blur(14px)',
          }}
          onMouseEnter={e => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.borderColor = 'rgba(0,212,255,0.28)' }}
          onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.7)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)' }}
        >
          <span aria-hidden style={{ fontSize: '16px', lineHeight: 1 }}>←</span>
          Back
        </button>

        {/* Logo mark */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '36px' }}>
          <div style={{
            width: '34px', height: '34px', borderRadius: '9px',
            background: 'linear-gradient(135deg,#00D4FF,#6C63FF)',
            boxShadow: '0 0 18px rgba(0,212,255,0.5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none">
              <path d="M12 2L2 7l10 5 10-5-10-5z" stroke="#fff" strokeWidth="1.6" strokeLinejoin="round"/>
              <path d="M2 17l10 5 10-5M2 12l10 5 10-5" stroke="#fff" strokeWidth="1.6" strokeLinejoin="round"/>
            </svg>
          </div>
          <span style={{ fontSize: '18px', fontWeight: 800, color: '#fff' }}>
            Intelli<span style={{ color: '#00D4FF' }}>FRA</span>
          </span>
        </div>

        {/* Heading */}
        <div style={{ marginBottom: '32px' }}>
          <h1 style={{ fontSize: '28px', fontWeight: 900, color: '#fff', letterSpacing: '-0.03em', marginBottom: '8px' }}>
            Welcome Back
          </h1>
          <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.42)', lineHeight: 1.6 }}>
            Sign in to your IntelliFRA account
          </p>
        </div>

        {error ? (
          <div style={{
            marginBottom: '18px',
            padding: '12px 14px',
            borderRadius: '12px',
            background: 'rgba(255,60,60,0.08)',
            border: '1px solid rgba(255,60,60,0.22)',
            color: 'rgba(255,160,160,0.95)',
            fontSize: '13px',
          }}>
            {error}
          </div>
        ) : null}

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* Email */}
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.45)', marginBottom: '8px' }}>
              Email
            </label>
            <input
              type="email"
              required
              placeholder="you@company.com"
              value={form.email}
              onChange={set('email')}
              style={{
                width: '100%', padding: '13px 16px',
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '12px',
                color: '#fff', fontSize: '14px',
                outline: 'none', transition: 'border-color 0.2s, box-shadow 0.2s',
                fontFamily: 'inherit',
              }}
              onFocus={e => {
                e.target.style.borderColor = 'rgba(0,212,255,0.55)'
                e.target.style.boxShadow   = '0 0 0 3px rgba(0,212,255,0.1)'
              }}
              onBlur={e => {
                e.target.style.borderColor = 'rgba(255,255,255,0.1)'
                e.target.style.boxShadow   = 'none'
              }}
            />
          </div>

          {/* Password */}
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.45)', marginBottom: '8px' }}>
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
                  width: '100%', padding: '13px 44px 13px 16px',
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '12px',
                  color: '#fff', fontSize: '14px',
                  outline: 'none', transition: 'border-color 0.2s, box-shadow 0.2s',
                  fontFamily: 'inherit',
                }}
                onFocus={e => {
                  e.target.style.borderColor = 'rgba(0,212,255,0.55)'
                  e.target.style.boxShadow   = '0 0 0 3px rgba(0,212,255,0.1)'
                }}
                onBlur={e => {
                  e.target.style.borderColor = 'rgba(255,255,255,0.1)'
                  e.target.style.boxShadow   = 'none'
                }}
              />
              <button
                type="button"
                onClick={() => setShowPass(v => !v)}
                style={{
                  position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: 'rgba(255,255,255,0.35)', padding: '2px',
                  display: 'flex', alignItems: 'center',
                }}
              >
                {showPass
                  ? <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                  : <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                }
              </button>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
              <button type="button" style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '12px', color: '#00D4FF', padding: 0 }}>
                Forgot password?
              </button>
            </div>
          </div>

          {/* Submit */}
          <motion.button
            type="submit"
            whileHover={{ scale: 1.025 }}
            whileTap={{ scale: 0.97 }}
            disabled={loading}
            style={{
              marginTop: '8px',
              width: '100%', padding: '14px',
              background: 'linear-gradient(135deg, #00D4FF 0%, #6C63FF 100%)',
              border: 'none', borderRadius: '12px',
              color: '#fff', fontWeight: 700, fontSize: '15px',
              cursor: 'pointer', letterSpacing: '0.02em',
              boxShadow: '0 0 24px rgba(0,212,255,0.4), 0 0 48px rgba(108,99,255,0.2)',
              transition: 'box-shadow 0.3s',
              fontFamily: 'inherit',
              opacity: loading ? 0.75 : 1,
            }}
            onMouseEnter={e => e.currentTarget.style.boxShadow = '0 0 36px rgba(0,212,255,0.65), 0 0 70px rgba(108,99,255,0.35)'}
            onMouseLeave={e => e.currentTarget.style.boxShadow = '0 0 24px rgba(0,212,255,0.4), 0 0 48px rgba(108,99,255,0.2)'}
          >
            {loading ? 'Signing In…' : 'Sign In →'}
          </motion.button>
        </form>

        {/* Divider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '24px 0' }}>
          <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.08)' }} />
          <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.28)', whiteSpace: 'nowrap' }}>or continue with</span>
          <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.08)' }} />
        </div>

        {/* OAuth placeholder */}
        <button
          type="button"
          style={{
            width: '100%', padding: '12px',
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '12px',
            color: 'rgba(255,255,255,0.75)', fontSize: '14px', fontWeight: 500,
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
            transition: 'background 0.2s, border-color 0.2s',
            fontFamily: 'inherit',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.18)' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)' }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
          Continue with Google
        </button>

        {/* Footer link */}
        <p style={{ textAlign: 'center', marginTop: '28px', fontSize: '14px', color: 'rgba(255,255,255,0.38)' }}>
          Don't have an account?{' '}
          <Link
            to="/register"
            style={{ color: '#00D4FF', fontWeight: 600, textDecoration: 'none', transition: 'color 0.2s' }}
            onMouseEnter={e => e.currentTarget.style.color = '#40E0FF'}
            onMouseLeave={e => e.currentTarget.style.color = '#00D4FF'}
          >
            Create one
          </Link>
        </p>
      </motion.div>
    </div>
  )
}

