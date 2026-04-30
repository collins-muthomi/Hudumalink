import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useNotifications, useToast } from '../../context/contexts'
import { authAPI } from '../../services/api'
import ThemeToggle from '../ui/ThemeToggle'
import Modal from '../ui/Modal'
import Button from '../ui/Button'
import Input from '../ui/Input'

export default function Topbar({ onMenuClick }) {
  const { user, logout } = useAuth()
  const { unreadCount } = useNotifications()
  const { toast } = useToast()
  const navigate = useNavigate()
  const menuRef = useRef(null)

  const [menuOpen, setMenuOpen] = useState(false)
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [logoutLoading, setLogoutLoading] = useState(false)
  const [passwordLoading, setPasswordLoading] = useState(false)
  const [passwordForm, setPasswordForm] = useState({
    current_password: '',
    new_password: '',
    confirm_password: '',
  })
  const [passwordErrors, setPasswordErrors] = useState({})

  const initials = `${user?.first_name?.[0] || ''}${user?.last_name?.[0] || ''}`
  const dashboardPath = user
    ? {
        customer: '/dashboard/customer',
        provider: '/dashboard/provider',
        delivery_driver: '/services',
        restaurant_owner: '/services',
        admin: '/dashboard/admin',
      }[user.role] || '/'
    : '#'

  const menuItems = useMemo(() => {
    if (!user) return []

    const common = [
      { label: 'Dashboard', to: dashboardPath },
      { label: 'Notifications', to: '/notifications', badge: unreadCount > 0 ? unreadCount : null },
      { label: 'Browse Services', to: '/services' },
    ]

    const roleSpecific = {
      admin: [
        { label: 'Manage Users', to: '/dashboard/admin/users' },
        { label: 'Verifications', to: '/dashboard/admin/verifications' },
        { label: 'Reports', to: '/dashboard/admin/reports' },
      ],
      provider: [
        { label: 'My Services', to: '/dashboard/provider/services' },
        { label: 'My Jobs', to: '/dashboard/provider/jobs' },
        { label: 'Verification', to: '/dashboard/provider/verification' },
      ],
      customer: [
        { label: 'My Requests', to: '/my-requests' },
        { label: 'Wallet', to: '/wallet' },
        { label: 'Referrals', to: '/referrals' },
      ],
      delivery_driver: [
        { label: 'Wallet', to: '/wallet' },
      ],
      restaurant_owner: [
        { label: 'Wallet', to: '/wallet' },
      ],
    }

    return [...common, ...(roleSpecific[user.role] || []), { label: 'Public Website', to: '/' }]
  }, [dashboardPath, unreadCount, user])

  useEffect(() => {
    if (!menuOpen) return

    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false)
      }
    }

    const handleEscape = (event) => {
      if (event.key === 'Escape') setMenuOpen(false)
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [menuOpen])

  const setPasswordField = (key, value) => {
    setPasswordForm((current) => ({ ...current, [key]: value }))
    setPasswordErrors((current) => ({ ...current, [key]: '', general: '' }))
  }

  const resetPasswordModal = () => {
    setShowPasswordModal(false)
    setPasswordForm({
      current_password: '',
      new_password: '',
      confirm_password: '',
    })
    setPasswordErrors({})
  }

  const handleChangePassword = async () => {
    const nextErrors = {}

    if (!passwordForm.current_password) nextErrors.current_password = 'Current password is required.'
    if (!passwordForm.new_password) nextErrors.new_password = 'New password is required.'
    else if (passwordForm.new_password.length < 8) nextErrors.new_password = 'Use at least 8 characters.'
    if (passwordForm.new_password !== passwordForm.confirm_password) {
      nextErrors.confirm_password = 'Passwords do not match.'
    }
    if (passwordForm.current_password && passwordForm.new_password && passwordForm.current_password === passwordForm.new_password) {
      nextErrors.new_password = 'New password must be different from the current password.'
    }

    if (Object.keys(nextErrors).length > 0) {
      setPasswordErrors(nextErrors)
      return
    }

    setPasswordLoading(true)
    try {
      await authAPI.changePassword({
        current_password: passwordForm.current_password,
        new_password: passwordForm.new_password,
      })
      toast.success('Password updated', 'Your account password has been changed successfully.')
      resetPasswordModal()
    } catch (error) {
      const message = error.response?.data?.detail || error.response?.data?.current_password || 'Unable to change password right now.'
      setPasswordErrors({ general: Array.isArray(message) ? message[0] : message })
      toast.error('Password change failed', Array.isArray(message) ? message[0] : message)
    } finally {
      setPasswordLoading(false)
    }
  }

  const handleLogout = async () => {
    setLogoutLoading(true)
    try {
      await logout()
      setMenuOpen(false)
      navigate('/login')
    } finally {
      setLogoutLoading(false)
    }
  }

  const openPasswordModal = () => {
    setMenuOpen(false)
    setShowPasswordModal(true)
  }

  return (
    <>
      <header className="h-16 bg-white dark:bg-slate-800 border-b border-slate-100 dark:border-slate-700 flex items-center px-4 lg:px-6 gap-4 sticky top-0 z-20 flex-shrink-0 transition-colors duration-300">
        <button onClick={onMenuClick}
          className="lg:hidden p-2 rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-all flex-shrink-0">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16"/>
          </svg>
        </button>

        <div className="flex-1 max-w-md">
          <label className="flex items-center gap-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 cursor-text hover:border-teal-300 hover:bg-white dark:hover:bg-slate-900 transition-all focus-within:border-teal-400 focus-within:bg-white dark:focus-within:bg-slate-900 focus-within:ring-2 focus-within:ring-teal-100 dark:focus-within:ring-teal-900/40">
            <svg className="w-4 h-4 text-slate-400 dark:text-slate-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
            <input type="search" placeholder="Search services, products..."
              className="flex-1 text-sm text-slate-700 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 bg-transparent outline-none min-w-0"/>
          </label>
        </div>

        <div className="flex items-center gap-1.5 ml-auto">
          <ThemeToggle />

          <Link to="/notifications"
            className="relative p-2.5 rounded-xl text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-all">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/>
            </svg>
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 min-w-[16px] h-4 px-1 rounded-full ring-2 ring-white bg-teal-600 text-[10px] leading-4 text-white text-center font-semibold">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </Link>

          <div className="w-px h-6 bg-slate-200 mx-1"/>

          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setMenuOpen((current) => !current)}
              className="flex items-center gap-2.5 px-1 py-1 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-white font-semibold text-xs flex-shrink-0"
                style={{ background: 'linear-gradient(135deg,#0d9488,#0f766e)' }}>
                {initials}
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-sm font-semibold text-slate-900 leading-tight">{user?.first_name}</p>
                <p className="text-[11px] text-slate-400 capitalize">{user?.role?.replace('_', ' ')}</p>
              </div>
              <svg className={`hidden sm:block w-3.5 h-3.5 text-slate-400 transition-transform ${menuOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7"/>
              </svg>
            </button>

            {menuOpen && (
              <div className="absolute right-0 mt-2 w-[270px] overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-[0_24px_60px_-32px_rgba(15,23,42,0.45)]">
                <div className="border-b border-slate-100 dark:border-slate-800 px-4 py-4">
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{`${user?.first_name || ''} ${user?.last_name || ''}`.trim()}</p>
                  <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{user?.email}</p>
                  <div className="mt-2 inline-flex rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-emerald-700">
                    {user?.role?.replace('_', ' ')}
                  </div>
                </div>

                <div className="p-2">
                  {menuItems.map((item) => (
                    <Link
                      key={item.label}
                      to={item.to}
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center justify-between rounded-xl px-3 py-2.5 text-sm text-slate-700 dark:text-slate-200 transition hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
                    >
                      <span>{item.label}</span>
                      {item.badge ? (
                        <span className="rounded-full bg-teal-50 px-2 py-0.5 text-[11px] font-semibold text-teal-700">
                          {item.badge > 9 ? '9+' : item.badge}
                        </span>
                      ) : null}
                    </Link>
                  ))}

                  <button
                    type="button"
                    onClick={openPasswordModal}
                    className="flex w-full items-center rounded-xl px-3 py-2.5 text-sm text-slate-700 dark:text-slate-200 transition hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
                  >
                    Change Password
                  </button>

                  <button
                    type="button"
                    onClick={handleLogout}
                    disabled={logoutLoading}
                    className="flex w-full items-center rounded-xl px-3 py-2.5 text-sm text-red-600 transition hover:bg-red-50 disabled:opacity-60"
                  >
                    {logoutLoading ? 'Signing out...' : 'Sign Out'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      <Modal
        open={showPasswordModal}
        onClose={resetPasswordModal}
        title="Change Password"
        size="sm"
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={resetPasswordModal} disabled={passwordLoading}>
              Cancel
            </Button>
            <Button onClick={handleChangePassword} loading={passwordLoading}>
              Update Password
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          {passwordErrors.general && (
            <div className="rounded-xl border border-red-100 bg-red-50 px-3 py-2.5 text-sm text-red-600">
              {passwordErrors.general}
            </div>
          )}

          <Input
            label="Current password"
            type="password"
            value={passwordForm.current_password}
            onChange={(event) => setPasswordField('current_password', event.target.value)}
            error={passwordErrors.current_password}
            autoComplete="current-password"
          />

          <Input
            label="New password"
            type="password"
            value={passwordForm.new_password}
            onChange={(event) => setPasswordField('new_password', event.target.value)}
            error={passwordErrors.new_password}
            hint="Use at least 8 characters."
            autoComplete="new-password"
          />

          <Input
            label="Confirm new password"
            type="password"
            value={passwordForm.confirm_password}
            onChange={(event) => setPasswordField('confirm_password', event.target.value)}
            error={passwordErrors.confirm_password}
            autoComplete="new-password"
          />
        </div>
      </Modal>
    </>
  )
}
