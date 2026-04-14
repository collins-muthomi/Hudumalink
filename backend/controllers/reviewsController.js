const { Review, ProviderProfile } = require('../models/index')
const { Service, ServiceBooking } = require('../models/Service')

exports.listReviews = async (req, res) => {
  const { type, id } = req.params
  const filter = type === 'service'
    ? { service: id }
    : { target_type: type, target_id: id }

  const reviews = await Review.find(filter)
    .sort({ createdAt: -1 })
    .populate('reviewer', 'first_name last_name')

  const results = reviews.map((review) => {
    const obj = review.toJSON()
    if (review.reviewer) obj.reviewer_name = `${review.reviewer.first_name} ${review.reviewer.last_name}`
    return obj
  })

  res.json(results)
}

exports.createReview = async (req, res) => {
  const { target_type, target_id, provider, service, rating, comment } = req.body
  const providerId = provider || (target_type === 'provider' ? target_id : null)
  const serviceId = service || null

  if (!providerId || !rating) {
    return res.status(400).json({ detail: 'provider and rating are required.' })
  }
  if (rating < 1 || rating > 5) {
    return res.status(400).json({ rating: 'Rating must be 1-5.' })
  }

  const existing = await Review.findOne({
    reviewer: req.user._id,
    provider: providerId,
    ...(serviceId ? { service: serviceId } : {}),
  })
  if (existing) return res.status(400).json({ detail: 'You have already reviewed this.' })

  if (serviceId) {
    const completedBooking = await ServiceBooking.findOne({
      customer: req.user._id,
      service: serviceId,
      provider: providerId,
      status: 'completed',
    })
    if (!completedBooking) {
      return res.status(400).json({ detail: 'You can only review a completed service.' })
    }
    completedBooking.reviewed = true
    await completedBooking.save()
  }

  const review = await Review.create({
    reviewer: req.user._id,
    reviewer_name: `${req.user.first_name} ${req.user.last_name}`,
    customer: req.user._id,
    provider: providerId,
    service: serviceId || null,
    target_type: target_type || 'provider',
    target_id: target_id || providerId,
    rating: Number(rating),
    comment: comment || '',
  })

  const providerReviews = await Review.find({ provider: providerId })
  const providerAverage = providerReviews.reduce((sum, item) => sum + item.rating, 0) / providerReviews.length

  await ProviderProfile.findOneAndUpdate(
    { user: providerId },
    { average_rating: Math.round(providerAverage * 10) / 10, reviews_count: providerReviews.length },
  )

  if (serviceId) {
    const serviceReviews = await Review.find({ service: serviceId })
    const serviceAverage = serviceReviews.reduce((sum, item) => sum + item.rating, 0) / serviceReviews.length
    await Service.findByIdAndUpdate(serviceId, {
      rating: Math.round(serviceAverage * 10) / 10,
      reviews_count: serviceReviews.length,
    })
  }

  res.status(201).json(review)
}

exports.myReviews = async (req, res) => {
  const reviews = await Review.find({ reviewer: req.user._id }).sort({ createdAt: -1 })
  res.json(reviews)
}
