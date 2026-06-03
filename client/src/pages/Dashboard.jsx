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
          ignoreThreatWarning: form.ignoreThreatWarning,
        },
      })
      setForm({ originalUrl: '', customAlias: '', expiresInDays: '', password: '', ignoreThreatWarning: false })
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
        <section className="lg:col-span-2 space-y-4">
          <div className="rounded-xl border border-indigo-500/40 bg-indigo-950/40 p-4">
            <h2 className="font-semibold text-indigo-200">AI Insights</h2>
            <p className="text-sm text-slate-300 mt-1">
              {summary?.topLink
                ? `Top performer: ${summary.topLink.shortCode} with ${summary.topLink.clickCount} clicks.`
                : 'Create your first smart link to unlock AI insights.'}
            </p>
            <p className="text-sm text-slate-300">Live visitors (last 60s): <strong>{liveCount}</strong> {liveBars}</p>
          </div>

          <form onSubmit={createLink} className="rounded-xl border border-slate-700 bg-slate-900 p-4 space-y-3">
            <h2 className="font-semibold">Create Smart Link</h2>
            <input
              className="w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2"
              placeholder="https://www.amazon.in/product..."
              value={form.originalUrl}
              onChange={(e) => setForm({ ...form, originalUrl: e.target.value })}
              onBlur={analyzeUrl}
              required
            />
            {preview && (
              <div className="rounded-lg border border-slate-600 bg-slate-800 p-3 text-sm">
                <div className="font-semibold text-cyan-300">Category: {preview.category}</div>
                <div className={preview.threat.level === 'warning' ? 'text-amber-300' : 'text-emerald-300'}>
                  {preview.threat.level === 'warning' ? '⚠ Warning: ' : '✓ '}
                  {preview.threat.message}
                </div>
                <div className="mt-2 font-medium">{preview.preview?.title}</div>
                <div className="text-slate-400">{preview.preview?.description}</div>
              </div>
            )}
            <div className="grid md:grid-cols-3 gap-2">
              <input className="rounded-lg border border-slate-600 bg-slate-800 px-3 py-2" placeholder="Custom alias (s24)" value={form.customAlias} onChange={(e) => setForm({ ...form, customAlias: e.target.value })} />
              <input className="rounded-lg border border-slate-600 bg-slate-800 px-3 py-2" placeholder="Expires in days" type="number" value={form.expiresInDays} onChange={(e) => setForm({ ...form, expiresInDays: e.target.value })} />
              <input className="rounded-lg border border-slate-600 bg-slate-800 px-3 py-2" placeholder="Password (optional)" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
            </div>
            <button disabled={status.loading} className="rounded-lg bg-indigo-500 px-4 py-2 font-semibold hover:bg-indigo-400">
              Shorten with AI
            </button>
          </form>

          <div className="rounded-xl border border-slate-700 bg-slate-900 p-4">
            <h3 className="font-semibold mb-2">Bulk URL Shortener (CSV)</h3>
            <input type="file" accept=".csv,text/csv" onChange={uploadBulk} />
            {bulkResult && (
              <p className="text-sm text-emerald-300 mt-2">
                Created {bulkResult.created?.length || 0} links, {bulkResult.failed?.length || 0} failed.
              </p>
            )}
          </div>

          {status.error && <p className="text-red-400">{status.error}</p>}
          {status.success && <p className="text-emerald-400">{status.success}</p>}
        </section>

        <aside>
          <PieChartCard title="URL Categories" items={summary?.categories || []} />
        </aside>
      </div>

      <section className="mt-6 rounded-xl border border-slate-700 bg-slate-900 p-4 overflow-x-auto">
        <h2 className="font-semibold mb-3">Your Smart Links</h2>
        <table className="w-full text-sm">
          <thead className="text-slate-400">
            <tr>
              <th className="text-left p-2">Original</th>
              <th className="text-left p-2">Short URL</th>
              <th className="text-left p-2">Category</th>
              <th className="text-left p-2">Clicks</th>
              <th className="text-left p-2">Status</th>
              <th className="text-left p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {links.map((link) => (
              <tr key={link.id} className="border-t border-slate-800">
                <td className="p-2 max-w-xs truncate">{link.originalUrl}</td>
                <td className="p-2">
                  <a className="text-cyan-300" href={link.shortUrl} target="_blank" rel="noreferrer">{link.shortUrl}</a>
                </td>
                <td className="p-2">{link.category}</td>
                <td className="p-2">{link.clickCount}</td>
                <td className="p-2">{link.status}</td>
                <td className="p-2 flex flex-wrap gap-2">
                  <button onClick={() => navigator.clipboard.writeText(link.shortUrl)} className="rounded bg-slate-700 px-2 py-1">Copy</button>
                  <Link to={`/analytics/${link.id}`} className="rounded bg-indigo-600 px-2 py-1">Analytics</Link>
                  <Link to={`/qr/${link.id}`} className="rounded bg-slate-700 px-2 py-1">QR</Link>
                  <Link to={`/stats/${link.shortCode}`} className="rounded bg-slate-700 px-2 py-1">Public</Link>
                  <button onClick={() => remove(link.id)} className="rounded bg-red-700 px-2 py-1">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </AppLayout>
  )
}
