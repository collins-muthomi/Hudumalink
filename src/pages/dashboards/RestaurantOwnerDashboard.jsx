import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { restaurantOwnerAPI } from '../../services/api'

const SkeletonCard = () => (
  <div className="card p-5 space-y-3">
    <div className="skeleton h-4 w-24 rounded" />
    <div className="skeleton h-8 w-32 rounded" />
  </div>
)

export default function RestaurantOwnerDashboard() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    restaurantOwnerAPI.dashboard()
      .then(({ data: payload }) => setData(payload))
      .catch(() => setData(null))
      .finally(() => setLoading(false))
  }, [])

  const hasRestaurant = !!data?.has_restaurant
  const restaurant = data?.restaurant

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8 animate-fade-in">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display font-bold text-2xl text-slate-900">Restaurant Dashboard</h1>
          <p className="text-slate-500 mt-1 text-sm">
            {restaurant?.name ? `Manage ${restaurant.name} and keep your menu fresh.` : 'Create your restaurant profile and publish your menu.'}
          </p>
        </div>
        <Link to="/dashboard/restaurant/manage" className="btn-primary text-sm">
          {hasRestaurant ? 'Manage Restaurant' : 'Set Up Restaurant'}
        </Link>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {loading ? [1, 2, 3, 4].map((item) => <SkeletonCard key={item} />) : (
          <>
            {[
              { label: 'Total Orders', value: data?.total_orders || 0, icon: '🍽️', color: 'bg-orange-50' },
              { label: 'Pending Orders', value: data?.pending_orders || 0, icon: '⏳', color: 'bg-amber-50' },
              { label: 'This Month', value: `KSh ${Number(data?.monthly_revenue || 0).toLocaleString()}`, icon: '💰', color: 'bg-emerald-50' },
              { label: 'Menu Items', value: data?.menu_count || 0, icon: '📋', color: 'bg-blue-50' },
            ].map((stat) => (
              <div key={stat.label} className="card p-5">
                <div className={`w-9 h-9 rounded-xl ${stat.color} flex items-center justify-center text-lg mb-3`}>{stat.icon}</div>
                <p className="text-xs text-slate-500 font-medium">{stat.label}</p>
                <p className="font-display font-bold text-xl text-slate-900 mt-0.5">{stat.value}</p>
              </div>
            ))}
          </>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { to: '/dashboard/restaurant/manage', label: 'Restaurant Profile', emoji: '🏪', color: 'bg-emerald-50 border-emerald-100' },
          { to: '/dashboard/restaurant/manage', label: 'Edit Menu', emoji: '🍔', color: 'bg-orange-50 border-orange-100' },
          { to: '/food', label: 'Preview Public Page', emoji: '👀', color: 'bg-blue-50 border-blue-100' },
        ].map((link) => (
          <Link key={link.label} to={link.to} className={`${link.color} border rounded-2xl p-5 hover:shadow-card transition-shadow`}>
            <span className="text-2xl block mb-2">{link.emoji}</span>
            <span className="font-medium text-slate-700 text-sm">{link.label}</span>
          </Link>
        ))}
      </div>

      <div className="card">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <h2 className="font-display font-semibold text-slate-800">Recent Orders</h2>
          {restaurant?.is_open != null && (
            <span className={`badge ${restaurant.is_open ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
              {restaurant.is_open ? 'Open' : 'Closed'}
            </span>
          )}
        </div>
        <div className="divide-y divide-slate-50">
          {!loading && !hasRestaurant && (
            <div className="px-5 py-10 text-center">
              <p className="text-3xl mb-2">🏪</p>
              <p className="text-sm text-slate-500">You have not created a restaurant profile yet.</p>
            </div>
          )}
          {!loading && hasRestaurant && (data?.recent_orders || []).length === 0 && (
            <div className="px-5 py-10 text-center">
              <p className="text-3xl mb-2">🍽️</p>
              <p className="text-sm text-slate-500">Orders will appear here once customers start buying.</p>
            </div>
          )}
          {(data?.recent_orders || []).map((order) => (
            <div key={order.id} className="px-5 py-3.5 flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-slate-800">{order.customer_name}</p>
                <p className="text-xs text-slate-400 mt-0.5">
                  {new Date(order.createdAt).toLocaleString()} · {order.status}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-slate-900">KSh {Number(order.total || 0).toLocaleString()}</p>
                <p className="text-xs text-slate-400 capitalize">{order.payment_status}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
