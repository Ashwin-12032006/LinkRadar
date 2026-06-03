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
    <div className="min-h-screen bg-cyber-bg grid place-items-center px-4 relative overflow-hidden font-sans">
      {/* Decorative Glow blobs */}
      <div className="absolute top-[30%] left-[30%] w-[300px] h-[300px] bg-emerald-600/5 rounded-full blur-[100px]" />
      
      <form
        onSubmit={submit}
        className="w-full max-w-md rounded-3xl border border-cyber-border bg-cyber-card/45 p-8 shadow-2xl backdrop-blur-xl relative z-10 space-y-4 text-center"
      >
        <div className="inline-flex h-12 w-12 rounded-2xl bg-emerald-950/20 border border-emerald-500/25 items-center justify-center text-cyber-mint text-xl shadow-lg">
          🔒
        </div>
        <h1 className="text-xl font-bold bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
          Secure Shield Active
        </h1>
        <p className="text-slate-400 text-xs font-medium leading-relaxed">
          The link <span className="text-cyber-mint font-bold">/{shortCode}</span> is password-protected. Provide the decryption key to proceed.
        </p>

        <input
          type="password"
          className="w-full rounded-xl border border-cyber-border bg-slate-900/60 px-4 py-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyber-mint/60 transition-colors"
          placeholder="Enter Passkey"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        
        {error && <p className="text-rose-400 text-xs font-semibold">⚠️ {error}</p>}
        
        <button className="w-full rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white py-3 font-semibold text-xs transition-all duration-300 shadow-md cursor-pointer">
          Verify & Decrypt
        </button>
      </form>
    </div>
  )
}

