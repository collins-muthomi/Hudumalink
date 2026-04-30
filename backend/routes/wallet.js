const router = require('express').Router()
const ctrl = require('../controllers/walletController')
const { protect } = require('../middleware/auth')
const { objectIdValidation, handleValidationErrors } = require('../middleware/validation')

// M-Pesa callback — no auth
router.post('/mpesa/callback/', ctrl.topupCallback)
router.post('/mpesa/b2c/result', ctrl.withdrawalResultCallback)
router.post('/mpesa/b2c/timeout', ctrl.withdrawalTimeoutCallback)

router.use(protect)

router.get('/balance/', ctrl.getBalance)
router.get('/transactions/', ctrl.getTransactions)
router.post('/topup/', ctrl.topup)
router.post('/withdraw/', ctrl.withdraw)
router.post('/transfer/', ctrl.transfer)
router.post('/service-bookings/:id/pay/', objectIdValidation('id'), handleValidationErrors, ctrl.payServiceBooking)
router.post('/requests/:id/pay/', objectIdValidation('id'), handleValidationErrors, ctrl.payCustomerRequest)

module.exports = router
