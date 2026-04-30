const router = require('express').Router()
const ctrl = require('../controllers/marketplaceController')
const { protect } = require('../middleware/auth')
const { upload } = require('../config/cloudinary')
const { objectIdValidation, handleValidationErrors } = require('../middleware/validation')

// Public
router.get('/categories/', ctrl.getCategories)
router.get('/products/', ctrl.listProducts)
router.get('/products/mine/', protect, ctrl.myProducts)
router.get('/products/:id/', objectIdValidation('id'), handleValidationErrors, ctrl.getProduct)

// Protected
router.post('/products/', protect, upload('products').single('image'), ctrl.createProduct)
router.patch('/products/:id/', objectIdValidation('id'), handleValidationErrors, protect, upload('products').single('image'), ctrl.updateProduct)
router.delete('/products/:id/', objectIdValidation('id'), handleValidationErrors, protect, ctrl.deleteProduct)

// Orders
router.post('/orders/', protect, ctrl.createOrder)
router.get('/orders/my/', protect, ctrl.myOrders)
router.get('/orders/:id/', objectIdValidation('id'), handleValidationErrors, protect, ctrl.getOrder)

module.exports = router
