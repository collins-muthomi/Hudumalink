import { Link, useNavigate } from 'react-router-dom'
import { useMemo, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { HudumaLogo } from '../../pages/LandingPage'
import ThemeToggle from '../ui/ThemeToggle'

const DEFAULT_NAV = [
  { label: 'Browse Services', to: '/services' },
  { label: 'About Us', to: '/about' },
  { label: 'Contact Us', to: '/contact' },
  { label: 'How It Works', to: '/#how' },
  { label: 'Join As Provider', to: '/register' },
]

export default function PublicSiteShell({ children, navLinks = DEFAULT_NAV, className = '' }) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [navOpen, setNavOpen] = useState(false)

  const dashboardPath = useMemo(() => {
    if (!user) return null
    if (user.role === 'admin') return '/dashboard/admin'
    if (user.role === 'provider') return '/dashboard/provider'
    if (user.role === 'customer') return '/dashboard/customer'
    return '/services'
  }, [user])

  const handleNavClick = (to) => {
    if (to === '/#how') {
      navigate('/')
      setTimeout(() => {
        document.getElementById('how')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }, 50)
      setNavOpen(false)
      return
    }

    navigate(to)
    setNavOpen(false)
  }

  return (
    <div className={`min-h-screen bg-[linear-gradient(180deg,#f0fdfa_0%,#ffffff_34%,#ecfccb_100%)] dark:bg-[linear-gradient(180deg,#020617_0%,#0f172a_42%,#052e2b_100%)] transition-colors duration-300 ${className}`} style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <nav className="sticky top-0 z-40 border-b border-white/70 dark:border-slate-700/70 bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl transition-colors duration-300">
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-8 px-4 sm:px-6">
          <Link to="/"><HudumaLogo /></Link>
          <div className="hidden flex-1 items-center gap-7 md:flex">
            {navLinks.map((item) => item.to === '/#how' ? (
              <button key={item.label} type="button" onClick={() => handleNavClick(item.to)} className="text-sm font-medium text-slate-600 dark:text-slate-400 transition-colors hover:text-teal-700 dark:hover:text-teal-400">
                {item.label}
              </button>
            ) : (
              <Link key={item.label} to={item.to} className="text-sm font-medium text-slate-600 dark:text-slate-400 transition-colors hover:text-teal-700 dark:hover:text-teal-400">
                {item.label}
              </Link>
            ))}
          </div>
          <div className="ml-auto hidden items-center gap-2 md:flex">
            <ThemeToggle />
            {user ? (
              <Link to={dashboardPath} className="rounded-xl bg-slate-900 dark:bg-slate-800 px-5 py-2.5 text-sm font-semibold text-white dark:text-slate-100 transition hover:bg-slate-800 dark:hover:bg-slate-700">
                Dashboard
              </Link>
            ) : (
              <>
                <Link to="/login" className="rounded-xl px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 transition hover:bg-slate-100 dark:hover:bg-slate-700">
                  Sign in
                </Link>
                <Link to="/register" className="rounded-xl bg-teal-600 dark:bg-teal-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-700 dark:hover:bg-teal-700">
                  Get started
                </Link>
              </>
            )}
          </div>
          <button type="button" onClick={() => setNavOpen((value) => !value)} className="ml-auto rounded-lg p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 md:hidden transition-colors">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              {navOpen
                ? <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                : <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />}
            </svg>
          </button>
        </div>
        {navOpen && (
          <div className="space-y-1 border-t border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-3 md:hidden transition-colors">
            {navLinks.map((item) => (
              <button key={item.label} type="button" onClick={() => handleNavClick(item.to)} className="block w-full rounded-xl px-3 py-2.5 text-left text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                {item.label}
              </button>
            ))}
          </div>
        )}
      </nav>

      {children}

      <footer className="border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 py-8 transition-colors duration-300">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 sm:flex-row sm:px-6">
          <HudumaLogo size="sm" />
          <p className="text-center text-xs text-slate-400 dark:text-slate-500 sm:text-left">© {new Date().getFullYear()} HudumaLink. Trusted local services across Nyeri and surrounding areas.</p>
          <div className="flex gap-4 text-xs font-medium text-slate-500 dark:text-slate-400">
            <Link to="/about" className="transition hover:text-slate-700 dark:hover:text-slate-300">About</Link>
            <Link to="/contact" className="transition hover:text-slate-700 dark:hover:text-slate-300">Contact</Link>
            <Link to="/pricing" className="transition hover:text-slate-700 dark:hover:text-slate-300">Pricing</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
