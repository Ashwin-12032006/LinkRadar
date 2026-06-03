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
      <h1 className="text-2xl font-bold mb-4">Settings</h1>
      <form onSubmit={save} className="max-w-lg rounded-xl border border-slate-700 bg-slate-900 p-4 space-y-3">
        <label className="block text-sm">
          Display Name
          <input className="mt-1 w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2" value={name} onChange={(e) => setName(e.target.value)} />
        </label>
        <label className="block text-sm">
          Theme
          <select className="mt-1 w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2" value={theme} onChange={(e) => setTheme(e.target.value)}>
            <option value="dark">Dark</option>
            <option value="light">Light</option>
          </select>
        </label>
        <button className="rounded-lg bg-indigo-500 px-4 py-2 font-semibold">Save</button>
        {message && <p className="text-emerald-400 text-sm">{message}</p>}
      </form>
    </AppLayout>
  )
}
