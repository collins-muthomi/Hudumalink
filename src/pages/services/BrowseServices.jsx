import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { servicesAPI } from '../../services/api'
import Button from '../../components/ui/Button'

const SkeletonCard = () => (
  <div className="card p-5 space-y-3">
    <div className="skeleton h-5 w-3/4 rounded" />
    <div className="skeleton h-3 w-full rounded" />
    <div className="skeleton h-3 w-2/3 rounded" />
    <div className="skeleton h-4 w-20 rounded" />
  </div>
)

export default function BrowseServices() {
  const [services, setServices] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeCategory, setActiveCategory] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)

  useEffect(() => {
    servicesAPI.categories().then(r => setCategories(r.data)).catch(() => {})
  }, [])

  useEffect(() => {
    setLoading(true)
    const params = { page, search, category: activeCategory || undefined }
    servicesAPI.list(params)
      .then(r => {
        const results = r.data.results || r.data
        setServices(page === 1 ? results : prev => [...prev, ...results])
        setHasMore(!!r.data.next)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [page, activeCategory])

  const handleSearch = (e) => {
    e.preventDefault()
    setPage(1)
    setLoading(true)
    servicesAPI.list({ search, category: activeCategory || undefined })
      .then(r => {
        setServices(r.data.results || r.data)
        setHasMore(!!r.data.next)
      }).finally(() => setLoading(false))
  }

  const handleCategory = (cat) => {
    setActiveCategory(cat)
    setPage(1)
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-display font-bold text-2xl text-slate-900">Browse Services</h1>
          <p className="text-slate-500 text-sm mt-1">Find skilled professionals in Nyeri County</p>
        </div>
        <Link to="/services/request/new" className="btn-primary text-sm py-2 px-4">
          + Post Request
        </Link>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1">
          <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
          </svg>
          <input
            type="search"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search services (e.g. plumber, tutor)…"
            className="input-base pl-10"
          />
        </div>
        <Button type="submit" variant="primary">Search</Button>
      </form>

      {/* Categories */}
      {categories.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          <button
            onClick={() => handleCategory('')}
            className={`flex-shrink-0 text-xs font-medium px-3.5 py-2 rounded-full border transition-all ${!activeCategory ? 'bg-primary-600 text-white border-primary-600' : 'border-slate-200 text-slate-600 hover:border-primary-300 hover:text-primary-600'}`}
          >
            All
          </button>
          {categories.map(c => (
            <button
              key={c.id || c.slug}
              onClick={() => handleCategory(c.slug || c.id)}
              className={`flex-shrink-0 text-xs font-medium px-3.5 py-2 rounded-full border transition-all ${activeCategory === (c.slug || c.id) ? 'bg-primary-600 text-white border-primary-600' : 'border-slate-200 text-slate-600 hover:border-primary-300 hover:text-primary-600'}`}
            >
              {c.name}
            </button>
          ))}
        </div>
      )}

      {/* Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading && page === 1
          ? Array(6).fill(0).map((_, i) => <SkeletonCard key={i} />)
          : services.map(s => (
            <Link key={s._id || s.id} to={`/providers/${s.provider_id || s.id}`} className="card-hover p-5 block group">
              {s.image && (
                <img src={s.image} alt={s.title} className="w-full h-36 object-cover rounded-xl mb-4" />
              )}
              <div className="flex items-start justify-between mb-2">
                <span className="badge bg-primary-50 text-primary-700">{s.category_name || s.category}</span>
                {s.is_verified && <span className="badge bg-emerald-50 text-emerald-700">✅ Verified</span>}
              </div>
              <h3 className="font-semibold text-slate-900 mb-1 group-hover:text-primary-700 transition-colors">{s.title}</h3>
              <p className="text-xs text-slate-500 line-clamp-2 mb-3">{s.description}</p>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-400">{s.provider_name}</p>
                  {s.rating && <p className="text-xs text-amber-500 font-medium">{'★'.repeat(Math.round(s.rating))} {s.rating}</p>}
                </div>
                {s.price_from && (
                  <p className="text-sm font-bold text-primary-600">From KSh {Number(s.price_from).toLocaleString()}</p>
                )}
              </div>
            </Link>
          ))
        }
      </div>

      {hasMore && (
        <div className="text-center pt-4">
          <Button variant="secondary" onClick={() => setPage(p => p + 1)} loading={loading && page > 1}>
            Load More
          </Button>
        </div>
      )}

      {!loading && services.length === 0 && (
        <div className="text-center py-16">
          <p className="text-4xl mb-3">🔍</p>
          <p className="font-semibold text-slate-700">No services found</p>
          <p className="text-sm text-slate-400 mt-1">Try a different search or category</p>
        </div>
      )}
    </div>
  )
}
