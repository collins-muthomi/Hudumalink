const router = require('express').Router()
const ctrl = require('../controllers/authController')
const { protect } = require('../middleware/auth')
const { registerValidation, loginValidation, verifyEmailValidation } = require('../middleware/validation')

router.post('/register/', registerValidation, ctrl.register)
router.post('/verify-email/', verifyEmailValidation, ctrl.verifyEmail)
router.post('/resend-verification-code/', verifyEmailValidation, ctrl.resendVerificationCode)
router.post('/login/', loginValidation, ctrl.login)
router.post('/logout/', protect, ctrl.logout)
router.get('/me/', protect, ctrl.me)
router.post('/token/refresh/', ctrl.refreshToken)
router.post('/change-password/', protect, ctrl.changePassword)
router.post('/google/', ctrl.googleAuth)

module.exports = router
