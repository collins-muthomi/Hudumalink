import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { providerAPI } from '../../services/api'

const SkeletonCard = () => (
  <div className="card p-5 space-y-3"><div className="skeleton h-4 w-24 rounded" /><div className="skeleton h-8 w-32 rounded" /></div>
)

export default function ProviderDashboard() {
  const { user } = useAuth()
  const [data, setData] = useState(null)
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.allSettled([providerAPI.dashboard(), providerAPI.bookings({ limit: 5 })])
      .then(([dashboard, bookingsResponse]) => {
        setData(dashboard.status === 'fulfilled' ? dashboard.value.data : null)
        setBookings(bookingsResponse.status === 'fulfilled' ? (bookingsResponse.value.data.results || bookingsResponse.value.data).slice(0, 5) : [])
      })
      .finally(() => setLoading(false))
  }, [])

  const verified = user?.is_verified

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8 animate-fade-in">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-display font-bold text-2xl text-slate-900">Provider Dashboard</h1>
          <p className="text-slate-500 mt-1 text-sm">Manage your services, direct bookings, and open-market jobs</p>
        </div>
        {!verified ? (
          <Link to="/dashboard/provider/verification" className="flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-700 text-xs font-medium px-3 py-2 rounded-xl hover:bg-amber-100 transition-colors">
            Complete Verification
          </Link>
        ) : (
          <span className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-medium px-3 py-2 rounded-xl">
            Verified Provider
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {loading ? [1, 2, 3, 4].map((item) => <SkeletonCard key={item} />) : (
          <>
            {[
              { label: 'Total Jobs', value: data?.total_bookings || 0, icon: 'Jobs', color: 'bg-blue-50' },
              { label: 'Completed', value: data?.completed_bookings || 0, icon: 'Done', color: 'bg-emerald-50' },
              { label: 'Open Requests', value: data?.open_requests || 0, icon: 'Open', color: 'bg-amber-50' },
              { label: 'This Month', value: `KSh ${Number(data?.monthly_earnings || 0).toLocaleString()}`, icon: 'KES', color: 'bg-teal-50' },
            ].map((stat) => (
              <div key={stat.label} className="card p-5">
                <div className={`w-9 h-9 rounded-xl ${stat.color} flex items-center justify-center text-xs font-bold mb-3 text-slate-700`}>{stat.icon}</div>
                <p className="text-xs text-slate-500 font-medium">{stat.label}</p>
                <p className="font-display font-bold text-xl text-slate-900 mt-0.5">{stat.value}</p>
              </div>
            ))}
          </>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {[
          { to: '/dashboard/provider/services', label: 'Manage Services', color: 'bg-blue-50 border-blue-100' },
          { to: '/dashboard/provider/open-requests', label: 'Open Requests', color: 'bg-orange-50 border-orange-100' },
          { to: '/dashboard/provider/jobs', label: 'My Jobs', color: 'bg-teal-50 border-teal-100' },
          { to: '/dashboard/provider/bookings', label: 'Booking Calendar', color: 'bg-slate-50 border-slate-200' },
          { to: '/dashboard/provider/verification', label: 'My Verification', color: 'bg-purple-50 border-purple-100' },
          { to: '/wallet', label: 'Earnings & Wallet', color: 'bg-emerald-50 border-emerald-100' },
        ].map((link) => (
          <Link key={link.to} to={link.to} className={`${link.color} border rounded-2xl p-5 hover:shadow-card transition-shadow`}>
            <span className="font-medium text-slate-700 text-sm">{link.label}</span>
          </Link>
        ))}
      </div>

      <div className="card">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <h2 className="font-display font-semibold text-slate-800">Legacy Bookings</h2>
          <Link to="/dashboard/provider/bookings" className="text-xs text-primary-600 font-medium hover:underline">View all</Link>
        </div>
        <div className="divide-y divide-slate-50">
          {loading ? Array(3).fill(0).map((_, index) => (
            <div key={index} className="px-5 py-4"><div className="skeleton h-4 w-full rounded" /></div>
          )) : bookings.length === 0 ? (
            <div className="px-5 py-10 text-center">
              <p className="text-sm text-slate-400">No legacy bookings yet</p>
            </div>
          ) : bookings.map((booking) => (
            <div key={booking.id || booking._id} className="px-5 py-3.5 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-800">{booking.customer_name || booking.service_name}</p>
                <p className="text-xs text-slate-400 mt-0.5">{booking.date} · {booking.time}</p>
              </div>
              <div className="text-right">
                <span className={`badge capitalize ${booking.status === 'confirmed' ? 'bg-blue-100 text-blue-700' : booking.status === 'completed' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>{booking.status}</span>
                {booking.amount && <p className="text-xs text-slate-500 mt-1">KSh {Number(booking.amount).toLocaleString()}</p>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
