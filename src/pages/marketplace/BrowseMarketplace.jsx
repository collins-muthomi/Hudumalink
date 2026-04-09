import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { marketplaceAPI } from '../../services/api'
import Button from '../../components/ui/Button'

const SkeletonCard = () => (
  <div className="card overflow-hidden">
    <div className="skeleton h-44 w-full rounded-none" />
    <div className="p-4 space-y-2">
      <div className="skeleton h-4 w-3/4 rounded" />
      <div className="skeleton h-3 w-1/2 rounded" />
      <div className="skeleton h-5 w-1/3 rounded" />
    </div>
  </div>
)

export default function BrowseMarketplace() {
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeCategory, setActiveCategory] = useState('')
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState('newest')
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)

  useEffect(() => { marketplaceAPI.categories().then(r => setCategories(r.data)).catch(() => {}) }, [])

  useEffect(() => {
    setLoading(true)
    marketplaceAPI.list({ page, search: search || undefined, category: activeCategory || undefined, ordering: sort === 'newest' ? '-created_at' : sort === 'price_asc' ? 'price' : '-price' })
      .then(r => {
        const results = r.data.results || r.data
        setProducts(page === 1 ? results : prev => [...prev, ...results])
        setHasMore(!!r.data.next)
      }).catch(() => {}).finally(() => setLoading(false))
  }, [page, activeCategory, sort])

  const handleSearch = (e) => {
    e.preventDefault()
    setPage(1)
    setLoading(true)
    marketplaceAPI.list({ search, category: activeCategory || undefined })
      .then(r => { setProducts(r.data.results || r.data); setHasMore(!!r.data.next) })
      .finally(() => setLoading(false))
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 animate-fade-in">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-display font-bold text-2xl text-slate-900">Marketplace</h1>
          <p className="text-slate-500 text-sm mt-1">Buy and sell locally in Nyeri County</p>
        </div>
        <Link to="/marketplace/sell" className="btn-primary text-sm py-2 px-4">+ Sell Item</Link>
      </div>

      {/* Search + Sort */}
      <div className="flex gap-2">
        <form onSubmit={handleSearch} className="flex gap-2 flex-1">
          <div className="relative flex-1">
            <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
            </svg>
            <input type="search" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search products…" className="input-base pl-10" />
          </div>
          <Button type="submit" variant="primary">Search</Button>
        </form>
        <select value={sort} onChange={e => { setSort(e.target.value); setPage(1) }} className="input-base w-auto">
          <option value="newest">Newest</option>
          <option value="price_asc">Price: Low–High</option>
          <option value="price_desc">Price: High–Low</option>
        </select>
      </div>

      {/* Categories */}
      {categories.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {['All', ...categories.map(c => c.name || c)].map((c, i) => {
            const val = i === 0 ? '' : (categories[i-1]?.slug || categories[i-1]?.id || c)
            return (
              <button key={c} onClick={() => { setActiveCategory(val); setPage(1) }}
                className={`flex-shrink-0 text-xs font-medium px-3.5 py-2 rounded-full border transition-all ${activeCategory === val ? 'bg-primary-600 text-white border-primary-600' : 'border-slate-200 text-slate-600 hover:border-primary-300'}`}
              >{c}</button>
            )
          })}
        </div>
      )}

      {/* Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {loading && page === 1 ? Array(8).fill(0).map((_, i) => <SkeletonCard key={i} />) : products.map(p => (
          <Link key={p.id} to={`/marketplace/${p.id}`} className="card-hover overflow-hidden group block">
            <div className="relative">
              {p.image ? (
                <img src={p.image} alt={p.title} className="w-full h-44 object-cover group-hover:scale-105 transition-transform duration-300" />
              ) : (
                <div className="w-full h-44 bg-slate-100 flex items-center justify-center text-4xl">🛒</div>
              )}
              {p.condition && <span className="absolute top-2 left-2 badge bg-white/90 text-slate-700 shadow-sm capitalize">{p.condition}</span>}
            </div>
            <div className="p-3.5">
              <p className="text-xs text-slate-400 mb-1">{p.category_name || p.category}</p>
              <h3 className="text-sm font-semibold text-slate-800 truncate group-hover:text-primary-700 transition-colors">{p.title}</h3>
              <p className="font-bold text-primary-600 mt-1.5">KSh {Number(p.price).toLocaleString()}</p>
              <p className="text-xs text-slate-400 mt-1">{p.seller_name} · {p.location}</p>
            </div>
          </Link>
        ))}
      </div>

      {hasMore && (
        <div className="text-center"><Button variant="secondary" onClick={() => setPage(p => p + 1)} loading={loading && page > 1}>Load More</Button></div>
      )}
      {!loading && products.length === 0 && (
        <div className="text-center py-16">
          <p className="text-5xl mb-3">🛒</p>
          <p className="font-semibold text-slate-700">No products found</p>
          <p className="text-sm text-slate-400 mt-1 mb-5">Be the first to list something!</p>
          <Link to="/marketplace/sell" className="btn-primary text-sm">Sell an Item</Link>
        </div>
      )}
    </div>
  )
}
