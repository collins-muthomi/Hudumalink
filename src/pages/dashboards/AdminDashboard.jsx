import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { adminAPI } from '../../services/api'

export default function AdminDashboard() {
  const [stats, setStats] = useState(null)
  const [verifications, setVerifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [approving, setApproving] = useState(null)

  useEffect(() => {
    Promise.allSettled([adminAPI.stats(), adminAPI.pendingVerifications()])
      .then(([s, v]) => {
        setStats(s.status === 'fulfilled' ? s.value.data : null)
        setVerifications(v.status === 'fulfilled' ? (v.value.data.results || v.value.data).slice(0, 5) : [])
      }).finally(() => setLoading(false))
  }, [])

  const handleApprove = async (id) => {
    setApproving(id)
    try {
      await adminAPI.approveVerification(id)
      setVerifications(prev => prev.filter(v => v.id !== id))
    } catch {} finally { setApproving(null) }
  }

  const statCards = [
    { label: 'Total Users', value: stats?.total_users || 0, icon: '👥', color: 'bg-blue-50 text-blue-600' },
    { label: 'Providers', value: stats?.total_providers || 0, icon: '🛠️', color: 'bg-purple-50 text-purple-600' },
    { label: "Today's Orders", value: stats?.today_orders || 0, icon: '📦', color: 'bg-orange-50 text-orange-600' },
    { label: 'Revenue (Month)', value: `KSh ${Number(stats?.monthly_revenue || 0).toLocaleString()}`, icon: '💰', color: 'bg-emerald-50 text-emerald-600' },
    { label: 'Pending Verifications', value: stats?.pending_verifications || 0, icon: '🛡️', color: 'bg-amber-50 text-amber-600' },
    { label: 'Active Drivers', value: stats?.active_drivers || 0, icon: '🚴', color: 'bg-teal-50 text-teal-600' },
  ]

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8 animate-fade-in">
      <div>
        <h1 className="font-display font-bold text-2xl text-slate-900">Admin Dashboard</h1>
        <p className="text-slate-500 mt-1 text-sm">Platform overview — Nyeri County</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? Array(6).fill(0).map((_, i) => (
          <div key={i} className="card p-5 space-y-3"><div className="skeleton h-4 w-20 rounded" /><div className="skeleton h-8 w-28 rounded" /></div>
        )) : statCards.map(s => (
          <div key={s.label} className="card p-5">
            <div className={`w-9 h-9 rounded-xl ${s.color} bg-opacity-80 flex items-center justify-center text-xl mb-3`}>{s.icon}</div>
            <p className="text-xs text-slate-500 font-medium">{s.label}</p>
            <p className="font-display font-bold text-2xl text-slate-900 mt-0.5">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Quick nav */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { to: '/dashboard/admin/users', label: 'Manage Users', emoji: '👥' },
          { to: '/dashboard/admin/verifications', label: 'Verifications', emoji: '🛡️' },
          { to: '/dashboard/admin/reports', label: 'Reports', emoji: '📊' },
          { to: '/notifications', label: 'Notifications', emoji: '🔔' },
        ].map(l => (
          <Link key={l.to} to={l.to} className="card p-4 flex flex-col items-center gap-2 hover:shadow-card-hover transition-shadow text-center">
            <span className="text-2xl">{l.emoji}</span>
            <span className="text-xs font-medium text-slate-700">{l.label}</span>
          </Link>
        ))}
      </div>

      {/* Pending verifications */}
      <div className="card">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <h2 className="font-display font-semibold text-slate-800">Pending Provider Verifications</h2>
          <div className="flex items-center gap-3">
            <span className="badge bg-amber-100 text-amber-700">{verifications.length} pending</span>
            <Link to="/dashboard/admin/verifications" className="text-sm font-medium text-slate-600 hover:text-slate-900">
              View all
            </Link>
          </div>
        </div>
        <div className="divide-y divide-slate-50">
          {loading ? Array(3).fill(0).map((_, i) => (
            <div key={i} className="px-5 py-4"><div className="skeleton h-10 w-full rounded" /></div>
          )) : verifications.length === 0 ? (
            <div className="px-5 py-10 text-center">
              <p className="text-3xl mb-2">✅</p>
              <p className="text-sm text-slate-400">No pending verifications</p>
            </div>
          ) : verifications.map(v => (
            <div key={v.id} className="px-5 py-3.5 flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-slate-800">{v.provider_name}</p>
                <p className="text-xs text-slate-400">{v.service_type} · Submitted {v.submitted_at}</p>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <button
                  onClick={() => handleApprove(v.id)}
                  disabled={approving === v.id}
                  className="text-xs font-medium bg-emerald-100 text-emerald-700 hover:bg-emerald-200 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                >
                  {approving === v.id ? '…' : 'Approve'}
                </button>
                <button className="text-xs font-medium bg-red-100 text-red-700 hover:bg-red-200 px-3 py-1.5 rounded-lg transition-colors">
                  Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
