const User = require('../models/User')
const { notify, debitWallet } = require('../utils/helpers')

const PLANS = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    billing: 'month',
    description: 'Perfect for getting started in Nyeri',
    features: ['Post up to 3 service requests/month', 'Browse marketplace', 'Order food', 'Basic wallet'],
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 499,
    billing: 'month',
    description: 'For active providers and frequent users',
    features: ['Unlimited service requests', 'Verified provider badge', 'Priority listing', 'Advanced analytics', 'Dedicated support', 'Featured in search results'],
  },
  {
    id: 'business',
    name: 'Business',
    price: 1499,
    billing: 'month',
    description: 'For established businesses in Nyeri',
    features: ['Everything in Pro', 'Multiple staff accounts', 'Custom business profile', 'Bulk ordering tools', 'API access', 'White-glove onboarding'],
  },
]

// GET /api/plans/
exports.listPlans = (req, res) => res.json(PLANS)

// GET /api/plans/current/
exports.currentPlan = async (req, res) => {
  const plan = PLANS.find(p => p.id === req.user.plan) || PLANS[0]
  res.json({ ...plan, plan_id: req.user.plan, expires_at: req.user.plan_expires_at })
}

// POST /api/plans/subscribe/
exports.subscribe = async (req, res) => {
  const { plan: planId, billing_cycle = 'month' } = req.body
  const plan = PLANS.find(p => p.id === planId)
  if (!plan) return res.status(400).json({ detail: 'Invalid plan.' })
  if (planId === 'free') {
    await User.findByIdAndUpdate(req.user._id, { plan: 'free', plan_expires_at: null })
    return res.json({ detail: 'Downgraded to Free plan.' })
  }

  const months = billing_cycle === 'year' ? 12 : 1
  const price = billing_cycle === 'year' ? Math.round(plan.price * 12 * 0.8) : plan.price

  try {
    await debitWallet(req.user._id, price, `${plan.name} plan subscription (${billing_cycle})`, `PLAN-${planId}-${Date.now()}`)
  } catch (err) {
    return res.status(400).json({ detail: err.message })
  }

  const expires = new Date()
  expires.setMonth(expires.getMonth() + months)

  await User.findByIdAndUpdate(req.user._id, { plan: planId, plan_expires_at: expires })

  await notify(req.user._id, {
    type: 'system',
    title: `${plan.name} plan activated 🎉`,
    message: `Your ${plan.name} plan is now active until ${expires.toLocaleDateString()}.`,
  })

  res.json({ detail: `Successfully subscribed to ${plan.name} plan.`, plan: planId, expires_at: expires })
}
