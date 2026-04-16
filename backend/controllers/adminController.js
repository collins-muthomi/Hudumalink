const User = require('../models/User')
const { ProviderProfile, Wallet, ActivityLog, Notification } = require('../models/index')
const { FoodOrder } = require('../models/Food')
const { MarketplaceOrder } = require('../models/Marketplace')
const { ServiceBooking } = require('../models/Service')
const CustomerRequest = require('../models/CustomerRequest')
const { DriverProfile } = require('../models/Delivery')
const { paginatedResponse, notify } = require('../utils/helpers')

// GET /api/admin/stats/
exports.getStats = async (req, res) => {
  const now = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

  const [
    total_users,
    total_providers,
    total_drivers,
    today_service_requests,
    today_service_bookings,
    pending_verifications,
    active_drivers,
    monthly_completed_requests,
    monthly_completed_bookings,
    escrowWallets,
  ] = await Promise.all([
    User.countDocuments({ role: 'customer' }),
    User.countDocuments({ role: 'provider' }),
    DriverProfile.countDocuments({ is_approved: true }),
    CustomerRequest.countDocuments({ createdAt: { $gte: todayStart } }),
    ServiceBooking.countDocuments({ createdAt: { $gte: todayStart } }),
    ProviderProfile.countDocuments({ verification_status: 'pending' }),
    DriverProfile.countDocuments({ is_available: true, is_approved: true }),
    CustomerRequest.find({ createdAt: { $gte: monthStart }, payment_status: 'payout_released' }).select('admin_fee'),
    ServiceBooking.find({ createdAt: { $gte: monthStart }, payment_status: 'payout_released' }).select('admin_fee'),
    Wallet.find({ locked: { $gt: 0 } }).select('locked'),
  ])

  const monthly_revenue = [...monthly_completed_requests, ...monthly_completed_bookings]
    .reduce((sum, item) => sum + Number(item.admin_fee || 0), 0)
  const escrow_balance = escrowWallets.reduce((sum, wallet) => sum + Number(wallet.locked || 0), 0)

  res.json({
    total_users,
    total_providers,
    total_drivers,
    today_orders: today_service_requests + today_service_bookings,
    monthly_revenue,
    pending_verifications,
    active_drivers,
    today_service_requests,
    today_service_bookings,
    escrow_balance,
  })
}

// GET /api/admin/users/
exports.getUsers = async (req, res) => {
  const { search, role, status, page = 1, limit = 20 } = req.query
  const filter = {}
  if (role) filter.role = role
  if (status === 'active') filter.is_active = true
  if (status === 'suspended') filter.is_active = false
  if (search) filter.$or = [
    { first_name: { $regex: search, $options: 'i' } },
    { last_name: { $regex: search, $options: 'i' } },
    { email: { $regex: search, $options: 'i' } },
    { phone: { $regex: search, $options: 'i' } },
  ]
  const data = await paginatedResponse(User, filter, { page, limit, sort: { createdAt: -1 } })
  res.json(data)
}

// PATCH /api/admin/users/:id/
exports.updateUser = async (req, res) => {
  const user = await User.findById(req.params.id)
  if (!user) return res.status(404).json({ detail: 'User not found.' })
  const allowed = ['is_active', 'role', 'is_verified', 'plan']
  allowed.forEach(k => { if (req.body[k] !== undefined) user[k] = req.body[k] })

  if (req.body.is_active === false) {
    user.suspension_reason = req.body.suspension_reason || 'Suspended for violating company rules.'
    user.suspended_at = new Date()
  }

  if (req.body.is_active === true) {
    user.suspension_reason = null
    user.suspended_at = null
  }

  await user.save()

  if (req.body.is_active === false) {
    await notify(user._id, {
      type: 'system',
      title: 'Account suspended',
      message: `Your account has been suspended. Reason: ${user.suspension_reason}`,
    })
  }

  if (req.body.is_active === true) {
    await notify(user._id, {
      type: 'system',
      title: 'Account reactivated',
      message: 'Your HudumaLink account has been reactivated.',
    })
  }

  await ActivityLog.create({
    user: req.user._id,
    action: 'admin.update_user',
    details: `Updated user ${user.email}: ${JSON.stringify(req.body)}`,
    ip: req.ip,
  })

  res.json(user)
}

