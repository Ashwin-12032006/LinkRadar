import { createContext, useContext, useMemo, useState } from 'react'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [token, setToken] = useState(localStorage.getItem('token') || '')
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem('user')
    return raw ? JSON.parse(raw) : null
  })
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark')

  const login = (payload) => {
    setToken(payload.token)
    setUser(payload.user)
    localStorage.setItem('token', payload.token)
    localStorage.setItem('user', JSON.stringify(payload.user))
    if (payload.user?.theme) setTheme(payload.user.theme)
  }

  const logout = () => {
    setToken('')
    setUser(null)
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  }

  const value = useMemo(
    () => ({ token, user, theme, setTheme, login, logout, isLoggedIn: Boolean(token) }),
    [token, user, theme]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  return useContext(AuthContext)
}
