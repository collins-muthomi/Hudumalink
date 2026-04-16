const CustomerRequest = require('../models/CustomerRequest')
const { ProviderProfile } = require('../models/index')
const { SERVICE_CATEGORIES } = require('./servicesController')
const { paginatedResponse, notify, notifyAdmins } = require('../utils/helpers')
const { releaseEscrowPayment, ESCROW_PENDING_STATES } = require('./walletController')

const REQUEST_STATUS_FLOW = ['open', 'assigned', 'in_progress', 'completion_requested', 'completed']
const PAYMENT_STATUS_FLOW = ['pending_payment', 'payment_received', 'service_in_progress', 'service_completed', 'payout_pending', 'payout_released']

const getCategoryMeta = (category) =>
  SERVICE_CATEGORIES.find((item) => item.slug === category || item.id === category)

const applyCategoryFilter = (filter, category) => {
  const categoryMeta = getCategoryMeta(category)
  if (categoryMeta) {
    filter.category = categoryMeta.slug
    return
  }

  const matching = SERVICE_CATEGORIES
    .filter((item) => item.group_slug === category)
    .map((item) => item.slug)

  if (matching.length) {
    filter.category = { $in: matching }
    return
  }

  filter.category = category
}

const mapRequest = async (request) => {
  const obj = request.toJSON()
  obj.customer_name = request.customer ? `${request.customer.first_name} ${request.customer.last_name}` : null
  obj.assigned_provider_name = request.assignedProvider
    ? `${request.assignedProvider.first_name} ${request.assignedProvider.last_name}`
    : null
  obj.can_pay = request.status === 'assigned' && ESCROW_PENDING_STATES.includes(request.payment_status)

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
    category: categoryMeta?.slug || category,
    category_name: categoryMeta?.name || category,
    parent_category: categoryMeta?.group_slug || '',
    parent_category_name: categoryMeta?.group_name || '',
    location: location || 'Nyeri Town',
    budget: budget || null,
  })

  res.status(201).json(request)
}

exports.openRequests = async (req, res) => {
  const { category, search, page = 1, limit = 20 } = req.query
  const filter = { status: 'open' }
  if (category) applyCategoryFilter(filter, category)
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
  const request = await CustomerRequest.findById(req.params.id)
  if (!request) return res.status(404).json({ detail: 'Request not found.' })

  const isCustomer = request.customer.toString() === req.user._id.toString()
  const isProvider = request.assignedProvider?.toString() === req.user._id.toString()

  if (!isCustomer && !isProvider && req.user.role !== 'admin') {
    return res.status(403).json({ detail: 'Not authorized.' })
  }

  if (req.body.payment_status) {
    const { payment_status } = req.body
    if (!PAYMENT_STATUS_FLOW.includes(payment_status)) {
      return res.status(400).json({ detail: 'Invalid payment status.' })
    }

    if (payment_status === 'payout_pending') {
      if (!isProvider && req.user.role !== 'admin') {
        return res.status(403).json({ detail: 'Only the provider can request payout.' })
      }
      if (request.status !== 'completed') {
        return res.status(400).json({ detail: 'The request must be completed before payout can be requested.' })
      }
      if (!['service_completed', 'payment_received', 'service_in_progress'].includes(request.payment_status)) {
        return res.status(400).json({ detail: 'Escrow payment must be secured before payout can be requested.' })
      }

      request.payment_status = 'payout_pending'
      request.payout_requested_at = new Date()
      await request.save()

      await notifyAdmins({
        type: 'payment',
        title: 'Payout requested',
        message: `${request.title} is ready for payout release.`,
        data: { requestId: request._id.toString(), payment_status: 'payout_pending' },
      })
    } else if (payment_status === 'payout_released') {
      if (req.user.role !== 'admin') {
        return res.status(403).json({ detail: 'Only admin can release payout.' })
      }
      await releaseEscrowPayment({
        job: request,
        providerId: request.assignedProvider,
        label: request.title || 'Customer request',
      })
    } else {
      return res.status(400).json({ detail: 'This payment status is managed automatically by the system.' })
    }

    const populated = await CustomerRequest.findById(request._id)
      .populate('customer', 'first_name last_name')
      .populate('assignedProvider', 'first_name last_name')

    return res.json(await mapRequest(populated))
  }

  const { status } = req.body
  if (!status || !REQUEST_STATUS_FLOW.includes(status)) {
    return res.status(400).json({ detail: 'Invalid status.' })
  }

  if (status === 'in_progress' && ESCROW_PENDING_STATES.includes(request.payment_status)) {
    return res.status(400).json({ detail: 'Customer payment must be secured before work can begin.' })
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
  if (status === 'in_progress' && request.payment_status === 'payment_received') {
    request.payment_status = 'service_in_progress'
  }
  if (status === 'completed' && ['payment_received', 'service_in_progress'].includes(request.payment_status)) {
    request.payment_status = 'service_completed'
  }
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
