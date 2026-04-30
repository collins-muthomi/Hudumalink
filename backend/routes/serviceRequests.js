const router = require('express').Router()
const ctrl = require('../controllers/servicesController')
const { protect } = require('../middleware/auth')
const { objectIdValidation, handleValidationErrors } = require('../middleware/validation')

router.use(protect)

router.post('/', ctrl.createBooking)
router.get('/my/', ctrl.myBookings)
router.get('/provider/jobs/', ctrl.providerJobs)
router.get('/:id/', objectIdValidation('id'), handleValidationErrors, ctrl.getBooking)
router.patch('/:id/accept/', objectIdValidation('id'), handleValidationErrors, ctrl.acceptBooking)
router.patch('/:id/status/', objectIdValidation('id'), handleValidationErrors, ctrl.updateBookingStatus)

module.exports = router
