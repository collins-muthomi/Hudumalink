const router = require('express').Router()
const ctrl = require('../controllers/marketplaceController')
const { protect } = require('../middleware/auth')
const { upload } = require('../config/cloudinary')

// Public
router.get('/categories/', ctrl.getCategories)
router.get('/products/', ctrl.listProducts)
router.get('/products/mine/', protect, ctrl.myProducts)
router.get('/products/:id/', ctrl.getProduct)

// Protected
router.post('/products/', protect, upload('products').single('image'), ctrl.createProduct)
router.patch('/products/:id/', protect, upload('products').single('image'), ctrl.updateProduct)
router.delete('/products/:id/', protect, ctrl.deleteProduct)

// Orders
router.post('/orders/', protect, ctrl.createOrder)
router.get('/orders/my/', protect, ctrl.myOrders)
router.get('/orders/:id/', protect, ctrl.getOrder)

module.exports = router
