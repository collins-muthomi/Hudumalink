const router = require('express').Router()
const ctrl = require('../controllers/requestsController')
const { protect, requireRole } = require('../middleware/auth')

router.use(protect)

router.post('/', requireRole('customer'), ctrl.createRequest)
router.get('/open/', requireRole('provider', 'admin'), ctrl.openRequests)
router.get('/mine/', ctrl.myRequests)
router.get('/:id/', ctrl.getRequest)
router.patch('/:id/accept/', requireRole('provider'), ctrl.acceptRequest)
router.patch('/:id/status/', ctrl.updateRequestStatus)

module.exports = router
