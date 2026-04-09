const jwt = require('jsonwebtoken')
const User = require('../models/User')
const { Wallet, Referral } = require('../models/index')
const { sendTokens, generateReferralCode, creditWallet, notify } = require('../utils/helpers')

// POST /api/auth/register/
exports.register = async (req, res) => {
  const { first_name, last_name, email, phone, password, role, referral_code } = req.body

  if (!first_name || !last_name || !email || !phone || !password) {
    return res.status(400).json({ detail: 'All fields are required.' })
  }
  if (password.length < 8) {
    return res.status(400).json({ password: 'Password must be at least 8 characters.' })
  }
  const allowedRoles = ['customer', 'provider', 'delivery_driver', 'restaurant_owner']
  const userRole = allowedRoles.includes(role) ? role : 'customer'

  const existing = await User.findOne({ $or: [{ email }, { phone }] })
  if (existing) {
    if (existing.email === email.toLowerCase()) return res.status(400).json({ email: 'Email already registered.' })
    return res.status(400).json({ phone: 'Phone number already registered.' })
  }

  const code = generateReferralCode()
  const user = await User.create({ first_name, last_name, email, phone, password, role: userRole, referral_code: code })

  // Create wallet
  await Wallet.create({ user: user._id, balance: 0 })

  // Handle referral
  if (referral_code) {
    const referrer = await User.findOne({ referral_code })
    if (referrer) {
      user.referred_by = referrer._id
      await user.save()
      await Referral.create({
        referrer: referrer._id,
        referred: user._id,
        referred_name: `${user.first_name} ${user.last_name}`,
        status: 'pending',
        reward: 50,
      })
    }
  }

  sendTokens(user, res, 201)
}

// POST /api/auth/login/
exports.login = async (req, res) => {
  const { email, password } = req.body
  if (!email || !password) return res.status(400).json({ detail: 'Email and password required.' })

  const user = await User.findOne({ email }).select('+password')
  if (!user || !(await user.comparePassword(password))) {
    return res.status(401).json({ detail: 'Invalid email or password.' })
  }
  if (!user.is_active) return res.status(403).json({ detail: 'Your account has been deactivated.' })

  user.last_login = new Date()
  await user.save()

  sendTokens(user, res)
}

// POST /api/auth/logout/
exports.logout = async (req, res) => {
  res.json({ detail: 'Logged out successfully.' })
}

// GET /api/auth/me/
exports.me = async (req, res) => {
  res.json(req.user)
}

// POST /api/auth/token/refresh/
exports.refreshToken = async (req, res) => {
  const { refresh } = req.body
  if (!refresh) return res.status(400).json({ detail: 'Refresh token required.' })
  try {
    const decoded = jwt.verify(refresh, process.env.JWT_REFRESH_SECRET)
    const user = await User.findById(decoded.id)
    if (!user) return res.status(401).json({ detail: 'User not found.' })
    const access = require('../utils/helpers').signToken(user._id)
    res.json({ access })
  } catch {
    res.status(401).json({ detail: 'Invalid or expired refresh token.' })
  }
}

// POST /api/auth/change-password/
exports.changePassword = async (req, res) => {
  const { old_password, new_password } = req.body
  if (!old_password || !new_password) return res.status(400).json({ detail: 'Both fields required.' })
  if (new_password.length < 8) return res.status(400).json({ new_password: 'Minimum 8 characters.' })

  const user = await User.findById(req.user._id).select('+password')
  if (!(await user.comparePassword(old_password))) {
    return res.status(400).json({ old_password: 'Incorrect current password.' })
  }
  user.password = new_password
  await user.save()
  res.json({ detail: 'Password changed successfully.' })
}

// POST /api/auth/google/  (UI-only placeholder — integrate with google-auth-library)
exports.googleAuth = async (req, res) => {
  res.status(501).json({ detail: 'Google auth not yet configured on this server.' })
}
