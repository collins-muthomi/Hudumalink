const router = require('express').Router()
const ctrl = require('../controllers/walletController')
const { protect } = require('../middleware/auth')

// M-Pesa callback — no auth
router.post('/mpesa/callback/', ctrl.topupCallback)

router.use(protect)

router.get('/balance/', ctrl.getBalance)
router.get('/transactions/', ctrl.getTransactions)
router.post('/topup/', ctrl.topup)
router.post('/withdraw/', ctrl.withdraw)
router.post('/transfer/', ctrl.transfer)

module.exports = router
