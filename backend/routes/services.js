const router = require('express').Router()
const ctrl = require('../controllers/servicesController')
const { protect, requireRole } = require('../middleware/auth')
const { objectIdValidation, handleValidationErrors } = require('../middleware/validation')

// Categories
router.get('/categories/', ctrl.getCategories)

// Service listings (providers' services)
router.get('/mine/', protect, requireRole('provider'), ctrl.myServices)
router.get('/', ctrl.listServices)
router.post('/', protect, requireRole('provider'), ctrl.createService)
router.get('/:id/', objectIdValidation('id'), handleValidationErrors, ctrl.getService)
router.patch('/:id/', objectIdValidation('id'), handleValidationErrors, protect, requireRole('provider'), ctrl.updateService)

module.exports = router
