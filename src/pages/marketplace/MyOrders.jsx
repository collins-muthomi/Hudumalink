import { useState, useEffect } from 'react'
import { marketplaceAPI } from '../../services/api'

const statusColor = {
  pending: 'bg-amber-100 text-amber-700',
  confirmed: 'bg-blue-100 text-blue-700',
  delivered: 'bg-emerald-100 text-emerald-700',
  cancelled: 'bg-red-100 text-red-700',
}

export default function MyOrders() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    const params = filter !== 'all' ? { status: filter } : {}
    marketplaceAPI.myOrders(params).then(r => setOrders(r.data.results || r.data)).catch(() => {}).finally(() => setLoading(false))
  }, [filter])

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 animate-fade-in">
      <div>
        <h1 className="font-display font-bold text-2xl text-slate-900">My Orders</h1>
        <p className="text-slate-500 text-sm mt-1">Track your marketplace purchases</p>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {['all', 'pending', 'confirmed', 'delivered', 'cancelled'].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`flex-shrink-0 text-xs font-medium px-3.5 py-2 rounded-full border capitalize transition-all ${filter === f ? 'bg-primary-600 text-white border-primary-600' : 'border-slate-200 text-slate-600 hover:border-primary-300'}`}>
            {f}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">{Array(4).fill(0).map((_, i) => <div key={i} className="card p-4 skeleton h-20" />)}</div>
      ) : orders.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-5xl mb-4">📦</p>
          <p className="font-semibold text-slate-700">No orders yet</p>
          <p className="text-sm text-slate-400 mt-1">Start shopping on the marketplace</p>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map(o => (
            <div key={o.id} className="card p-5 flex items-start gap-4">
              {o.product_image ? (
                <img src={o.product_image} alt={o.product_name} className="w-16 h-16 rounded-xl object-cover flex-shrink-0" />
              ) : (
                <div className="w-16 h-16 rounded-xl bg-slate-100 flex items-center justify-center text-2xl flex-shrink-0">🛒</div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-semibold text-slate-800 truncate">{o.product_name || o.title}</h3>
                  <span className={`badge capitalize flex-shrink-0 ${statusColor[o.status] || 'bg-slate-100 text-slate-600'}`}>{o.status}</span>
                </div>
                <p className="text-sm font-bold text-primary-600 mt-1">KSh {Number(o.total || o.price).toLocaleString()}</p>
                <p className="text-xs text-slate-400 mt-0.5">Seller: {o.seller_name} · {new Date(o.created_at).toLocaleDateString()}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
