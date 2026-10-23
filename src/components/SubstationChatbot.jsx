import { useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { API_BASE } from '../lib/api'
import { useTheme } from '../lib/theme'

const DEFAULT_SUGGESTIONS = [
  'Why did mid-frequency CCF drop below 0.95?',
  'How to distinguish bad earthing from real winding deformation?',
  'What are the IS 10593 DGA limits for 400 kV transformers?',
  'What does CEA mandate after through-fault current stress?',
  'Explain the 3 IEEE C57.149 sub-bands and their physical parameters',
]

export default function SubstationChatbot() {
  const { isDark } = useTheme()
  const location = useLocation()
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      text: '👋 **IntelliFRA Substation Diagnostic Copilot** initialized.\n\nI am calibrated on **IEEE C57.149-2012**, **IS 2026 (Part 1-5)**, **IS 10593**, and **Central Electricity Authority (CEA)** technical standards.\n\nAsk me about SFRA pole deviations, through-fault stress, DGA gas limits, or click any prompt below.',
      references: ['IEEE C57.149', 'IS 2026', 'IS 10593', 'CEA Regulations'],
    },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [activeContext, setActiveContext] = useState(null)
  const [copiedIndex, setCopiedIndex] = useState(null)
  const messagesEndRef = useRef(null)

  // Listen for active transformer telemetry when on /results/:id
  useEffect(() => {
    const handleTelemetry = (e) => {
      if (e?.detail) setActiveContext(e.detail)
    }
    window.addEventListener('fra-active-telemetry', handleTelemetry)
    return () => window.removeEventListener('fra-active-telemetry', handleTelemetry)
  }, [])

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, isOpen])

  const sendMessage = async (textToSend) => {
    const query = (textToSend || input).trim()
    if (!query || loading) return

    const newMessages = [...messages, { role: 'user', text: query }]
    setMessages(newMessages)
    setInput('')
    setLoading(true)

    const token = localStorage.getItem('token') || 'demo-engineer-session-token'
    const payload = {
      message: query,
      history: newMessages.map((m) => ({ role: m.role, text: m.text })),
      context: activeContext,
    }

    const candidateBases = [
      API_BASE,
      'http://127.0.0.1:8000',
      'http://localhost:8000',
    ].filter(Boolean)
    const uniqueBases = Array.from(new Set(candidateBases))

    let result = null
    for (const base of uniqueBases) {
      try {
        const res = await fetch(`${base}/fra/assistant/chat`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        })
        if (res.ok) {
          result = await res.json()
          break
        }
      } catch {
        // try next endpoint
      }
    }

    if (result && result.reply) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: result.reply,
          references: result.references || [],
          suggestedFollowups: result.suggested_followups || [],
        },
      ])
    } else {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: '⚠️ **Communication Alert**: Substation diagnostic core temporarily disconnected. Per IEEE C57.149, check local grounding or verify API service port 8000.',
          references: ['IEEE C57.149'],
        },
      ])
    }
    setLoading(false)
  }

  const handleCopy = (text, idx) => {
    navigator.clipboard.writeText(text)
    setCopiedIndex(idx)
    setTimeout(() => setCopiedIndex(null), 2000)
  }

  // Theme palettes
  const botBg = isDark ? '#111827' : '#FFFFFF'
  const botBorder = isDark ? '#1F2937' : '#E2E8F0'
  const headerBg = isDark ? '#0B0F19' : '#F1F5F9'
  const msgUserBg = isDark ? '#0284C7' : '#0284C7'
  const msgBotBg = isDark ? '#1F2937' : '#F8FAFC'
  const textMain = isDark ? '#F9FAFB' : '#0F172A'
  const textMuted = isDark ? '#9CA3AF' : '#64748B'
  const inputBg = isDark ? '#1F2937' : '#FFFFFF'
  const inputBorder = isDark ? '#374151' : '#CBD5E1'

  // Format assistant message markdown basics
  const renderFormattedText = (raw) => {
    const lines = raw.split('\n')
    return lines.map((line, idx) => {
      if (line.startsWith('### ')) {
        return (
          <h4 key={idx} style={{ fontSize: '14px', fontWeight: 800, margin: '8px 0 4px', color: '#0284C7' }}>
            {line.replace('### ', '')}
          </h4>
        )
      }
      if (line.startsWith('#### ')) {
        return (
          <h5 key={idx} style={{ fontSize: '13px', fontWeight: 700, margin: '6px 0 2px' }}>
            {line.replace('#### ', '')}
          </h5>
        )
      }
      if (line.startsWith('- ')) {
        return (
          <li key={idx} style={{ marginLeft: '16px', marginBottom: '3px' }}>
            {line.replace('- ', '')}
          </li>
        )
      }
      if (line.trim() === '') {
        return <div key={idx} style={{ height: '6px' }} />
      }
      return <p key={idx} style={{ margin: '3px 0' }}>{line}</p>
    })
  }

  return (
    <>
      {/* Floating Launcher Pill */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '12px 18px',
            borderRadius: '9999px',
            backgroundColor: isDark ? '#111827' : '#FFFFFF',
            color: textMain,
            border: `1.5px solid ${isDark ? '#0284C7' : '#0284C7'}`,
            boxShadow: isDark
              ? '0 10px 30px rgba(0, 0, 0, 0.5), 0 0 15px rgba(2, 132, 199, 0.3)'
              : '0 10px 25px rgba(2, 132, 199, 0.25)',
            cursor: 'pointer',
            transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
            fontWeight: 700,
            fontSize: '13px',
          }}
          className="hover:scale-105 active:scale-95"
        >
          <span style={{
            display: 'inline-block',
            width: '10px',
            height: '10px',
            borderRadius: '50%',
            backgroundColor: '#10B981',
            boxShadow: '0 0 8px #10B981',
          }} />
          <span>⚡ Substation Copilot (AI)</span>
          {activeContext && (
            <span style={{
              fontSize: '10px',
              padding: '2px 6px',
              borderRadius: '4px',
              backgroundColor: '#EF4444',
              color: '#FFFFFF',
              fontWeight: 800,
            }}>
              Asset Linked
            </span>
          )}
        </button>
      )}

      {/* Floating Chat Modal */}
      {isOpen && (
        <div
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            width: '420px',
            maxWidth: 'calc(100vw - 32px)',
            height: '620px',
            maxHeight: 'calc(100vh - 48px)',
            zIndex: 10000,
            backgroundColor: botBg,
            border: `1px solid ${botBorder}`,
            borderRadius: '16px',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            boxShadow: isDark
              ? '0 25px 50px -12px rgba(0, 0, 0, 0.7), 0 0 30px rgba(2, 132, 199, 0.2)'
              : '0 20px 40px -12px rgba(0, 0, 0, 0.15)',
            transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: '14px 16px',
              backgroundColor: headerBg,
              borderBottom: `1px solid ${botBorder}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                backgroundColor: '#0284C7',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#FFFFFF',
                fontWeight: 900,
                fontSize: '15px',
              }}>
                ⚡
              </div>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 800, color: textMain, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  IntelliFRA Copilot
                  <span style={{ fontSize: '10px', color: '#10B981', fontWeight: 700 }}>● Online</span>
                </div>
                <div style={{ fontSize: '11px', color: textMuted }}>
                  IS 2026 / IS 10593 / IEEE C57.149 Specialist
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <button
                onClick={() => setMessages([messages[0]])}
                title="Reset Chat"
                style={{
                  background: 'none',
                  border: 'none',
                  color: textMuted,
                  cursor: 'pointer',
                  padding: '4px',
                  borderRadius: '4px',
                  fontSize: '14px',
                }}
                className="hover:text-red-400"
              >
                🔄
              </button>
              <button
                onClick={() => setIsOpen(false)}
                title="Minimize Copilot"
                style={{
                  background: 'none',
                  border: 'none',
                  color: textMuted,
                  cursor: 'pointer',
                  padding: '4px',
                  borderRadius: '4px',
                  fontSize: '18px',
                  lineHeight: '1',
                }}
                className="hover:text-white"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Active Transformer Banner (Context-Aware) */}
          {activeContext && (
            <div
              style={{
                padding: '8px 14px',
                backgroundColor: isDark ? '#1E293B' : '#E0F2FE',
                borderBottom: `1px solid ${botBorder}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: '11px',
              }}
            >
              <div style={{ color: isDark ? '#38BDF8' : '#0369A1', fontWeight: 700 }}>
                📍 Linked: {activeContext.asset_tag || activeContext.asset_id || 'Active Asset'}
              </div>
              <button
                onClick={() => sendMessage('Diagnose this active transformer based on current test telemetry.')}
                style={{
                  backgroundColor: '#0284C7',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '4px',
                  padding: '3px 8px',
                  fontSize: '10px',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
                className="hover:bg-blue-600"
              >
                Analyze Telemetry
              </button>
            </div>
          )}

          {/* Messages Scroll Area */}
          <div
            style={{
              flex: 1,
              padding: '16px',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            }}
          >
            {messages.map((m, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: m.role === 'user' ? 'flex-end' : 'flex-start',
                }}
              >
                <div
                  style={{
                    maxWidth: '88%',
                    padding: '10px 14px',
                    borderRadius: m.role === 'user' ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
                    backgroundColor: m.role === 'user' ? msgUserBg : msgBotBg,
                    color: m.role === 'user' ? '#FFFFFF' : textMain,
                    border: `1px solid ${m.role === 'user' ? 'transparent' : botBorder}`,
                    fontSize: '12.5px',
                    lineHeight: '1.5',
                  }}
                >
                  {m.role === 'user' ? m.text : renderFormattedText(m.text)}

                  {/* Standards Reference Badges */}
                  {m.references && m.references.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '8px', paddingTop: '6px', borderTop: `1px solid ${botBorder}` }}>
                      {m.references.map((ref, rIdx) => (
                        <span
                          key={rIdx}
                          style={{
                            fontSize: '9.5px',
                            fontWeight: 700,
                            padding: '1px 6px',
                            borderRadius: '3px',
                            backgroundColor: isDark ? '#0B0F19' : '#E2E8F0',
                            color: isDark ? '#38BDF8' : '#0369A1',
                          }}
                        >
                          📜 {ref}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Copy Button */}
                  {m.role === 'assistant' && (
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '6px' }}>
                      <button
                        onClick={() => handleCopy(m.text, idx)}
                        style={{
                          background: 'none',
                          border: 'none',
                          fontSize: '10px',
                          color: textMuted,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '3px',
                        }}
                      >
                        {copiedIndex === idx ? '✓ Copied' : '📋 Copy'}
                      </button>
                    </div>
                  )}
                </div>

                {/* Followup suggestions if available */}
                {m.suggestedFollowups && m.suggestedFollowups.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '6px', maxWidth: '88%' }}>
                    {m.suggestedFollowups.map((f, fIdx) => (
                      <button
                        key={fIdx}
                        onClick={() => sendMessage(f)}
                        style={{
                          fontSize: '10.5px',
                          padding: '4px 8px',
                          borderRadius: '12px',
                          backgroundColor: isDark ? '#1F2937' : '#F1F5F9',
                          border: `1px solid ${botBorder}`,
                          color: isDark ? '#93C5FD' : '#1D4ED8',
                          cursor: 'pointer',
                          textAlign: 'left',
                        }}
                        className="hover:border-blue-400"
                      >
                        💡 {f}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', backgroundColor: msgBotBg, borderRadius: '12px', maxWidth: '70%', border: `1px solid ${botBorder}` }}>
                <span style={{ fontSize: '12px', color: textMuted }}>Diagnostic inference in progress...</span>
                <span className="animate-spin" style={{ display: 'inline-block' }}>⚙️</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompt Chips */}
          <div
            style={{
              padding: '6px 12px',
              overflowX: 'auto',
              whiteSpace: 'nowrap',
              borderTop: `1px solid ${botBorder}`,
              display: 'flex',
              gap: '6px',
            }}
          >
            {DEFAULT_SUGGESTIONS.map((s, idx) => (
              <button
                key={idx}
                onClick={() => sendMessage(s)}
                style={{
                  fontSize: '10.5px',
                  padding: '4px 10px',
                  borderRadius: '12px',
                  backgroundColor: isDark ? '#1F2937' : '#F1F5F9',
                  border: `1px solid ${isDark ? '#374151' : '#CBD5E1'}`,
                  color: textMain,
                  cursor: 'pointer',
                  flexShrink: 0,
                }}
                className="hover:border-blue-400"
              >
                {s}
              </button>
            ))}
          </div>

          {/* Input Bar */}
          <form
            onSubmit={(e) => {
              e.preventDefault()
              sendMessage()
            }}
            style={{
              padding: '12px 14px',
              backgroundColor: headerBg,
              borderTop: `1px solid ${botBorder}`,
              display: 'flex',
              gap: '8px',
            }}
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask IEEE C57.149 or IS 10593 question..."
              style={{
                flex: 1,
                padding: '9px 12px',
                borderRadius: '8px',
                backgroundColor: inputBg,
                border: `1px solid ${inputBorder}`,
                color: textMain,
                fontSize: '12.5px',
                outline: 'none',
              }}
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              style={{
                padding: '9px 16px',
                borderRadius: '8px',
                backgroundColor: '#0284C7',
                color: '#FFFFFF',
                border: 'none',
                fontWeight: 700,
                fontSize: '13px',
                cursor: loading || !input.trim() ? 'not-allowed' : 'pointer',
                opacity: loading || !input.trim() ? 0.6 : 1,
              }}
              className="hover:bg-blue-600 active:scale-95 transition-all"
            >
              Send
            </button>
          </form>
        </div>
      )}
    </>
  )
}
