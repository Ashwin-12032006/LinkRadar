import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { io } from 'socket.io-client'
import { apiFetch, SOCKET_URL } from '../api'
import { useAuth } from '../context/AuthContext'
import { AppLayout } from '../components/Layout'
import { PieChartCard } from '../components/Charts'

export default function Dashboard() {
  const { token, user } = useAuth()
  const [links, setLinks] = useState([])
  const [summary, setSummary] = useState(null)
  const [liveCount, setLiveCount] = useState(0)
  const [liveBars, setLiveBars] = useState('')
  const [form, setForm] = useState({
    originalUrl: '',
    customAlias: '',
    expiresInDays: '',
    password: '',
    isPublicStats: true,
    isSecureShield: false,
    ignoreThreatWarning: false,
  })
  const [preview, setPreview] = useState(null)
  const [status, setStatus] = useState({ loading: false, error: '', success: '' })
  const [bulkResult, setBulkResult] = useState(null)

  const load = async () => {
    const [linksRes, summaryRes] = await Promise.all([
      apiFetch('/links', { token }),
      apiFetch('/links/dashboard/summary', { token }),
    ])
    setLinks(linksRes.links)
    setSummary(summaryRes)
  }

  useEffect(() => {
    load().catch((err) => setStatus({ loading: false, error: err.message, success: '' }))
  }, [token])

  useEffect(() => {
    const socket = io(SOCKET_URL, { transports: ['websocket'] })
    socket.emit('join:user', user?.id)
    socket.on('live:global', (payload) => {
      setLiveCount(payload.liveCount)
      setLiveBars(payload.bars || '')
    })
    socket.on('live:visit', () => load())
    return () => socket.disconnect()
  }, [user?.id])

  const analyzeUrl = async () => {
    if (!form.originalUrl) return
    try {
      const data = await apiFetch('/links/analyze', { token, method: 'POST', body: { originalUrl: form.originalUrl } })
      setPreview(data)
    } catch (err) {
      setStatus((s) => ({ ...s, error: err.message }))
    }
  }

  const createLink = async (e) => {
    e.preventDefault()
    setStatus({ loading: true, error: '', success: '' })
    try {
      await apiFetch('/links', {
        token,
        method: 'POST',
        body: {
          originalUrl: form.originalUrl,
          customAlias: form.customAlias || undefined,
          expiresInDays: form.expiresInDays ? Number(form.expiresInDays) : undefined,
          password: form.password || undefined,
          isPublicStats: form.isPublicStats,
          isSecureShield: form.isSecureShield,
          ignoreThreatWarning: form.ignoreThreatWarning,
        },
      })
      setForm({ originalUrl: '', customAlias: '', expiresInDays: '', password: '', isPublicStats: true, isSecureShield: false, ignoreThreatWarning: false })
      setPreview(null)
      setStatus({ loading: false, error: '', success: 'Smart link created successfully' })
      await load()
    } catch (err) {
      if (err.data?.requiresConfirmation) {
        setStatus({
          loading: false,
          error: `${err.message} Confirm to proceed anyway.`,
          success: '',
        })
        setForm((f) => ({ ...f, ignoreThreatWarning: true }))
      } else {
        setStatus({ loading: false, error: err.message, success: '' })
      }
    }
  }

  const uploadBulk = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const fd = new FormData()
    fd.append('file', file)
    try {
      const data = await apiFetch('/links/bulk', { token, method: 'POST', formData: fd })
      setBulkResult(data)
      await load()
    } catch (err) {
      setStatus((s) => ({ ...s, error: err.message }))
    }
  }

  const remove = async (id) => {
    if (!confirm('Delete this link?')) return
    await apiFetch(`/links/${id}`, { token, method: 'DELETE' })
    await load()
  }

  return (
    <AppLayout>
      <div className="grid lg:grid-cols-3 gap-6">
        <section className="lg:col-span-2 space-y-6">
          {/* AI Insights & Real-time Pulsing */}
          <div className="rounded-2xl border border-emerald-500/20 bg-gradient-to-r from-emerald-950/10 to-teal-950/15 p-5 shadow-lg backdrop-blur-md relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-cyber-mint/5 rounded-full blur-2xl pointer-events-none" />
            <h2 className="font-bold text-base text-slate-100 flex items-center gap-2">
              <span className="flex h-2.5 w-2.5 rounded-full bg-cyber-mint animate-ping" />
              AI Insights Core
            </h2>
            <p className="text-sm text-slate-300 mt-2 leading-relaxed">
              {summary?.topLink
                ? `Top performer is currently "/${summary.topLink.shortCode}" drawing a solid ${summary.topLink.clickCount} clicks.`
                : 'Welcome! Create your first shortened URL link to start generating real-time AI category insights.'}
            </p>
            <div className="mt-4 flex items-center justify-between text-xs border-t border-cyber-border/40 pt-3">
              <span className="text-slate-400 font-semibold uppercase tracking-wider">Live visitors (last 60s)</span>
              <span className="text-cyber-mint font-bold bg-slate-900 px-3 py-1 rounded-full border border-cyber-border">
                {liveCount} {liveBars && `· ${liveBars}`}
              </span>
            </div>
          </div>

          {/* Form to Shorten */}
          <form onSubmit={createLink} className="cyber-panel p-6 space-y-4">
            <h2 className="font-bold text-slate-200">Create Smart Link</h2>
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Destination URL</label>
              <input
                className="w-full rounded-xl border border-cyber-border bg-slate-900/60 px-4 py-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyber-mint/60 transition-colors"
                placeholder="https://www.amazon.in/product..."
                value={form.originalUrl}
                onChange={(e) => setForm({ ...form, originalUrl: e.target.value })}
                onBlur={analyzeUrl}
                required
              />
            </div>

            {preview && (
              <div className="rounded-xl border border-cyber-border bg-slate-900/40 p-4 text-xs space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-slate-400">Classified Category:</span>
                  <span className="rounded-full bg-emerald-950/40 border border-emerald-500/20 px-3 py-0.5 font-bold text-cyber-mint">
                    {preview.category}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 font-bold">
                  {preview.threat.level === 'warning' ? (
                    <span className="text-cyber-orange">⚠ Warning: {preview.threat.message}</span>
                  ) : (
                    <span className="text-emerald-400">✓ Secure: {preview.threat.message}</span>
                  )}
                </div>
                {preview.preview?.title && (
                  <div className="border-t border-cyber-border/40 pt-2 mt-2 space-y-1">
                    <div className="font-bold text-slate-300">{preview.preview.title}</div>
                    <div className="text-slate-500 line-clamp-2 leading-relaxed">{preview.preview.description}</div>
                  </div>
                )}
              </div>
            )}

            <div className="grid sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Custom Alias</label>
                <input
                  className="w-full rounded-xl border border-cyber-border bg-slate-900/60 px-4 py-3 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyber-mint/60 transition-colors"
                  placeholder="Custom alias (e.g. s24)"
                  value={form.customAlias}
                  onChange={(e) => setForm({ ...form, customAlias: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Expiry (Days)</label>
                <input
                  className="w-full rounded-xl border border-cyber-border bg-slate-900/60 px-4 py-3 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyber-mint/60 transition-colors"
                  placeholder="Expires in days"
                  type="number"
                  value={form.expiresInDays}
                  onChange={(e) => setForm({ ...form, expiresInDays: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Password (Optional)</label>
                <input
                  className="w-full rounded-xl border border-cyber-border bg-slate-900/60 px-4 py-3 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyber-mint/60 transition-colors"
                  placeholder="Redirect Password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-6 pt-1">
              <label className="flex items-center gap-2 text-xs font-semibold text-slate-300 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={form.isPublicStats}
                  onChange={(e) => setForm({ ...form, isPublicStats: e.target.checked })}
                  className="rounded border-cyber-border bg-slate-900 text-cyber-mint focus:ring-0 focus:ring-offset-0 h-4 w-4 cursor-pointer"
                />
                Public Stats Portal
              </label>

              <label className="flex items-center gap-2 text-xs font-semibold text-slate-300 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={form.isSecureShield}
                  onChange={(e) => setForm({ ...form, isSecureShield: e.target.checked })}
                  className="rounded border-cyber-border bg-slate-900 text-cyber-mint focus:ring-0 focus:ring-offset-0 h-4 w-4 cursor-pointer"
                />
                Enable Secure Loading Shield
              </label>
            </div>

            <div className="pt-2 flex justify-between items-center gap-4">
              <button
                disabled={status.loading}
                className="rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white px-6 py-3 font-semibold text-xs transition-all duration-300 shadow-md shadow-emerald-500/10 cursor-pointer"
              >
                {status.loading ? 'Shortening...' : 'Shorten with AI'}
              </button>
              {form.ignoreThreatWarning && (
                <span className="text-[10px] text-cyber-orange font-semibold animate-pulse">Threat Bypass Mode Active</span>
              )}
            </div>
          </form>

          {/* Bulk Upload */}
          <div className="cyber-panel p-5 space-y-3">
            <h3 className="font-bold text-slate-200 text-xs uppercase tracking-wider">Bulk URL Shortener (CSV)</h3>
            <div className="flex items-center gap-3">
              <input
                type="file"
                accept=".csv,text/csv"
                onChange={uploadBulk}
                className="text-xs text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-emerald-950 file:text-cyber-mint hover:file:bg-emerald-900 transition-colors cursor-pointer"
              />
            </div>
            {bulkResult && (
              <p className="text-xs text-cyber-mint font-semibold mt-2">
                Processed successfully. Created {bulkResult.created?.length || 0} links, {bulkResult.failed?.length || 0} failed entries.
              </p>
            )}
          </div>

          {status.error && <p className="text-rose-400 text-xs font-semibold">⚠️ {status.error}</p>}
          {status.success && <p className="text-cyber-mint text-xs font-semibold">✓ {status.success}</p>}
        </section>

        {/* Sidebar Analytics Visuals */}
        <aside className="space-y-6">
          <PieChartCard title="URL Category Breakdown" items={summary?.categories || []} />
        </aside>
      </div>

      {/* Smart Links Directory */}
      <section className="mt-8 cyber-panel p-5 overflow-x-auto">
        <h2 className="font-bold mb-4 text-slate-200 text-sm uppercase tracking-wider">Link Registry</h2>
        <table className="w-full text-xs text-left">
          <thead className="text-slate-500 font-bold border-b border-cyber-border/40 uppercase tracking-widest text-[10px]">
            <tr>
              <th className="pb-3 px-3">Target Destination</th>
              <th className="pb-3 px-3">Alias</th>
              <th className="pb-3 px-3">AI Tag</th>
              <th className="pb-3 px-3">Clicks</th>
              <th className="pb-3 px-3 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-cyber-border/40">
            {links.map((link) => (
              <tr key={link.id} className="hover:bg-slate-900/20 transition-colors">
                <td className="py-4 px-3 max-w-xs truncate text-slate-300 font-medium">{link.originalUrl}</td>
                 <td className="py-4 px-3">
                  <div className="flex items-center gap-1.5">
                    <a className="text-cyber-mint hover:underline font-semibold" href={link.shortUrl} target="_blank" rel="noreferrer">
                      /{link.shortCode}
                    </a>
                    {link.isSecureShield && (
                      <span className="text-[11px]" title="Secure Loading Shield Enabled">🛡️</span>
                    )}
                    {link.hasPassword && (
                      <span className="text-[11px]" title="Password Protected">🔒</span>
                    )}
                  </div>
                </td>
                <td className="py-4 px-3">
                  <span className="rounded-full bg-emerald-950/30 border border-emerald-500/10 px-2.5 py-0.5 text-[10px] text-cyber-mint font-semibold">
                    {link.category}
                  </span>
                </td>
                <td className="py-4 px-3 text-slate-200 font-bold">{link.clickCount}</td>
                <td className="py-4 px-3">
                  <div className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 max-w-[150px] sm:max-w-none mx-auto">
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(link.shortUrl)
                        alert('Copied URL to Clipboard!')
                      }}
                      className="rounded-lg bg-slate-900 hover:bg-slate-800 border border-cyber-border px-2.5 py-1.5 text-[10px] font-semibold text-slate-300 cursor-pointer"
                    >
                      Copy
                    </button>
                    <Link
                      to={`/analytics/${link.id}`}
                      className="rounded-lg bg-emerald-600 hover:bg-emerald-500 px-2.5 py-1.5 text-[10px] font-semibold text-white shadow-md shadow-emerald-500/5"
                    >
                      Analytics
                    </Link>
                    <Link
                      to={`/qr/${link.id}`}
                      className="rounded-lg bg-slate-900 hover:bg-slate-800 border border-cyber-border px-2.5 py-1.5 text-[10px] font-semibold text-slate-300"
                    >
                      QR Studio
                    </Link>
                    <Link
                      to={`/stats/${link.shortCode}`}
                      className="rounded-lg bg-slate-900 hover:bg-slate-800 border border-cyber-border px-2.5 py-1.5 text-[10px] font-semibold text-slate-300"
                    >
                      Public
                    </Link>
                    <button
                      onClick={() => remove(link.id)}
                      className="rounded-lg bg-rose-950/40 hover:bg-rose-900/60 border border-rose-900/30 px-2.5 py-1.5 text-[10px] font-semibold text-rose-400 cursor-pointer"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {links.length === 0 && (
              <tr>
                <td colSpan={5} className="py-8 text-center text-slate-500 font-medium">
                  No active smart links recorded. Paste a destination URL above to initialize.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>
    </AppLayout>
  )
}

