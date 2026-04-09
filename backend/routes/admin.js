const router = require('express').Router()
const ctrl = require('../controllers/adminController')
const { protect, requireRole } = require('../middleware/auth')

router.use(protect, requireRole('admin'))

router.get('/stats/', ctrl.getStats)
router.get('/users/', ctrl.getUsers)
router.patch('/users/:id/', ctrl.updateUser)
router.get('/verifications/pending/', ctrl.getPendingVerifications)
router.post('/verifications/:id/approve/', ctrl.approveVerification)
router.post('/verifications/:id/reject/', ctrl.rejectVerification)
router.get('/reports/', ctrl.getReports)
router.get('/activity/', ctrl.getActivityLog)

module.exports = router
