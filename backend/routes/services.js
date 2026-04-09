const router = require('express').Router()
const ctrl = require('../controllers/servicesController')
const { protect, requireRole } = require('../middleware/auth')

// Categories
router.get('/categories/', ctrl.getCategories)

// Service listings (providers' services)
router.get('/', ctrl.listServices)
router.get('/:id/', ctrl.getService)

module.exports = router
