import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import { authAPI } from '../services/api'
import { joinWalletRoom, leaveWalletRoom, disconnectSocket } from '../services/socket'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null) // Start with null instead of checking localStorage
  const [loading, setLoading] = useState(false) // Start with false
  const [error, setError] = useState(null)

  // Remove automatic auth check - only check when explicitly needed
  const checkAuth = useCallback(async () => {
    if (loading) return

    setLoading(true)
    try {
      const res = await authAPI.me()
      setUser(res.data)
      localStorage.setItem('hl_user', JSON.stringify(res.data))
      joinWalletRoom(res.data._id)
      setError(null)
    } catch (error) {
      localStorage.removeItem('hl_user')
      localStorage.removeItem('hl_token')
      localStorage.removeItem('hl_refresh')
      setUser(null)
      setError(error.response?.data?.detail || 'Authentication failed')
    } finally {
      setLoading(false)
    }
  }, [loading])

  const login = useCallback(async (credentials) => {
    setError(null)
    setLoading(true)
    try {
      const res = await authAPI.login(credentials)
      const { user: userData } = res.data
      localStorage.setItem('hl_user', JSON.stringify(userData))
      setUser(userData)
      joinWalletRoom(userData._id)
      setError(null)
      return userData
    } catch (error) {
      setError(error.response?.data?.detail || 'Login failed')
      throw error
    } finally {
      setLoading(false)
    }
  }, [])

  const register = useCallback(async (data) => {
    setError(null)
    const res = await authAPI.register(data)
    const { user: userData } = res.data
    if (userData) {
      localStorage.setItem('hl_user', JSON.stringify(userData))
      setUser(userData)
      return userData
    }

    localStorage.removeItem('hl_user')
    setUser(null)
    return res.data
  }, [])

  const verifyEmail = useCallback(async (data) => {
    setError(null)
    const res = await authAPI.verifyEmail(data)
    const { user: userData } = res.data
    if (userData) {
      localStorage.setItem('hl_user', JSON.stringify(userData))
      setUser(userData)
    }
    return res.data
  }, [])

  const resendVerificationCode = useCallback(async (data) => {
    setError(null)
    const res = await authAPI.resendVerificationCode(data)
    return res.data
  }, [])

  const logout = useCallback(async () => {
    try { await authAPI.logout() } catch {}
    if (user) {
      leaveWalletRoom(user._id)
    }
    disconnectSocket()
    localStorage.removeItem('hl_user')
    setUser(null)
  }, [user])

  const updateUser = useCallback((data) => {
    const updated = { ...user, ...data }
    setUser(updated)
    localStorage.setItem('hl_user', JSON.stringify(updated))
  }, [user])

  const value = {
    user,
    loading,
    error,
    checkAuth,
    login,
    register,
    verifyEmail,
    resendVerificationCode,
    logout,
    updateUser,
    isAuthenticated: !!user,
  }
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
