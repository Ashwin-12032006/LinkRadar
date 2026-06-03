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
  const [color, setColor] = useState('10b981')
  const [format, setFormat] = useState('png')
  const [qrType, setQrType] = useState('standard') // 'standard' or 'branded'
  const [previewUrl, setPreviewUrl] = useState('')

  useEffect(() => {
    apiFetch('/links', { token }).then((res) => {
      setLinks(res.links)
      if (!selectedId && res.links[0]) setSelectedId(res.links[0].id)
    })
  }, [token])

  useEffect(() => {
    if (!selectedId || !token) return
    const isBranded = qrType === 'branded'
    // If branded, we always request SVG backend format to stitch the SVG vector logo
    const requestFormat = isBranded ? 'svg' : format
    const url = `${API_URL}/links/${selectedId}/qr?color=${encodeURIComponent(color)}&format=${requestFormat}&logo=${isBranded ? 'true' : 'false'}`
    
    fetch(url, { 
      headers: { 
        Authorization: `Bearer ${token}`,
        'bypass-tunnel-reminder': 'true'
      } 
    })
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
  }, [selectedId, color, format, qrType, token])

  const download = () => {
    if (!previewUrl) return
    
    if (format === 'png' && qrType === 'branded') {
      // Convert SVG vector to a high DPI PNG image using Canvas
      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.onload = () => {
        const canvas = document.createElement('canvas')
        canvas.width = 640
        canvas.height = 640
        const ctx = canvas.getContext('2d')
        ctx.fillStyle = '#FFFFFF'
        ctx.fillRect(0, 0, 640, 640)
        ctx.drawImage(img, 0, 0, 640, 640)
        
        canvas.toBlob((blob) => {
          const url = URL.createObjectURL(blob)
          const a = document.createElement('a')
          a.href = url
          a.download = `linklens-branded-qr.png`
          a.click()
          URL.revokeObjectURL(url)
        }, 'image/png')
      }
      img.src = previewUrl
    } else {
      const a = document.createElement('a')
      a.href = previewUrl
      a.download = `linklens-${qrType}-qr.${format === 'svg' ? 'svg' : 'png'}`
      a.click()
    }
  }

  return (
    <AppLayout>
      <h1 className="text-2xl font-bold bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent border-b border-cyber-border/40 pb-4">
        QR Code Studio
      </h1>

      <div className="grid md:grid-cols-2 gap-6 mt-6">
        {/* Controls Card */}
        <div className="rounded-2xl border border-cyber-border bg-cyber-card/45 p-6 space-y-4 shadow-xl">
          <h2 className="font-bold text-sm text-slate-200 uppercase tracking-wider">Configure QR Matrix</h2>
          
          <div className="space-y-1">
            <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Select Smart Link</label>
            <select
              className="mt-1 w-full rounded-xl border border-cyber-border bg-slate-900 px-3 py-3 text-xs text-slate-100 focus:outline-none focus:border-cyber-mint/60"
              value={selectedId}
              onChange={(e) => setSelectedId(e.target.value)}
            >
              {links.map((l) => (
                <option key={l.id} value={l.id}>
                  /{l.shortCode} — {l.originalUrl.slice(0, 35)}...
                </option>
              ))}
              {links.length === 0 && <option value="">No links available</option>}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">QR Style Options</label>
            <div className="grid grid-cols-2 gap-2 mt-1">
              <button
                type="button"
                onClick={() => setQrType('standard')}
                className={`rounded-xl py-2.5 text-[10px] font-bold border transition-all duration-300 cursor-pointer ${
                  qrType === 'standard'
                    ? 'bg-emerald-950/40 border-cyber-mint text-cyber-mint'
                    : 'bg-slate-900 border-cyber-border text-slate-450 hover:text-slate-200'
                }`}
              >
                Standard QR
              </button>
              <button
                type="button"
                onClick={() => setQrType('branded')}
                className={`rounded-xl py-2.5 text-[10px] font-bold border transition-all duration-300 cursor-pointer ${
                  qrType === 'branded'
                    ? 'bg-emerald-950/40 border-cyber-mint text-cyber-mint'
                    : 'bg-slate-900 border-cyber-border text-slate-455 hover:text-slate-200'
                }`}
              >
                Branded (Eye Logo)
              </button>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">QR Code Fill Color (Hex)</label>
            <div className="flex gap-2 items-center">
              <input
                className="w-full rounded-xl border border-cyber-border bg-slate-900 px-3 py-3 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyber-mint/60"
                value={color}
                onChange={(e) => setColor(e.target.value.replace('#', ''))}
                placeholder="e.g. 10b981"
              />
              <div
                className="w-10 h-10 rounded-xl border border-cyber-border flex-shrink-0 shadow-inner"
                style={{ backgroundColor: `#${color}` }}
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Export Format</label>
            <select
              className="mt-1 w-full rounded-xl border border-cyber-border bg-slate-900 px-3 py-3 text-xs text-slate-100 focus:outline-none focus:border-cyber-mint/60"
              value={format}
              onChange={(e) => setFormat(e.target.value)}
            >
              <option value="png">PNG Bitmap</option>
              <option value="svg">SVG Vector XML</option>
            </select>
          </div>

          <div className="pt-2">
            <button
              onClick={download}
              disabled={!previewUrl}
              className="w-full rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white py-3 font-semibold text-xs transition-all duration-300 shadow-md shadow-emerald-500/10 cursor-pointer disabled:opacity-50"
            >
              Download Export
            </button>
          </div>
        </div>

        {/* Preview Frame */}
        <div className="rounded-2xl border border-cyber-border bg-cyber-card/30 p-6 flex flex-col items-center justify-center min-h-[340px] shadow-xl relative overflow-hidden backdrop-blur-sm">
          <div className="absolute top-[-30%] left-[-30%] w-60 h-60 bg-cyber-mint/5 rounded-full blur-[80px]" />
          
          {previewUrl ? (
            <div className="space-y-4 text-center z-10">
              <div className="bg-white p-4 rounded-2xl shadow-xl shadow-black/45 inline-block border border-cyber-border/40 hover:scale-[1.02] transition-transform duration-300">
                <img src={previewUrl} alt="QR Matrix Preview" className="w-48 h-48 block" />
              </div>
              <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">
                {qrType === 'branded' ? 'Branded Matrix Render' : 'Standard Matrix Render'}
              </p>
            </div>
          ) : (
            <div className="text-center space-y-2 z-10">
              <p className="text-slate-500 text-xs font-semibold">No active URL linked.</p>
              <p className="text-[10px] text-slate-600 max-w-[200px]">Create an intelligent link from the console to automatically map a QR Matrix here.</p>
            </div>
          )}
        </div>
      </div>
      <p className="text-[10px] text-slate-500 font-semibold mt-4">
        * Supports hex parameter overrides, responsive vector grids, and high-DPI scaling presets.
      </p>
    </AppLayout>
  )
}

