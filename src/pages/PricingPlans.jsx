import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { plansAPI } from '../services/api'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/contexts'
import { HudumaLogo } from './LandingPage'

const defaultPlans = [
  {
    id: 'free', name: 'Free', price: 0, billing: 'month',
    description: 'Perfect for getting started in Nyeri',
    features: ['Post up to 3 service requests/month', 'Browse categorized services', 'Basic wallet', 'Notifications'],
    cta: 'Current Plan', highlight: false,
  },
  {
    id: 'pro', name: 'Pro', price: 499, billing: 'month',
    description: 'For active providers and frequent users',
    features: ['Unlimited service requests', 'Verified provider badge', 'Priority listing', 'Advanced analytics', 'Dedicated support', 'Featured in search results'],
    cta: 'Upgrade to Pro', highlight: true,
  },
  {
    id: 'business', name: 'Business', price: 1499, billing: 'month',
    description: 'For established businesses in Nyeri',
    features: ['Everything in Pro', 'Multiple staff accounts', 'Custom business profile', 'Escrow and payout oversight', 'API access', 'White-glove onboarding'],
    cta: 'Get Business', highlight: false,
  },
]

export default function PricingPlans() {
  const { user } = useAuth()
  const { toast } = useToast()
  const navigate = useNavigate()
  const [plans, setPlans] = useState(defaultPlans)
  const [currentPlan, setCurrentPlan] = useState('free')
  const [subscribing, setSubscribing] = useState(null)
  const [billing, setBilling] = useState('month')

  useEffect(() => {
    if (user) {
      plansAPI.currentPlan().then(r => setCurrentPlan(r.data.plan_id || 'free')).catch(() => {})
      plansAPI.list().then(r => { if (r.data?.length) setPlans(r.data) }).catch(() => {})
    }
  }, [user])

  const handleSubscribe = async (planId) => {
    if (!user) { navigate('/register'); return }
    if (planId === currentPlan || planId === 'free') return
    setSubscribing(planId)
    try {
      await plansAPI.subscribe({ plan: planId, billing_cycle: billing })
      toast.success('Subscription activated!', `Welcome to the ${planId} plan.`)
      setCurrentPlan(planId)
    } catch (err) {
      toast.error('Subscription failed', err.response?.data?.detail || 'Please try again.')
    } finally { setSubscribing(null) }
  }

  const dashboardPath = user
    ? user.role === 'admin'
      ? '/dashboard/admin'
      : user.role === 'provider'
        ? '/dashboard/provider'
        : user.role === 'customer'
          ? '/dashboard/customer'
          : '/services'
    : '/login'

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-300">
      <nav className="bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 sticky top-0 z-10 transition-colors duration-300">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">
          <Link to="/" className="flex items-center">
            <HudumaLogo />
          </Link>
          {user ? (
            <Link to={dashboardPath} className="btn-ghost text-sm">Dashboard</Link>
          ) : (
            <Link to="/login" className="btn-primary text-sm py-2 px-4">Sign In</Link>
          )}
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-16 space-y-12">
        <div className="text-center">
          <h1 className="font-display font-bold text-4xl text-slate-900 dark:text-slate-100 mb-3">Simple, transparent pricing</h1>
          <p className="text-slate-500 dark:text-slate-400 max-w-md mx-auto">Choose the plan that works for you. Upgrade or downgrade anytime. Pay in KSh.</p>

          <div className="inline-flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-full p-1 mt-6 transition-colors duration-300">
            {['month', 'year'].map(b => (
              <button key={b} onClick={() => setBilling(b)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all capitalize ${billing === b ? 'bg-primary-600 text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}>
                {b === 'year' ? 'Yearly (save 20%)' : 'Monthly'}
              </button>
            ))}
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {plans.map(plan => {
            const price = billing === 'year' ? Math.round(plan.price * 12 * 0.8) : plan.price
            const isCurrent = currentPlan === plan.id
            return (
              <div key={plan.id}
                className={`card flex flex-col ${plan.highlight ? 'border-primary-400 ring-2 ring-primary-300 relative' : ''}`}>
                {plan.highlight && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                    <span className="bg-primary-600 text-white text-xs font-bold px-4 py-1 rounded-full shadow-glow">Most Popular</span>
                  </div>
                )}
                <div className="p-6 flex-1">
                  <h2 className="font-display font-bold text-xl text-slate-900">{plan.name}</h2>
                  <p className="text-slate-400 text-xs mt-1 mb-4">{plan.description}</p>
                  <div className="flex items-end gap-1 mb-6">
                    <span className="font-display font-bold text-4xl text-slate-900">
                      {price === 0 ? 'Free' : `KSh ${price.toLocaleString()}`}
                    </span>
                    {price > 0 && <span className="text-slate-400 text-sm mb-1">/{billing}</span>}
                  </div>
                  <ul className="space-y-2.5">
                    {plan.features.map(f => (
                      <li key={f} className="flex items-start gap-2 text-sm text-slate-600">
                        <span className="text-emerald-500 flex-shrink-0 mt-0.5">✓</span>
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="p-6 pt-0">
                  <button
                    onClick={() => handleSubscribe(plan.id)}
                    disabled={isCurrent || plan.id === 'free' || subscribing === plan.id}
                    className={`w-full py-3 rounded-xl font-medium text-sm transition-all ${
                      isCurrent ? 'bg-slate-100 text-slate-400 cursor-default' :
                      plan.highlight ? 'btn-primary' : 'btn-secondary'
                    }`}
                  >
                    {subscribing === plan.id ? 'Processing…' : isCurrent ? '✓ Current Plan' : plan.cta}
                  </button>
                </div>
              </div>
            )
          })}
        </div>

        <div className="max-w-xl mx-auto">
          <h2 className="font-display font-bold text-2xl text-slate-900 text-center mb-6">Common questions</h2>
          {[
            { q: 'Can I cancel anytime?', a: 'Yes! Cancel anytime from your account settings. Your plan stays active until the end of the billing period.' },
            { q: 'What payment methods are accepted?', a: 'We accept M-Pesa and wallet balance. More options coming soon.' },
            { q: 'Is there a free trial?', a: 'New providers get a 7-day free trial of the Pro plan. No card required.' },
          ].map(f => (
            <div key={f.q} className="border-b border-slate-100 py-4">
              <p className="font-semibold text-slate-800 text-sm mb-1.5">{f.q}</p>
              <p className="text-slate-500 text-sm">{f.a}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
