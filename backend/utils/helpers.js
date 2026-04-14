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
  res.status(statusCode).json({ access, refresh, user })
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
const notify = async (userId, { type = 'system', title, message = '', data = {} }) => {
  try {
    await Notification.create({ user: userId, type, title, message, data })
  } catch {}
}

const notifyAdmins = async (payload) => {
  try {
    const admins = await User.find({ role: 'admin', is_active: true }).select('_id')
    await Promise.all(admins.map((admin) => notify(admin._id, payload)))
  } catch {}
}

// ─── Wallet helpers ──────────────────────────────────────
const getOrCreateWallet = async (userId) => {
  let wallet = await Wallet.findOne({ user: userId })
  if (!wallet) wallet = await Wallet.create({ user: userId, balance: 0 })
  return wallet
}

const creditWallet = async (userId, amount, description, reference = null) => {
  const wallet = await getOrCreateWallet(userId)
  wallet.balance += amount
  await wallet.save()
  await Transaction.create({ user: userId, type: 'credit', amount, description, reference, status: 'completed' })
  return wallet
}

const debitWallet = async (userId, amount, description, reference = null) => {
  const wallet = await getOrCreateWallet(userId)
  if (wallet.balance < amount) throw Object.assign(new Error('Insufficient wallet balance.'), { statusCode: 400 })
  wallet.balance -= amount
  await wallet.save()
  await Transaction.create({ user: userId, type: 'debit', amount, description, reference, status: 'completed' })
  return wallet
}

module.exports = {
  signToken, signRefreshToken, sendTokens,
  generateReferralCode,
  paginate, paginatedResponse,
  notify, notifyAdmins,
  getOrCreateWallet, creditWallet, debitWallet,
}
