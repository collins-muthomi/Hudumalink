import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

// ── Shared HudumaLink Logo — hexagon + wordmark ──────────
export function HudumaLogo({ size = 'md', dark = false }) {
  const s = { sm: [26, 14], md: [33, 18], lg: [42, 23] }[size] || [33, 18]
  return (
    <div className="flex items-center gap-2 select-none">
      <svg width={s[0]} height={s[0]} viewBox="0 0 40 40" fill="none">
        <path d="M20 2L36 11V29L20 38L4 29V11L20 2Z" fill="#0d9488"/>
        <circle cx="20" cy="20" r="7" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="1"/>
        <path d="M14.5 20.5L18.5 24.5L26 16" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
      <div style={{ lineHeight: 1 }}>
        <div style={{ fontSize: s[1], fontFamily: 'Sora, sans-serif', fontWeight: 700 }}
          className={dark ? 'text-white' : 'text-slate-900'}>
          Huduma<span style={{ color: '#14b8a6' }}>Link</span>
        </div>
        <div style={{ fontSize: 9, letterSpacing: '0.12em', color: dark ? 'rgba(255,255,255,0.4)' : '#94a3b8', marginTop: 2 }}
          className="font-medium uppercase">Nyeri County</div>
      </div>
    </div>
  )
}

const CATS = [
  { e: '⚡', n: 'Electricians', c: '84 nearby', bg: '#fefce8' },
  { e: '🔧', n: 'Plumbers', c: '61 nearby', bg: '#eff6ff' },
  { e: '🚗', n: 'Mechanics', c: '43 nearby', bg: '#fef2f2' },
  { e: '🧹', n: 'Cleaners', c: '118 nearby', bg: '#f0fdf4' },
  { e: '📱', n: 'Phone Repair', c: '29 nearby', bg: '#faf5ff' },
  { e: '🪚', n: 'Carpenters', c: '22 nearby', bg: '#fffbeb' },
  { e: '🎨', n: 'Painters', c: '51 nearby', bg: '#fdf2f8' },
  { e: '🔌', n: 'Appliance Repair', c: '37 nearby', bg: '#eef2ff' },
]

const PROVIDERS = [
  { i: 'JM', name: 'James Mwangi', role: 'Certified Electrician', yrs: 6, rating: 4.4, rev: 142, price: 800, v: true, bg: '#0d9488' },
  { i: 'AK', name: 'Amina Kariuki', role: 'Plumber', yrs: 4, rating: 4.8, rev: 98, price: 600, v: true, bg: '#2563eb' },
  { i: 'PN', name: 'Peter Njoroge', role: 'Phone Repair Tech', yrs: 3, rating: 4.7, rev: 76, price: 500, v: false, bg: '#ea580c' },
  { i: 'GW', name: 'Grace Wambui', role: 'Professional Cleaner', yrs: 5, rating: 4.9, rev: 204, price: 1200, v: true, bg: '#7c3aed' },
  { i: 'DK', name: 'David Kariuki', role: 'Private Tutor', yrs: 6, rating: 4.6, rev: 118, price: 500, v: true, bg: '#059669' },
]

const STATS = [
  { v: '1,240+', l: 'Verified providers' },
  { v: '4.8★', l: 'Average rating' },
  { v: '12 min', l: 'Avg. response time' },
  { v: '8 sub-counties', l: 'Coverage in Nyeri' },
]

