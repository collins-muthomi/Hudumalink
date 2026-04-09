import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { authAPI } from '../services/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('hl_user')
      return stored ? JSON.parse(stored) : null
    } catch { return null }
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const token = localStorage.getItem('hl_token')
    if (token) {
      authAPI.me()
        .then(res => { setUser(res.data); localStorage.setItem('hl_user', JSON.stringify(res.data)) })
        .catch(() => { localStorage.removeItem('hl_token'); localStorage.removeItem('hl_user'); setUser(null) })
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [])

  const login = useCallback(async (credentials) => {
    setError(null)
    const res = await authAPI.login(credentials)
    const { access, refresh, user: userData } = res.data
    localStorage.setItem('hl_token', access)
    if (refresh) localStorage.setItem('hl_refresh', refresh)
    localStorage.setItem('hl_user', JSON.stringify(userData))
    setUser(userData)
    return userData
  }, [])

  const register = useCallback(async (data) => {
    setError(null)
    const res = await authAPI.register(data)
    const { access, refresh, user: userData } = res.data
    localStorage.setItem('hl_token', access)
    if (refresh) localStorage.setItem('hl_refresh', refresh)
    localStorage.setItem('hl_user', JSON.stringify(userData))
    setUser(userData)
    return userData
  }, [])

  const logout = useCallback(async () => {
    try { await authAPI.logout() } catch {}
    localStorage.removeItem('hl_token')
    localStorage.removeItem('hl_refresh')
    localStorage.removeItem('hl_user')
    setUser(null)
  }, [])

  const updateUser = useCallback((data) => {
    const updated = { ...user, ...data }
    setUser(updated)
    localStorage.setItem('hl_user', JSON.stringify(updated))
  }, [user])

  const value = { user, loading, error, login, register, logout, updateUser, isAuthenticated: !!user }
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
