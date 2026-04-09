const errorHandler = (err, req, res, next) => {
  let status = err.statusCode || err.status || 500
  let message = err.message || 'Internal server error'

  // Mongoose duplicate key
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0]
    message = `${field ? field.charAt(0).toUpperCase() + field.slice(1) : 'Value'} already exists.`
    status = 400
  }

  // Mongoose validation
  if (err.name === 'ValidationError') {
    const errors = {}
    Object.keys(err.errors).forEach(k => { errors[k] = err.errors[k].message })
    return res.status(400).json(errors)
  }

  // Mongoose cast error (bad ObjectId)
  if (err.name === 'CastError') {
    message = 'Invalid ID format.'
    status = 400
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') { message = 'Invalid token.'; status = 401 }
  if (err.name === 'TokenExpiredError') { message = 'Token expired.'; status = 401 }

  if (process.env.NODE_ENV === 'development') {
    console.error('❌', err)
  }

  res.status(status).json({ detail: message })
}

const notFound = (req, res) => res.status(404).json({ detail: `Route ${req.originalUrl} not found.` })

module.exports = { errorHandler, notFound }
