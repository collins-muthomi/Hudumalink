const router = require('express').Router()
const ctrl = require('../controllers/foodController')
const { protect, requireRole } = require('../middleware/auth')
const { objectIdValidation, handleValidationErrors } = require('../middleware/validation')

// Public
router.get('/restaurants/', ctrl.listRestaurants)
router.get('/restaurants/:id/', objectIdValidation('id'), handleValidationErrors, ctrl.getRestaurant)
router.get('/restaurants/:id/menu/', objectIdValidation('id'), handleValidationErrors, ctrl.getMenu)

// Protected
router.get('/me/dashboard/', protect, requireRole('restaurant_owner'), ctrl.getOwnerDashboard)
router.get('/me/restaurant/', protect, requireRole('restaurant_owner'), ctrl.getMyRestaurant)
router.post('/me/restaurant/', protect, requireRole('restaurant_owner'), ctrl.createMyRestaurant)
router.patch('/me/restaurant/', protect, requireRole('restaurant_owner'), ctrl.updateMyRestaurant)
router.post('/me/menu/', protect, requireRole('restaurant_owner'), ctrl.createMenuItem)
router.patch('/me/menu/:itemId/', objectIdValidation('itemId'), handleValidationErrors, protect, requireRole('restaurant_owner'), ctrl.updateMenuItem)
router.delete('/me/menu/:itemId/', objectIdValidation('itemId'), handleValidationErrors, protect, requireRole('restaurant_owner'), ctrl.deleteMenuItem)
router.post('/orders/', protect, ctrl.createOrder)
router.get('/orders/my/', protect, ctrl.myOrders)
router.get('/orders/:id/', objectIdValidation('id'), handleValidationErrors, protect, ctrl.getOrder)
router.get('/orders/:id/track/', objectIdValidation('id'), handleValidationErrors, protect, ctrl.trackOrder)

// M-Pesa webhook (no auth)
router.post('/mpesa/callback/', ctrl.mpesaCallback)

module.exports = router
