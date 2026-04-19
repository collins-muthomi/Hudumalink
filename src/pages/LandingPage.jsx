import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { servicesAPI } from '../services/api'
import PublicSiteShell from '../components/layout/PublicSiteShell'

export function HudumaLogo({ size = 'md', dark = false }) {
  const s = { sm: [26, 14], md: [33, 18], lg: [42, 23] }[size] || [33, 18]
  return (
    <div className="flex items-center gap-2 select-none">
      <svg width={s[0]} height={s[0]} viewBox="0 0 40 40" fill="none">
        <path d="M20 2L36 11V29L20 38L4 29V11L20 2Z" fill="#0d9488" />
        <circle cx="20" cy="20" r="7" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="1" />
        <path d="M14.5 20.5L18.5 24.5L26 16" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <div style={{ lineHeight: 1 }}>
        <div
          style={{ fontSize: s[1], fontFamily: 'Sora, sans-serif', fontWeight: 700 }}
          className={dark ? 'text-white' : 'text-slate-900'}
        >
          Huduma<span style={{ color: '#14b8a6' }}>Link</span>
        </div>
        <div
          style={{ fontSize: 9, letterSpacing: '0.12em', color: dark ? 'rgba(255,255,255,0.4)' : '#94a3b8', marginTop: 2 }}
          className="font-medium uppercase"
        >
          Multi-Service Platform
        </div>
      </div>
    </div>
  )
}

const CATEGORY_GROUPS = [
  {
    slug: 'home-services',
    name: 'Home Services',
    icon: '🏠',
    description: 'Repairs, cleaning, painting, and skilled home help.',
    subs: [
      { slug: 'plumbing', name: 'Plumbing' },
      { slug: 'electrical', name: 'Electrical' },
      { slug: 'cleaning', name: 'Cleaning' },
      { slug: 'carpentry', name: 'Carpentry' },
      { slug: 'painting', name: 'Painting' },
    ],
  },
  {
    slug: 'beauty',
    name: 'Beauty',
    icon: '✂️',
    description: 'Mobile and studio beauty professionals near you.',
    subs: [
      { slug: 'barber', name: 'Barber' },
      { slug: 'salon', name: 'Salon' },
      { slug: 'nails', name: 'Nails' },
      { slug: 'makeup', name: 'Makeup' },
    ],
  },
  {
    slug: 'tech',
    name: 'Tech',
    icon: '💻',
    description: 'Fast help for phones, laptops, software, and internet setup.',
    subs: [
      { slug: 'phone-repair', name: 'Phone Repair' },
      { slug: 'laptop-repair', name: 'Laptop Repair' },
      { slug: 'wifi-setup', name: 'WiFi Setup' },
      { slug: 'software-help', name: 'Software Help' },
    ],
  },
  {
    slug: 'moving',
    name: 'Moving',
    icon: '🚚',
    description: 'Trusted crews for household and furniture moves.',
    subs: [
      { slug: 'house-moving', name: 'House Moving' },
      { slug: 'furniture-moving', name: 'Furniture Moving' },
    ],
  },
  {
    slug: 'personal',
    name: 'Personal',
    icon: '🌿',
    description: 'Everyday support for learning, care, and home routines.',
    subs: [
      { slug: 'tutoring', name: 'Tutoring' },
      { slug: 'gardening', name: 'Gardening' },
      { slug: 'pet-care', name: 'Pet Care' },
      { slug: 'other', name: 'Other' },
    ],
  },
]

const NAV_LINKS = [
  { label: 'Browse Services', to: '/services' },
  { label: 'About Us', to: '/about' },
  { label: 'Contact Us', to: '/contact' },
  { label: 'Post Request', to: '/services/request/new' },
  { label: 'How It Works', to: '/#how' },
  { label: 'Join ', to: '/register' },
]

const TRUST_POINTS = [
  { value: 'Escrow Protected', label: 'Customer funds stay secure until work is confirmed' },
  { value: 'Verified Providers', label: 'Service professionals are reviewed before visibility' },
  { value: 'One Request Flow', label: 'Categories and subservices feed into the same booking flow' },
]

