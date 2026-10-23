export const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000'

export async function apiRequest(path, { method = 'GET', body, token } = {}) {
  const headers = { 'Content-Type': 'application/json' }
  const effectiveToken = token || localStorage.getItem('token') || 'demo-engineer-session-token'
  if (effectiveToken) headers.Authorization = `Bearer ${effectiveToken}`

  const primaryBase = API_BASE
  const alternateBase = primaryBase.includes('127.0.0.1') ? 'http://localhost:8000' : 'http://127.0.0.1:8000'

  const targetUrls = [
    `${primaryBase}${path}`,
    `${alternateBase}${path}`,
  ]

  let res = null
  let lastErr = null

  for (const url of targetUrls) {
    try {
      res = await fetch(url, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
      })
      if (res.ok || (res.status >= 400 && res.status < 500)) {
        break
      }
    } catch (err) {
      lastErr = err
    }
  }

  if (!res && lastErr) throw lastErr

  const isJson = (res.headers.get('content-type') || '').includes('application/json')
  const data = isJson ? await res.json().catch(() => null) : await res.text().catch(() => null)

  if (!res.ok) {
    const msg = (data && typeof data === 'object' && data.detail) ? data.detail : `Request failed (${res.status})`
    const err = new Error(msg)
    err.status = res.status
    throw err
  }

  return data
}
