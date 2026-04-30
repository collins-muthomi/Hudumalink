const router = require('express').Router()
const ctrl = require('../controllers/adminController')
const { protect, requireRole } = require('../middleware/auth')
const { objectIdValidation, handleValidationErrors } = require('../middleware/validation')

router.use(protect, requireRole('admin'))

router.get('/stats/', ctrl.getStats)
router.get('/users/', ctrl.getUsers)
router.patch('/users/:id/', objectIdValidation('id'), handleValidationErrors, ctrl.updateUser)
router.get('/verifications/pending/', ctrl.getPendingVerifications)
router.post('/verifications/:id/approve/', objectIdValidation('id'), handleValidationErrors, ctrl.approveVerification)
router.post('/verifications/:id/reject/', objectIdValidation('id'), handleValidationErrors, ctrl.rejectVerification)
router.get('/reports/', ctrl.getReports)
router.get('/activity/', ctrl.getActivityLog)

module.exports = router
