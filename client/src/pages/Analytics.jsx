import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { io } from 'socket.io-client'
import { apiFetch, SOCKET_URL } from '../api'
import { useAuth } from '../context/AuthContext'
import { AppLayout } from '../components/Layout'
import { PieChartCard, TrendBarChart } from '../components/Charts'

export default function Analytics() {
  const { id } = useParams()
  const { token } = useAuth()
  const [data, setData] = useState(null)
  const [liveCount, setLiveCount] = useState(0)

  const load = async () => {
    const res = await apiFetch(`/links/${id}/analytics`, { token })
    setData(res)
    setLiveCount(res.liveVisitors)
  }

  useEffect(() => {
    load().catch(console.error)
  }, [id, token])

  useEffect(() => {
    if (!id) return
    const socket = io(SOCKET_URL, { transports: ['websocket'] })
    socket.emit('join:link', id)
    socket.on('live:linkCount', (payload) => {
      if (payload.linkId === id) setLiveCount(payload.count)
    })
    socket.on('live:pulse', () => load())
    return () => socket.disconnect()
  }, [id])

  if (!data) return <AppLayout><p className="text-slate-400">Loading analytics...</p></AppLayout>

  const { link, aiInsights, performance, badges, timeline, regions } = data
  const maxRegion = Math.max(...(regions?.map((r) => r.clicks) || [1]), 1)

  return (
    <AppLayout>
      <div className="flex items-center justify-between gap-4 mb-4">
        <div>
          <h1 className="text-2xl font-bold">Analytics — {link.shortCode}</h1>
          <p className="text-slate-400 text-sm truncate max-w-2xl">{link.originalUrl}</p>
        </div>
        <Link to="/dashboard" className="text-indigo-300 text-sm">← Back</Link>
      </div>

      <div className="grid md:grid-cols-4 gap-4 mb-6">
        {[
          ['Total Clicks', data.totalClicks],
          ['Live Visitors', liveCount],
          ['Performance', `${performance.score}/100`],
          ['Status', link.status],
        ].map(([k, v]) => (
          <div key={k} className="rounded-xl border border-slate-700 bg-slate-900 p-4">
            <div className="text-slate-400 text-sm">{k}</div>
            <div className="text-2xl font-bold mt-1">{v}</div>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-indigo-500/30 bg-indigo-950/30 p-4 mb-6">
        <h2 className="font-semibold text-indigo-200">AI Insights</h2>
        <ul className="mt-2 space-y-1 text-sm text-slate-300">
          {aiInsights.map((line) => (
            <li key={line}>• {line}</li>
          ))}
        </ul>
        <div className="mt-3 flex flex-wrap gap-2">
          {badges.map((b) => (
            <span key={b.id} className="rounded-full bg-slate-800 px-3 py-1 text-sm">
              {b.icon} {b.label}
            </span>
          ))}
        </div>
        <p className="text-sm text-slate-400 mt-2">
          Growth: {performance.growth >= 0 ? '+' : ''}
          {performance.growth}% · Engagement: {performance.engagement}
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-4 mb-6">
        <TrendBarChart title="Click Trend (7 days)" trend={data.clickTrend} />
        <PieChartCard title="Browser Analytics" items={data.browsers} />
        <PieChartCard title="Device Analytics" items={data.devices} />
      </div>

      <section className="rounded-xl border border-slate-700 bg-slate-900 p-4 mb-6">
        <h2 className="font-semibold mb-3">India Region Heat Insights</h2>
        <div className="space-y-2">
          {regions.map((r) => (
            <div key={r.region}>
              <div className="flex justify-between text-sm mb-1">
                <span>{r.region}</span>
                <span>{r.clicks} clicks</span>
              </div>
              <div className="h-2 rounded bg-slate-800">
                <div
                  className="h-2 rounded bg-gradient-to-r from-cyan-500 to-indigo-500"
                  style={{ width: `${(r.clicks / maxRegion) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-xl border border-slate-700 bg-slate-900 p-4">
        <h2 className="font-semibold mb-3">Visitor Journey Timeline</h2>
        <div className="space-y-3">
          {timeline.map((v) => (
            <div key={v.id} className="flex gap-3 items-start">
              <div className="w-2 h-2 mt-2 rounded-full bg-cyan-400" />
              <div>
                <div className="font-medium">
                  {new Date(v.time).toLocaleTimeString()} → {v.city} → {v.device}
                </div>
                <div className="text-sm text-slate-400">
                  {v.browser} · {v.os} · {v.region}, {v.country}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </AppLayout>
  )
}
