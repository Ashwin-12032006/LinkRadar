import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { API_URL } from '../api'
import { TrendBarChart } from '../components/Charts'

export default function PublicStats() {
  const { shortCode } = useParams()
  const [data, setData] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch(`${API_URL}/public/stats/${shortCode}`, {
      headers: { 'bypass-tunnel-reminder': 'true' }
    })
      .then((r) => r.json().then((d) => ({ ok: r.ok, d })))
      .then(({ ok, d }) => {
        if (!ok) throw new Error(d.message || 'Stats unavailable')
        setData(d)
      })
      .catch((err) => setError(err.message))
  }, [shortCode])

  if (error) {
    return (
      <div className="min-h-screen bg-cyber-bg text-white grid place-items-center px-4 relative overflow-hidden font-sans">
        <div className="absolute top-[30%] left-[30%] w-[300px] h-[300px] bg-rose-500/5 rounded-full blur-[100px]" />
        <div className="text-center relative z-10 max-w-sm rounded-3xl border border-rose-950 bg-cyber-card/45 p-8 space-y-4">
          <div className="inline-flex h-12 w-12 rounded-2xl bg-rose-950/40 border border-rose-900/30 items-center justify-center text-rose-450 text-lg shadow-lg">
            ⚠️
          </div>
          <h1 className="text-lg font-bold text-rose-400">Registry Failure</h1>
          <p className="text-slate-400 text-xs leading-relaxed">{error}</p>
          <Link to="/" className="inline-block rounded-xl bg-slate-900 hover:bg-slate-800 border border-cyber-border px-5 py-2.5 text-xs font-semibold text-slate-300 transition-colors">
            Return Home
          </Link>
        </div>
      </div>
    )
  }

  if (!data) return (
    <div className="min-h-screen bg-cyber-bg text-slate-400 grid place-items-center font-sans">
      <div className="text-center space-y-2">
        <div className="h-6 w-6 rounded-full border-2 border-cyber-mint border-t-transparent animate-spin mx-auto" />
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Decrypting registry data...</p>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-cyber-bg text-white px-6 py-10 relative overflow-hidden font-sans">
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-emerald-600/5 rounded-full blur-[120px]" />
      
      <div className="mx-auto max-w-4xl space-y-6 relative z-10">
        <div className="border-b border-cyber-border/40 pb-4 flex justify-between items-center flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-extrabold bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
              LinkLens Public Stats
            </h1>
            <p className="text-cyber-mint font-bold text-xs mt-1">/{data.shortCode}</p>
          </div>
          <Link to="/" className="text-slate-400 hover:text-slate-300 text-xs font-semibold flex items-center gap-1 transition-colors">
            <span>←</span> Home Console
          </Link>
        </div>

        {/* Public KPIs */}
        <div className="grid grid-cols-3 gap-4">
          {[
            ['Aggregate Clicks', data.clickCount, 'text-cyber-mint'],
            ['AI Classification', data.category, 'text-cyber-mint'],
            ['Engagement Growth', `+${data.growth}%`, 'text-cyber-orange'],
          ].map(([k, v, color]) => (
            <div key={k} className="rounded-2xl border border-cyber-border bg-cyber-card/45 p-5 shadow-lg">
              <div className="text-slate-500 text-[10px] uppercase font-bold tracking-wider">{k}</div>
              <div className={`text-2xl font-extrabold mt-2 ${color}`}>{v}</div>
            </div>
          ))}
        </div>

        {/* Chart */}
        <div className="rounded-2xl border border-cyber-border bg-cyber-card/45 p-5 shadow-xl">
          <TrendBarChart title="Public Traffic Velocity (Trend)" trend={data.clickTrend} />
        </div>

        {/* Countries log */}
        <div className="rounded-2xl border border-cyber-border bg-cyber-card/20 p-5 shadow-lg flex items-center justify-between text-xs">
          <span className="text-slate-500 font-bold uppercase tracking-wider">Origin Geographies</span>
          <span className="text-cyber-mint font-semibold bg-slate-900 border border-cyber-border px-3 py-1 rounded-full">
            {data.countries?.join(', ') || 'None Recorded'}
          </span>
        </div>
      </div>
    </div>
  )
}

