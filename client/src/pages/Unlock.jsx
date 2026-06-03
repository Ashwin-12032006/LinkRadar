import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { API_URL } from '../api'

export default function Unlock() {
  const { shortCode } = useParams()
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    try {
      const res = await fetch(`${API_URL}/public/unlock/${shortCode}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ password }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Unlock failed')
      window.location.href = data.redirectUrl
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 grid place-items-center px-4">
      <form onSubmit={submit} className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 p-6">
        <h1 className="text-xl font-bold text-white">Password Protected Link</h1>
        <p className="text-slate-400 text-sm mt-1">Enter password to continue to destination.</p>
        <input
          type="password"
          className="mt-4 w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
        <button className="mt-4 w-full rounded-lg bg-indigo-500 py-2 font-semibold">Continue</button>
      </form>
    </div>
  )
}
