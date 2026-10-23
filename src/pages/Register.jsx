import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { apiRequest } from '../lib/api'
import { useTheme } from '../lib/theme'

function PasswordStrength({ password, isDark }) {
  const checks = [
    password.length >= 8,
    /[A-Z]/.test(password),
    /[0-9]/.test(password),
    /[^A-Za-z0-9]/.test(password),
  ]
  const score  = checks.filter(Boolean).length
  const labels = ['Weak', 'Fair', 'Good', 'Strong']
  const colors = ['#EF4444', '#F59E0B', '#10B981', '#0284C7']

  if (!password) return null

  return (
    <div style={{ marginTop: '8px' }}>
      <div style={{ display: 'flex', gap: '4px', marginBottom: '5px' }}>
        {[0,1,2,3].map(i => (
          <div key={i} style={{
            flex: 1, height: '3px', borderRadius: '2px',
            background: i < score ? colors[score - 1] : (isDark ? 'rgba(255,255,255,0.1)' : '#E2E8F0'),
            transition: 'background 0.3s',
          }} />
        ))}
      </div>
      <span style={{ fontSize: '11px', color: score > 0 ? colors[score - 1] : (isDark ? 'rgba(255,255,255,0.35)' : '#94A3B8'), fontWeight: 600 }}>
        {score > 0 ? labels[score - 1] : ''}
      </span>
    </div>
  )
}

function InputField({ label, type = 'text', placeholder, value, onChange, error, extra, isDark }) {
  const [focused, setFocused] = useState(false)
  const [show, setShow] = useState(false)
  const isPass = type === 'password'

  return (
    <div>
      <label style={{
        display: 'block', fontSize: '12px', fontWeight: 700,
        letterSpacing: '0.05em', textTransform: 'uppercase',
        color: isDark ? '#9CA3AF' : '#475569', marginBottom: '8px',
      }}>
        {label}
      </label>
      <div style={{ position: 'relative' }}>
        <input
          type={isPass && !show ? 'password' : isPass ? 'text' : type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          required
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{
            width: '100%',
            padding: isPass ? '12px 42px 12px 14px' : '12px 14px',
            background: isDark ? '#1F2937' : '#F8FAFC',
            border: `1px solid ${error ? '#EF4444' : focused ? '#0284C7' : (isDark ? '#374151' : '#CBD5E1')}`,
            borderRadius: '8px',
            color: isDark ? '#fff' : '#0F172A',
            fontSize: '14px',
            outline: 'none',
            fontFamily: 'inherit',
          }}
        />
        {isPass && (
          <button
            type="button"
            onClick={() => setShow(v => !v)}
            style={{
              position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
              background: 'none', border: 'none', cursor: 'pointer',
              color: isDark ? '#9CA3AF' : '#64748B', padding: '2px', display: 'flex', alignItems: 'center',
            }}
          >
            {show ? '🙈' : '👁️'}
          </button>
        )}
      </div>
      <AnimatePresence>
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            style={{ fontSize: '12px', color: '#EF4444', marginTop: '6px', fontWeight: 600 }}
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>
      {extra}
    </div>
  )
}

