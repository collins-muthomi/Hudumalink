const { Review, ProviderProfile } = require('../models/index')
const { paginatedResponse } = require('../utils/helpers')

// GET /api/reviews/:type/:id/
exports.listReviews = async (req, res) => {
  const { type, id } = req.params
  const reviews = await Review.find({ target_type: type, target_id: id })
    .sort({ createdAt: -1 })
    .populate('reviewer', 'first_name last_name')
  const results = reviews.map(r => {
    const obj = r.toJSON()
    if (r.reviewer) obj.reviewer_name = `${r.reviewer.first_name} ${r.reviewer.last_name}`
    return obj
  })
  res.json(results)
}

// POST /api/reviews/
exports.createReview = async (req, res) => {
  const { target_type, target_id, rating, comment } = req.body
  if (!target_type || !target_id || !rating) {
    return res.status(400).json({ detail: 'target_type, target_id, and rating are required.' })
  }
  if (rating < 1 || rating > 5) return res.status(400).json({ rating: 'Rating must be 1–5.' })

  const existing = await Review.findOne({ reviewer: req.user._id, target_type, target_id })
  if (existing) return res.status(400).json({ detail: 'You have already reviewed this.' })

  const review = await Review.create({
    reviewer: req.user._id,
    reviewer_name: `${req.user.first_name} ${req.user.last_name}`,
    target_type,
    target_id,
    rating: Number(rating),
    comment: comment || '',
  })

  // Update provider average rating
  if (target_type === 'provider') {
    const allReviews = await Review.find({ target_type: 'provider', target_id })
    const avg = allReviews.reduce((s, r) => s + r.rating, 0) / allReviews.length
    await ProviderProfile.findOneAndUpdate(
      { user: target_id },
      { average_rating: Math.round(avg * 10) / 10, reviews_count: allReviews.length }
    )
  }

  res.status(201).json(review)
}

// GET /api/reviews/mine/
exports.myReviews = async (req, res) => {
  const reviews = await Review.find({ reviewer: req.user._id }).sort({ createdAt: -1 })
  res.json(reviews)
}
