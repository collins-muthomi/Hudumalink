const { Service, ServiceRequest } = require('../models/Service')
const { ProviderProfile } = require('../models/index')
const { paginatedResponse, notify } = require('../utils/helpers')

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

// GET /api/services/categories/
exports.getCategories = (req, res) => res.json(SERVICE_CATEGORIES)

// GET /api/services/
exports.listServices = async (req, res) => {
  const { search, category, page = 1, limit = 12 } = req.query
  const filter = { is_active: true }
  if (category) filter.category = category
  if (search) filter.$text = { $search: search }

  const data = await paginatedResponse(Service, filter, {
    page, limit,
    populate: { path: 'provider', select: 'first_name last_name is_verified' },
    sort: { createdAt: -1 },
  })

  // Attach provider info
  const results = data.results.map(s => {
    const obj = s.toJSON()
    if (s.provider) {
      obj.provider_name = `${s.provider.first_name} ${s.provider.last_name}`
      obj.is_verified = s.provider.is_verified
      obj.provider_id = s.provider._id
    }
    return obj
  })

  res.json({ ...data, results })
}

// GET /api/services/:id/
exports.getService = async (req, res) => {
  const service = await Service.findById(req.params.id).populate('provider', 'first_name last_name is_verified phone')
  if (!service) return res.status(404).json({ detail: 'Service not found.' })
  const obj = service.toJSON()
  if (service.provider) {
    obj.provider_name = `${service.provider.first_name} ${service.provider.last_name}`
    obj.is_verified = service.provider.is_verified
    obj.provider_id = service.provider._id
  }
  res.json(obj)
}

// POST /api/service-requests/
exports.createRequest = async (req, res) => {
  const { title, description, category, budget_min, budget_max, location, urgency } = req.body
  if (!title || !description || !category) {
    return res.status(400).json({ detail: 'Title, description and category are required.' })
  }
  const cat = SERVICE_CATEGORIES.find(c => c.slug === category || c.id === category)
  const req_ = await ServiceRequest.create({
    customer: req.user._id,
    title, description, category,
    category_name: cat?.name || category,
    budget_min: budget_min || null,
    budget_max: budget_max || null,
    location: location || 'Nyeri Town',
    urgency: urgency || 'normal',
  })
  res.status(201).json(req_)
}

// GET /api/service-requests/my/
exports.myRequests = async (req, res) => {
  const { status, page = 1, limit = 20 } = req.query
  const filter = { customer: req.user._id }
  if (status) filter.status = status

  const data = await paginatedResponse(ServiceRequest, filter, { page, limit, sort: { createdAt: -1 } })
  res.json(data)
}

// GET /api/service-requests/:id/
exports.getRequest = async (req, res) => {
  const sreq = await ServiceRequest.findById(req.params.id)
  if (!sreq) return res.status(404).json({ detail: 'Request not found.' })
  if (sreq.customer.toString() !== req.user._id.toString() && req.user.role !== 'admin' && req.user.role !== 'provider') {
    return res.status(403).json({ detail: 'Not authorized.' })
  }
  res.json(sreq)
}

// PATCH /api/service-requests/:id/
exports.updateRequest = async (req, res) => {
  const sreq = await ServiceRequest.findById(req.params.id)
  if (!sreq) return res.status(404).json({ detail: 'Request not found.' })
  if (sreq.customer.toString() !== req.user._id.toString()) return res.status(403).json({ detail: 'Not authorized.' })
  const allowed = ['title', 'description', 'budget_min', 'budget_max', 'location', 'urgency']
  allowed.forEach(k => { if (req.body[k] !== undefined) sreq[k] = req.body[k] })
  await sreq.save()
  res.json(sreq)
}

// POST /api/service-requests/:id/cancel/
exports.cancelRequest = async (req, res) => {
  const sreq = await ServiceRequest.findById(req.params.id)
  if (!sreq) return res.status(404).json({ detail: 'Request not found.' })
  if (sreq.customer.toString() !== req.user._id.toString()) return res.status(403).json({ detail: 'Not authorized.' })
  if (sreq.status === 'completed') return res.status(400).json({ detail: 'Cannot cancel a completed request.' })
  sreq.status = 'cancelled'
  await sreq.save()
  res.json(sreq)
}

// POST /api/service-requests/:id/respond/
exports.respondToRequest = async (req, res) => {
  if (req.user.role !== 'provider') return res.status(403).json({ detail: 'Only providers can respond.' })
  const { quote, message } = req.body
  if (!quote) return res.status(400).json({ detail: 'Quote amount is required.' })

  const sreq = await ServiceRequest.findById(req.params.id)
  if (!sreq) return res.status(404).json({ detail: 'Request not found.' })
  if (sreq.status !== 'pending') return res.status(400).json({ detail: 'Request is no longer open.' })

  const alreadyResponded = sreq.responses.some(r => r.provider.toString() === req.user._id.toString())
  if (alreadyResponded) return res.status(400).json({ detail: 'You have already responded.' })

  sreq.responses.push({
    provider: req.user._id,
    provider_name: `${req.user.first_name} ${req.user.last_name}`,
    quote: Number(quote),
    message: message || '',
  })
  await sreq.save()

  await notify(sreq.customer, {
    type: 'service',
    title: 'New quote received',
    message: `${req.user.first_name} sent a quote of KSh ${quote} for your request "${sreq.title}"`,
  })

  res.status(201).json({ detail: 'Response submitted.' })
}
