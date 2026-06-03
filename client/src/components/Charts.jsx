import {
  Chart as ChartJS,
  ArcElement,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
} from 'chart.js'
import { Pie, Bar } from 'react-chartjs-2'

ChartJS.register(ArcElement, CategoryScale, LinearScale, BarElement, Tooltip, Legend)

export function PieChartCard({ title, items, colors }) {
  if (!items?.length) return <div className="rounded-xl border border-slate-700 bg-slate-900 p-4 text-slate-400">{title}: no data</div>
  const palette = colors || ['#6366f1', '#22d3ee', '#f59e0b', '#10b981', '#ef4444', '#a78bfa']
  const data = {
    labels: items.map((i) => i.name),
    datasets: [{ data: items.map((i) => i.count), backgroundColor: palette }],
  }
  return (
    <div className="rounded-xl border border-slate-700 bg-slate-900 p-4">
      <h3 className="mb-2 font-semibold text-white">{title}</h3>
      <Pie data={data} />
    </div>
  )
}

export function TrendBarChart({ title, trend }) {
  const data = {
    labels: trend?.labels || [],
    datasets: [{ label: 'Clicks', data: trend?.values || [], backgroundColor: '#6366f1' }],
  }
  return (
    <div className="rounded-xl border border-slate-700 bg-slate-900 p-4">
      <h3 className="mb-2 font-semibold text-white">{title}</h3>
      <Bar data={data} options={{ responsive: true, plugins: { legend: { display: false } } }} />
    </div>
  )
}
