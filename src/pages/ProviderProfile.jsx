import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { providerAPI, reviewsAPI, servicesAPI } from '../services/api'
import { useToast } from '../context/contexts'
import Button from '../components/ui/Button'

export default function ProviderProfile() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { toast } = useToast()
  const [provider, setProvider] = useState(null)
  const [reviews, setReviews] = useState([])
  const [services, setServices] = useState([])
  const [loading, setLoading] = useState(true)
  const [booking, setBooking] = useState(false)

  useEffect(() => {
    Promise.allSettled([
      providerAPI.profile(id),
      reviewsAPI.list('provider', id),
      servicesAPI.list({ provider: id }),
    ]).then(([p, r, s]) => {
      setProvider(p.status === 'fulfilled' ? p.value.data : null)
      setReviews(r.status === 'fulfilled' ? (r.value.data.results || r.value.data) : [])
      setServices(s.status === 'fulfilled' ? (s.value.data.results || s.value.data) : [])
    }).finally(() => setLoading(false))
  }, [id])

  const handleBook = async () => {
    setBooking(true)
    try {
      navigate(`/services/request/new?provider=${id}`)
    } finally { setBooking(false) }
  }

  if (loading) return (
    <div className="p-6 space-y-4 max-w-2xl mx-auto">
      <div className="skeleton h-32 w-full rounded-2xl" />
      <div className="skeleton h-6 w-1/2 rounded" />
      <div className="skeleton h-4 w-3/4 rounded" />
    </div>
  )

  if (!provider) return (
    <div className="p-6 text-center">
      <p className="text-4xl mb-3">🔍</p>
      <p className="text-slate-400">Provider not found.</p>
    </div>
  )

  const rating = provider.average_rating
  const stars = rating ? Math.round(rating) : 0

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-2xl mx-auto animate-fade-in space-y-6">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 transition-colors">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        Back
      </button>

      {/* Profile header */}
      <div className="card p-6">
        <div className="flex items-start gap-4">
          <div className="w-20 h-20 rounded-2xl bg-gradient-primary flex items-center justify-center text-white font-display font-bold text-2xl flex-shrink-0 overflow-hidden">
            {provider.profile_photo ? (
              <img src={provider.profile_photo} alt={provider.name} className="w-full h-full object-cover" />
            ) : (
              (provider.first_name?.[0] || '') + (provider.last_name?.[0] || '')
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="font-display font-bold text-xl text-slate-900">{provider.first_name} {provider.last_name}</h1>
              {provider.is_verified && (
                <span className="badge bg-emerald-50 text-emerald-700 border border-emerald-200">✅ Verified</span>
              )}
            </div>
            <p className="text-slate-500 text-sm mt-1">{provider.service_type}</p>
            <div className="flex items-center gap-3 mt-2 flex-wrap">
              {rating && (
                <span className="text-sm text-amber-500 font-medium">
                  {'★'.repeat(stars)}{'☆'.repeat(5 - stars)} {rating.toFixed(1)}
                </span>
              )}
              {provider.reviews_count != null && (
                <span className="text-xs text-slate-400">{provider.reviews_count} reviews</span>
              )}
              {provider.completed_jobs != null && (
                <span className="text-xs text-slate-400">{provider.completed_jobs} jobs done</span>
              )}
            </div>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          {[
            { label: 'Location', value: provider.location || 'Nyeri County' },
            { label: 'Experience', value: provider.experience_years ? `${provider.experience_years} years` : '—' },
            { label: 'Response time', value: provider.response_time || 'Within 1 hr' },
            { label: 'Member since', value: provider.created_at ? new Date(provider.created_at).getFullYear() : '—' },
          ].map(i => (
            <div key={i.label} className="bg-slate-50 rounded-xl p-3">
              <p className="text-[11px] text-slate-400 font-medium">{i.label}</p>
              <p className="text-sm font-semibold text-slate-700 mt-0.5">{i.value}</p>
            </div>
          ))}
        </div>

        {provider.bio && (
          <div className="mt-4">
            <p className="text-sm font-medium text-slate-700 mb-1">About</p>
            <p className="text-sm text-slate-500 leading-relaxed">{provider.bio}</p>
          </div>
        )}

        <Button onClick={handleBook} loading={booking} fullWidth className="mt-5">
          Book {provider.first_name}
        </Button>
      </div>

      {/* Services */}
      {services.length > 0 && (
        <div className="card">
          <div className="px-5 py-4 border-b border-slate-100">
            <h2 className="font-semibold text-slate-800">Services Offered</h2>
          </div>
          <div className="divide-y divide-slate-50">
            {services.map(s => (
              <div key={s.id} className="px-5 py-3.5 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-800">{s.title}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{s.description?.slice(0, 60)}…</p>
                </div>
                {s.price_from && (
                  <p className="text-sm font-bold text-primary-600 flex-shrink-0 ml-3">
                    From KSh {Number(s.price_from).toLocaleString()}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Reviews */}
      <div className="card">
        <div className="px-5 py-4 border-b border-slate-100">
          <h2 className="font-semibold text-slate-800">Reviews ({reviews.length})</h2>
        </div>
        <div className="divide-y divide-slate-50">
          {reviews.length === 0 ? (
            <div className="px-5 py-10 text-center">
              <p className="text-3xl mb-2">⭐</p>
              <p className="text-sm text-slate-400">No reviews yet — be the first to book!</p>
            </div>
          ) : reviews.map(r => (
            <div key={r.id} className="px-5 py-4">
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-primary-100 text-primary-700 font-bold text-xs flex items-center justify-center">
                    {r.reviewer_name?.[0] || 'U'}
                  </div>
                  <p className="text-sm font-medium text-slate-800">{r.reviewer_name || 'Anonymous'}</p>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-amber-400 text-xs">{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</span>
                  <span className="text-xs text-slate-400 ml-1">{r.created_at ? new Date(r.created_at).toLocaleDateString() : ''}</span>
                </div>
              </div>
              <p className="text-sm text-slate-500 leading-relaxed">{r.comment}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
