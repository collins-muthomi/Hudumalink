import { NavLink, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useNotifications } from '../../context/contexts'
import { ConfirmModal } from '../ui/Modal'
import { HudumaLogo } from '../../pages/LandingPage'

const NAV = {
  customer: [
    { to: '/dashboard/customer', label: 'Dashboard', icon: 'grid' },
    { to: '/services', label: 'Services', icon: 'tool' },
    { to: '/marketplace', label: 'Marketplace', icon: 'bag' },
    { to: '/food', label: 'Food Order', icon: 'coffee' },
    { to: '/my-requests', label: 'My Requests', icon: 'clipboard' },
    { to: '/my-orders', label: 'My Orders', icon: 'package' },
    { to: '/wallet', label: 'Wallet', icon: 'wallet' },
    { to: '/referrals', label: 'Refer & Earn', icon: 'gift' },
    { to: '/notifications', label: 'Notifications', icon: 'bell', badge: true },
  ],
  provider: [
    { to: '/dashboard/provider', label: 'Dashboard', icon: 'grid' },
    { to: '/dashboard/provider/services', label: 'My Services', icon: 'tool' },
    { to: '/dashboard/provider/open-requests', label: 'Open Requests', icon: 'clipboard' },
    { to: '/dashboard/provider/jobs', label: 'Jobs', icon: 'package' },
    { to: '/dashboard/provider/bookings', label: 'Bookings', icon: 'calendar' },
    { to: '/dashboard/provider/verification', label: 'Verification', icon: 'shield' },
    { to: '/wallet', label: 'Earnings', icon: 'wallet' },
    { to: '/notifications', label: 'Notifications', icon: 'bell', badge: true },
    { to: '/pricing', label: 'Upgrade Plan', icon: 'zap' },
  ],
  delivery_driver: [
    { to: '/dashboard/driver', label: 'Dashboard', icon: 'grid' },
    { to: '/wallet', label: 'Earnings', icon: 'wallet' },
    { to: '/notifications', label: 'Notifications', icon: 'bell', badge: true },
  ],
  restaurant_owner: [
    { to: '/dashboard/restaurant', label: 'Dashboard', icon: 'grid' },
    { to: '/dashboard/restaurant/manage', label: 'My Restaurant', icon: 'store' },
    { to: '/food', label: 'Public Listing', icon: 'coffee' },
    { to: '/notifications', label: 'Notifications', icon: 'bell', badge: true },
  ],
  admin: [
    { to: '/dashboard/admin', label: 'Overview', icon: 'grid' },
    { to: '/dashboard/admin/users', label: 'Users', icon: 'users' },
    { to: '/dashboard/admin/verifications', label: 'Verifications', icon: 'shield' },
    { to: '/dashboard/admin/reports', label: 'Reports', icon: 'chart' },
    { to: '/notifications', label: 'Notifications', icon: 'bell', badge: true },
  ],
}

const ICONS = {
  grid: <><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></>,
  tool: <><path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/></>,
  bag: <><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></>,
  coffee: <><path d="M18 8h1a4 4 0 010 8h-1"/><path d="M2 8h16v9a4 4 0 01-4 4H6a4 4 0 01-4-4V8z"/><line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/></>,
  store: <><path d="M3 9l2-5h14l2 5"/><path d="M4 10h16v9a2 2 0 01-2 2H6a2 2 0 01-2-2v-9z"/><path d="M9 21v-6h6v6"/></>,
  clipboard: <><path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2"/><rect x="8" y="2" width="8" height="4" rx="1"/></>,
  package: <><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 002 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></>,
  wallet: <><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/><circle cx="17" cy="15" r="1" fill="currentColor"/></>,
  gift: <><polyline points="20 12 20 22 4 22 4 12"/><rect x="2" y="7" width="20" height="5"/><path d="M12 22V7"/><path d="M12 7H7.5a2.5 2.5 0 010-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 000-5C13 2 12 7 12 7z"/></>,
  bell: <><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></>,
  calendar: <><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></>,
  shield: <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>,
  users: <><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></>,
  chart: <><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></>,
  zap: <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>,
  logout: <><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></>,
}

function NavIcon({ name }) {
  return (
    <svg className="w-[17px] h-[17px] flex-shrink-0" fill="none" viewBox="0 0 24 24"
      stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
      {ICONS[name]}
    </svg>
  )
}

export default function Sidebar({ mobile, onClose }) {
  const { user, logout } = useAuth()
  const { unreadCount } = useNotifications()
  const navigate = useNavigate()
  const [showLogout, setShowLogout] = useState(false)
  const [logoutLoading, setLogoutLoading] = useState(false)

  const items = NAV[user?.role] || NAV.customer

  const handleLogout = async () => {
    setLogoutLoading(true)
    await logout()
    navigate('/login')
  }

  const initials = `${user?.first_name?.[0] || ''}${user?.last_name?.[0] || ''}`

  return (
    <>
      <aside className="flex flex-col h-full bg-white border-r border-slate-100" style={{ width: mobile ? 272 : 252 }}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 flex-shrink-0">
          <HudumaLogo size="md" />
          {mobile && (
            <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 transition-colors ml-2">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          )}
        </div>

        <div className="px-3 py-3 border-b border-slate-100 flex-shrink-0">
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-slate-50">
            <div className="w-9 h-9 rounded-full flex items-center justify-center text-white font-semibold text-sm flex-shrink-0"
              style={{ background: 'linear-gradient(135deg,#0d9488,#0f766e)' }}>
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-slate-900 truncate leading-tight">
                {user?.first_name} {user?.last_name}
              </p>
              <p className="text-[11px] text-slate-400 capitalize mt-0.5">{user?.role?.replace('_', ' ')}</p>
            </div>
            {user?.is_verified && (
              <svg className="w-4 h-4 flex-shrink-0" style={{ color: '#0d9488' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
              </svg>
            )}
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-0.5">
          {items.map(item => (
            <NavLink key={item.to} to={item.to} end={item.to.split('/').length <= 3}
              onClick={mobile ? onClose : undefined}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13.5px] font-medium transition-all duration-150 relative
                ${isActive
                  ? 'text-teal-700 font-semibold'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`
              }
              style={({ isActive }) => isActive ? { background: 'rgba(13,148,136,0.08)', color: '#0f766e' } : {}}
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-r-full" style={{ background: '#0d9488' }}/>
                  )}
                  <span style={{ color: isActive ? '#0d9488' : '#94a3b8' }}>
                    <NavIcon name={item.icon} />
                  </span>
                  <span className="flex-1">{item.label}</span>
                  {item.badge && unreadCount > 0 && (
                    <span className="text-[10px] font-bold text-white px-1.5 py-0.5 rounded-full min-w-[18px] text-center"
                      style={{ background: '#0d9488', fontSize: 10 }}>
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="px-3 pb-4 pt-2 border-t border-slate-100 flex-shrink-0">
          <button onClick={() => setShowLogout(true)}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13.5px] font-medium text-slate-500 hover:bg-red-50 hover:text-red-600 transition-all duration-150">
            <NavIcon name="logout" />
            Sign Out
          </button>
        </div>
      </aside>

      <ConfirmModal
        open={showLogout}
        onClose={() => setShowLogout(false)}
        onConfirm={handleLogout}
        title="Sign out of HudumaLink?"
        message="Are you sure you want to sign out? You can sign back in at any time."
        confirmLabel="Sign Out"
        danger
        loading={logoutLoading}
      />
    </>
  )
}