// GET /api/admin/verifications/pending/
exports.getPendingVerifications = async (req, res) => {
  const verifications = await ProviderProfile.find({ verification_status: 'pending' })
    .populate('user', 'first_name last_name email phone')
    .sort({ submitted_at: 1 })

  const results = verifications.map(v => ({
    id: v._id,
    provider_name: v.user ? `${v.user.first_name} ${v.user.last_name}` : 'Unknown',
    email: v.user?.email,
    service_type: v.service_type,
    submitted_at: v.submitted_at,
    id_front: v.id_front,
    id_back: v.id_back,
    certificate: v.certificate,
    profile_photo: v.profile_photo,
  }))

  res.json({ count: results.length, results })
}

// POST /api/admin/verifications/:id/approve/
exports.approveVerification = async (req, res) => {
  const profile = await ProviderProfile.findById(req.params.id).populate('user')
  if (!profile) return res.status(404).json({ detail: 'Verification not found.' })

  profile.verification_status = 'approved'
  profile.approved_at = new Date()
  await profile.save()

  // Mark user as verified
  if (profile.user) {
    await User.findByIdAndUpdate(profile.user._id, { is_verified: true })
    await notify(profile.user._id, {
      type: 'system',
      title: '✅ Verification approved!',
      message: 'Congratulations! Your provider account is now verified. You will appear in search with a verified badge.',
    })
  }

  await ActivityLog.create({
    user: req.user._id,
    action: 'admin.approve_verification',
    details: `Approved verification for provider ${profile._id}`,
    ip: req.ip,
  })

  res.json({ detail: 'Verification approved.' })
}

// POST /api/admin/verifications/:id/reject/
exports.rejectVerification = async (req, res) => {
  const { reason } = req.body
  const profile = await ProviderProfile.findById(req.params.id).populate('user')
  if (!profile) return res.status(404).json({ detail: 'Verification not found.' })

  profile.verification_status = 'rejected'
  profile.rejection_reason = reason || 'Documents could not be verified.'
  await profile.save()

  if (profile.user) {
    await notify(profile.user._id, {
      type: 'system',
      title: 'Verification not approved',
      message: `Your verification was not approved. Reason: ${profile.rejection_reason}. Please re-submit with clearer documents.`,
    })
  }

  res.json({ detail: 'Verification rejected.' })
}

// GET /api/admin/reports/
exports.getReports = async (req, res) => {
  const { type = 'overview', page = 1 } = req.query

  if (type === 'food_orders') {
    const data = await paginatedResponse(FoodOrder, {}, {
      page, limit: 20, sort: { createdAt: -1 },
      populate: [
        { path: 'customer', select: 'first_name last_name' },
        { path: 'restaurant', select: 'name' },
      ],
    })
    return res.json(data)
  }

  if (type === 'marketplace_orders') {
    const data = await paginatedResponse(MarketplaceOrder, {}, {
      page, limit: 20, sort: { createdAt: -1 },
      populate: [
        { path: 'buyer', select: 'first_name last_name' },
        { path: 'product', select: 'title' },
      ],
    })
    return res.json(data)
  }

  if (type === 'service_requests') {
    const data = await paginatedResponse(CustomerRequest, {}, {
      page, limit: 20, sort: { createdAt: -1 },
      populate: [
        { path: 'customer', select: 'first_name last_name' },
        { path: 'assignedProvider', select: 'first_name last_name' },
      ],
    })
    return res.json(data)
  }

  if (type === 'service_bookings') {
    const data = await paginatedResponse(ServiceBooking, {}, {
      page, limit: 20, sort: { createdAt: -1 },
      populate: [
        { path: 'customer', select: 'first_name last_name' },
        { path: 'provider', select: 'first_name last_name' },
        { path: 'service', select: 'title' },
      ],
    })
    return res.json(data)
  }

  res.json({ type, detail: 'Use ?type=service_requests|service_bookings' })
}

// GET /api/admin/activity/
exports.getActivityLog = async (req, res) => {
  const logs = await ActivityLog.find({})
    .sort({ createdAt: -1 })
    .limit(50)
    .populate('user', 'first_name last_name email')
  res.json(logs)
}
