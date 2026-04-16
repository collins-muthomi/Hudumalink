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
      .then(([statsResponse, verificationsResponse]) => {
        setStats(statsResponse.status === 'fulfilled' ? statsResponse.value.data : null)
        setVerifications(verificationsResponse.status === 'fulfilled' ? (verificationsResponse.value.data.results || verificationsResponse.value.data).slice(0, 5) : [])
      })
      .finally(() => setLoading(false))
  }, [])

  const handleApprove = async (id) => {
    setApproving(id)
    try {
      await adminAPI.approveVerification(id)
      setVerifications((current) => current.filter((verification) => verification.id !== id))
    } finally {
      setApproving(null)
    }
  }

  const statCards = [
    { label: 'Total Users', value: stats?.total_users || 0, icon: 'Users', color: 'bg-blue-50 text-blue-600' },
    { label: 'Providers', value: stats?.total_providers || 0, icon: 'Pros', color: 'bg-purple-50 text-purple-600' },
    { label: "Today's Jobs", value: stats?.today_orders || 0, icon: 'Jobs', color: 'bg-orange-50 text-orange-600' },
    { label: 'Escrow Held', value: `KSh ${Number(stats?.escrow_balance || 0).toLocaleString()}`, icon: 'Hold', color: 'bg-sky-50 text-sky-700' },
    { label: 'Commission (Month)', value: `KSh ${Number(stats?.monthly_revenue || 0).toLocaleString()}`, icon: 'KES', color: 'bg-emerald-50 text-emerald-600' },
    { label: 'Pending Verifications', value: stats?.pending_verifications || 0, icon: 'Check', color: 'bg-amber-50 text-amber-600' },
  ]

  return (
    <div className="space-y-8 p-4 sm:p-6 lg:p-8 animate-fade-in">
      <div>
        <h1 className="font-display text-2xl font-bold text-slate-900">Admin Dashboard</h1>
        <p className="mt-1 text-sm text-slate-500">Service-first overview for requests, bookings, escrow balances, and provider verification activity.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        {loading ? Array(6).fill(0).map((_, index) => (
          <div key={index} className="card p-5 space-y-3">
            <div className="skeleton h-4 w-20 rounded" />
            <div className="skeleton h-8 w-28 rounded" />
          </div>
        )) : statCards.map((stat) => (
          <div key={stat.label} className="card p-5">
            <div className={`mb-3 flex h-9 w-9 items-center justify-center rounded-xl text-xs font-semibold ${stat.color}`}>{stat.icon}</div>
            <p className="text-xs font-medium text-slate-500">{stat.label}</p>
            <p className="mt-0.5 font-display text-2xl font-bold text-slate-900">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { to: '/dashboard/admin/users', label: 'Manage Users', icon: 'Users' },
          { to: '/dashboard/admin/verifications', label: 'Verifications', icon: 'Verify' },
          { to: '/dashboard/admin/reports', label: 'Escrow Reports', icon: 'Reports' },
          { to: '/notifications', label: 'Notifications', icon: 'Alerts' },
        ].map((item) => (
          <Link key={item.to} to={item.to} className="card flex flex-col items-center gap-2 p-4 text-center transition-shadow hover:shadow-card-hover">
            <span className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">{item.icon}</span>
            <span className="text-xs font-medium text-slate-700">{item.label}</span>
          </Link>
        ))}
      </div>

      <div className="card">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <h2 className="font-display font-semibold text-slate-800">Pending Provider Verifications</h2>
          <div className="flex items-center gap-3">
            <span className="badge bg-amber-100 text-amber-700">{verifications.length} pending</span>
            <Link to="/dashboard/admin/verifications" className="text-sm font-medium text-slate-600 hover:text-slate-900">
              View all
            </Link>
          </div>
        </div>
        <div className="divide-y divide-slate-50">
          {loading ? Array(3).fill(0).map((_, index) => (
            <div key={index} className="px-5 py-4">
              <div className="skeleton h-10 w-full rounded" />
            </div>
          )) : verifications.length === 0 ? (
            <div className="px-5 py-10 text-center">
              <p className="text-sm text-slate-400">No pending verifications</p>
            </div>
          ) : verifications.map((verification) => (
            <div key={verification.id} className="flex items-center justify-between gap-3 px-5 py-3.5">
              <div>
                <p className="text-sm font-medium text-slate-800">{verification.provider_name}</p>
                <p className="text-xs text-slate-400">{verification.service_type} · Submitted {verification.submitted_at}</p>
              </div>
              <button
                onClick={() => handleApprove(verification.id)}
                disabled={approving === verification.id}
                className="rounded-lg bg-emerald-100 px-3 py-1.5 text-xs font-medium text-emerald-700 transition-colors hover:bg-emerald-200 disabled:opacity-50"
              >
                {approving === verification.id ? '...' : 'Approve'}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
