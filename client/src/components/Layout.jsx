import { Link, NavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export function AppLayout({ children }) {
  const { user, logout } = useAuth()
  const nav = 'px-3 py-2 rounded-lg text-sm hover:bg-slate-800'
  const active = ({ isActive }) => `${nav} ${isActive ? 'bg-indigo-600 text-white' : 'text-slate-300'}`

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur sticky top-0 z-20">
        <div className="mx-auto max-w-7xl px-4 py-3 flex items-center justify-between gap-4">
          <Link to="/dashboard" className="font-bold text-xl text-indigo-300">
            LinkLens AI
          </Link>
          <nav className="flex flex-wrap gap-2">
            <NavLink to="/dashboard" className={active}>Dashboard</NavLink>
            <NavLink to="/qr" className={active}>QR Studio</NavLink>
            <NavLink to="/settings" className={active}>Settings</NavLink>
          </nav>
          <div className="text-sm text-slate-300">
            {user?.name}
            <button onClick={logout} className="ml-3 rounded-lg bg-slate-800 px-3 py-1 hover:bg-slate-700">
              Logout
            </button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-6">{children}</main>
    </div>
  )
}
