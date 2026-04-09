const router = require('express').Router()
const ctrl = require('../controllers/providerController')
const { protect } = require('../middleware/auth')
const { upload } = require('../config/cloudinary')

const verificationUpload = upload('verification').fields([
  { name: 'id_front', maxCount: 1 },
  { name: 'id_back', maxCount: 1 },
  { name: 'certificate', maxCount: 1 },
  { name: 'photo', maxCount: 1 },
])

// My provider routes (authenticated)
router.get('/me/', protect, ctrl.getMyProfile)
router.patch('/me/', protect, upload('profiles').single('profile_photo'), ctrl.updateMyProfile)
router.get('/me/availability/', protect, ctrl.getAvailability)
router.patch('/me/availability/', protect, ctrl.updateAvailability)
router.get('/me/bookings/', protect, ctrl.getBookings)
router.get('/me/dashboard/', protect, ctrl.getDashboard)
router.get('/me/earnings/', protect, ctrl.getEarnings)

// Verification
router.post('/verification/', protect, verificationUpload, ctrl.uploadVerification)
router.get('/verification/status/', protect, ctrl.verificationStatus)

// Public profile
router.get('/:id/', ctrl.getProfile)

module.exports = router
