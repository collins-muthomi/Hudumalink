const { ProviderProfile, Booking } = require('../models/index')
const User = require('../models/User')
const { paginatedResponse, notify } = require('../utils/helpers')

// GET /api/providers/:id/
exports.getProfile = async (req, res) => {
  const profile = await ProviderProfile.findOne({ user: req.params.id })
    .populate('user', 'first_name last_name email phone is_verified created_at')
  if (!profile) return res.status(404).json({ detail: 'Provider not found.' })
  const obj = profile.toJSON()
  if (profile.user) {
    obj.first_name = profile.user.first_name
    obj.last_name = profile.user.last_name
    obj.phone = profile.user.phone
    obj.is_verified = profile.user.is_verified
    obj.created_at = profile.user.createdAt
  }
  res.json(obj)
}

// GET /api/providers/me/
exports.getMyProfile = async (req, res) => {
  let profile = await ProviderProfile.findOne({ user: req.user._id })
  if (!profile) {
    // Auto-create bare profile for providers
    profile = await ProviderProfile.create({ user: req.user._id, service_type: '', experience_years: 0 })
  }
  res.json(profile)
}

// PATCH /api/providers/me/
exports.updateMyProfile = async (req, res) => {
  let profile = await ProviderProfile.findOne({ user: req.user._id })
  if (!profile) profile = await ProviderProfile.create({ user: req.user._id, service_type: '' })
  const allowed = ['service_type', 'experience_years', 'bio', 'location', 'response_time']
  allowed.forEach(k => { if (req.body[k] !== undefined) profile[k] = req.body[k] })
  if (req.file) profile.profile_photo = req.file.path || req.file.secure_url
  await profile.save()
  res.json(profile)
}

// POST /api/providers/verification/
exports.uploadVerification = async (req, res) => {
  let profile = await ProviderProfile.findOne({ user: req.user._id })
  if (!profile) profile = new ProviderProfile({ user: req.user._id, service_type: '' })

  const { service_type, experience_years, bio, location } = req.body
  if (!service_type) return res.status(400).json({ detail: 'Service type is required.' })

  const files = req.files || {}
  const getUrl = (key) => files[key]?.[0]?.path || files[key]?.[0]?.secure_url || null

  if (!getUrl('id_front') && !profile.id_front) return res.status(400).json({ id_front: 'ID front is required.' })
  if (!getUrl('id_back') && !profile.id_back) return res.status(400).json({ id_back: 'ID back is required.' })
  if (!getUrl('photo') && !profile.profile_photo) return res.status(400).json({ photo: 'Profile photo is required.' })

  profile.service_type = service_type
  profile.experience_years = experience_years || 0
  profile.bio = bio || ''
  profile.location = location || 'Nyeri Town'
  if (getUrl('id_front')) profile.id_front = getUrl('id_front')
  if (getUrl('id_back')) profile.id_back = getUrl('id_back')
  if (getUrl('certificate')) profile.certificate = getUrl('certificate')
  if (getUrl('photo')) profile.profile_photo = getUrl('photo')
  profile.verification_status = 'pending'
  profile.submitted_at = new Date()

  await profile.save()

  // Notify admins — in real app would query admin users
  res.json({ detail: 'Verification submitted successfully. You will be notified within 24-48 hours.', profile })
}

// GET /api/providers/verification/status/
exports.verificationStatus = async (req, res) => {
  const profile = await ProviderProfile.findOne({ user: req.user._id })
    .select('verification_status submitted_at approved_at rejection_reason')
  if (!profile) return res.json({ status: 'unsubmitted' })
  res.json({
    status: profile.verification_status,
    submitted_at: profile.submitted_at,
    approved_at: profile.approved_at,
    rejection_reason: profile.rejection_reason,
  })
}

// GET /api/providers/me/availability/
exports.getAvailability = async (req, res) => {
  const profile = await ProviderProfile.findOne({ user: req.user._id }).select('availability')
  res.json(profile?.availability || {})
}

// PATCH /api/providers/me/availability/
exports.updateAvailability = async (req, res) => {
  let profile = await ProviderProfile.findOne({ user: req.user._id })
  if (!profile) profile = await ProviderProfile.create({ user: req.user._id, service_type: '' })
  const days = ['monday','tuesday','wednesday','thursday','friday','saturday','sunday']
  days.forEach(d => {
    if (req.body[d] !== undefined) profile.availability[d] = !!req.body[d]
  })
  profile.markModified('availability')
  await profile.save()
  res.json(profile.availability)
}

// GET /api/providers/me/bookings/
exports.getBookings = async (req, res) => {
  const { month, year, page = 1, limit = 30 } = req.query
  const filter = { provider: req.user._id }
  if (month && year) {
    const start = new Date(year, month - 1, 1)
    const end = new Date(year, month, 0, 23, 59, 59)
    filter.createdAt = { $gte: start, $lte: end }
  }
  const data = await paginatedResponse(Booking, filter, {
    page, limit, sort: { date: 1, time: 1 },
    populate: { path: 'customer', select: 'first_name last_name phone' },
  })
  const results = data.results.map(b => {
    const obj = b.toJSON()
    if (b.customer) obj.customer_name = `${b.customer.first_name} ${b.customer.last_name}`
    return obj
  })
  res.json({ ...data, results })
}

// GET /api/providers/me/dashboard/
exports.getDashboard = async (req, res) => {
  const [profile, totalBookings, completedBookings, thisMonthBookings] = await Promise.all([
    ProviderProfile.findOne({ user: req.user._id }),
    Booking.countDocuments({ provider: req.user._id }),
    Booking.countDocuments({ provider: req.user._id, status: 'completed' }),
    Booking.find({
      provider: req.user._id,
      status: 'completed',
      createdAt: { $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) },
    }),
  ])

  const monthlyEarnings = thisMonthBookings.reduce((sum, b) => sum + (b.amount || 0), 0)

  res.json({
    total_bookings: totalBookings,
    completed_bookings: completedBookings,
    monthly_earnings: monthlyEarnings,
    average_rating: profile?.average_rating || null,
    verification_status: profile?.verification_status || 'unsubmitted',
  })
}

// GET /api/providers/me/earnings/
exports.getEarnings = async (req, res) => {
  const { page = 1, limit = 20 } = req.query
  const data = await paginatedResponse(Booking, { provider: req.user._id, status: 'completed', amount: { $gt: 0 } }, {
    page, limit, sort: { createdAt: -1 },
    populate: { path: 'customer', select: 'first_name last_name' },
  })
  res.json(data)
}
