import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { requestsAPI, walletAPI, serviceBookingsAPI } from '../../services/api'

const SkeletonCard = () => (
  <div className="card p-5 space-y-3">
    <div className="skeleton h-4 w-24 rounded" />
    <div className="skeleton h-8 w-32 rounded" />
    <div className="skeleton h-3 w-20 rounded" />
  </div>
)

const StatCard = ({ label, value, sub, icon, color }) => (
  <div className="card p-5 flex items-start gap-4">
    <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl text-xs font-semibold ${color}`}>{icon}</div>
    <div>
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <p className="mt-0.5 font-display text-2xl font-bold text-slate-900">{value}</p>
      {sub && <p className="mt-1 text-xs text-slate-400">{sub}</p>}
    </div>
  </div>
)

const quickLinks = [
  { to: '/services', icon: 'Browse', label: 'Browse Services', color: 'bg-blue-50' },
  { to: '/services/request/new', icon: 'New', label: 'Post Request', color: 'bg-purple-50' },
  { to: '/wallet', icon: 'Pay', label: 'Wallet', color: 'bg-emerald-50' },
  { to: '/my-requests', icon: 'Track', label: 'My Requests', color: 'bg-teal-50' },
  { to: '/referrals', icon: 'Earn', label: 'Refer & Earn', color: 'bg-pink-50' },
]

const categoryLinks = [
  { to: '/services?category=home-services', label: 'Home Services', sub: 'Plumbing, electrical, cleaning', color: 'bg-emerald-50 border-emerald-100' },
  { to: '/services?category=beauty', label: 'Beauty', sub: 'Barber, salon, nails', color: 'bg-rose-50 border-rose-100' },
  { to: '/services?category=tech', label: 'Tech', sub: 'Phone, laptop, WiFi setup', color: 'bg-sky-50 border-sky-100' },
  { to: '/services?category=moving', label: 'Moving', sub: 'House and furniture moving', color: 'bg-amber-50 border-amber-100' },
  { to: '/services?category=personal', label: 'Personal', sub: 'Tutoring, gardening, pet care, cobbler', color: 'bg-violet-50 border-violet-100' },
]

export default function CustomerDashboard() {
  const { user } = useAuth()
  const [stats, setStats] = useState(null)
  const [requests, setRequests] = useState([])
  const [pendingConfirmations, setPendingConfirmations] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.allSettled([
      walletAPI.balance(),
      requestsAPI.my({ limit: 5 }),
      serviceBookingsAPI.my({ limit: 5 }),
    ]).then(([bal, reqs, booked]) => {
      const requestResults = reqs.status === 'fulfilled' ? (reqs.value.data.results || reqs.value.data) : []
      const bookingResults = booked.status === 'fulfilled' ? (booked.value.data.results || booked.value.data) : []

      setStats({
        balance: bal.status === 'fulfilled' ? bal.value.data.balance : 0,
        requests: requestResults.length,
        bookings: bookingResults.length,
      })
      setRequests(requestResults.slice(0, 4))
      setPendingConfirmations([
        ...requestResults
          .filter((request) => request.status === 'completion_requested')
          .map((request) => ({
            type: 'request',
            id: request._id || request.id,
            title: request.title,
            provider: request.assigned_provider_name,
            to: `/services/request/${request._id || request.id}`,
          })),
        ...bookingResults
          .filter((booking) => booking.status === 'completion_requested')
          .map((booking) => ({
            type: 'booking',
            id: booking._id || booking.id,
            title: booking.service_title || booking.title,
            provider: booking.provider_name,
            to: `/services/bookings/${booking._id || booking.id}`,
          })),
      ].slice(0, 5))
    }).finally(() => setLoading(false))
  }, [])

  const statusBadge = (status) => {
    const map = {
      pending: 'bg-amber-100 text-amber-700',
      active: 'bg-blue-100 text-blue-700',
      completed: 'bg-emerald-100 text-emerald-700',
      cancelled: 'bg-red-100 text-red-700',
    }
    return map[status] || 'bg-slate-100 text-slate-600'
  }

  return (
    <div className="space-y-8 p-4 sm:p-6 lg:p-8 animate-fade-in">
      <div>
        <h1 className="font-display text-2xl font-bold text-slate-900">
          Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'}, {user?.first_name}
        </h1>
        <p className="mt-1 text-sm text-slate-500">Browse categories, secure payments in escrow, and keep tabs on every active job.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {loading ? (
          [1, 2, 3].map((item) => <SkeletonCard key={item} />)
        ) : (
          <>
            <StatCard label="Wallet Balance" value={`KSh ${Number(stats?.balance || 0).toLocaleString()}`} sub="Available funds" icon="Pay" color="bg-emerald-50" />
            <StatCard label="Active Requests" value={stats?.requests || 0} sub="Classified requests" icon="Jobs" color="bg-blue-50" />
            <StatCard label="Active Bookings" value={stats?.bookings || 0} sub="Direct service bookings" icon="Book" color="bg-purple-50" />
          </>
        )}
      </div>

      <div>
        <h2 className="mb-4 font-display text-lg font-semibold text-slate-800">Quick Actions</h2>
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-5">
          {quickLinks.map((quickLink) => (
            <Link
              key={quickLink.to}
              to={quickLink.to}
              className={`${quickLink.color} rounded-2xl border border-transparent p-4 text-center transition-transform duration-200 hover:scale-105 hover:border-slate-200`}
            >
              <span className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">{quickLink.icon}</span>
              <p className="mt-2 text-xs font-medium text-slate-700">{quickLink.label}</p>
            </Link>
          ))}
        </div>
      </div>

      <div>
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="font-display text-lg font-semibold text-slate-800">Browse By Category</h2>
          <Link to="/services" className="text-xs font-medium text-primary-600 hover:underline">See all services</Link>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          {categoryLinks.map((category) => (
            <Link
              key={category.to}
              to={category.to}
              className={`${category.color} rounded-2xl border p-4 transition-transform duration-200 hover:-translate-y-1 hover:border-slate-200`}
            >
              <p className="text-sm font-semibold text-slate-800">{category.label}</p>
              <p className="mt-2 text-xs leading-5 text-slate-500">{category.sub}</p>
            </Link>
          ))}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <h2 className="font-display font-semibold text-slate-800">Recent Service Requests</h2>
            <Link to="/my-requests" className="text-xs font-medium text-primary-600 hover:underline">View all</Link>
          </div>
          <div className="divide-y divide-slate-50">
            {loading ? (
              Array(3).fill(0).map((_, index) => (
                <div key={index} className="px-5 py-3.5">
                  <div className="skeleton h-4 w-full rounded" />
                </div>
              ))
            ) : requests.length === 0 ? (
              <div className="px-5 py-8 text-center">
                <p className="text-sm text-slate-400">No service requests yet</p>
                <Link to="/services/request/new" className="mt-2 inline-block text-xs text-primary-600 hover:underline">Post a request</Link>
              </div>
            ) : requests.map((request) => (
              <Link key={request.id || request._id} to={`/services/request/${request.id || request._id}`} className="flex items-center justify-between px-5 py-3.5 transition-colors hover:bg-slate-50">
                <div>
                  <p className="max-w-[220px] truncate text-sm font-medium text-slate-800">{request.title}</p>
                  <p className="mt-0.5 text-xs text-slate-400">{request.category_name || request.category}</p>
                </div>
                <span className={`badge capitalize ${statusBadge(request.status)}`}>{request.status}</span>
              </Link>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <h2 className="font-display font-semibold text-slate-800">Awaiting Your Confirmation</h2>
            <Link to="/my-requests" className="text-xs font-medium text-primary-600 hover:underline">Open jobs</Link>
          </div>
          <div className="divide-y divide-slate-50">
            {loading ? (
              Array(3).fill(0).map((_, index) => (
                <div key={index} className="px-5 py-3.5">
                  <div className="skeleton h-4 w-full rounded" />
                </div>
              ))
            ) : pendingConfirmations.length === 0 ? (
              <div className="px-5 py-8 text-center">
                <p className="text-sm text-slate-400">No jobs waiting for your confirmation</p>
              </div>
            ) : pendingConfirmations.map((item) => (
              <Link key={`${item.type}-${item.id}`} to={item.to} className="flex items-center justify-between px-5 py-3.5 transition-colors hover:bg-slate-50">
                <div>
                  <p className="text-sm font-medium text-slate-800">{item.title}</p>
                  <p className="mt-0.5 text-xs text-slate-400">{item.provider || 'Assigned provider'}</p>
                </div>
                <span className="badge bg-purple-100 text-purple-700">Confirm</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
