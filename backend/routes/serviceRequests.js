const router = require('express').Router()
const ctrl = require('../controllers/servicesController')
const { protect } = require('../middleware/auth')

router.use(protect)

router.post('/', ctrl.createBooking)
router.get('/my/', ctrl.myBookings)
router.get('/provider/jobs/', ctrl.providerJobs)
router.get('/:id/', ctrl.getBooking)
router.patch('/:id/accept/', ctrl.acceptBooking)
router.patch('/:id/status/', ctrl.updateBookingStatus)

module.exports = router
