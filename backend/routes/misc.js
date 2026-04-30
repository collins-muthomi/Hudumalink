const { protect } = require('../middleware/auth')
const refCtrl = require('../controllers/referralController')
const revCtrl = require('../controllers/reviewsController')
const plansCtrl = require('../controllers/plansController')
const { objectIdValidation, handleValidationErrors } = require('../middleware/validation')

// ─── Referrals ───────────────────────────────────────────
const referralRouter = require('express').Router()
referralRouter.use(protect)
referralRouter.get('/my-code/', refCtrl.myCode)
referralRouter.get('/stats/', refCtrl.stats)
referralRouter.get('/history/', refCtrl.history)

// ─── Reviews ─────────────────────────────────────────────
// NOTE: /mine/ must be registered BEFORE /:type/:id/ to avoid collision
const reviewRouter = require('express').Router()
reviewRouter.get('/mine/', protect, revCtrl.myReviews)
reviewRouter.post('/', protect, revCtrl.createReview)
reviewRouter.get('/:type/:id/', objectIdValidation('id'), handleValidationErrors, revCtrl.listReviews)

// ─── Plans ───────────────────────────────────────────────
const plansRouter = require('express').Router()
plansRouter.get('/', plansCtrl.listPlans)
plansRouter.get('/current/', protect, plansCtrl.currentPlan)
plansRouter.post('/subscribe/', protect, plansCtrl.subscribe)

module.exports = { referralRouter, reviewRouter, plansRouter }
