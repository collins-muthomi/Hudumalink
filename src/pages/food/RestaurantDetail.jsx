import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { foodAPI } from '../../services/api'
import { useCart, useToast } from '../../context/contexts'

export default function RestaurantDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { toast } = useToast()
  const { addItem, count, restaurantId } = useCart()
  const [restaurant, setRestaurant] = useState(null)
  const [menu, setMenu] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeCategory, setActiveCategory] = useState('all')
  const [showConflict, setShowConflict] = useState(false)
  const [pendingItem, setPendingItem] = useState(null)

  useEffect(() => {
    Promise.allSettled([foodAPI.restaurantDetail(id), foodAPI.menu(id)])
      .then(([r, m]) => {
        setRestaurant(r.status === 'fulfilled' ? r.value.data : null)
        setMenu(m.status === 'fulfilled' ? m.value.data : [])
      }).finally(() => setLoading(false))
  }, [id])

  const menuCategories = ['all', ...new Set(menu.map(i => i.category).filter(Boolean))]
  const filteredMenu = activeCategory === 'all' ? menu : menu.filter(i => i.category === activeCategory)

  const handleAddToCart = (item) => {
    if (restaurantId && restaurantId !== id) {
      setPendingItem(item); setShowConflict(true); return
    }
    addItem(item, id)
    toast.success('Added to cart', item.name)
  }

  if (loading) return (
    <div className="p-6 space-y-4">
      <div className="skeleton h-48 w-full rounded-2xl" />
      <div className="skeleton h-6 w-1/2 rounded" />
    </div>
  )
  if (!restaurant) return <div className="p-6 text-center text-slate-400">Restaurant not found.</div>

  return (
    <div className="animate-fade-in">
      {/* Hero banner */}
      <div className="relative h-48 sm:h-56">
        {restaurant.image ? (
          <img src={restaurant.image} alt={restaurant.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-orange-200 to-amber-200 flex items-center justify-center text-6xl">🍽️</div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <button onClick={() => navigate(-1)} className="absolute top-4 left-4 p-2 rounded-xl bg-white/20 backdrop-blur-sm text-white hover:bg-white/30 transition-colors">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div className="absolute bottom-4 left-4 right-4">
          <h1 className="font-display font-bold text-2xl text-white">{restaurant.name}</h1>
          <p className="text-white/80 text-sm mt-1">{restaurant.cuisine} · {restaurant.location}</p>
          <div className="flex items-center gap-3 mt-2">
            {restaurant.rating && <span className="text-xs bg-white/20 text-white px-2 py-1 rounded-full">⭐ {restaurant.rating}</span>}
            {restaurant.delivery_time && <span className="text-xs bg-white/20 text-white px-2 py-1 rounded-full">🕐 {restaurant.delivery_time} min</span>}
            {restaurant.minimum_order && <span className="text-xs bg-white/20 text-white px-2 py-1 rounded-full">Min. KSh {Number(restaurant.minimum_order).toLocaleString()}</span>}
          </div>
        </div>
      </div>

      <div className="p-4 sm:p-6 space-y-5">
        {/* Cart badge */}
        {count > 0 && restaurantId === id && (
          <Link to="/food/cart" className="flex items-center justify-between p-4 bg-primary-600 text-white rounded-2xl shadow-glow">
            <span className="font-medium text-sm">{count} item{count > 1 ? 's' : ''} in your cart</span>
            <span className="text-sm font-semibold">View Cart →</span>
          </Link>
        )}

        {/* Menu categories */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {menuCategories.map(c => (
            <button key={c} onClick={() => setActiveCategory(c)}
              className={`flex-shrink-0 text-xs font-medium px-3.5 py-2 rounded-full border capitalize transition-all ${activeCategory === c ? 'bg-primary-600 text-white border-primary-600' : 'border-slate-200 text-slate-600 hover:border-primary-300'}`}>
              {c}
            </button>
          ))}
        </div>

        {/* Menu items */}
        <div className="space-y-3">
          {filteredMenu.map(item => (
            <div key={item.id} className="card p-4 flex gap-4 items-start">
              {item.image ? (
                <img src={item.image} alt={item.name} className="w-20 h-20 rounded-xl object-cover flex-shrink-0" />
              ) : (
                <div className="w-20 h-20 rounded-xl bg-slate-100 flex items-center justify-center text-2xl flex-shrink-0">🍽️</div>
              )}
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-slate-800">{item.name}</h3>
                <p className="text-xs text-slate-400 mt-0.5 line-clamp-2">{item.description}</p>
                <p className="font-bold text-primary-600 mt-1.5">KSh {Number(item.price).toLocaleString()}</p>
              </div>
              <button
                onClick={() => handleAddToCart(item)}
                disabled={!restaurant.is_open || item.is_unavailable}
                className="btn-primary text-xs py-1.5 px-3 flex-shrink-0 disabled:opacity-40"
              >
                + Add
              </button>
            </div>
          ))}
        </div>

        {filteredMenu.length === 0 && !loading && (
          <div className="text-center py-10">
            <p className="text-3xl mb-2">🍽️</p>
            <p className="text-sm text-slate-400">No items in this category</p>
          </div>
        )}
      </div>

      {/* Conflict modal */}
      {showConflict && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full">
            <h3 className="font-display font-bold text-lg text-slate-900 mb-2">Start a new order?</h3>
            <p className="text-sm text-slate-500 mb-5">You have items from another restaurant in your cart. Adding this item will clear your current cart.</p>
            <div className="flex gap-3">
              <button onClick={() => { setShowConflict(false); setPendingItem(null) }} className="btn-secondary flex-1 text-sm">Keep Current</button>
              <button onClick={() => {
                const { clearCart } = useCart()
                clearCart()
                addItem(pendingItem, id)
                setShowConflict(false)
                toast.success('Added to cart', pendingItem.name)
              }} className="btn-primary flex-1 text-sm">Start New</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
