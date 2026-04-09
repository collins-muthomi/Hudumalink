const router = require('express').Router()
const ctrl = require('../controllers/notificationsController')
const { protect } = require('../middleware/auth')

router.use(protect)

router.get('/', ctrl.list)
router.get('/unread-count/', ctrl.unreadCount)
router.post('/mark-all-read/', ctrl.markAllRead)
router.patch('/:id/read/', ctrl.markRead)
router.delete('/:id/', ctrl.deleteNotification)

module.exports = router
