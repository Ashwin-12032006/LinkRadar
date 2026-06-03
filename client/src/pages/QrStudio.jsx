import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { apiFetch, API_URL } from '../api'
import { useAuth } from '../context/AuthContext'
import { AppLayout } from '../components/Layout'

export default function QrStudio() {
  const { id: routeId } = useParams()
  const { token } = useAuth()
  const [links, setLinks] = useState([])
  const [selectedId, setSelectedId] = useState(routeId || '')
  const [color, setColor] = useState('6366f1')
  const [format, setFormat] = useState('png')
  const [previewUrl, setPreviewUrl] = useState('')

  useEffect(() => {
    apiFetch('/links', { token }).then((res) => {
      setLinks(res.links)
      if (!selectedId && res.links[0]) setSelectedId(res.links[0].id)
    })
  }, [token])

  useEffect(() => {
    if (!selectedId || !token) return
    const url = `${API_URL}/links/${selectedId}/qr?color=${encodeURIComponent(color)}&format=${format}`
    fetch(url, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.blob())
      .then((blob) => {
        setPreviewUrl((prev) => {
          if (prev) URL.revokeObjectURL(prev)
          return URL.createObjectURL(blob)
        })
      })
      .catch(() => setPreviewUrl(''))
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl)
    }
  }, [selectedId, color, format, token])

  const download = () => {
    if (!previewUrl) return
    const a = document.createElement('a')
    a.href = previewUrl
    a.download = `linklens-qr.${format === 'svg' ? 'svg' : 'png'}`
    a.click()
  }

  return (
    <AppLayout>
      <h1 className="text-2xl font-bold mb-4">QR Code Studio</h1>
      <div className="grid md:grid-cols-2 gap-6">
        <div className="rounded-xl border border-slate-700 bg-slate-900 p-4 space-y-3">
          <label className="block text-sm">
            Select Link
            <select
              className="mt-1 w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2"
              value={selectedId}
              onChange={(e) => setSelectedId(e.target.value)}
            >
              {links.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.shortCode} — {l.originalUrl.slice(0, 40)}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm">
            Custom Color (hex without #)
            <input className="mt-1 w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2" value={color} onChange={(e) => setColor(e.target.value)} />
          </label>
          <label className="block text-sm">
            Format
            <select className="mt-1 w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2" value={format} onChange={(e) => setFormat(e.target.value)}>
              <option value="png">PNG</option>
              <option value="svg">SVG</option>
            </select>
          </label>
          <button onClick={download} className="rounded-lg bg-indigo-500 px-4 py-2 font-semibold">
            Download QR
          </button>
        </div>
        <div className="rounded-xl border border-slate-700 bg-slate-900 p-4 flex items-center justify-center min-h-[320px]">
          {previewUrl ? (
            <img src={previewUrl} alt="QR preview" className="max-w-full rounded-lg bg-white p-3" />
          ) : (
            <p className="text-slate-400">Create a link first</p>
          )}
        </div>
      </div>
      <p className="text-sm text-slate-500 mt-3">Supports normal, custom color, and downloadable PNG/SVG formats.</p>
    </AppLayout>
  )
}
