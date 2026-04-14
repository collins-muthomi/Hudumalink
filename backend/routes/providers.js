const router = require('express').Router()
const ctrl = require('../controllers/providerController')
const { protect, requireRole } = require('../middleware/auth')
const { upload } = require('../config/cloudinary')

const verificationUpload = upload('verification').fields([
  { name: 'id_front', maxCount: 1 },
  { name: 'id_back', maxCount: 1 },
  { name: 'certificate', maxCount: 1 },
  { name: 'photo', maxCount: 1 },
])

// My provider routes (authenticated)
router.get('/me/', protect, requireRole('provider'), ctrl.getMyProfile)
router.patch('/me/', protect, requireRole('provider'), upload('profiles').single('profile_image'), ctrl.updateMyProfile)
router.get('/me/availability/', protect, requireRole('provider'), ctrl.getAvailability)
router.patch('/me/availability/', protect, requireRole('provider'), ctrl.updateAvailability)
router.get('/me/bookings/', protect, requireRole('provider'), ctrl.getBookings)
router.get('/me/dashboard/', protect, requireRole('provider'), ctrl.getDashboard)
router.get('/me/earnings/', protect, requireRole('provider'), ctrl.getEarnings)

// Verification
router.post('/verification/', protect, requireRole('provider'), verificationUpload, ctrl.uploadVerification)
router.get('/verification/status/', protect, requireRole('provider'), ctrl.verificationStatus)

// Public profile
router.get('/:id/', ctrl.getProfile)

module.exports = router
