import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
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
  const [searchParams, setSearchParams] = useSearchParams()
  const [services, setServices] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)
  const [searchInput, setSearchInput] = useState(searchParams.get('search') || '')

  const activeCategory = searchParams.get('category') || ''
  const activeSearch = searchParams.get('search') || ''

  useEffect(() => {
    setSearchInput(activeSearch)
  }, [activeSearch])

  useEffect(() => {
    servicesAPI.categories().then((response) => setCategories(response.data || [])).catch(() => {})
  }, [])

  useEffect(() => {
    setLoading(true)
    servicesAPI.list({
      page,
      search: activeSearch || undefined,
      category: activeCategory || undefined,
    })
      .then((response) => {
        const results = response.data.results || response.data || []
        setServices((current) => page === 1 ? results : [...current, ...results])
        setHasMore(Boolean(response.data.next))
      })
      .catch(() => {
        if (page === 1) setServices([])
      })
      .finally(() => setLoading(false))
  }, [page, activeCategory, activeSearch])

  const groups = useMemo(() => {
    const map = new Map()
    categories.forEach((category) => {
      if (category.group_slug && !map.has(category.group_slug)) {
        map.set(category.group_slug, { slug: category.group_slug, name: category.group_name || category.group_slug })
      }
    })
    return Array.from(map.values())
  }, [categories])

  const updateFilters = ({ category = activeCategory, search = activeSearch }) => {
    const next = new URLSearchParams()
    if (category) next.set('category', category)
    if (search) next.set('search', search)
    setPage(1)
    setSearchParams(next)
  }

  const handleSearch = (event) => {
    event.preventDefault()
    updateFilters({ search: searchInput.trim(), category: activeCategory })
  }

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8 animate-fade-in">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900">Browse Services</h1>
          <p className="mt-1 text-sm text-slate-500">Browse providers by category, then book securely through the existing HudumaLink flow.</p>
        </div>
        <Link to="/services/request/new" className="btn-primary px-4 py-2 text-sm">
          + Post Request
        </Link>
      </div>

      <form onSubmit={handleSearch} className="flex flex-col gap-3 rounded-3xl border border-slate-200 bg-white p-3 shadow-sm sm:flex-row">
        <div className="relative flex-1">
          <svg className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
          <input
            type="search"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Search by service, provider, or location"
            className="input-base rounded-2xl border-0 bg-slate-50 pl-11"
          />
        </div>
        <Button type="submit">Search</Button>
      </form>

      {groups.length > 0 && (
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => updateFilters({ category: '', search: activeSearch })}
              className={`rounded-full border px-4 py-2 text-xs font-semibold transition ${!activeCategory ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-200 text-slate-600 hover:border-teal-300 hover:text-teal-700'}`}
            >
              All Categories
            </button>
            {groups.map((group) => (
              <button
                key={group.slug}
                type="button"
                onClick={() => updateFilters({ category: group.slug, search: activeSearch })}
                className={`rounded-full border px-4 py-2 text-xs font-semibold transition ${activeCategory === group.slug ? 'border-teal-600 bg-teal-600 text-white' : 'border-slate-200 text-slate-600 hover:border-teal-300 hover:text-teal-700'}`}
              >
                {group.name}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <button
                key={category.slug || category.id}
                type="button"
                onClick={() => updateFilters({ category: category.slug || category.id, search: activeSearch })}
                className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${activeCategory === (category.slug || category.id) ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-slate-200 bg-white text-slate-500 hover:border-emerald-300 hover:text-emerald-700'}`}
              >
                {category.name}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {loading && page === 1
          ? Array.from({ length: 6 }).map((_, index) => <SkeletonCard key={index} />)
          : services.map((service) => (
            <div key={service._id || service.id} className="card-hover overflow-hidden p-5">
              {service.image && (
                <img src={service.image} alt={service.title} className="mb-4 h-40 w-full rounded-2xl object-cover" />
              )}
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <span className="badge bg-primary-50 text-primary-700">{service.parent_category_name || service.category_name || service.category}</span>
                <span className="badge bg-slate-100 text-slate-700">{service.category_name || service.category}</span>
                {service.is_verified && <span className="badge bg-emerald-50 text-emerald-700">Verified</span>}
              </div>
              <h3 className="text-lg font-semibold text-slate-900">{service.title}</h3>
              <p className="mt-2 line-clamp-2 text-sm text-slate-500">{service.description}</p>
              <div className="mt-4 flex items-center justify-between text-sm">
                <div>
                  <p className="font-medium text-slate-700">{service.provider_name}</p>
                  <p className="text-slate-400">{service.location || 'Nyeri Town'}</p>
                </div>
                <p className="font-bold text-primary-700">
                  {service.price_from ? `KSh ${Number(service.price_from).toLocaleString()}` : 'Quote'}
                </p>
              </div>
              <div className="mt-5 flex gap-2">
                <Link to={`/providers/${service.provider_id || service._id || service.id}`} className="btn-secondary flex-1 text-center text-sm">
                  View Provider
                </Link>
                <Link
                  to={`/services/request/new?category=${encodeURIComponent(service.category)}&subservice=${encodeURIComponent(service.category_name || service.category)}&title=${encodeURIComponent(`Need ${service.category_name || service.category} help`)}`}
                  className="btn-primary flex-1 text-center text-sm"
                >
                  Request
                </Link>
              </div>
            </div>
          ))}
      </div>

      {hasMore && (
        <div className="pt-4 text-center">
          <Button variant="secondary" onClick={() => setPage((current) => current + 1)} loading={loading && page > 1}>
            Load More
          </Button>
        </div>
      )}

      {!loading && services.length === 0 && (
        <div className="rounded-[28px] border border-dashed border-slate-200 bg-white px-6 py-16 text-center">
          <p className="text-lg font-semibold text-slate-700">No providers match that filter yet.</p>
          <p className="mt-2 text-sm text-slate-400">Try another category, adjust your search, or post a request so providers can respond.</p>
          <Link to="/services/request/new" className="btn-primary mt-5 inline-flex text-sm">
            Post a Request
          </Link>
        </div>
      )}
    </div>
  )
}
