import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useEffect } from 'react'

const roleDashboards = {
  customer: '/dashboard/customer',
  provider: '/dashboard/provider',
  delivery_driver: '/services',
  restaurant_owner: '/services',
  admin: '/dashboard/admin',
}

export default function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading, checkAuth } = useAuth()
  const location = useLocation()

  useEffect(() => {
    // Only check auth if we don't have a user and we're not already loading
    if (!user && !loading) {
      checkAuth()
    }
  }, [user, loading, checkAuth])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-full border-4 border-primary-200 border-t-primary-600 animate-spin" />
          <p className="text-sm text-slate-400 font-medium">Loading…</p>
        </div>
      </div>
    )
  }

  if (!user) return <Navigate to="/login" state={{ from: location }} replace />

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    const dash = roleDashboards[user.role] || '/'
    return <Navigate to={dash} replace />
  }

  return children
}
