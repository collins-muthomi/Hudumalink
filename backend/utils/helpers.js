const jwt = require('jsonwebtoken')
const { customAlphabet } = require('nanoid')
const { Notification, Wallet, Transaction } = require('../models/index')
const User = require('../models/User')

const nanoid = customAlphabet('ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', 8)

// ─── JWT ─────────────────────────────────────────────────
const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' })

const signRefreshToken = (id) =>
  jwt.sign({ id }, process.env.JWT_REFRESH_SECRET, { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d' })

const sendTokens = (user, res, statusCode = 200) => {
  const access = signToken(user._id)
  const refresh = signRefreshToken(user._id)

  // Set HTTP-only cookies for security
  const isProduction = process.env.NODE_ENV === 'production'
  const cookieOptions = {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'strict' : 'lax',
    maxAge: 24 * 60 * 60 * 1000, // 24 hours for access token
  }

  const refreshCookieOptions = {
    ...cookieOptions,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days for refresh token
  }

  res.cookie('accessToken', access, cookieOptions)
  res.cookie('refreshToken', refresh, refreshCookieOptions)

  res.status(statusCode).json({ user })
}

// ─── Referral code ───────────────────────────────────────
const generateReferralCode = () => nanoid()

// ─── Pagination helper ───────────────────────────────────
const paginate = (query, page = 1, limit = 20) => {
  const skip = (Number(page) - 1) * Number(limit)
  return query.skip(skip).limit(Number(limit))
}

const paginatedResponse = async (Model, filter, options = {}) => {
  const { page = 1, limit = 20, sort = { createdAt: -1 }, populate = '', select = '' } = options
  const skip = (Number(page) - 1) * Number(limit)
  const [count, results] = await Promise.all([
    Model.countDocuments(filter),
    Model.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(Number(limit))
      .populate(populate)
      .select(select),
  ])
  return {
    count,
    next: skip + results.length < count ? page + 1 : null,
    previous: page > 1 ? page - 1 : null,
    results,
  }
}

// ─── Push notification ───────────────────────────────────
const notify = async (userId, { type = 'system', title, message = '', data = {} }, session = null) => {
  try {
    const notification = new Notification({ user: userId, type, title, message, data })
    await notification.save({ session })
  } catch {}
}

const notifyAdmins = async (payload, session = null) => {
  try {
    const admins = await User.find({ role: 'admin', is_active: true }).select('_id').session(session)
    await Promise.all(admins.map((admin) => notify(admin._id, payload, session)))
  } catch {}
}

// ─── Wallet helpers ──────────────────────────────────────
const getOrCreateWallet = async (userId, session = null) => {
  let wallet = await Wallet.findOne({ user: userId }).session(session)
  if (!wallet) wallet = await Wallet.create([{ user: userId, balance: 0 }], { session }).then((docs) => docs[0])
  return wallet
}

const creditWallet = async (userId, amount, description, reference = null, session = null) => {
  const wallet = await getOrCreateWallet(userId, session)
  wallet.balance += amount
  await wallet.save({ session })
  await Transaction.create([{ user: userId, type: 'credit', amount, description, reference, status: 'completed' }], { session })
  return wallet
}

const debitWallet = async (userId, amount, description, reference = null, session = null) => {
  const wallet = await getOrCreateWallet(userId, session)
  if (wallet.balance < amount) throw Object.assign(new Error('Insufficient wallet balance.'), { statusCode: 400 })
  wallet.balance -= amount
  await wallet.save({ session })
  await Transaction.create([{ user: userId, type: 'debit', amount, description, reference, status: 'completed' }], { session })
  return wallet
}

module.exports = {
  signToken, signRefreshToken, sendTokens,
  generateReferralCode,
  paginate, paginatedResponse,
  notify, notifyAdmins,
  getOrCreateWallet, creditWallet, debitWallet,
}