export default function Register() {
  const navigate = useNavigate()
  const { isDark, toggleTheme } = useTheme()
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [serverError, setServerError] = useState('')
  const [submitted, setSubmitted] = useState(false)

  // Redirect if already authenticated
  useEffect(() => {
    const token = localStorage.getItem('token')
    if (token) {
      navigate('/dashboard', { replace: true })
    }
  }, [navigate])

  const set = (k) => (e) => {
    setForm((p) => ({ ...p, [k]: e.target.value }))
    if (errors[k]) setErrors((p) => ({ ...p, [k]: '' }))
    if (serverError) setServerError('')
  }

  const validate = () => {
    const errs = {}
    if (!form.name.trim()) errs.name = 'Name is required'
    if (!form.email || !/\S+@\S+\.\S+/.test(form.email)) errs.email = 'Valid email is required'
    if (!form.password || form.password.length < 8) errs.password = 'Password must be at least 8 characters'
    if (form.password !== form.confirm) errs.confirm = 'Passwords do not match'
    return errs
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    setServerError('')
    const errs = validate()
    if (Object.keys(errs).length) {
      setErrors(errs)
      return
    }
    setLoading(true)
    const cleanEmail = form.email.trim().toLowerCase()
    const cleanName = form.name.trim()

    apiRequest('/register', {
      method: 'POST',
      body: { name: cleanName, email: cleanEmail, password: form.password },
    })
      .then(() =>
        apiRequest('/login', {
          method: 'POST',
          body: { email: cleanEmail, password: form.password },
        })
      )
      .then((loginData) => {
        localStorage.setItem('token', loginData.access_token)
        setSubmitted(true)
        setTimeout(() => navigate('/dashboard', { replace: true }), 900)
      })
      .catch((err) => {
        const msg = err?.message || ''
        if (msg.includes('already exists') || err?.status === 409) {
          setServerError('An account already exists with this email address.')
        } else {
          setServerError(msg || 'Registration failed. Check network or server status.')
        }
      })
      .finally(() => setLoading(false))
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
      padding: '40px 24px',
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
          maxWidth: '460px',
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
        {/* Logo */}
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
            Register Engineering Account
          </h1>
          <p style={{ fontSize: '14px', color: isDark ? 'rgba(255,255,255,0.5)' : '#64748B', lineHeight: 1.5 }}>
            Access Transformer AI Diagnostic Cockpit & Substation Radar
          </p>
        </div>

        {serverError ? (
          <div style={{
            marginBottom: '18px',
            padding: '12px 14px',
            borderRadius: '8px',
            background: 'rgba(239,68,68,0.12)',
            border: '1px solid #EF4444',
            color: '#EF4444',
            fontSize: '13px',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '8px',
          }}>
            <span>⚠️ {serverError}</span>
            {serverError.includes('already exists') && (
              <button
                type="button"
                onClick={() => navigate('/login')}
                style={{
                  padding: '4px 10px',
                  borderRadius: '4px',
                  backgroundColor: '#EF4444',
                  color: '#FFFFFF',
                  border: 'none',
                  fontSize: '11px',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Sign In Instead →
              </button>
            )}
          </div>
        ) : null}

        {/* Success state */}
        <AnimatePresence>
          {submitted && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              style={{
                padding: '14px 18px', borderRadius: '8px', marginBottom: '20px',
                background: 'rgba(2,132,199,0.12)', border: '1px solid #0284C7',
                display: 'flex', alignItems: 'center', gap: '10px',
                color: '#0284C7', fontWeight: 700, fontSize: '14px',
              }}
            >
              <span>⚡</span>
              <span>Account successfully verified! Redirecting to Cockpit…</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Form */}
        <form onSubmit={handleSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <InputField
            label="Full Name"
            type="text"
            placeholder="Substation Engineer"
            value={form.name}
            onChange={set('name')}
            error={errors.name}
            isDark={isDark}
          />

          <InputField
            label="Utility Email"
            type="email"
            placeholder="engineer@msetcl.in"
            value={form.email}
            onChange={set('email')}
            error={errors.email}
            isDark={isDark}
          />

          <InputField
            label="Password"
            type="password"
            placeholder="••••••••"
            value={form.password}
            onChange={set('password')}
            error={errors.password}
            extra={<PasswordStrength password={form.password} isDark={isDark} />}
            isDark={isDark}
          />

          <InputField
            label="Confirm Password"
            type="password"
            placeholder="••••••••"
            value={form.confirm}
            onChange={set('confirm')}
            error={errors.confirm}
            isDark={isDark}
          />

          {/* Submit */}
          <motion.button
            type="submit"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            disabled={loading}
            style={{
              marginTop: '4px',
              width: '100%', padding: '13px',
              background: '#0284C7',
              border: 'none', borderRadius: '8px',
              color: '#fff', fontWeight: 700, fontSize: '14px',
              cursor: 'pointer',
              opacity: loading ? 0.75 : 1,
            }}
          >
            {loading ? 'Creating Profile…' : 'Create Engineering Account →'}
          </motion.button>
        </form>

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
            to="/login"
            style={{ color: '#0284C7', fontWeight: 700, textDecoration: 'none' }}
          >
            Already have an account? Sign In
          </Link>
        </div>
      </motion.div>
    </div>
  )
}
