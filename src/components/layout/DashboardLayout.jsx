import { useState, useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import Topbar from './Topbar'
import { notificationsAPI } from '../../services/api'
import { useNotifications } from '../../context/contexts'

export default function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { setCount } = useNotifications()

  useEffect(() => {
    notificationsAPI.unreadCount()
      .then(res => setCount(res.data?.count || 0))
      .catch(() => {})
  }, [setCount])

  // Close mobile sidebar on resize to desktop
  useEffect(() => {
    const handler = () => { if (window.innerWidth >= 1024) setSidebarOpen(false) }
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [])

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">

      {/* Desktop sidebar — fixed height, internal scroll */}
      <div className="hidden lg:flex lg:flex-shrink-0">
        <Sidebar />
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px]"
            onClick={() => setSidebarOpen(false)}
          />
          {/* Drawer */}
          <div className="relative animate-slide-in-right">
            <Sidebar mobile onClose={() => setSidebarOpen(false)} />
          </div>
        </div>
      )}

      {/* Main column — sticky topbar + scrollable content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Sticky topbar */}
        <Topbar onMenuClick={() => setSidebarOpen(true)} />

        {/* Scrollable page content */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
