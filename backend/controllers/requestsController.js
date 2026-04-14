const CustomerRequest = require('../models/CustomerRequest')
const { ProviderProfile } = require('../models/index')
const { SERVICE_CATEGORIES } = require('./servicesController')
const { paginatedResponse, notify, notifyAdmins } = require('../utils/helpers')

const REQUEST_STATUS_FLOW = ['open', 'assigned', 'in_progress', 'completion_requested', 'completed']

const getCategoryMeta = (category) =>
  SERVICE_CATEGORIES.find((item) => item.slug === category || item.id === category)

const mapRequest = async (request) => {
  const obj = request.toJSON()
  obj.customer_name = request.customer ? `${request.customer.first_name} ${request.customer.last_name}` : null
  obj.assigned_provider_name = request.assignedProvider
    ? `${request.assignedProvider.first_name} ${request.assignedProvider.last_name}`
    : null
  obj.can_pay = request.status === 'completed' && request.payment_status !== 'paid'

  if (request.assignedProvider) {
    const profile = await ProviderProfile.findOne({ user: request.assignedProvider._id || request.assignedProvider })
      .select('profileImage profile_photo')
    obj.assigned_provider_image = profile?.profileImage || profile?.profile_photo || null
  }

  return obj
}

exports.createRequest = async (req, res) => {
  const { title, description, category, location, budget } = req.body
  if (!title || !description || !category) {
    return res.status(400).json({ detail: 'Title, description and category are required.' })
  }

  const categoryMeta = getCategoryMeta(category)
  const request = await CustomerRequest.create({
    customer: req.user._id,
    title,
    description,
    category,
    category_name: categoryMeta?.name || category,
    location: location || 'Nyeri Town',
    budget: budget || null,
  })

  res.status(201).json(request)
}

exports.openRequests = async (req, res) => {
  const { category, search, page = 1, limit = 20 } = req.query
  const filter = { status: 'open' }
  if (category) filter.category = category
  if (search) {
    filter.$or = [
      { title: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
      { category_name: { $regex: search, $options: 'i' } },
      { location: { $regex: search, $options: 'i' } },
    ]
  }

  const data = await paginatedResponse(CustomerRequest, filter, {
    page,
    limit,
    sort: { createdAt: -1 },
    populate: { path: 'customer', select: 'first_name last_name' },
  })

  const results = await Promise.all(data.results.map(mapRequest))
  res.json({ ...data, results })
}

exports.myRequests = async (req, res) => {
  const { status, page = 1, limit = 20 } = req.query
  const filter = req.user.role === 'provider'
    ? { assignedProvider: req.user._id }
    : { customer: req.user._id }

  if (status) filter.status = status

  const data = await paginatedResponse(CustomerRequest, filter, {
    page,
    limit,
    sort: { createdAt: -1 },
    populate: [
      { path: 'customer', select: 'first_name last_name' },
      { path: 'assignedProvider', select: 'first_name last_name' },
    ],
  })

  const results = await Promise.all(data.results.map(mapRequest))
  res.json({ ...data, results })
}

exports.getRequest = async (req, res) => {
  const request = await CustomerRequest.findById(req.params.id)
    .populate('customer', 'first_name last_name phone')
    .populate('assignedProvider', 'first_name last_name phone')

  if (!request) return res.status(404).json({ detail: 'Request not found.' })

  const userId = req.user._id.toString()
  const allowed = [
    request.customer?._id?.toString(),
    request.assignedProvider?._id?.toString(),
  ]

  if (req.user.role === 'provider' && request.status === 'open') {
    return res.json(await mapRequest(request))
  }

  if (!allowed.includes(userId) && req.user.role !== 'admin') {
    return res.status(403).json({ detail: 'Not authorized.' })
  }

  res.json(await mapRequest(request))
}

exports.acceptRequest = async (req, res) => {
  if (!req.user.is_verified) {
    return res.status(403).json({ detail: 'Only verified providers can accept requests.' })
  }

  const request = await CustomerRequest.findById(req.params.id)
  if (!request) return res.status(404).json({ detail: 'Request not found.' })
  if (request.status !== 'open') {
    return res.status(400).json({ detail: 'This request is no longer open.' })
  }

  request.status = 'assigned'
  request.assignedProvider = req.user._id
  await request.save()

  await notify(request.customer, {
    type: 'service',
    title: 'Provider assigned',
    message: `${req.user.first_name} accepted your request "${request.title}".`,
    data: { requestId: request._id.toString() },
  })

  const populated = await CustomerRequest.findById(request._id)
    .populate('customer', 'first_name last_name')
    .populate('assignedProvider', 'first_name last_name')

  res.json(await mapRequest(populated))
}

exports.updateRequestStatus = async (req, res) => {
  const { status } = req.body
  if (!status || !REQUEST_STATUS_FLOW.includes(status)) {
    return res.status(400).json({ detail: 'Invalid status.' })
  }

  const request = await CustomerRequest.findById(req.params.id)
  if (!request) return res.status(404).json({ detail: 'Request not found.' })

  const isCustomer = request.customer.toString() === req.user._id.toString()
  const isProvider = request.assignedProvider?.toString() === req.user._id.toString()

  if (!isCustomer && !isProvider && req.user.role !== 'admin') {
    return res.status(403).json({ detail: 'Not authorized.' })
  }

  if (status === 'completed') {
    if (!isCustomer && req.user.role !== 'admin') {
      return res.status(403).json({ detail: 'Only the customer can confirm completion.' })
    }
    if (request.status !== 'completion_requested') {
      return res.status(400).json({ detail: 'The provider must first mark the work as completed.' })
    }
  } else if (!isProvider && req.user.role !== 'admin') {
    return res.status(403).json({ detail: 'Only the assigned provider can update this status.' })
  }

  request.status = status
  await request.save()

  if (status === 'completion_requested') {
    await notifyAdmins({
      type: 'service',
      title: 'Customer request marked completed',
      message: `${request.title} is awaiting customer confirmation before payment.`,
      data: { requestId: request._id.toString() },
    })
  }

  const notifyUser = isProvider ? request.customer : request.assignedProvider
  if (notifyUser) {
    await notify(notifyUser, {
      type: 'service',
      title: 'Request status updated',
      message: `"${request.title}" is now ${status.replace('_', ' ')}.`,
      data: { requestId: request._id.toString(), status },
    })
  }

  const populated = await CustomerRequest.findById(request._id)
    .populate('customer', 'first_name last_name')
    .populate('assignedProvider', 'first_name last_name')

  res.json(await mapRequest(populated))
}
