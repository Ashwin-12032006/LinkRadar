import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'

const features = [
  'AI URL Category Detection',
  'Smart Threat Detection',
  'Live Visitor Tracking',
  'Visitor Journey Timeline',
  'India Region Heat Insights',
  'QR Code Studio',
  'Password Protected Links',
  'AI Analytics Summary',
]

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 text-white">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute -top-20 -left-20 h-72 w-72 rounded-full bg-indigo-500/20 blur-3xl"
          animate={{ x: [0, 80, 0], y: [0, 40, 0] }}
          transition={{ repeat: Infinity, duration: 12 }}
        />
        <motion.div
          className="absolute top-40 right-0 h-96 w-96 rounded-full bg-cyan-400/10 blur-3xl"
          animate={{ x: [0, -60, 0], y: [0, 30, 0] }}
          transition={{ repeat: Infinity, duration: 14 }}
        />
      </div>

      <div className="relative mx-auto max-w-6xl px-6 py-16">
        <nav className="flex items-center justify-between">
          <div className="text-2xl font-bold text-indigo-300">LinkLens AI</div>
          <div className="flex gap-3">
            <Link to="/login" className="rounded-lg px-4 py-2 text-slate-200 hover:bg-white/10">Login</Link>
            <Link to="/signup" className="rounded-lg bg-indigo-500 px-4 py-2 font-semibold hover:bg-indigo-400">Get Started</Link>
          </div>
        </nav>

        <section className="mt-20 text-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-5xl md:text-6xl font-extrabold tracking-tight"
          >
            Smart URL Intelligence Platform
          </motion.h1>
          <p className="mt-6 text-lg text-slate-300 max-w-3xl mx-auto">
            Go beyond basic shortening. Detect threats, classify URLs with AI, track live visitors, and unlock
            analytics that make judges say wow.
          </p>
          <div className="mt-8 flex justify-center gap-4">
            <Link to="/signup" className="rounded-xl bg-indigo-500 px-6 py-3 font-semibold hover:bg-indigo-400">
              Launch Dashboard
            </Link>
            <a href="#features" className="rounded-xl border border-slate-600 px-6 py-3 hover:bg-white/5">
              Explore Features
            </a>
          </div>
        </section>

        <section id="features" className="mt-20 grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {features.map((f) => (
            <motion.div
              key={f}
              whileHover={{ scale: 1.02 }}
              className="rounded-xl border border-slate-700 bg-slate-900/70 p-4 text-sm"
            >
              {f}
            </motion.div>
          ))}
        </section>

        <section className="mt-16 grid md:grid-cols-3 gap-6 text-center">
          {[
            ['12K+', 'Links Analyzed'],
            ['98%', 'Threat Checks Passed'],
            ['35%', 'Avg Weekly Growth'],
          ].map(([n, l]) => (
            <div key={l} className="rounded-xl bg-slate-900/80 border border-slate-700 p-6">
              <div className="text-3xl font-bold text-cyan-300">{n}</div>
              <div className="text-slate-400 mt-2">{l}</div>
            </div>
          ))}
        </section>
      </div>
    </div>
  )
}
