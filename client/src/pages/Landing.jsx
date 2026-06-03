import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'

const features = [
  { name: 'AI URL Category Detection', desc: 'Auto-classifies destination links using heuristic NLP.', icon: '🧠' },
  { name: 'Smart Threat Detection', desc: 'Scans target domains for active phishing and TLD vulnerabilities.', icon: '🛡️' },
  { name: 'Live Visitor Tracking', desc: 'Realtime websockets channel visitor pings instantly to dashboard.', icon: '⚡' },
  { name: 'Visitor Journey Timeline', desc: 'Chronological visual feed of clicks, browser agent details, and GEOs.', icon: '⏱️' },
  { name: 'India Region Heat Insights', desc: 'Aggregated regional traffic maps focused on states.', icon: '📍' },
  { name: 'QR Code Studio', desc: 'Generate customized, high-definition PNG/SVG vector QR codes.', icon: '📷' },
  { name: 'Password Protected Links', desc: 'Gate redirects behind robust client-side unlock screens.', icon: '🔒' },
  { name: 'AI Analytics Summary', desc: 'Get automated narrative highlights about click velocity trends.', icon: '📈' },
]

export default function Landing() {
  return (
    <div className="min-h-screen bg-cyber-bg text-white relative overflow-hidden font-sans">
      {/* Decorative Blur Backgrounds */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-emerald-600/5 blur-[150px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-orange-600/5 blur-[150px] pointer-events-none" />
      <div className="absolute top-[40%] left-[40%] w-[300px] h-[300px] rounded-full bg-teal-650/5 blur-[120px] pointer-events-none" />

      {/* Grid Pattern Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-30 pointer-events-none" />

      <div className="relative mx-auto max-w-6xl px-6 py-8 z-10">
        {/* Header */}
        <nav className="flex items-center justify-between border-b border-cyber-border/45 pb-6">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-tr from-emerald-500 to-orange-500 flex items-center justify-center shadow-lg shadow-emerald-500/10">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </div>
            <div className="text-xl font-bold bg-gradient-to-r from-emerald-400 via-teal-400 to-orange-400 bg-clip-text text-transparent">
              LinkLens AI
            </div>
          </div>
          <div className="flex gap-4">
            <Link to="/login" className="rounded-xl px-4 py-2 text-slate-300 hover:text-white transition-colors text-sm font-medium">
              Login
            </Link>
            <Link to="/signup" className="rounded-xl bg-slate-900 border border-cyber-border hover:bg-slate-800/80 px-4 py-2 text-sm font-medium text-cyber-mint transition-all duration-300">
              Get Started
            </Link>
          </div>
        </nav>

        {/* Hero Section */}
        <section className="mt-20 text-center max-w-4xl mx-auto space-y-8">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/20 border border-emerald-500/20 text-xs text-cyber-mint font-medium"
          >
            <span className="flex h-2 w-2 rounded-full bg-cyber-mint animate-pulse" />
            Next-Gen Smart URL Engine
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="text-4xl sm:text-6xl font-extrabold tracking-tight leading-[1.1] bg-gradient-to-b from-white via-slate-100 to-slate-400 bg-clip-text text-transparent"
          >
            URL Analytics Powered By <span className="bg-gradient-to-r from-emerald-400 via-teal-400 to-orange-400 bg-clip-text text-transparent">AI Intelligence</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-slate-400 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed"
          >
            Go beyond simple shortening. Classify target destinations, audit active security threats, track global visitors in real-time, and download customized dynamic vector QR Codes.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="flex flex-wrap justify-center gap-4 pt-4"
          >
            <Link to="/signup" className="rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white px-8 py-4 font-semibold text-sm transition-all duration-300 shadow-lg shadow-emerald-500/10 hover:shadow-emerald-500/20">
              Launch Console Free
            </Link>
            <a href="#features" className="rounded-2xl border border-cyber-border bg-slate-950/40 px-8 py-4 font-semibold text-sm hover:bg-slate-900/60 transition-all duration-300 text-slate-300 hover:text-white">
              Explore Intelligence Hub
            </a>
          </motion.div>
        </section>

        {/* Feature Grid */}
        <section id="features" className="mt-32 space-y-12">
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">Power-Packed Core Platform</h2>
            <p className="text-slate-500 text-sm max-w-lg mx-auto">Everything you need to capture traffic insights and safeguard redirects.</p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((f, i) => (
              <motion.div
                key={f.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: i * 0.05 }}
                whileHover={{ y: -5, borderColor: 'rgba(16,185,129,0.3)', backgroundColor: 'rgba(13,18,31,0.6)' }}
                className="rounded-2xl border border-cyber-border bg-cyber-card/45 p-5 space-y-3 transition-all duration-300 shadow-md backdrop-blur-sm"
              >
                <div className="text-2xl">{f.icon}</div>
                <h3 className="font-bold text-slate-200 text-sm">{f.name}</h3>
                <p className="text-slate-400 text-xs leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Highlight Stats */}
        <section className="mt-28 grid sm:grid-cols-3 gap-6 text-center border-t border-cyber-border/45 pt-16">
          {[
            ['15K+', 'Active Links Shortened', 'from-emerald-400 to-teal-400'],
            ['99.9%', 'Heuristic Security Score', 'from-cyber-mint to-teal-500'],
            ['Live', 'Visitor Map Updates', 'from-orange-400 to-amber-500'],
          ].map(([n, l, grad]) => (
            <div key={l} className="rounded-2xl bg-cyber-card/30 border border-cyber-border/45 p-6 backdrop-blur-sm">
              <div className={`text-4xl font-extrabold bg-gradient-to-r ${grad} bg-clip-text text-transparent`}>{n}</div>
              <div className="text-slate-400 text-xs mt-2 font-medium">{l}</div>
            </div>
          ))}
        </section>
      </div>
    </div>
  )
}

