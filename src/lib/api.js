export const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

export async function apiRequest(path, { method = 'GET', body, token } = {}) {
  const headers = { 'Content-Type': 'application/json' }
  if (token) headers.Authorization = `Bearer ${token}`

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  })

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

