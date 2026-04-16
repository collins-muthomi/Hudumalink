const crypto = require('crypto')
const jwt = require('jsonwebtoken')
const User = require('../models/User')
const { Wallet, Referral } = require('../models/index')
const { sendTokens, signToken, signRefreshToken, generateReferralCode } = require('../utils/helpers')
const { sendEmail } = require('../utils/email')

const EMAIL_VERIFICATION_WINDOW_MINUTES = 15

const buildVerificationCode = () => String(crypto.randomInt(100000, 1000000))

const buildVerificationFields = () => ({
  emailVerificationCode: buildVerificationCode(),
  emailVerificationExpires: new Date(Date.now() + EMAIL_VERIFICATION_WINDOW_MINUTES * 60 * 1000),
})

const sendVerificationCodeEmail = async (user) => {
  if (!user?.email || !user?.emailVerificationCode) return

  await sendEmail({
    to: user.email,
    template: 'emailVerificationOtp',
    data: {
      first_name: user.first_name,
      code: user.emailVerificationCode,
      minutes: EMAIL_VERIFICATION_WINDOW_MINUTES,
    },
  })
}

// POST /api/auth/register/
exports.register = async (req, res) => {
  const { first_name, last_name, email, phone, password, role, referral_code } = req.body

  if (!first_name || !last_name || !email || !phone || !password) {
    return res.status(400).json({ detail: 'All fields are required.' })
  }
  if (password.length < 8) {
    return res.status(400).json({ password: 'Password must be at least 8 characters.' })
  }

  const normalizedEmail = email.toLowerCase().trim()
  const allowedRoles = ['customer', 'provider', 'delivery_driver', 'restaurant_owner']
  const userRole = allowedRoles.includes(role) ? role : 'customer'

  const existing = await User.findOne({ $or: [{ email: normalizedEmail }, { phone }] })
  if (existing) {
    if (existing.email === normalizedEmail) return res.status(400).json({ email: 'Email already registered.' })
    return res.status(400).json({ phone: 'Phone number already registered.' })
  }

  const verificationFields = buildVerificationFields()
  const referralCode = generateReferralCode()
  const user = await User.create({
    first_name,
    last_name,
    email: normalizedEmail,
    phone,
    password,
    role: userRole,
    referral_code: referralCode,
    is_verified: false,
    ...verificationFields,
  })

  await Wallet.create({ user: user._id, balance: 0 })

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

  await sendVerificationCodeEmail(user)

  res.status(201).json({
    detail: 'Account created. Please verify your email with the code we sent.',
    requiresVerification: true,
    email: user.email,
    user,
  })
}

// POST /api/auth/verify-email/
exports.verifyEmail = async (req, res) => {
  const { email, code } = req.body
  if (!email || !code) {
    return res.status(400).json({ detail: 'Email and verification code are required.' })
  }

  const normalizedEmail = email.toLowerCase().trim()
  const normalizedCode = String(code).trim()
  const user = await User.findOne({ email: normalizedEmail }).select('+emailVerificationCode +emailVerificationExpires')

  if (!user) return res.status(404).json({ detail: 'User not found.' })
  if (user.is_verified) return res.json({ detail: 'Email already verified.', alreadyVerified: true })

  if (!user.emailVerificationCode || user.emailVerificationCode !== normalizedCode) {
    return res.status(400).json({ detail: 'Invalid verification code.' })
  }

  if (!user.emailVerificationExpires || user.emailVerificationExpires < new Date()) {
    return res.status(400).json({ detail: 'Verification code has expired. Please request a new code.' })
  }

  user.is_verified = true
  user.emailVerificationCode = null
  user.emailVerificationExpires = null
  user.last_login = new Date()
  await user.save()

  await sendEmail({
    to: user.email,
    template: 'welcome',
    data: { first_name: user.first_name },
  })

  res.json({
    detail: 'Email verified successfully.',
    access: signToken(user._id),
    refresh: signRefreshToken(user._id),
    user,
  })
}

// POST /api/auth/resend-verification-code/
exports.resendVerificationCode = async (req, res) => {
  const { email } = req.body
  if (!email) return res.status(400).json({ detail: 'Email is required.' })

  const normalizedEmail = email.toLowerCase().trim()
  const user = await User.findOne({ email: normalizedEmail }).select('+emailVerificationCode +emailVerificationExpires')

  if (!user) return res.status(404).json({ detail: 'User not found.' })
  if (user.is_verified) return res.json({ detail: 'Already verified', alreadyVerified: true })

  Object.assign(user, buildVerificationFields())
  await user.save()
  await sendVerificationCodeEmail(user)

  res.json({
    detail: 'A new verification code has been sent to your email.',
    requiresVerification: true,
    email: user.email,
  })
}

// POST /api/auth/login/
exports.login = async (req, res) => {
  const { email, password } = req.body
  if (!email || !password) return res.status(400).json({ detail: 'Email and password required.' })

  const normalizedEmail = email.toLowerCase().trim()
  const user = await User.findOne({ email: normalizedEmail }).select('+password')
  if (!user || !(await user.comparePassword(password))) {
    return res.status(401).json({ detail: 'Invalid email or password.' })
  }
  if (!user.is_active) return res.status(403).json({ detail: 'Your account has been deactivated.' })
  if (!user.is_verified) {
    return res.status(403).json({
      detail: 'Please verify your email before logging in',
      requiresVerification: true,
      email: user.email,
    })
  }

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
    if (!user.is_verified) {
      return res.status(403).json({ detail: 'Please verify your email before logging in' })
    }
    const access = signToken(user._id)
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
