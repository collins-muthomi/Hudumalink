import { useState, useEffect } from 'react'
import { notificationsAPI } from '../services/api'
import { useNotifications } from '../context/contexts'
import Button from '../components/ui/Button'

const typeIcon = {
  order: '📦',
  booking: '📅',
  payment: '💳',
  service: '🛠️',
  system: '🔔',
  promo: '🎉',
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [markingAll, setMarkingAll] = useState(false)
  const { setCount } = useNotifications()

  useEffect(() => {
    notificationsAPI.list()
      .then(r => setNotifications(r.data.results || r.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const handleMarkRead = async (id) => {
    try {
      await notificationsAPI.markRead(id)
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
      setCount(prev => Math.max(0, prev - 1))
    } catch {}
  }

  const handleMarkAllRead = async () => {
    setMarkingAll(true)
    try {
      await notificationsAPI.markAllRead()
      setNotifications(prev => prev.map(n => ({ ...n, read: true })))
      setCount(0)
    } catch {}
    finally { setMarkingAll(false) }
  }

  const handleDelete = async (id) => {
    try {
      await notificationsAPI.delete(id)
      setNotifications(prev => prev.filter(n => n.id !== id))
    } catch {}
  }

  const filtered = filter === 'all' ? notifications : filter === 'unread' ? notifications.filter(n => !n.read) : notifications.filter(n => n.read)
  const unreadCount = notifications.filter(n => !n.read).length

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-2xl mx-auto space-y-5 animate-fade-in">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-display font-bold text-2xl text-slate-900">Notifications</h1>
          <p className="text-slate-500 text-sm mt-1">{unreadCount > 0 ? `${unreadCount} unread` : 'All caught up!'}</p>
        </div>
        {unreadCount > 0 && (
          <Button variant="ghost" size="sm" onClick={handleMarkAllRead} loading={markingAll}>
            Mark all read
          </Button>
        )}
      </div>

      {/* Filter */}
      <div className="flex gap-2">
        {['all', 'unread', 'read'].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`text-xs font-medium px-3.5 py-2 rounded-full border capitalize transition-all ${filter === f ? 'bg-primary-600 text-white border-primary-600' : 'border-slate-200 text-slate-600 hover:border-primary-300'}`}>
            {f}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array(5).fill(0).map((_, i) => (
            <div key={i} className="card p-4 flex gap-3">
              <div className="skeleton w-10 h-10 rounded-full flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="skeleton h-4 w-3/4 rounded" />
                <div className="skeleton h-3 w-1/2 rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-5xl mb-4">🔔</p>
          <p className="font-semibold text-slate-700">No notifications</p>
          <p className="text-sm text-slate-400 mt-1">You're all caught up!</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(n => (
            <div
              key={n.id}
              onClick={() => !n.read && handleMarkRead(n.id)}
              className={`card p-4 flex gap-3 cursor-pointer transition-all hover:shadow-card-hover group ${!n.read ? 'border-l-4 border-l-primary-400' : ''}`}
            >
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xl flex-shrink-0 ${!n.read ? 'bg-primary-50' : 'bg-slate-50'}`}>
                {typeIcon[n.type] || '🔔'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <p className={`text-sm ${!n.read ? 'font-semibold text-slate-900' : 'font-medium text-slate-700'}`}>{n.title}</p>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDelete(n.id) }}
                    className="opacity-0 group-hover:opacity-100 p-1 rounded text-slate-300 hover:text-red-400 transition-all flex-shrink-0"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                {n.message && <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{n.message}</p>}
                <p className="text-[10px] text-slate-400 mt-1.5">
                  {n.created_at ? new Date(n.created_at).toLocaleString() : 'Just now'}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
