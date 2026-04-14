import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { requestsAPI, marketplaceAPI, walletAPI, serviceBookingsAPI } from '../../services/api'

const SkeletonCard = () => (
  <div className="card p-5 space-y-3">
    <div className="skeleton h-4 w-24 rounded" />
    <div className="skeleton h-8 w-32 rounded" />
    <div className="skeleton h-3 w-20 rounded" />
  </div>
)

const StatCard = ({ label, value, sub, icon, color }) => (
  <div className="card p-5 flex items-start gap-4">
    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0 ${color}`}>{icon}</div>
    <div>
      <p className="text-xs text-slate-500 font-medium">{label}</p>
      <p className="font-display font-bold text-2xl text-slate-900 mt-0.5">{value}</p>
      {sub && <p className="text-xs text-slate-400 mt-1">{sub}</p>}
    </div>
  </div>
)

const quickLinks = [
  { to: '/services', emoji: '🛠️', label: 'Book Service', color: 'bg-blue-50' },
  { to: '/marketplace', emoji: '🛒', label: 'Shop', color: 'bg-purple-50' },
  { to: '/food', emoji: '🍔', label: 'Order Food', color: 'bg-orange-50' },
  { to: '/wallet', emoji: '💳', label: 'Wallet', color: 'bg-emerald-50' },
  { to: '/my-requests', emoji: '📋', label: 'My Requests', color: 'bg-teal-50' },
  { to: '/referrals', emoji: '🎁', label: 'Refer & Earn', color: 'bg-pink-50' },
]

export default function CustomerDashboard() {
  const { user } = useAuth()
  const [stats, setStats] = useState(null)
  const [requests, setRequests] = useState([])
  const [bookings, setBookings] = useState([])
  const [orders, setOrders] = useState([])
  const [pendingConfirmations, setPendingConfirmations] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.allSettled([
      walletAPI.balance(),
      requestsAPI.my({ limit: 5 }),
      serviceBookingsAPI.my({ limit: 5 }),
      marketplaceAPI.myOrders({ limit: 5 }),
    ]).then(([bal, reqs, booked, ords]) => {
      const requestResults = reqs.status === 'fulfilled' ? (reqs.value.data.results || reqs.value.data) : []
      const bookingResults = booked.status === 'fulfilled' ? (booked.value.data.results || booked.value.data) : []
      setStats({
        balance: bal.status === 'fulfilled' ? bal.value.data.balance : 0,
        requests: requestResults.length,
        bookings: bookingResults.length,
        orders: ords.status === 'fulfilled' ? ords.value.data.count || ords.value.data.results?.length || 0 : 0,
      })
      setRequests(requestResults.slice(0, 4))
      setBookings(bookingResults.slice(0, 4))
      setOrders(ords.status === 'fulfilled' ? (ords.value.data.results || ords.value.data).slice(0, 4) : [])
      setPendingConfirmations([
        ...requestResults
          .filter(r => r.status === 'completion_requested')
          .map(r => ({ type: 'request', id: r._id || r.id, title: r.title, provider: r.assigned_provider_name, to: `/services/request/${r._id || r.id}` })),
        ...bookingResults
          .filter(b => b.status === 'completion_requested')
          .map(b => ({ type: 'booking', id: b._id || b.id, title: b.service_title || b.title, provider: b.provider_name, to: `/services/bookings/${b._id || b.id}` })),
      ].slice(0, 5))
    }).finally(() => setLoading(false))
  }, [])

  const statusBadge = (s) => {
    const map = {
      pending: 'bg-amber-100 text-amber-700',
      active: 'bg-blue-100 text-blue-700',
      completed: 'bg-emerald-100 text-emerald-700',
      cancelled: 'bg-red-100 text-red-700',
      delivered: 'bg-emerald-100 text-emerald-700',
    }
    return map[s] || 'bg-slate-100 text-slate-600'
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8 animate-fade-in">
      {/* Greeting */}
      <div>
        <h1 className="font-display font-bold text-2xl text-slate-900">
          Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'}, {user?.first_name} 👋
        </h1>
        <p className="text-slate-500 mt-1 text-sm">Here's what's happening today</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {loading ? (
          [1,2,3].map(i => <SkeletonCard key={i} />)
        ) : (
          <>
            <StatCard label="Wallet Balance" value={`KSh ${Number(stats?.balance || 0).toLocaleString()}`} sub="Available funds" icon="💳" color="bg-emerald-50" />
            <StatCard label="Active Requests" value={stats?.requests || 0} sub="Service requests" icon="📋" color="bg-blue-50" />
            <StatCard label="Total Orders" value={stats?.orders || 0} sub="Marketplace orders" icon="📦" color="bg-purple-50" />
          </>
        )}
      </div>

      {/* Quick links */}
      <div>
        <h2 className="font-display font-semibold text-lg text-slate-800 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
          {quickLinks.map(ql => (
            <Link
              key={ql.to}
              to={ql.to}
              className={`${ql.color} rounded-2xl p-4 flex flex-col items-center gap-2 hover:scale-105 transition-transform duration-200 border border-transparent hover:border-slate-200`}
            >
              <span className="text-2xl">{ql.emoji}</span>
              <span className="text-xs font-medium text-slate-700 text-center">{ql.label}</span>
            </Link>
          ))}
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Requests */}
        <div className="card">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <h2 className="font-display font-semibold text-slate-800">Recent Service Requests</h2>
            <Link to="/my-requests" className="text-xs text-primary-600 font-medium hover:underline">View all</Link>
          </div>
          <div className="divide-y divide-slate-50">
            {loading ? (
              Array(3).fill(0).map((_, i) => (
                <div key={i} className="px-5 py-3.5 flex gap-3">
                  <div className="skeleton h-4 w-full rounded" />
                </div>
              ))
            ) : requests.length === 0 ? (
          <div className="px-5 py-8 text-center">
            <p className="text-3xl mb-2">📋</p>
            <p className="text-sm text-slate-400">No service requests yet</p>
            <Link to="/services/request/new" className="text-xs text-primary-600 mt-2 inline-block hover:underline">Post a request →</Link>
          </div>
            ) : requests.map(r => (
              <Link key={r.id} to={`/services/request/${r.id}`} className="px-5 py-3.5 flex items-center justify-between hover:bg-slate-50 transition-colors">
                <div>
                  <p className="text-sm font-medium text-slate-800 truncate max-w-[200px]">{r.title}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{r.category}</p>
                </div>
                <span className={`badge ${statusBadge(r.status)} capitalize`}>{r.status}</span>
              </Link>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <h2 className="font-display font-semibold text-slate-800">Awaiting Your Confirmation</h2>
            <Link to="/my-requests" className="text-xs text-primary-600 font-medium hover:underline">Open jobs</Link>
          </div>
          <div className="divide-y divide-slate-50">
            {loading ? (
              Array(3).fill(0).map((_, i) => (
                <div key={i} className="px-5 py-3.5 flex gap-3">
                  <div className="skeleton h-4 w-full rounded" />
                </div>
              ))
            ) : pendingConfirmations.length === 0 ? (
              <div className="px-5 py-8 text-center">
                <p className="text-3xl mb-2">✅</p>
                <p className="text-sm text-slate-400">No jobs waiting for your confirmation</p>
              </div>
            ) : pendingConfirmations.map(item => (
              <Link key={`${item.type}-${item.id}`} to={item.to} className="px-5 py-3.5 flex items-center justify-between hover:bg-slate-50 transition-colors">
                <div>
                  <p className="text-sm font-medium text-slate-800">{item.title}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{item.provider || 'Assigned provider'}</p>
                </div>
                <span className="badge bg-purple-100 text-purple-700">Confirm</span>
              </Link>
            ))}
          </div>
        </div>

        {/* Recent Orders */}
        <div className="card">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <h2 className="font-display font-semibold text-slate-800">Recent Orders</h2>
            <Link to="/my-orders" className="text-xs text-primary-600 font-medium hover:underline">View all</Link>
          </div>
          <div className="divide-y divide-slate-50">
            {loading ? (
              Array(3).fill(0).map((_, i) => (
                <div key={i} className="px-5 py-3.5 flex gap-3">
                  <div className="skeleton h-4 w-full rounded" />
                </div>
              ))
            ) : orders.length === 0 ? (
              <div className="px-5 py-8 text-center">
                <p className="text-3xl mb-2">📦</p>
                <p className="text-sm text-slate-400">No orders yet</p>
                <Link to="/marketplace" className="text-xs text-primary-600 mt-2 inline-block hover:underline">Browse marketplace →</Link>
              </div>
            ) : orders.map(o => (
              <div key={o.id} className="px-5 py-3.5 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-800">{o.product_name || o.title}</p>
                  <p className="text-xs text-slate-400 mt-0.5">KSh {Number(o.total || o.price || 0).toLocaleString()}</p>
                </div>
                <span className={`badge ${statusBadge(o.status)} capitalize`}>{o.status}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
