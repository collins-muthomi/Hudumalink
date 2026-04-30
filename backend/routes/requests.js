const router = require('express').Router()
const ctrl = require('../controllers/requestsController')
const { protect, requireRole } = require('../middleware/auth')
const { objectIdValidation, handleValidationErrors } = require('../middleware/validation')

router.use(protect)

router.post('/', requireRole('customer'), ctrl.createRequest)
router.get('/open/', requireRole('provider', 'admin'), ctrl.openRequests)
router.get('/mine/', ctrl.myRequests)
router.get('/:id/', objectIdValidation('id'), handleValidationErrors, ctrl.getRequest)
router.patch('/:id/accept/', objectIdValidation('id'), handleValidationErrors, requireRole('provider'), ctrl.acceptRequest)
router.patch('/:id/status/', objectIdValidation('id'), handleValidationErrors, ctrl.updateRequestStatus)

module.exports = router
