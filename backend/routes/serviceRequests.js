const router = require('express').Router()
const ctrl = require('../controllers/servicesController')
const { protect } = require('../middleware/auth')

router.use(protect)

router.post('/', ctrl.createRequest)
router.get('/my/', ctrl.myRequests)
router.get('/:id/', ctrl.getRequest)
router.patch('/:id/', ctrl.updateRequest)
router.post('/:id/cancel/', ctrl.cancelRequest)
router.post('/:id/respond/', ctrl.respondToRequest)

module.exports = router
