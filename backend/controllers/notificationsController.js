const { Notification } = require('../models/index')
const { paginatedResponse } = require('../utils/helpers')

// GET /api/notifications/
exports.list = async (req, res) => {
  const { page = 1, limit = 30 } = req.query
  const data = await paginatedResponse(Notification, { user: req.user._id }, {
    page, limit, sort: { createdAt: -1 },
  })
  res.json(data)
}

// GET /api/notifications/unread-count/
exports.unreadCount = async (req, res) => {
  const count = await Notification.countDocuments({ user: req.user._id, read: false })
  res.json({ count })
}

// PATCH /api/notifications/:id/read/
exports.markRead = async (req, res) => {
  const n = await Notification.findOneAndUpdate(
    { _id: req.params.id, user: req.user._id },
    { read: true },
    { new: true }
  )
  if (!n) return res.status(404).json({ detail: 'Notification not found.' })
  res.json(n)
}

// POST /api/notifications/mark-all-read/
exports.markAllRead = async (req, res) => {
  await Notification.updateMany({ user: req.user._id, read: false }, { read: true })
  res.json({ detail: 'All notifications marked as read.' })
}

// DELETE /api/notifications/:id/
exports.deleteNotification = async (req, res) => {
  const n = await Notification.findOneAndDelete({ _id: req.params.id, user: req.user._id })
  if (!n) return res.status(404).json({ detail: 'Notification not found.' })
  res.json({ detail: 'Notification deleted.' })
}
