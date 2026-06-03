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
    <div className="min-h-screen grid place-items-center bg-slate-950 px-4">
      <form onSubmit={submit} className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 p-6">
        <h1 className="text-2xl font-bold text-white">{isSignup ? 'Create Account' : 'Welcome Back'}</h1>
        <p className="text-slate-400 mt-1">LinkLens AI — Smart URL Intelligence</p>
        {isSignup && (
          <label className="block mt-4 text-sm">
            Name
            <input className="mt-1 w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </label>
        )}
        <label className="block mt-4 text-sm">
          Email
          <input type="email" className="mt-1 w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        </label>
        <label className="block mt-4 text-sm">
          Password
          <input type="password" minLength={6} className="mt-1 w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2" required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
        </label>
        {status.error && <p className="mt-3 text-red-400 text-sm">{status.error}</p>}
        <button disabled={status.loading} className="mt-5 w-full rounded-lg bg-indigo-500 py-2 font-semibold hover:bg-indigo-400">
          {status.loading ? 'Please wait...' : isSignup ? 'Sign Up' : 'Login'}
        </button>
        <p className="mt-4 text-sm text-slate-400 text-center">
          {isSignup ? (
            <>
              Already have an account? <Link className="text-indigo-300" to="/login">Login</Link>
            </>
          ) : (
            <>
              New here? <Link className="text-indigo-300" to="/signup">Create account</Link>
            </>
          )}
        </p>
      </form>
    </div>
  )
}
