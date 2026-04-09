import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useNotifications } from '../../context/contexts'

export default function Topbar({ onMenuClick }) {
  const { user } = useAuth()
  const { unreadCount } = useNotifications()
  const initials = `${user?.first_name?.[0] || ''}${user?.last_name?.[0] || ''}`
  const dashboardPath = user
    ? {
        customer: '/dashboard/customer',
        provider: '/dashboard/provider',
        delivery_driver: '/dashboard/driver',
        restaurant_owner: '/dashboard/restaurant',
        admin: '/dashboard/admin',
      }[user.role] || '/'
    : '#'

  return (
    <header className="h-16 bg-white border-b border-slate-100 flex items-center px-4 lg:px-6 gap-4 sticky top-0 z-20 flex-shrink-0">
      <button onClick={onMenuClick}
        className="lg:hidden p-2 rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-all flex-shrink-0">
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16"/>
        </svg>
      </button>

      <div className="flex-1 max-w-md">
        <label className="flex items-center gap-2.5 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 cursor-text hover:border-teal-300 hover:bg-white transition-all focus-within:border-teal-400 focus-within:bg-white focus-within:ring-2 focus-within:ring-teal-100">
          <svg className="w-4 h-4 text-slate-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <input type="search" placeholder="Search services, products…"
            className="flex-1 text-sm text-slate-700 placeholder-slate-400 bg-transparent outline-none min-w-0"/>
        </label>
      </div>

      <div className="flex items-center gap-1.5 ml-auto">
        <Link to="/notifications"
          className="relative p-2.5 rounded-xl text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-all">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/>
          </svg>
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full ring-2 ring-white" style={{ background: '#0d9488' }}/>
          )}
        </Link>

        <div className="w-px h-6 bg-slate-200 mx-1"/>

        <Link to={dashboardPath}
          className="flex items-center gap-2.5 hover:opacity-80 transition-opacity px-1 py-1 rounded-xl">
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-white font-semibold text-xs flex-shrink-0"
            style={{ background: 'linear-gradient(135deg,#0d9488,#0f766e)' }}>
            {initials}
          </div>
          <div className="hidden sm:block text-left">
            <p className="text-sm font-semibold text-slate-900 leading-tight">{user?.first_name}</p>
            <p className="text-[11px] text-slate-400 capitalize">{user?.role?.replace('_', ' ')}</p>
          </div>
          <svg className="hidden sm:block w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7"/>
          </svg>
        </Link>
      </div>
    </header>
  )
}
