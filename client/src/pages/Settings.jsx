import { useState } from 'react'
import { apiFetch } from '../api'
import { useAuth } from '../context/AuthContext'
import { AppLayout } from '../components/Layout'

export default function Settings() {
  const { token, user, theme, setTheme, login } = useAuth()
  const [name, setName] = useState(user?.name || '')
  const [message, setMessage] = useState('')

  const save = async (e) => {
    e.preventDefault()
    const data = await apiFetch('/auth/profile', { token, method: 'PATCH', body: { name, theme } })
    login({ token, user: data.user })
    localStorage.setItem('theme', theme)
    document.documentElement.classList.toggle('dark', theme === 'dark')
    setMessage('Profile updated')
  }

  return (
    <AppLayout>
      <h1 className="text-2xl font-bold bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent border-b border-cyber-border/40 pb-4">
        Settings
      </h1>
      <form onSubmit={save} className="max-w-lg rounded-2xl border border-cyber-border bg-cyber-card/45 p-6 mt-6 space-y-4 shadow-xl">
        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
          Display Name
          <input className="mt-1.5 w-full rounded-xl border border-cyber-border bg-slate-900/60 px-4 py-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyber-mint/60 transition-colors" value={name} onChange={(e) => setName(e.target.value)} />
        </label>
        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
          Theme
          <select className="mt-1.5 w-full rounded-xl border border-cyber-border bg-slate-900 px-3 py-3 text-xs text-slate-100 focus:outline-none focus:border-cyber-mint/60" value={theme} onChange={(e) => setTheme(e.target.value)}>
            <option value="dark">Dark Cyber</option>
            <option value="light">Light Slate</option>
          </select>
        </label>
        <button className="rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white px-6 py-3 font-semibold text-xs transition-all duration-300 shadow-md cursor-pointer">
          Save Settings
        </button>
        {message && <p className="text-cyber-mint text-xs font-semibold">✓ {message}</p>}
      </form>
    </AppLayout>
  )
}
