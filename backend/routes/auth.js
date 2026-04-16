const router = require('express').Router()
const ctrl = require('../controllers/authController')
const { protect } = require('../middleware/auth')

router.post('/register/', ctrl.register)
router.post('/verify-email/', ctrl.verifyEmail)
router.post('/resend-verification-code/', ctrl.resendVerificationCode)
router.post('/login/', ctrl.login)
router.post('/logout/', protect, ctrl.logout)
router.get('/me/', protect, ctrl.me)
router.post('/token/refresh/', ctrl.refreshToken)
router.post('/change-password/', protect, ctrl.changePassword)
router.post('/google/', ctrl.googleAuth)

module.exports = router
