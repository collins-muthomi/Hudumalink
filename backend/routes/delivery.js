const router = require('express').Router()
const ctrl = require('../controllers/deliveryController')
const { protect } = require('../middleware/auth')
const { upload } = require('../config/cloudinary')

const docUpload = upload('documents').fields([
  { name: 'id_document', maxCount: 1 },
  { name: 'driving_license', maxCount: 1 },
  { name: 'vehicle_photo', maxCount: 1 },
  { name: 'profile_photo', maxCount: 1 },
])

router.use(protect)

router.post('/register/', docUpload, ctrl.register)
router.get('/profile/', ctrl.getProfile)
router.patch('/profile/', ctrl.updateProfile)
router.get('/active/', ctrl.activeDeliveries)
router.get('/history/', ctrl.history)
router.post('/location/', ctrl.updateLocation)
router.post('/:id/accept/', ctrl.acceptDelivery)
router.post('/:id/complete/', ctrl.completeDelivery)

module.exports = router
