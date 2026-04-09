import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function NotFound() {
  const navigate = useNavigate()
  const { user } = useAuth()

  const dash = user
    ? user.role === 'delivery_driver'
      ? '/dashboard/driver'
      : user.role === 'restaurant_owner'
        ? '/dashboard/restaurant'
        : `/dashboard/${user.role}`
    : '/'

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-primary-50 flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <div className="relative inline-block mb-6">
          <p className="font-display font-black text-[120px] leading-none text-slate-100 select-none">404</p>
          <p className="absolute inset-0 flex items-center justify-center text-6xl animate-pulse-slow">🗺️</p>
        </div>
        <h1 className="font-display font-bold text-2xl text-slate-900 mb-2">Page not found</h1>
        <p className="text-slate-500 text-sm mb-8 leading-relaxed">
          Looks like this page doesn't exist in Nyeri County. Maybe it was moved, deleted, or you followed a bad link.
        </p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={() => navigate(-1)}
            className="btn-secondary text-sm"
          >
            ← Go Back
          </button>
          <Link to={dash} className="btn-primary text-sm">
            {user ? 'Go to Dashboard' : 'Go Home'}
          </Link>
        </div>
      </div>
    </div>
  )
}
