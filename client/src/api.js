const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000'

export function authHeaders(token) {
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  }
}

export async function apiFetch(path, { token, method = 'GET', body, formData } = {}) {
  const headers = token ? authHeaders(token) : {}
  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers: formData ? { Authorization: headers.Authorization } : body ? headers : token ? { Authorization: headers.Authorization } : {},
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
