import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { apiFetch } from '../api'
import { useAuth } from '../context/AuthContext'

export default function AuthPage({ signup: isSignup = false }) {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [status, setStatus] = useState({ loading: false, error: '' })

  const submit = async (e) => {
    e.preventDefault()
    setStatus({ loading: true, error: '' })
    try {
      const endpoint = isSignup ? '/auth/signup' : '/auth/login'
      const body = isSignup ? form : { email: form.email, password: form.password }
      const data = await apiFetch(endpoint, { method: 'POST', body })
      login(data)
      setStatus({ loading: false, error: '' })
      navigate('/dashboard')
    } catch (err) {
      setStatus({ loading: false, error: err.message })
    }
  }

  return (
    <div className="min-h-screen grid place-items-center bg-cyber-bg px-4 relative overflow-hidden font-sans">
      {/* Dynamic Ambient Glows */}
      <div className="absolute top-[20%] left-[20%] w-[350px] h-[350px] rounded-full bg-emerald-600/5 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[20%] right-[20%] w-[350px] h-[350px] rounded-full bg-orange-600/5 blur-[100px] pointer-events-none" />

      <form
        onSubmit={submit}
        className="w-full max-w-md rounded-3xl border border-cyber-border bg-cyber-card/45 p-8 shadow-2xl shadow-black/60 backdrop-blur-xl relative z-10 space-y-5"
      >
        <div className="text-center space-y-1">
          <div className="inline-flex h-10 w-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-orange-500 items-center justify-center shadow-lg shadow-emerald-500/20 mb-2">
            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
            {isSignup ? 'Create Account' : 'Welcome Back'}
          </h1>
          <p className="text-slate-400 text-xs font-medium">LinkLens AI — Smart URL Intelligence</p>
        </div>

        <div className="space-y-4">
          {isSignup && (
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Name
              <input
                className="mt-1.5 w-full rounded-xl border border-cyber-border bg-slate-900/60 px-4 py-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyber-mint/75 focus:ring-1 focus:ring-cyber-mint/50 transition-all duration-300"
                placeholder="John Doe"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </label>
          )}
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Email Address
            <input
              type="email"
              className="mt-1.5 w-full rounded-xl border border-cyber-border bg-slate-900/60 px-4 py-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyber-mint/75 focus:ring-1 focus:ring-cyber-mint/50 transition-all duration-300"
              placeholder="you@example.com"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </label>
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Password
            <input
              type="password"
              minLength={6}
              className="mt-1.5 w-full rounded-xl border border-cyber-border bg-slate-900/60 px-4 py-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyber-mint/75 focus:ring-1 focus:ring-cyber-mint/50 transition-all duration-300"
              placeholder="••••••••"
              required
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
          </label>
        </div>

        {status.error && <p className="text-red-400 text-xs font-semibold text-center mt-2">⚠️ {status.error}</p>}

        <button
          disabled={status.loading}
          className="w-full rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 py-3 text-sm font-semibold text-white transition-all duration-300 shadow-lg shadow-emerald-500/10 cursor-pointer disabled:opacity-50"
        >
          {status.loading ? 'Establishing secure session...' : isSignup ? 'Sign Up' : 'Authorize Console'}
        </button>

        <p className="text-xs text-slate-400 text-center pt-2">
          {isSignup ? (
            <>
              Already have an account?{' '}
              <Link className="text-cyber-mint hover:text-cyber-mint/80 font-semibold transition-colors" to="/login">
                Login
              </Link>
            </>
          ) : (
            <>
              New to LinkLens?{' '}
              <Link className="text-cyber-mint hover:text-cyber-mint/80 font-semibold transition-colors" to="/signup">
                Create Account
              </Link>
            </>
          )}
        </p>
      </form>
    </div>
  )
}

