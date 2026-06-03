import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { API_URL } from '../api'
import { TrendBarChart } from '../components/Charts'

export default function PublicStats() {
  const { shortCode } = useParams()
  const [data, setData] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch(`${API_URL}/public/stats/${shortCode}`)
      .then((r) => r.json().then((d) => ({ ok: r.ok, d })))
      .then(({ ok, d }) => {
        if (!ok) throw new Error(d.message || 'Stats unavailable')
        setData(d)
      })
      .catch((err) => setError(err.message))
  }, [shortCode])

  if (error) {
    return (
      <div className="min-h-screen bg-slate-950 text-white grid place-items-center">
        <div className="text-center">
          <p className="text-red-400">{error}</p>
          <Link to="/" className="text-indigo-300 mt-4 inline-block">Home</Link>
        </div>
      </div>
    )
  }

  if (!data) return <div className="min-h-screen bg-slate-950 text-white grid place-items-center">Loading public stats...</div>

  return (
    <div className="min-h-screen bg-slate-950 text-white px-4 py-10">
      <div className="mx-auto max-w-4xl">
        <h1 className="text-3xl font-bold text-indigo-300">LinkLens Public Stats</h1>
        <p className="text-slate-400 mt-1">/{data.shortCode}</p>
        <div className="grid md:grid-cols-3 gap-4 mt-6">
          <div className="rounded-xl border border-slate-700 bg-slate-900 p-4">
            <div className="text-slate-400 text-sm">Total Clicks</div>
            <div className="text-3xl font-bold">{data.clickCount}</div>
          </div>
          <div className="rounded-xl border border-slate-700 bg-slate-900 p-4">
            <div className="text-slate-400 text-sm">Category</div>
            <div className="text-3xl font-bold">{data.category}</div>
          </div>
          <div className="rounded-xl border border-slate-700 bg-slate-900 p-4">
            <div className="text-slate-400 text-sm">Growth</div>
            <div className="text-3xl font-bold">+{data.growth}%</div>
          </div>
        </div>
        <div className="mt-6">
          <TrendBarChart title="Public Trend Graph" trend={data.clickTrend} />
        </div>
        <p className="text-sm text-slate-400 mt-4">Countries: {data.countries?.join(', ') || 'N/A'}</p>
      </div>
    </div>
  )
}
