import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { foodAPI } from '../../services/api'
import { useCart } from '../../context/contexts'

const SkeletonCard = () => (
  <div className="card overflow-hidden">
    <div className="skeleton h-40 w-full rounded-none" />
    <div className="p-4 space-y-2">
      <div className="skeleton h-5 w-3/4 rounded" />
      <div className="skeleton h-3 w-1/2 rounded" />
    </div>
  </div>
)

export default function RestaurantList() {
  const [restaurants, setRestaurants] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const { count } = useCart()

  useEffect(() => {
    foodAPI.restaurants().then(r => setRestaurants(r.data.results || r.data)).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const filtered = restaurants.filter(r =>
    !search || r.name?.toLowerCase().includes(search.toLowerCase()) || r.cuisine?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 animate-fade-in">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-display font-bold text-2xl text-slate-900">Order Food 🍔</h1>
          <p className="text-slate-500 text-sm mt-1">Restaurants and eateries in Nyeri County</p>
        </div>
        {count > 0 && (
          <Link to="/food/cart" className="relative btn-primary text-sm py-2 px-4">
            🛒 Cart
            <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">{count}</span>
          </Link>
        )}
      </div>

      <div className="relative">
        <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
        </svg>
        <input type="search" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search restaurants or cuisine…" className="input-base pl-10" />
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {loading ? Array(6).fill(0).map((_, i) => <SkeletonCard key={i} />) : filtered.map(r => (
          <Link key={r.id} to={`/food/restaurant/${r.id}`} className="card-hover overflow-hidden group block">
            <div className="relative">
              {r.image ? (
                <img src={r.image} alt={r.name} className="w-full h-40 object-cover group-hover:scale-105 transition-transform duration-300" />
              ) : (
                <div className="w-full h-40 bg-gradient-to-br from-orange-100 to-amber-100 flex items-center justify-center text-5xl">🍽️</div>
              )}
              {!r.is_open && (
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                  <span className="bg-white/90 text-slate-700 text-xs font-semibold px-3 py-1.5 rounded-full">Closed</span>
                </div>
              )}
              {r.delivery_time && (
                <span className="absolute bottom-2 right-2 bg-white/90 text-slate-700 text-xs font-medium px-2 py-1 rounded-full shadow-sm">
                  🕐 {r.delivery_time} min
                </span>
              )}
            </div>
            <div className="p-4">
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-semibold text-slate-900 group-hover:text-primary-700 transition-colors">{r.name}</h3>
                {r.rating && <span className="text-xs font-medium text-amber-600 flex-shrink-0">{'⭐'} {r.rating}</span>}
              </div>
              <p className="text-xs text-slate-400 mt-1">{r.cuisine} · {r.location}</p>
              {r.minimum_order && (
                <p className="text-xs text-slate-400 mt-1">Min. order: KSh {Number(r.minimum_order).toLocaleString()}</p>
              )}
            </div>
          </Link>
        ))}
      </div>

      {!loading && filtered.length === 0 && (
        <div className="text-center py-16">
          <p className="text-5xl mb-3">🍽️</p>
          <p className="font-semibold text-slate-700">No restaurants found</p>
          <p className="text-sm text-slate-400 mt-1">Try a different search</p>
        </div>
      )}
    </div>
  )
}
