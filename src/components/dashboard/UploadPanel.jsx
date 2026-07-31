import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useState } from 'react'

export default function UploadPanel() {
  const navigate = useNavigate()
  const [dragging, setDragging] = useState(false)
  const latestResultId = (() => {
    try {
      const raw = JSON.parse(localStorage.getItem('fra_history') || '[]')
      return Array.isArray(raw) && raw[0]?.id ? raw[0].id : null
    } catch {
      return null
    }
  })()

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
      style={{
        borderRadius: '20px',
        background: 'rgba(255,255,255,0.025)',
        border: `1px solid ${dragging ? 'rgba(0,212,255,0.6)' : 'rgba(0,212,255,0.12)'}`,
        backdropFilter: 'blur(20px)',
        padding: '36px',
        position: 'relative',
        overflow: 'hidden',
        transition: 'border-color 0.25s, box-shadow 0.25s',
        boxShadow: dragging ? '0 0 40px rgba(0,212,255,0.18), inset 0 0 40px rgba(0,212,255,0.06)' : 'none',
      }}
      onDragOver={e => { e.preventDefault(); setDragging(true) }}
      onDragLeave={() => setDragging(false)}
      onDrop={e => { e.preventDefault(); setDragging(false); navigate('/upload') }}
    >
      {/* Background gradient */}
      <div aria-hidden style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: 'radial-gradient(ellipse at 50% 0%, rgba(0,212,255,0.07) 0%, transparent 60%)',
      }} />
      {/* Subtle grid */}
      <div aria-hidden style={{
        position: 'absolute', inset: 0, pointerEvents: 'none', opacity: 0.12,
        backgroundImage: 'linear-gradient(rgba(0,212,255,0.15) 1px,transparent 1px),linear-gradient(90deg,rgba(0,212,255,0.15) 1px,transparent 1px)',
        backgroundSize: '40px 40px',
        maskImage: 'radial-gradient(ellipse at 50% 0%, black 0%, transparent 70%)',
        WebkitMaskImage: 'radial-gradient(ellipse at 50% 0%, black 0%, transparent 70%)',
      }} />

      <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: '40px' }}>
        <div
          style={{
            flex: '0 0 220px',
            height: '160px',
            borderRadius: '16px',
            border: `2px dashed ${dragging ? 'rgba(0,212,255,0.8)' : 'rgba(0,212,255,0.25)'}`,
            background: dragging ? 'rgba(0,212,255,0.08)' : 'rgba(0,212,255,0.03)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '10px',
            transition: 'all 0.25s',
            cursor: 'pointer',
          }}
          onClick={() => navigate('/upload')}
        >
          <motion.div
            animate={{ y: dragging ? -6 : [0, -4, 0] }}
            transition={{ duration: dragging ? 0.2 : 2.5, repeat: dragging ? 0 : Infinity, ease: 'easeInOut' }}
          >
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke={dragging ? '#00D4FF' : 'rgba(0,212,255,0.6)'} strokeWidth="1.5">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </motion.div>
          <span style={{ fontSize: '12px', color: dragging ? '#00D4FF' : 'rgba(255,255,255,0.4)', fontWeight: 500, textAlign: 'center', lineHeight: 1.4 }}>
            {dragging ? 'Drop to upload' : 'Drop FRA file here'}
          </span>
          <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.22)' }}>CSV / TXT</span>
        </div>

        <div style={{ flex: 1 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '7px',
            padding: '4px 14px', borderRadius: '100px', marginBottom: '14px',
            background: 'rgba(0,212,255,0.08)', border: '1px solid rgba(0,212,255,0.2)',
            fontSize: '11px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#00D4FF',
          }}>
            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#00D4FF', boxShadow: '0 0 6px #00D4FF', animation: 'pulse-dot 2s infinite' }} />
            AI Analysis Ready
          </div>

          <h2 style={{ fontSize: '22px', fontWeight: 900, color: '#fff', letterSpacing: '-0.02em', marginBottom: '8px', lineHeight: 1.2 }}>
            Upload FRA Measurement File
          </h2>
          <p style={{ fontSize: '13.5px', color: 'rgba(255,255,255,0.45)', lineHeight: 1.7, marginBottom: '28px', maxWidth: '420px' }}>
            Upload your Frequency Response Analysis data from any device manufacturer.
            Our AI engine will classify faults and generate a full diagnostic report in seconds.
          </p>

          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate('/upload')}
              style={{
                padding: '13px 28px', borderRadius: '12px', fontSize: '14px', fontWeight: 700,
                background: 'linear-gradient(135deg,#00D4FF,#6C63FF)',
                border: 'none', color: '#fff', cursor: 'pointer', fontFamily: 'inherit',
                boxShadow: '0 0 24px rgba(0,212,255,0.45), 0 0 48px rgba(108,99,255,0.2)',
                display: 'flex', alignItems: 'center', gap: '8px',
                letterSpacing: '0.02em',
              }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Upload FRA File
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate(latestResultId ? `/results/${latestResultId}` : '/upload')}
              style={{
                padding: '13px 24px', borderRadius: '12px', fontSize: '14px', fontWeight: 600,
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.12)',
                color: 'rgba(255,255,255,0.75)', cursor: 'pointer', fontFamily: 'inherit',
                display: 'flex', alignItems: 'center', gap: '8px',
                transition: 'all 0.2s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = '#fff' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = 'rgba(255,255,255,0.75)' }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" strokeLinecap="round" strokeLinejoin="round"/>
                <polyline points="14,2 14,8 20,8" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              View Reports
            </motion.button>
          </div>
        </div>

        <div style={{ flex: '0 0 auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {[
            { label: 'Avg Processing', value: '1.8s' },
            { label: 'Supported Formats', value: '12+' },
            { label: 'Accuracy Rate', value: '99.2%' },
          ].map((s) => (
            <div key={s.label} style={{
              padding: '14px 20px', borderRadius: '12px',
              background: 'rgba(0,212,255,0.05)', border: '1px solid rgba(0,212,255,0.1)',
              textAlign: 'center', minWidth: '120px',
            }}>
              <div style={{ fontSize: '20px', fontWeight: 900, color: '#00D4FF', lineHeight: 1 }}>{s.value}</div>
              <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.38)', marginTop: '4px', letterSpacing: '0.04em' }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  )
}

