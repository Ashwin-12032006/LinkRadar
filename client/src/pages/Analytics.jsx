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

  if (!data) return <AppLayout><p className="text-slate-400">Loading analytics details...</p></AppLayout>

  const { link, aiInsights, performance, badges, timeline, regions } = data
  const maxRegion = Math.max(...(regions?.map((r) => r.clicks) || [1]), 1)

  return (
    <AppLayout>
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-cyber-border/40 pb-4">
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
            Analytics — /{link.shortCode}
          </h1>
          <p className="text-slate-500 text-xs truncate max-w-md sm:max-w-2xl mt-1 font-medium">{link.originalUrl}</p>
        </div>
        <Link to="/dashboard" className="text-cyber-mint hover:text-cyber-mint/80 text-xs font-semibold flex items-center gap-1 transition-colors">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Registry
        </Link>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
        {[
          ['Total Clicks', data.totalClicks, 'text-cyber-mint'],
          ['Live Visitors', liveCount, 'text-teal-400'],
          ['Performance Score', `${performance.score}/100`, 'text-cyber-orange'],
          ['Status', link.status.toUpperCase(), link.status === 'active' ? 'text-cyber-mint' : 'text-rose-450'],
        ].map(([k, v, color]) => (
          <div key={k} className="rounded-2xl border border-cyber-border bg-cyber-card/45 p-4 shadow-lg">
            <div className="text-slate-500 text-[10px] uppercase font-bold tracking-wider">{k}</div>
            <div className={`text-2xl font-extrabold mt-2 ${color}`}>{v}</div>
          </div>
        ))}
      </div>

      {/* AI Summary Banner */}
      <div className="rounded-2xl border border-emerald-500/20 bg-gradient-to-r from-emerald-950/10 to-teal-950/15 p-5 mt-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-24 h-24 bg-cyber-mint/5 rounded-full blur-2xl pointer-events-none" />
        <h2 className="font-bold text-sm text-slate-200 uppercase tracking-wider flex items-center gap-2">
          <span>🧠</span> AI Insights Summary
        </h2>
        <ul className="mt-3 space-y-2 text-xs text-slate-300 leading-relaxed font-medium">
          {aiInsights.map((line) => (
            <li key={line} className="flex items-start gap-2">
              <span className="text-cyber-mint mt-0.5">•</span>
              <span>{line}</span>
            </li>
          ))}
        </ul>

        {badges.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2 border-t border-cyber-border/40 pt-3">
            {badges.map((b) => (
              <span key={b.id} className="rounded-full bg-slate-900 border border-cyber-border px-3 py-1 text-[10px] text-cyber-mint font-bold flex items-center gap-1 shadow-sm">
                <span>{b.icon}</span>
                <span>{b.label}</span>
              </span>
            ))}
          </div>
        )}

        <p className="text-[10px] text-slate-500 mt-3 font-semibold">
          Growth Index: {performance.growth >= 0 ? '+' : ''}{performance.growth}% · Engagement Rating: {performance.engagement.toUpperCase()}
        </p>
      </div>

      {/* Charts Grid */}
      <div className="grid lg:grid-cols-2 gap-6 mt-6">
        <TrendBarChart title="Click Volume Trend (Last 7 Days)" trend={data.clickTrend} />
        <div className="space-y-6">
          <PieChartCard title="Device Analytics" items={data.devices} />
          <PieChartCard title="Browser Analytics" items={data.browsers} />
        </div>
      </div>

      {/* India Heat Map */}
      <section className="rounded-2xl border border-cyber-border bg-cyber-card/45 p-5 mt-6 shadow-xl">
        <h2 className="font-bold mb-4 text-slate-200 text-xs uppercase tracking-wider">India Region Heat Insights</h2>
        <div className="space-y-4">
          {regions.map((r) => (
            <div key={r.region} className="space-y-1">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-slate-300">{r.region}</span>
                <span className="text-cyber-mint">{r.clicks} clicks</span>
              </div>
              <div className="h-2.5 rounded-full bg-slate-900 overflow-hidden border border-cyber-border">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-cyber-mint to-teal-600 transition-all duration-500"
                  style={{ width: `${(r.clicks / maxRegion) * 100}%` }}
                />
              </div>
            </div>
          ))}
          {regions.length === 0 && (
            <p className="text-slate-500 text-xs font-medium py-4 text-center">No location tracking statistics available yet.</p>
          )}
        </div>
      </section>

      {/* Visitor Timeline */}
      <section className="rounded-2xl border border-cyber-border bg-cyber-card/30 p-5 mt-6 shadow-xl backdrop-blur-sm">
        <h2 className="font-bold mb-4 text-slate-200 text-xs uppercase tracking-wider">Visitor Journey Logs</h2>
        <div className="relative pl-6 border-l border-cyber-border/80 space-y-6 ml-2">
          {timeline.map((v) => (
            <div key={v.id} className="relative space-y-1">
              {/* Pulsing indicator node */}
              <div className="absolute -left-[31px] top-1.5 h-3.5 w-3.5 rounded-full bg-cyber-mint/20 border border-cyber-mint flex items-center justify-center">
                <span className="h-1.5 w-1.5 rounded-full bg-cyber-mint animate-ping" />
              </div>
              <div className="flex justify-between items-center text-xs flex-wrap gap-2">
                <span className="font-bold text-slate-200">
                  {new Date(v.time).toLocaleTimeString()} · {v.city || 'Unknown Location'} · {v.device}
                </span>
                <span className="text-slate-500 text-[10px] font-semibold bg-slate-900 px-2 py-0.5 rounded border border-cyber-border">
                  IP Logged
                </span>
              </div>
              <div className="text-xs text-slate-400 leading-relaxed font-medium">
                Running {v.browser} ({v.os}) · Region: {v.region || 'Unknown'}, {v.country}
              </div>
            </div>
          ))}
          {timeline.length === 0 && (
            <p className="text-slate-500 text-xs font-medium py-4 text-center -ml-6">No visitor traffic logs recorded yet.</p>
          )}
        </div>
      </section>
    </AppLayout>
  )
}

