const API_URL = import.meta.env.PROD ? '/api' : (import.meta.env.VITE_API_URL || 'http://localhost:5000/api')
const SOCKET_URL = import.meta.env.PROD ? window.location.origin : (import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000')

export function authHeaders(token) {
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  }
}

export async function apiFetch(path, { token, method = 'GET', body, formData } = {}) {
  const headers = { 'bypass-tunnel-reminder': 'true' }
  if (token) headers.Authorization = `Bearer ${token}`
  if (!formData) headers['Content-Type'] = 'application/json'

  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: formData || (body ? JSON.stringify(body) : undefined),
    credentials: 'include',
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    const err = new Error(data.message || 'Request failed')
    err.status = res.status
    err.data = data
    throw err
  }
  return data
}

export { API_URL, SOCKET_URL }
