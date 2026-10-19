import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { API_BASE } from '../lib/api'

const MAX_FILE_BYTES = 5 * 1024 * 1024
const parseTimestamp = (value) => {
  if (!value) return 0
  if (typeof value === 'number') return value
  const asNumber = Number(value)
  if (Number.isFinite(asNumber) && asNumber > 0) return asNumber
  const asDate = new Date(value).getTime()
  return Number.isFinite(asDate) ? asDate : 0
}

export default function Upload() {
  const navigate = useNavigate()
  const [file, setFile] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const fileLabel = useMemo(() => file?.name || 'Choose CSV, TXT, or Plot Image (PNG/JPG)', [file])

  const onSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!file) {
      setError('Please select a .csv, .txt, .png, or .jpg file')
      return
    }

    const ext = (file.name.split('.').pop() || '').toLowerCase()
    if (!['csv', 'txt', 'png', 'jpg', 'jpeg'].includes(ext)) {
      setError('Only .csv, .txt, .png, or .jpg files are supported')
      return
    }
    if (file.size > MAX_FILE_BYTES) {
      setError('File must be smaller than 5MB')
      return
    }

    const token = localStorage.getItem('token')
    if (!token) {
      navigate('/login', { replace: true })
      return
    }

    setLoading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)

      const res = await fetch(`${API_BASE}/fra/upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      })

      const data = await res.json().catch(() => null)
      if (!res.ok) {
        const msg = data?.detail || 'Upload failed'
        throw new Error(msg)
      }

      try {
        const prev = JSON.parse(localStorage.getItem('fra_history') || '[]')
        const next = [{
          id: data.id,
          filename: data.filename,
          classification: data.classification,
          timestamp: data.timestamp || Date.now(),
        }, ...(Array.isArray(prev) ? prev : [])]
          .filter((item) => item?.id)
          .sort((a, b) => parseTimestamp(b?.timestamp) - parseTimestamp(a?.timestamp))
          .slice(0, 10)
        localStorage.setItem('fra_history', JSON.stringify(next))
        window.dispatchEvent(new CustomEvent('fra-history-updated', { detail: next }))
      } catch {
        // ignore history errors (e.g. storage full)
      }

      navigate(`/results/${data.id}`, { replace: true })
    } catch (err) {
      setError(err?.message || 'Upload failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0B0F1A',
      backgroundImage: 'radial-gradient(rgba(0,212,255,0.04) 1px, transparent 1px)',
      backgroundSize: '40px 40px',
      padding: '28px',
      fontFamily: "'Inter', system-ui, sans-serif",
      color: '#fff',
    }}>
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap', marginBottom: '18px' }}>
          <div>
            <div style={{ fontSize: '12px', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(0,212,255,0.8)', fontWeight: 800 }}>
              FRA Upload
            </div>
            <h1 style={{ fontSize: '28px', fontWeight: 900, letterSpacing: '-0.03em', marginTop: '10px' }}>
              Upload FRA File
            </h1>
            <div style={{ marginTop: '8px', color: 'rgba(255,255,255,0.55)', maxWidth: '560px', lineHeight: 1.65 }}>
              Upload raw sweep files (<span style={{ color: 'rgba(0,212,255,0.9)', fontWeight: 700 }}>.csv</span>, <span style={{ color: 'rgba(0,212,255,0.9)', fontWeight: 700 }}>.txt</span>) or visual plot images (<span style={{ color: 'rgba(0,212,255,0.9)', fontWeight: 700 }}>.png</span>, <span style={{ color: 'rgba(0,212,255,0.9)', fontWeight: 700 }}>.jpg</span>). Optical curve digitization & IEEE C57.149 sub-band analysis run automatically.
            </div>
          </div>

          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            style={{
              padding: '10px 14px',
              borderRadius: '12px',
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.1)',
              color: 'rgba(255,255,255,0.75)',
              cursor: 'pointer',
              fontWeight: 600,
            }}
          >
            ← Back
          </button>
        </div>

        <div style={{
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '24px',
          padding: '28px',
          backdropFilter: 'blur(18px)',
        }}>
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

          <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <div style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.45)', marginBottom: '10px' }}>
                File
              </div>

              <label style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '12px',
                padding: '14px 16px',
                borderRadius: '14px',
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.1)',
                cursor: 'pointer',
              }}>
                <span style={{ color: file ? '#fff' : 'rgba(255,255,255,0.6)', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {fileLabel}
                </span>
                <span style={{ color: 'rgba(0,212,255,0.9)', fontWeight: 800, letterSpacing: '0.02em' }}>
                  Browse
                </span>
                <input
                  type="file"
                  accept=".csv,.txt,.png,.jpg,.jpeg"
                  style={{ display: 'none' }}
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                />
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                marginTop: '6px',
                width: 'fit-content',
                padding: '14px 18px',
                borderRadius: '14px',
                border: 'none',
                cursor: 'pointer',
                fontWeight: 800,
                letterSpacing: '0.02em',
                color: '#fff',
                background: 'linear-gradient(135deg, #00D4FF 0%, #6C63FF 100%)',
                boxShadow: '0 0 24px rgba(0,212,255,0.35), 0 0 48px rgba(108,99,255,0.2)',
                opacity: loading ? 0.75 : 1,
              }}
            >
              {loading ? 'Uploading…' : 'Upload & Analyze →'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

