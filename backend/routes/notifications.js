const router = require('express').Router()
const ctrl = require('../controllers/notificationsController')
const { protect } = require('../middleware/auth')
const { objectIdValidation, handleValidationErrors } = require('../middleware/validation')

router.use(protect)

router.get('/', ctrl.list)
router.get('/unread-count/', ctrl.unreadCount)
router.post('/mark-all-read/', ctrl.markAllRead)
router.patch('/:id/read/', objectIdValidation('id'), handleValidationErrors, ctrl.markRead)
router.delete('/:id/', objectIdValidation('id'), handleValidationErrors, ctrl.deleteNotification)

module.exports = router
