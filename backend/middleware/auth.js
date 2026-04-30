const jwt = require('jsonwebtoken')
const User = require('../models/User')

// ─── Protect route — require valid JWT ──────────────────
const protect = async (req, res, next) => {
  let token

  // Check for token in cookies first (secure method)
  if (req.cookies.accessToken) {
    token = req.cookies.accessToken
  }
  // Fallback to Authorization header for backward compatibility
  else {
    const auth = req.headers.authorization
    if (auth && auth.startsWith('Bearer ')) token = auth.split(' ')[1]
  }

  if (!token) return res.status(401).json({ detail: 'Authentication required.' })

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    const user = await User.findById(decoded.id).select('-password')
    if (!user || !user.is_active) return res.status(401).json({ detail: 'User not found or deactivated.' })
    req.user = user
    next()
  } catch {
    return res.status(401).json({ detail: 'Invalid or expired token.' })
  }
}

// ─── Role guard ──────────────────────────────────────────
const requireRole = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ detail: 'Access denied: insufficient permissions.' })
  }
  next()
}

module.exports = { protect, requireRole }
