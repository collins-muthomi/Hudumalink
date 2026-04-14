const User = require('../models/User')
const { Service, ServiceBooking } = require('../models/Service')
const { ProviderProfile } = require('../models/index')
const { paginatedResponse, notify, notifyAdmins } = require('../utils/helpers')

const SERVICE_CATEGORIES = [
  { id: 'plumbing', slug: 'plumbing', name: 'Plumbing' },
  { id: 'electrical', slug: 'electrical', name: 'Electrical' },
  { id: 'cleaning', slug: 'cleaning', name: 'Cleaning' },
  { id: 'carpentry', slug: 'carpentry', name: 'Carpentry' },
  { id: 'painting', slug: 'painting', name: 'Painting' },
  { id: 'tutoring', slug: 'tutoring', name: 'Tutoring' },
  { id: 'beauty', slug: 'beauty', name: 'Beauty & Hair' },
  { id: 'mechanic', slug: 'mechanic', name: 'Mechanic' },
  { id: 'moving', slug: 'moving', name: 'Moving' },
  { id: 'gardening', slug: 'gardening', name: 'Gardening' },
  { id: 'tech', slug: 'tech', name: 'Tech Help' },
  { id: 'petcare', slug: 'petcare', name: 'Pet Care' },
  { id: 'other', slug: 'other', name: 'Other' },
]

const SERVICE_STATUS_FLOW = ['pending', 'accepted', 'in_progress', 'completion_requested', 'completed', 'cancelled']

const getCategoryMeta = (category) =>
  SERVICE_CATEGORIES.find((item) => item.slug === category || item.id === category)

const mapService = async (service) => {
  const obj = service.toJSON()
  if (!service.provider) return obj

  const profile = await ProviderProfile.findOne({ user: service.provider._id })
    .select('profileImage profile_photo average_rating reviews_count')

  obj.provider_name = `${service.provider.first_name} ${service.provider.last_name}`
  obj.is_verified = service.provider.is_verified
  obj.provider_id = service.provider._id
  obj.profileImage = profile?.profileImage || profile?.profile_photo || null
  obj.averageRating = profile?.average_rating || null
  obj.totalReviews = profile?.reviews_count || 0

  return obj
}

const mapBooking = (booking) => {
  const obj = booking.toJSON()
  obj.customer_name = booking.customer ? `${booking.customer.first_name} ${booking.customer.last_name}` : null
  obj.provider_name = booking.provider ? `${booking.provider.first_name} ${booking.provider.last_name}` : null
  obj.service_title = booking.service?.title || booking.title
  obj.can_pay = booking.status === 'completed' && booking.payment_status !== 'paid'
  return obj
}

exports.getCategories = (req, res) => res.json(SERVICE_CATEGORIES)

