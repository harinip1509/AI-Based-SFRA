import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { apiRequest } from '../lib/api'

function PasswordStrength({ password }) {
  const checks = [
    password.length >= 8,
    /[A-Z]/.test(password),
    /[0-9]/.test(password),
    /[^A-Za-z0-9]/.test(password),
  ]
  const score  = checks.filter(Boolean).length
  const labels = ['Weak', 'Fair', 'Good', 'Strong']
  const colors = ['#FF4444', '#FF9900', '#FFD700', '#00D4FF']

  if (!password) return null

  return (
    <div style={{ marginTop: '8px' }}>
      <div style={{ display: 'flex', gap: '4px', marginBottom: '5px' }}>
        {[0,1,2,3].map(i => (
          <div key={i} style={{
            flex: 1, height: '3px', borderRadius: '2px',
            background: i < score ? colors[score - 1] : 'rgba(255,255,255,0.1)',
            transition: 'background 0.3s',
          }} />
        ))}
      </div>
      <span style={{ fontSize: '11px', color: score > 0 ? colors[score - 1] : 'rgba(255,255,255,0.35)' }}>
        {score > 0 ? labels[score - 1] : ''}
      </span>
    </div>
  )
}

function InputField({ label, type = 'text', placeholder, value, onChange, error, extra }) {
  const [focused, setFocused] = useState(false)
  const [show, setShow] = useState(false)
  const isPass = type === 'password'

  return (
    <div>
      <label style={{
        display: 'block', fontSize: '12px', fontWeight: 600,
        letterSpacing: '0.05em', textTransform: 'uppercase',
        color: 'rgba(255,255,255,0.45)', marginBottom: '8px',
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
            padding: isPass ? '13px 44px 13px 16px' : '13px 16px',
            background: 'rgba(255,255,255,0.04)',
            border: `1px solid ${error ? 'rgba(255,60,60,0.6)' : focused ? 'rgba(0,212,255,0.55)' : 'rgba(255,255,255,0.1)'}`,
            borderRadius: '12px',
            color: '#fff', fontSize: '14px', outline: 'none',
            boxShadow: error
              ? '0 0 0 3px rgba(255,60,60,0.1)'
              : focused ? '0 0 0 3px rgba(0,212,255,0.1)' : 'none',
            transition: 'border-color 0.2s, box-shadow 0.2s',
            fontFamily: 'inherit',
          }}
        />
        {isPass && (
          <button
            type="button"
            onClick={() => setShow(v => !v)}
            style={{
              position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)',
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'rgba(255,255,255,0.35)', padding: '2px', display: 'flex', alignItems: 'center',
            }}
          >
            {show
              ? <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
              : <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
            }
          </button>
        )}
      </div>
      <AnimatePresence>
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            style={{ fontSize: '12px', color: 'rgba(255,100,100,0.9)', marginTop: '6px' }}
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
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' })
  const [errors, setErrors] = useState({})
  const [submitted, setSubmitted] = useState(false)
  const [serverError, setServerError] = useState('')
  const [loading, setLoading] = useState(false)

  const set = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }))

  const validate = () => {
    const e = {}
    if (!form.name.trim()) e.name = 'Name is required'
    if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Enter a valid email'
    if (form.password.length < 8) {
      e.password = 'At least 8 characters'
    } else if (!/[A-Z]/.test(form.password)) {
      e.password = 'Must contain an uppercase letter'
    } else if (!/[a-z]/.test(form.password)) {
      e.password = 'Must contain a lowercase letter'
    } else if (!/\d/.test(form.password)) {
      e.password = 'Must contain a number'
    } else if (!/[!@#$%^&*()_+]/.test(form.password)) {
      e.password = 'Must contain a special character'
    }
    if (form.confirm !== form.password) e.confirm = 'Passwords do not match'
    return e
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    setServerError('')
    const errs = validate()
    setErrors(errs)
    if (Object.keys(errs).length === 0) {
      setLoading(true)
      apiRequest('/register', { method: 'POST', body: { name: form.name, email: form.email, password: form.password } })
        .then(async () => {
          const loginData = await apiRequest('/login', {
            method: 'POST',
            body: { email: form.email, password: form.password },
          })
          localStorage.setItem('token', loginData.access_token)
          setSubmitted(true)
          setTimeout(() => navigate('/dashboard', { replace: true }), 900)
        })
        .catch((err) => setServerError(err?.message || 'Registration failed'))
        .finally(() => setLoading(false))
    }
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
      padding: '40px 24px',
      fontFamily: "'Inter', system-ui, sans-serif",
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* ── Background glows ── */}
      <div aria-hidden style={{
        position: 'absolute', top: '30%', left: '50%', transform: 'translate(-50%,-50%)',
        width: '700px', height: '500px', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(108,99,255,0.13) 0%, transparent 65%)',
        filter: 'blur(50px)', pointerEvents: 'none',
      }} />
      <div aria-hidden style={{
        position: 'absolute', top: '70%', left: '50%', transform: 'translate(-50%,-50%)',
        width: '500px', height: '300px', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(0,212,255,0.08) 0%, transparent 65%)',
        filter: 'blur(50px)', pointerEvents: 'none',
      }} />

      {/* ── Card ── */}
      <motion.div
        initial={{ opacity: 0, y: 32 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        style={{
          width: '100%',
          maxWidth: '460px',
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

        {/* Logo */}
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
            Create Account
          </h1>
          <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.42)', lineHeight: 1.6 }}>
            Start monitoring your transformers with AI
          </p>
        </div>

        {serverError ? (
          <div style={{
            marginBottom: '18px',
            padding: '12px 14px',
            borderRadius: '12px',
            background: 'rgba(255,60,60,0.08)',
            border: '1px solid rgba(255,60,60,0.22)',
            color: 'rgba(255,160,160,0.95)',
            fontSize: '13px',
          }}>
            {serverError}
          </div>
        ) : null}

        {/* Success state */}
        <AnimatePresence>
          {submitted && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              style={{
                padding: '16px 20px', borderRadius: '12px', marginBottom: '20px',
                background: 'rgba(0,212,255,0.08)', border: '1px solid rgba(0,212,255,0.25)',
                display: 'flex', alignItems: 'center', gap: '10px',
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#00D4FF" strokeWidth="2">
                <path d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span style={{ fontSize: '14px', color: 'rgba(0,212,255,0.9)', fontWeight: 500 }}>
                Account created! Redirecting…
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Form */}
        <form onSubmit={handleSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <InputField
            label="Full Name"
            type="text"
            placeholder="Jane Smith"
            value={form.name}
            onChange={set('name')}
            error={errors.name}
          />

          <InputField
            label="Email"
            type="email"
            placeholder="you@company.com"
            value={form.email}
            onChange={set('email')}
            error={errors.email}
          />

          <InputField
            label="Password"
            type="password"
            placeholder="••••••••"
            value={form.password}
            onChange={set('password')}
            error={errors.password}
            extra={<PasswordStrength password={form.password} />}
          />

          <InputField
            label="Confirm Password"
            type="password"
            placeholder="••••••••"
            value={form.confirm}
            onChange={set('confirm')}
            error={errors.confirm}
          />

          {/* Terms */}
          <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.32)', lineHeight: 1.6, marginTop: '4px' }}>
            By creating an account you agree to our{' '}
            <span style={{ color: '#00D4FF', cursor: 'pointer' }}>Terms of Service</span>{' '}
            and{' '}
            <span style={{ color: '#00D4FF', cursor: 'pointer' }}>Privacy Policy</span>.
          </p>

          {/* Submit */}
          <motion.button
            type="submit"
            whileHover={{ scale: 1.025 }}
            whileTap={{ scale: 0.97 }}
            disabled={loading}
            style={{
              marginTop: '4px',
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
            {loading ? 'Creating…' : 'Create Account →'}
          </motion.button>
        </form>

        {/* Footer link */}
        <p style={{ textAlign: 'center', marginTop: '28px', fontSize: '14px', color: 'rgba(255,255,255,0.38)' }}>
          Already have an account?{' '}
          <Link
            to="/login"
            style={{ color: '#00D4FF', fontWeight: 600, textDecoration: 'none' }}
            onMouseEnter={e => e.currentTarget.style.color = '#40E0FF'}
            onMouseLeave={e => e.currentTarget.style.color = '#00D4FF'}
          >
            Login
          </Link>
        </p>
      </motion.div>
    </div>
  )
}