export default function LandingPage() {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [featuredProviders, setFeaturedProviders] = useState([])

  useEffect(() => {
    servicesAPI.list({ limit: 4 })
      .then((response) => setFeaturedProviders(response.data.results || response.data || []))
      .catch(() => setFeaturedProviders([]))
  }, [])

  const goToServices = (params = {}) => {
    const next = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => {
      if (value) next.set(key, value)
    })
    navigate(`/services${next.toString() ? `?${next.toString()}` : ''}`)
  }

  const goToRequestForm = ({ slug, name }) => {
    const next = new URLSearchParams({
      category: slug,
      subservice: name,
      title: `Need ${name.toLowerCase()} help`,
    })
    navigate(`/services/request/new?${next.toString()}`)
  }

  const handleHeroSearch = (event) => {
    event.preventDefault()
    goToServices({ search: query })
  }

  return (
    <PublicSiteShell navLinks={NAV_LINKS}>
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(20,184,166,0.18),transparent_32%),radial-gradient(circle_at_bottom_right,rgba(16,185,129,0.15),transparent_30%)]" />
        <div className="relative mx-auto grid max-w-7xl gap-10 px-4 pb-16 pt-12 sm:px-6 lg:grid-cols-[1.15fr_0.85fr] lg:items-center lg:pb-20 lg:pt-16">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-teal-200 bg-white/80 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-teal-700">
              Classified Multi-Service Platform
            </span>
            <h1 className="mt-6 max-w-3xl font-display text-4xl font-bold leading-tight text-slate-900 sm:text-5xl lg:text-6xl" style={{ fontFamily: 'Sora, sans-serif' }}>
              Find the right provider,
              <span className="block text-teal-700">secure payment in escrow,</span>
              and track every service cleanly.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
              Browse categorized services, choose a trusted provider, pay securely through HudumaLink, and release funds only after the job is complete.
            </p>

            <form onSubmit={handleHeroSearch} className="mt-8 flex flex-col gap-3 rounded-[28px] border border-slate-200 bg-white p-3 shadow-[0_30px_80px_-45px_rgba(15,23,42,0.55)] sm:flex-row">
              <div className="flex flex-1 items-center gap-3 rounded-2xl bg-slate-50 px-4 py-3">
                <svg className="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.35-4.35" />
                </svg>
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search plumbing, salon, tutoring, phone repair..."
                  className="min-w-0 flex-1 bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400 sm:text-base"
                />
              </div>
              <button type="submit" className="rounded-2xl bg-teal-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-teal-700 sm:text-base">
                Search Services
              </button>
            </form>

            <div className="mt-4 flex flex-wrap gap-2">
              {['Plumbing', 'Barber', 'WiFi Setup', 'House Moving', 'Tutoring'].map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => goToServices({ search: item })}
                  className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:border-teal-300 hover:text-teal-700"
                >
                  {item}
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-4">
            <div className="rounded-[30px] bg-[linear-gradient(150deg,#0c4535_0%,#0a3a2c_55%,#072e22_100%)] p-6 text-white shadow-[0_24px_80px_-40px_rgba(12,69,53,0.9)]">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-300">Escrow Flow</p>
              <div className="mt-5 space-y-3">
                {[
                  'Customer selects provider and confirms service',
                  'Customer pays through the app into escrow',
                  'Provider sees payment secured before starting work',
                  'Customer confirms completion',
                  'Admin releases payout after commission deduction',
                ].map((step, index) => (
                  <div key={step} className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                    <span className="mt-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-emerald-400 text-xs font-bold text-slate-950">{index + 1}</span>
                    <p className="text-sm text-slate-200">{step}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              {TRUST_POINTS.map((point) => (
                <div key={point.value} className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
                  <p className="text-sm font-semibold text-slate-900">{point.value}</p>
                  <p className="mt-1 text-xs leading-5 text-slate-500">{point.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mb-8 flex items-end justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-teal-700">Categories</p>
              <h2 className="mt-2 font-display text-3xl font-bold text-slate-900" style={{ fontFamily: 'Sora, sans-serif' }}>
                Browse services by category
              </h2>
            </div>
            <Link to="/services" className="hidden text-sm font-semibold text-slate-700 transition hover:text-teal-700 sm:block">
              View all providers
            </Link>
          </div>

          <div className="grid gap-5 lg:grid-cols-5">
            {CATEGORY_GROUPS.map((group) => (
              <div key={group.slug} className="group rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-emerald-200 hover:shadow-xl">
                <button type="button" onClick={() => goToServices({ category: group.slug })} className="w-full text-left">
                  <div className="flex items-center justify-between">
                    <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-2xl">{group.icon}</span>
                    <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400 group-hover:text-emerald-700">Browse</span>
                  </div>
                  <h3 className="mt-4 text-lg font-semibold text-slate-900">{group.name}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-500">{group.description}</p>
                </button>
                <div className="mt-5 flex flex-wrap gap-2">
                  {group.subs.map((sub) => (
                    <button
                      key={sub.slug}
                      type="button"
                      onClick={() => goToRequestForm(sub)}
                      className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700"
                    >
                      {sub.name}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[linear-gradient(150deg,#0c4535_0%,#0a3d31_100%)] py-16 text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-300">Featured Providers</p>
              <h2 className="mt-2 font-display text-3xl font-bold" style={{ fontFamily: 'Sora, sans-serif' }}>
                Trusted providers already available
              </h2>
            </div>
            <Link to="/services" className="text-sm font-semibold text-emerald-300 transition hover:text-emerald-200">
              Browse all services
            </Link>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {featuredProviders.length === 0 ? (
              Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="rounded-[26px] border border-white/10 bg-white/5 p-5">
                  <div className="skeleton h-24 rounded-2xl" />
                </div>
              ))
            ) : featuredProviders.map((provider) => (
              <div key={provider._id || provider.id} className="rounded-[26px] border border-white/10 bg-white/5 p-5 transition hover:border-emerald-400/40 hover:bg-white/10">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-300">
                      {provider.parent_category_name || provider.category_name || provider.category}
                    </p>
                    <h3 className="mt-2 text-lg font-semibold text-white">{provider.provider_name || provider.title}</h3>
                  </div>
                  <span className="rounded-full bg-emerald-500/15 px-2.5 py-1 text-[11px] font-semibold text-emerald-200">
                    {provider.is_verified ? 'Verified' : 'Active'}
                  </span>
                </div>
                <p className="mt-3 line-clamp-2 text-sm leading-6 text-slate-300">{provider.title}</p>
                <div className="mt-5 flex items-center justify-between text-sm text-slate-300">
                  <span>{provider.location || 'Nyeri Town'}</span>
                  <span className="font-semibold text-white">
                    {provider.price_from ? `From KSh ${Number(provider.price_from).toLocaleString()}` : 'Quote on request'}
                  </span>
                </div>
                <div className="mt-5 flex gap-2">
                  <Link to={`/providers/${provider.provider_id || provider._id || provider.id}`} className="flex-1 rounded-xl border border-white/15 px-4 py-2.5 text-center text-sm font-semibold text-white transition hover:bg-white/10">
                    View Provider
                  </Link>
                  <button
                    type="button"
                    onClick={() => goToRequestForm({ slug: provider.category, name: provider.category_name || provider.category })}
                    className="flex-1 rounded-xl bg-teal-400 px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-emerald-300"
                  >
                    Book Now
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="how" className="py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mb-10 text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-teal-700">How It Works</p>
            <h2 className="mt-2 font-display text-3xl font-bold text-slate-900" style={{ fontFamily: 'Sora, sans-serif' }}>
              Keep the same request flow, with safer payments
            </h2>
          </div>
          <div className="grid gap-5 md:grid-cols-4">
            {[
              { title: 'Browse', body: 'Customers browse categories or search for a provider using the existing services route.' },
              { title: 'Request', body: 'Subservice clicks prefill the current request form so customers stay on the same request flow.' },
              { title: 'Secure', body: 'Payment is collected through the app and held in escrow before work starts.' },
              { title: 'Release', body: 'After completion is confirmed, payout is released and commission is deducted automatically.' },
            ].map((item, index) => (
              <div key={item.title} className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-teal-600 text-sm font-bold text-white">
                  {index + 1}
                </span>
                <h3 className="mt-4 text-lg font-semibold text-slate-900">{item.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-500">{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="pb-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="rounded-[36px] bg-[linear-gradient(150deg,#0c4535_0%,#0a3d31_100%)] px-6 py-10 text-center text-white shadow-[0_24px_80px_-45px_rgba(12,69,53,0.9)] sm:px-10">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-300">Ready To Book</p>
            <h2 className="mt-3 font-display text-3xl font-bold" style={{ fontFamily: 'Sora, sans-serif' }}>
              Start with a category, a provider, or a request
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-sm leading-6 text-slate-200">
              HudumaLink now centers the full experience around service categories, provider selection, secure escrow payments, and the existing request flow.
            </p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Link to="/services" className="rounded-2xl bg-white px-6 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-100">
                Browse Providers
              </Link>
              <Link to="/services/request/new" className="rounded-2xl border border-white/20 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10">
                Post Service Request
              </Link>
            </div>
          </div>
        </div>
      </section>
    </PublicSiteShell>
  )
}
