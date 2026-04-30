const { body, param, query, validationResult } = require('express-validator')

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({
      detail: 'Validation failed.',
      errors: errors.array().map(err => ({
        field: err.path,
        message: err.msg
      }))
    })
  }
  next()
}

// Auth validation schemas
const registerValidation = [
  body('first_name')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('First name must be 1-50 characters.')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('First name can only contain letters and spaces.'),
  body('last_name')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Last name must be 1-50 characters.')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('Last name can only contain letters and spaces.'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email required.'),
  body('phone')
    .matches(/^(\+254|0)[17]\d{8}$/)
    .withMessage('Valid Kenyan phone number required.'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters.')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain uppercase, lowercase, and number.'),
  body('role')
    .optional()
    .isIn(['customer', 'provider', 'delivery_driver', 'restaurant_owner'])
    .withMessage('Invalid role.'),
  body('referral_code')
    .optional()
    .isLength({ min: 6, max: 10 })
    .withMessage('Invalid referral code.'),
  handleValidationErrors
]

const loginValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email required.'),
  body('password')
    .notEmpty()
    .withMessage('Password required.'),
  handleValidationErrors
]

const verifyEmailValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email required.'),
  body('code')
    .isLength({ min: 6, max: 6 })
    .isNumeric()
    .withMessage('Valid 6-digit code required.'),
  handleValidationErrors
]

// ObjectId validation
const objectIdValidation = (field) => param(field).isMongoId().withMessage('Invalid ID format.')

// General sanitization
const sanitizeInput = (req, res, next) => {
  // Recursively sanitize strings in req.body, req.query, req.params
  const sanitize = (obj) => {
    for (let key in obj) {
      if (typeof obj[key] === 'string') {
        // Remove potential script tags and other dangerous content
        obj[key] = obj[key]
          .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
          .replace(/<[^>]*>/g, '') // Remove HTML tags
          .trim()
      } else if (typeof obj[key] === 'object' && obj[key] !== null) {
        sanitize(obj[key])
      }
    }
  }

  sanitize(req.body)
  sanitize(req.query)
  sanitize(req.params)
  next()
}

module.exports = {
  registerValidation,
  loginValidation,
  verifyEmailValidation,
  objectIdValidation,
  sanitizeInput,
  handleValidationErrors
}