exports.listServices = async (req, res) => {
  const { search, category, provider, page = 1, limit = 12 } = req.query

  const providerFilter = { role: 'provider', is_verified: true, is_active: true }
  if (provider) providerFilter._id = provider

  const verifiedProviders = await User.find(providerFilter).select('_id')
  const providerIds = verifiedProviders.map((item) => item._id)
  if (!providerIds.length) {
    return res.json({ count: 0, next: null, previous: null, results: [] })
  }

  const filter = { is_active: true, provider: { $in: providerIds } }
  if (category) filter.category = category
  if (search) {
    filter.$or = [
      { title: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
      { category_name: { $regex: search, $options: 'i' } },
      { location: { $regex: search, $options: 'i' } },
    ]
  }

  const data = await paginatedResponse(Service, filter, {
    page,
    limit,
    populate: { path: 'provider', select: 'first_name last_name is_verified' },
    sort: { createdAt: -1 },
  })

  const results = await Promise.all(data.results.map(mapService))
  res.json({ ...data, results })
}

exports.getService = async (req, res) => {
  const service = await Service.findById(req.params.id)
    .populate('provider', 'first_name last_name is_verified phone')

  if (!service || !service.provider?.is_verified) {
    return res.status(404).json({ detail: 'Service not found.' })
  }

  res.json(await mapService(service))
}

exports.myServices = async (req, res) => {
  const services = await Service.find({ provider: req.user._id }).sort({ createdAt: -1 })
  res.json(services)
}

exports.createService = async (req, res) => {
  if (!req.user.is_verified) {
    return res.status(403).json({ detail: 'Only verified providers can create services.' })
  }

  const { title, description, category, price_from, image, location } = req.body
  if (!title || !description || !category) {
    return res.status(400).json({ detail: 'Title, description and category are required.' })
  }

  const categoryMeta = getCategoryMeta(category)
  const service = await Service.create({
    provider: req.user._id,
    title,
    description,
    category,
    category_name: categoryMeta?.name || category,
    price_from: price_from || null,
    image: image || null,
    location: location || 'Nyeri Town',
  })

  const populated = await Service.findById(service._id)
    .populate('provider', 'first_name last_name is_verified')

  res.status(201).json(await mapService(populated))
}

exports.updateService = async (req, res) => {
  const service = await Service.findById(req.params.id)
  if (!service) return res.status(404).json({ detail: 'Service not found.' })
  if (service.provider.toString() !== req.user._id.toString()) {
    return res.status(403).json({ detail: 'Not authorized.' })
  }

  const allowed = ['title', 'description', 'category', 'price_from', 'image', 'location', 'is_active']
  allowed.forEach((key) => {
    if (req.body[key] !== undefined) service[key] = req.body[key]
  })

  if (req.body.category) {
    const categoryMeta = getCategoryMeta(req.body.category)
    service.category_name = categoryMeta?.name || req.body.category
  }

  await service.save()
  const populated = await Service.findById(service._id)
    .populate('provider', 'first_name last_name is_verified')
  res.json(await mapService(populated))
}

exports.createBooking = async (req, res) => {
  const { service: serviceId, description, location, budget } = req.body
  if (!serviceId) return res.status(400).json({ detail: 'Service is required.' })

  const service = await Service.findById(serviceId)
    .populate('provider', 'first_name last_name is_verified')

  if (!service || !service.is_active || !service.provider?.is_verified) {
    return res.status(404).json({ detail: 'Service not found.' })
  }

  const booking = await ServiceBooking.create({
    customer: req.user._id,
    provider: service.provider._id,
    service: service._id,
    title: service.title,
    description: description || '',
    location: location || service.location || 'Nyeri Town',
    budget: budget || service.price_from || null,
  })

  await notify(service.provider._id, {
    type: 'service',
    title: 'New service booking',
    message: `${req.user.first_name} requested "${service.title}".`,
    data: { bookingId: booking._id.toString(), serviceId: service._id.toString() },
  })

  const populated = await ServiceBooking.findById(booking._id)
    .populate('customer', 'first_name last_name')
    .populate('provider', 'first_name last_name')
    .populate('service', 'title')

  res.status(201).json(mapBooking(populated))
}

exports.myBookings = async (req, res) => {
  const { status, page = 1, limit = 20 } = req.query
  const filter = req.user.role === 'provider'
    ? { provider: req.user._id }
    : { customer: req.user._id }

  if (status) filter.status = status

  const data = await paginatedResponse(ServiceBooking, filter, {
    page,
    limit,
    sort: { createdAt: -1 },
    populate: [
      { path: 'customer', select: 'first_name last_name' },
      { path: 'provider', select: 'first_name last_name' },
      { path: 'service', select: 'title' },
    ],
  })

  res.json({ ...data, results: data.results.map(mapBooking) })
}

exports.providerJobs = async (req, res) => {
  const { status } = req.query
  const filter = { provider: req.user._id }
  if (status) filter.status = status

  const jobs = await ServiceBooking.find(filter)
    .sort({ createdAt: -1 })
    .populate('customer', 'first_name last_name')
    .populate('provider', 'first_name last_name')
    .populate('service', 'title')

  res.json(jobs.map(mapBooking))
}

exports.getBooking = async (req, res) => {
  const booking = await ServiceBooking.findById(req.params.id)
    .populate('customer', 'first_name last_name phone')
    .populate('provider', 'first_name last_name phone')
    .populate('service', 'title description price_from')

  if (!booking) return res.status(404).json({ detail: 'Service request not found.' })

  const userId = req.user._id.toString()
  const allowed = [
    booking.customer?._id?.toString?.() || booking.customer?.toString?.(),
    booking.provider?._id?.toString?.() || booking.provider?.toString?.(),
  ].filter(Boolean)
  if (!allowed.includes(userId) && req.user.role !== 'admin') {
    return res.status(403).json({ detail: 'Not authorized.' })
  }

  res.json(mapBooking(booking))
}

exports.acceptBooking = async (req, res) => {
  const booking = await ServiceBooking.findById(req.params.id)
  if (!booking) return res.status(404).json({ detail: 'Service request not found.' })
  if (booking.provider.toString() !== req.user._id.toString()) {
    return res.status(403).json({ detail: 'Not authorized.' })
  }
  if (booking.status !== 'pending') {
    return res.status(400).json({ detail: 'Only pending requests can be accepted.' })
  }

  booking.status = 'accepted'
  await booking.save()

  await notify(booking.customer, {
    type: 'service',
    title: 'Service request accepted',
    message: `Your request for "${booking.title}" was accepted.`,
    data: { bookingId: booking._id.toString() },
  })

  const populated = await ServiceBooking.findById(booking._id)
    .populate('customer', 'first_name last_name')
    .populate('provider', 'first_name last_name')
    .populate('service', 'title')

  res.json(mapBooking(populated))
}

exports.updateBookingStatus = async (req, res) => {
  const { status } = req.body
  if (!status || !SERVICE_STATUS_FLOW.includes(status)) {
    return res.status(400).json({ detail: 'Invalid status.' })
  }

  const booking = await ServiceBooking.findById(req.params.id)
  if (!booking) return res.status(404).json({ detail: 'Service request not found.' })

  const isProvider = booking.provider.toString() === req.user._id.toString()
  const isCustomer = booking.customer.toString() === req.user._id.toString()

  if (!isProvider && !isCustomer && req.user.role !== 'admin') {
    return res.status(403).json({ detail: 'Not authorized.' })
  }

  if (status === 'cancelled' && !isCustomer && req.user.role !== 'admin') {
    return res.status(403).json({ detail: 'Only the customer can cancel this request.' })
  }

  if (status === 'completed') {
    if (!isCustomer && req.user.role !== 'admin') {
      return res.status(403).json({ detail: 'Only the customer can confirm completion.' })
    }
    if (booking.status !== 'completion_requested') {
      return res.status(400).json({ detail: 'The provider must first mark the work as completed.' })
    }
  } else if (status !== 'cancelled' && !isProvider && req.user.role !== 'admin') {
    return res.status(403).json({ detail: 'Only the provider can update this status.' })
  }

  booking.status = status
  await booking.save()

  if (status === 'completion_requested') {
    await notifyAdmins({
      type: 'service',
      title: 'Job marked completed',
      message: `${booking.title} was marked completed and is awaiting customer confirmation.`,
      data: { bookingId: booking._id.toString() },
    })
  }

  const notifyUser = isProvider ? booking.customer : booking.provider
  await notify(notifyUser, {
    type: 'service',
    title: 'Service status updated',
    message: `"${booking.title}" is now ${status.replace('_', ' ')}.`,
    data: { bookingId: booking._id.toString(), status },
  })

  const populated = await ServiceBooking.findById(booking._id)
    .populate('customer', 'first_name last_name')
    .populate('provider', 'first_name last_name')
    .populate('service', 'title')

  res.json(mapBooking(populated))
}

exports.SERVICE_CATEGORIES = SERVICE_CATEGORIES