export default function LandingPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [q, setQ] = useState('')
  const [nav, setNav] = useState(false)
  const dash = user
    ? user.role === 'delivery_driver'
      ? '/dashboard/driver'
      : user.role === 'restaurant_owner'
        ? '/dashboard/restaurant'
        : `/dashboard/${user.role}`
    : null

  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: "'DM Sans',sans-serif" }}>

      {/* NAV */}
      <nav className="sticky top-0 z-40 bg-white border-b border-slate-100 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center h-16 gap-8">
          <Link to="/"><HudumaLogo /></Link>
          <div className="hidden md:flex items-center gap-7 flex-1">
            {[['Home','/'],['Providers','/services'],['How it works','#how'],['Join as provider','/register']].map(([l,to])=>(
              <Link key={l} to={to} className="text-sm font-medium text-slate-600 hover:text-teal-600 transition-colors">{l}</Link>
            ))}
          </div>
          <div className="hidden md:flex items-center gap-2 ml-auto">
            {user ? (
              <Link to={dash} className="bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition-colors">Dashboard →</Link>
            ) : (<>
              <Link to="/login" className="flex items-center gap-1.5 text-sm font-medium text-slate-600 px-4 py-2 rounded-lg hover:bg-slate-50 transition-colors">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
                Sign in
              </Link>
              <Link to="/register" className="flex items-center gap-1.5 bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition-colors shadow-sm">
                Get started <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/></svg>
              </Link>
            </>)}
          </div>
          <button onClick={()=>setNav(v=>!v)} className="md:hidden ml-auto p-2 rounded-lg text-slate-500 hover:bg-slate-50">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              {nav?<path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>:<path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16"/>}
            </svg>
          </button>
        </div>
        {nav && (
          <div className="md:hidden bg-white border-t border-slate-100 px-4 py-3 space-y-1">
            {['Providers','How it works','Join as provider'].map(l=>(
              <Link key={l} to={l==='Providers'?'/services':l==='Join as provider'?'/register':'#'} onClick={()=>setNav(false)}
                className="block text-sm font-medium text-slate-600 py-2.5 border-b border-slate-50 last:border-0">{l}</Link>
            ))}
            <div className="flex gap-3 pt-3">
              <Link to="/login" className="flex-1 text-center text-sm font-medium border border-slate-200 py-2.5 rounded-xl">Sign in</Link>
              <Link to="/register" className="flex-1 text-center text-sm font-semibold bg-teal-600 text-white py-2.5 rounded-xl">Get started</Link>
            </div>
          </div>
        )}
      </nav>

      {/* HERO */}
      <section style={{ background: 'linear-gradient(150deg,#0c4535 0%,#0a3a2c 55%,#072e22 100%)' }} className="text-white relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-20 -right-20 w-96 h-96 rounded-full" style={{ background: 'radial-gradient(circle,rgba(20,184,166,0.12) 0%,transparent 70%)' }}/>
          <div className="absolute bottom-0 left-0 w-64 h-64 rounded-full" style={{ background: 'radial-gradient(circle,rgba(16,185,129,0.08) 0%,transparent 70%)' }}/>
        </div>
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 pt-14 pb-0">
          <span className="inline-flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded-full border mb-8" style={{ background: 'rgba(255,255,255,0.08)', borderColor: 'rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.75)' }}>
            <svg className="w-3 h-3" style={{ color: '#34d399' }} fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd"/></svg>
            Serving Nyeri County, Kenya
          </span>
          <div className="max-w-2xl pb-14">
            <h1 style={{ fontFamily: 'Sora,sans-serif', lineHeight: 1.08, fontWeight: 700 }} className="text-4xl sm:text-5xl lg:text-6xl mb-5">
              Find trusted<br/>
              <span style={{ color: '#4ade80' }}>local experts</span><br/>
              near you
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.6)' }} className="text-base sm:text-lg mb-9 leading-relaxed max-w-lg">
              Electricians, plumbers, mechanics, cleaners and more — all verified, rated, and ready to help across Nyeri County.
            </p>
            {/* Search */}
            <form onSubmit={e=>{e.preventDefault();navigate(`/services${q?`?search=${encodeURIComponent(q)}`:''}`);}}
              className="flex items-center bg-white rounded-2xl overflow-hidden shadow-2xl max-w-lg">
              <div className="flex items-center flex-1 px-4 gap-2.5 min-w-0">
                <svg className="w-4 h-4 flex-shrink-0" style={{ color: '#94a3b8' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
                </svg>
                <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search e.g. electrician, plumber..."
                  className="flex-1 text-sm text-slate-700 placeholder-slate-400 outline-none bg-transparent py-3.5 min-w-0"/>
              </div>
              <div className="hidden sm:flex items-center gap-1.5 px-3 py-3.5 border-l text-xs font-medium flex-shrink-0" style={{ borderColor: '#e2e8f0', color: '#64748b' }}>
                <svg className="w-3.5 h-3.5" style={{ color: '#0d9488' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/></svg>
                All of Nyeri
                <svg className="w-3 h-3" style={{ color: '#cbd5e1' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7"/></svg>
              </div>
              <button type="submit" className="flex items-center gap-1.5 text-white text-sm font-semibold px-5 py-3.5 flex-shrink-0 transition-colors"
                style={{ background: '#0d9488' }} onMouseEnter={e=>e.target.style.background='#0f766e'} onMouseLeave={e=>e.target.style.background='#0d9488'}>
                Search <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/></svg>
              </button>
            </form>
            <div className="flex flex-wrap gap-2 mt-4">
              {['Electrician','Plumber','Phone Repair','Cleaner','Mechanic'].map(t=>(
                <button key={t} onClick={()=>navigate(`/services?search=${t}`)}
                  className="text-xs px-3 py-1 rounded-full border transition-all"
                  style={{ color: 'rgba(255,255,255,0.6)', borderColor: 'rgba(255,255,255,0.15)' }}
                  onMouseEnter={e=>{e.target.style.color='rgba(255,255,255,0.95)';e.target.style.borderColor='rgba(255,255,255,0.35)'}}
                  onMouseLeave={e=>{e.target.style.color='rgba(255,255,255,0.6)';e.target.style.borderColor='rgba(255,255,255,0.15)'}}>
                  {t}
                </button>
              ))}
            </div>
          </div>
        </div>
        {/* Stats */}
        <div style={{ background: 'rgba(0,0,0,0.18)', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-5 grid grid-cols-2 sm:grid-cols-4 divide-x" style={{ '--tw-divide-opacity': 1, borderColor: 'rgba(255,255,255,0.08)' }}>
            {STATS.map(s=>(
              <div key={s.l} className="text-center px-4">
                <p style={{ fontFamily: 'Sora,sans-serif', fontWeight: 700, fontSize: 22, color: '#fff' }}>{s.v}</p>
                <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>{s.l}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CATEGORIES */}
      <section className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-10">
            <h2 style={{ fontFamily: 'Sora,sans-serif', fontWeight: 700, fontSize: 28 }} className="text-slate-900 mb-2">Browse by category</h2>
            <p className="text-slate-400 text-sm">Find the right professional for any job in Nyeri County</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {CATS.map(c=>(
              <Link key={c.n} to={`/services?search=${encodeURIComponent(c.n)}`}
                className="bg-white border border-slate-100 rounded-2xl p-5 sm:p-6 flex flex-col items-center gap-3 transition-all duration-200 group hover:shadow-md"
                style={{ '--hover-border': '#99f6e4' }}
                onMouseEnter={e=>e.currentTarget.style.borderColor='#99f6e4'}
                onMouseLeave={e=>e.currentTarget.style.borderColor='#f1f5f9'}>
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl" style={{ background: c.bg }}>{c.e}</div>
                <div className="text-center">
                  <p className="text-sm font-semibold text-slate-800 group-hover:text-teal-700 transition-colors">{c.n}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{c.c}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* TOP RATED */}
      <section className="py-16" style={{ background: '#f8fafc' }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex items-end justify-between mb-8">
            <div>
              <h2 style={{ fontFamily: 'Sora,sans-serif', fontWeight: 700, fontSize: 28 }} className="text-slate-900">Top rated nearby</h2>
              <p className="text-slate-400 text-sm mt-1">Highest-rated providers in Nyeri County this week</p>
            </div>
            <Link to="/services" className="hidden sm:flex items-center gap-1 text-sm font-semibold text-teal-600 hover:text-teal-700">
              See all <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/></svg>
            </Link>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-3 -mx-4 px-4 sm:mx-0 sm:px-0" style={{ scrollbarWidth: 'none' }}>
            {PROVIDERS.map(p=>(
              <Link key={p.name} to="/services"
                className="flex-shrink-0 w-60 sm:w-64 bg-white rounded-2xl border border-slate-100 p-4 hover:shadow-md hover:border-teal-200 transition-all duration-200 group snap-start">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-xs flex-shrink-0"
                      style={{ background: p.bg }}>{p.i}</div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-900 group-hover:text-teal-700 transition-colors truncate leading-tight">{p.name}</p>
                      <p className="text-[11px] text-slate-400 mt-0.5 truncate">{p.role} · {p.yrs} yrs</p>
                    </div>
                  </div>
                  <span className="text-xs font-bold px-2 py-1 rounded-lg whitespace-nowrap ml-2 flex-shrink-0" style={{ color: '#0d9488', background: '#f0fdfa' }}>
                    KSh {p.price.toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <span className="text-amber-400 text-xs">{'★'.repeat(Math.round(p.rating))}{'☆'.repeat(5-Math.round(p.rating))}</span>
                    <span className="text-[11px] text-slate-400 ml-0.5">{p.rating} ({p.rev})</span>
                  </div>
                  {p.v && (
                    <span className="flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ color: '#059669', background: '#ecfdf5' }}>
                      <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
                      Verified
                    </span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how" className="py-16 bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <h2 style={{ fontFamily: 'Sora,sans-serif', fontWeight: 700, fontSize: 28 }} className="text-slate-900 mb-2">How it works</h2>
          <p className="text-slate-400 text-sm mb-12">Get help in minutes, not days</p>
          <div className="grid sm:grid-cols-3 gap-10">
            {[{n:'1',e:'🔍',t:'Search & browse',d:'Find verified professionals near you in Nyeri County.'},
              {n:'2',e:'📝',t:'Post your request',d:'Describe the job, set a budget and receive quotes fast.'},
              {n:'3',e:'✅',t:'Get it done',d:'Book, pay via M-Pesa and leave a review.'}].map(s=>(
              <div key={s.n} className="flex flex-col items-center">
                <div className="relative mb-4">
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl" style={{ background: '#f0fdfa' }}>{s.e}</div>
                  <span className="absolute -top-2 -right-2 w-5 h-5 rounded-full text-white flex items-center justify-center font-bold" style={{ fontSize: 10, background: '#0d9488' }}>{s.n}</span>
                </div>
                <h3 className="font-semibold text-slate-900 mb-2 text-sm">{s.t}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ background: 'linear-gradient(150deg,#0c4535 0%,#0a3d31 100%)' }} className="py-16">
        <div className="max-w-xl mx-auto px-4 text-center">
          <h2 style={{ fontFamily: 'Sora,sans-serif', fontWeight: 700, fontSize: 28, color: '#fff' }} className="mb-3">Ready to get started?</h2>
          <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 14 }} className="mb-8">Join thousands of Nyeri residents already using HudumaLink every day.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/register" className="font-semibold py-3 px-8 rounded-xl text-sm text-white transition-colors shadow-lg" style={{ background: '#14b8a6' }}
              onMouseEnter={e=>e.target.style.background='#0d9488'} onMouseLeave={e=>e.target.style.background='#14b8a6'}>
              Create Free Account
            </Link>
            <Link to="/services" className="font-semibold py-3 px-8 rounded-xl text-sm text-white transition-colors" style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)' }}>
              Browse Services
            </Link>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ background: '#0f172a', borderTop: '1px solid #1e293b' }} className="py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <HudumaLogo size="sm" dark />
          <p style={{ fontSize: 12, color: '#475569' }}>© {new Date().getFullYear()} HudumaLink · Nyeri County, Kenya</p>
          <div className="flex gap-5" style={{ fontSize: 12, color: '#475569' }}>
            {[['Pricing','/pricing'],['Privacy','#'],['Terms','#']].map(([l,to])=>(
              <Link key={l} to={to} className="hover:text-slate-300 transition-colors">{l}</Link>
            ))}
          </div>
        </div>
      </footer>
    </div>
  )
}
