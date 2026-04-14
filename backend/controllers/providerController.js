const { ProviderProfile, Booking, Review } = require('../models/index')
const { Service, ServiceBooking } = require('../models/Service')
const CustomerRequest = require('../models/CustomerRequest')
const { paginatedResponse } = require('../utils/helpers')

exports.getProfile = async (req, res) => {
  const profile = await ProviderProfile.findOne({ user: req.params.id })
    .populate('user', 'first_name last_name email phone is_verified createdAt')

  if (!profile) return res.status(404).json({ detail: 'Provider not found.' })

  const [services, reviews] = await Promise.all([
    Service.find({ provider: req.params.id, is_active: true }).sort({ createdAt: -1 }),
    Review.find({ provider: req.params.id }).sort({ createdAt: -1 }).populate('reviewer', 'first_name last_name'),
  ])

  const obj = profile.toJSON()
  if (profile.user) {
    obj.first_name = profile.user.first_name
    obj.last_name = profile.user.last_name
    obj.phone = profile.user.phone
    obj.is_verified = profile.user.is_verified
    obj.created_at = profile.user.createdAt
  }

  obj.profileImage = profile.profileImage || profile.profile_photo || null
  obj.averageRating = profile.average_rating || null
  obj.totalReviews = profile.reviews_count || 0
  obj.services = services
  obj.reviews = reviews.map((review) => ({
    ...review.toJSON(),
    reviewer_name: review.reviewer ? `${review.reviewer.first_name} ${review.reviewer.last_name}` : review.reviewer_name,
  }))

  res.json(obj)
}

exports.getMyProfile = async (req, res) => {
  let profile = await ProviderProfile.findOne({ user: req.user._id })
  if (!profile) {
    profile = await ProviderProfile.create({ user: req.user._id, service_type: '', experience_years: 0 })
  }
  res.json(profile)
}

exports.updateMyProfile = async (req, res) => {
  let profile = await ProviderProfile.findOne({ user: req.user._id })
  if (!profile) profile = await ProviderProfile.create({ user: req.user._id, service_type: '' })

  const allowed = ['service_type', 'experience_years', 'bio', 'location', 'response_time']
  allowed.forEach((key) => {
    if (req.body[key] !== undefined) profile[key] = req.body[key]
  })

  if (req.file) {
    const imageUrl = req.file.path || req.file.secure_url
    profile.profile_photo = imageUrl
    profile.profileImage = imageUrl
  }

  await profile.save()
  res.json(profile)
}

exports.uploadVerification = async (req, res) => {
  let profile = await ProviderProfile.findOne({ user: req.user._id })
  if (!profile) profile = new ProviderProfile({ user: req.user._id, service_type: '' })

  const { service_type, experience_years, bio, location } = req.body
  if (!service_type) return res.status(400).json({ detail: 'Service type is required.' })

  const files = req.files || {}
  const getUrl = (key) => files[key]?.[0]?.path || files[key]?.[0]?.secure_url || null

  if (!getUrl('id_front') && !profile.id_front) return res.status(400).json({ id_front: 'ID front is required.' })
  if (!getUrl('id_back') && !profile.id_back) return res.status(400).json({ id_back: 'ID back is required.' })
  if (!getUrl('photo') && !profile.profile_photo && !profile.profileImage) {
    return res.status(400).json({ photo: 'Profile photo is required.' })
  }

  profile.service_type = service_type
  profile.experience_years = experience_years || 0
  profile.bio = bio || ''
  profile.location = location || 'Nyeri Town'
  if (getUrl('id_front')) profile.id_front = getUrl('id_front')
  if (getUrl('id_back')) profile.id_back = getUrl('id_back')
  if (getUrl('certificate')) profile.certificate = getUrl('certificate')
  if (getUrl('photo')) {
    profile.profile_photo = getUrl('photo')
    profile.profileImage = getUrl('photo')
  }
  profile.verification_status = 'pending'
  profile.submitted_at = new Date()

  await profile.save()

  res.json({ detail: 'Verification submitted successfully. You will be notified within 24-48 hours.', profile })
}

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

exports.getAvailability = async (req, res) => {
  const profile = await ProviderProfile.findOne({ user: req.user._id }).select('availability')
  res.json(profile?.availability || {})
}

exports.updateAvailability = async (req, res) => {
  let profile = await ProviderProfile.findOne({ user: req.user._id })
  if (!profile) profile = await ProviderProfile.create({ user: req.user._id, service_type: '' })
  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
  days.forEach((day) => {
    if (req.body[day] !== undefined) profile.availability[day] = !!req.body[day]
  })
  profile.markModified('availability')
  await profile.save()
  res.json(profile.availability)
}

exports.getBookings = async (req, res) => {
  const { month, year, page = 1, limit = 30 } = req.query
  const filter = { provider: req.user._id }
  if (month && year) {
    const start = new Date(year, month - 1, 1)
    const end = new Date(year, month, 0, 23, 59, 59)
    filter.createdAt = { $gte: start, $lte: end }
  }
  const data = await paginatedResponse(Booking, filter, {
    page,
    limit,
    sort: { date: 1, time: 1 },
    populate: { path: 'customer', select: 'first_name last_name phone' },
  })
  const results = data.results.map((booking) => {
    const obj = booking.toJSON()
    if (booking.customer) obj.customer_name = `${booking.customer.first_name} ${booking.customer.last_name}`
    return obj
  })
  res.json({ ...data, results })
}

exports.getDashboard = async (req, res) => {
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
  const [profile, totalBookings, completedBookings, thisMonthBookings, serviceJobs, customerRequests, openRequests] = await Promise.all([
    ProviderProfile.findOne({ user: req.user._id }),
    Booking.countDocuments({ provider: req.user._id }),
    Booking.countDocuments({ provider: req.user._id, status: 'completed' }),
    Booking.find({ provider: req.user._id, status: 'completed', createdAt: { $gte: monthStart } }),
    ServiceBooking.find({ provider: req.user._id }),
    CustomerRequest.find({ assignedProvider: req.user._id }),
    CustomerRequest.countDocuments({ status: 'open' }),
  ])

  const monthlyEarnings = thisMonthBookings.reduce((sum, booking) => sum + (booking.amount || 0), 0)
    + serviceJobs
      .filter((job) => job.status === 'completed' && job.createdAt >= monthStart)
      .reduce((sum, job) => sum + (job.budget || 0), 0)

  res.json({
    total_bookings: totalBookings + serviceJobs.length + customerRequests.length,
    completed_bookings: completedBookings
      + serviceJobs.filter((job) => job.status === 'completed').length
      + customerRequests.filter((job) => job.status === 'completed').length,
    monthly_earnings: monthlyEarnings,
    average_rating: profile?.average_rating || null,
    verification_status: profile?.verification_status || 'unsubmitted',
    open_requests: openRequests,
    active_service_jobs: serviceJobs.filter((job) => ['pending', 'accepted', 'in_progress'].includes(job.status)).length,
    assigned_customer_requests: customerRequests.filter((job) => ['assigned', 'in_progress'].includes(job.status)).length,
  })
}

exports.getEarnings = async (req, res) => {
  const { page = 1, limit = 20 } = req.query
  const data = await paginatedResponse(Booking, { provider: req.user._id, status: 'completed', amount: { $gt: 0 } }, {
    page,
    limit,
    sort: { createdAt: -1 },
    populate: { path: 'customer', select: 'first_name last_name' },
  })
  res.json(data)
}
