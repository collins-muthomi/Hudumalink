const { Product, MarketplaceOrder } = require('../models/Marketplace')
const { paginatedResponse, notify } = require('../utils/helpers')

const MP_CATEGORIES = [
  { id: 'electronics', slug: 'electronics', name: 'Electronics' },
  { id: 'phones', slug: 'phones', name: 'Phones & Accessories' },
  { id: 'clothing', slug: 'clothing', name: 'Clothing & Fashion' },
  { id: 'furniture', slug: 'furniture', name: 'Furniture & Home' },
  { id: 'vehicles', slug: 'vehicles', name: 'Vehicles & Parts' },
  { id: 'farm', slug: 'farm', name: 'Farm Produce' },
  { id: 'food', slug: 'food', name: 'Food & Grocery' },
  { id: 'books', slug: 'books', name: 'Books & Education' },
  { id: 'sports', slug: 'sports', name: 'Sports & Fitness' },
  { id: 'other', slug: 'other', name: 'Other' },
]

// GET /api/marketplace/categories/
exports.getCategories = (req, res) => res.json(MP_CATEGORIES)

// GET /api/marketplace/products/
exports.listProducts = async (req, res) => {
  const { search, category, ordering, page = 1, limit = 12 } = req.query
  const filter = { is_active: true, is_sold: false }
  if (category) filter.category = category
  if (search) filter.$or = [
    { title: { $regex: search, $options: 'i' } },
    { description: { $regex: search, $options: 'i' } },
  ]

  const sortMap = { '-created_at': { createdAt: -1 }, price: { price: 1 }, '-price': { price: -1 } }
  const sort = sortMap[ordering] || { createdAt: -1 }

  const data = await paginatedResponse(Product, filter, {
    page, limit, sort,
    populate: { path: 'seller', select: 'first_name last_name' },
  })

  const results = data.results.map(p => {
    const obj = p.toJSON()
    if (p.seller) obj.seller_name = `${p.seller.first_name} ${p.seller.last_name}`
    return obj
  })
  res.json({ ...data, results })
}

// GET /api/marketplace/products/mine/
exports.myProducts = async (req, res) => {
  const products = await Product.find({ seller: req.user._id }).sort({ createdAt: -1 })
  res.json(products)
}

// GET /api/marketplace/products/:id/
exports.getProduct = async (req, res) => {
  const product = await Product.findById(req.params.id).populate('seller', 'first_name last_name phone')
  if (!product) return res.status(404).json({ detail: 'Product not found.' })
  product.views += 1
  await product.save()
  const obj = product.toJSON()
  if (product.seller) obj.seller_name = `${product.seller.first_name} ${product.seller.last_name}`
  res.json(obj)
}

// POST /api/marketplace/products/
exports.createProduct = async (req, res) => {
  const { title, description, category, price, condition, location, phone } = req.body
  if (!title || !description || !category || !price) {
    return res.status(400).json({ detail: 'Title, description, category and price are required.' })
  }
  const cat = MP_CATEGORIES.find(c => c.slug === category || c.id === category)
  const product = await Product.create({
    seller: req.user._id,
    title, description, category,
    category_name: cat?.name || category,
    price: Number(price),
    condition: condition || 'good',
    location: location || 'Nyeri Town',
    phone: phone || null,
    image: req.file?.path || req.file?.secure_url || null,
  })
  res.status(201).json(product)
}

// PATCH /api/marketplace/products/:id/
exports.updateProduct = async (req, res) => {
  const product = await Product.findById(req.params.id)
  if (!product) return res.status(404).json({ detail: 'Product not found.' })
  if (product.seller.toString() !== req.user._id.toString()) return res.status(403).json({ detail: 'Not authorized.' })
  const allowed = ['title', 'description', 'price', 'condition', 'location', 'phone', 'is_active']
  allowed.forEach(k => { if (req.body[k] !== undefined) product[k] = req.body[k] })
  if (req.file) product.image = req.file.path || req.file.secure_url
  await product.save()
  res.json(product)
}

// DELETE /api/marketplace/products/:id/
exports.deleteProduct = async (req, res) => {
  const product = await Product.findById(req.params.id)
  if (!product) return res.status(404).json({ detail: 'Product not found.' })
  if (product.seller.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    return res.status(403).json({ detail: 'Not authorized.' })
  }
  product.is_active = false
  await product.save()
  res.json({ detail: 'Product removed.' })
}

// POST /api/marketplace/orders/
exports.createOrder = async (req, res) => {
  const { product: productId, quantity = 1 } = req.body
  const product = await Product.findById(productId)
  if (!product || product.is_sold || !product.is_active) {
    return res.status(400).json({ detail: 'Product not available.' })
  }
  if (product.seller.toString() === req.user._id.toString()) {
    return res.status(400).json({ detail: 'You cannot buy your own product.' })
  }
  const total = product.price * Number(quantity)
  const order = await MarketplaceOrder.create({
    buyer: req.user._id,
    product: product._id,
    seller: product.seller,
    quantity: Number(quantity),
    total,
    status: 'pending',
  })

  await notify(product.seller, {
    type: 'order',
    title: 'New order received!',
    message: `Someone wants to buy "${product.title}" for KSh ${total.toLocaleString()}`,
  })

  res.status(201).json({ ...order.toJSON(), product_name: product.title })
}

// GET /api/marketplace/orders/my/
exports.myOrders = async (req, res) => {
  const { status, page = 1, limit = 20 } = req.query
  const filter = { buyer: req.user._id }
  if (status) filter.status = status
  const data = await paginatedResponse(MarketplaceOrder, filter, {
    page, limit,
    populate: [{ path: 'product', select: 'title image price' }, { path: 'seller', select: 'first_name last_name phone' }],
    sort: { createdAt: -1 },
  })
  const results = data.results.map(o => {
    const obj = o.toJSON()
    if (o.product) { obj.product_name = o.product.title; obj.product_image = o.product.image }
    if (o.seller) obj.seller_name = `${o.seller.first_name} ${o.seller.last_name}`
    return obj
  })
  res.json({ ...data, results })
}

// GET /api/marketplace/orders/:id/
exports.getOrder = async (req, res) => {
  const order = await MarketplaceOrder.findById(req.params.id)
    .populate('product', 'title image price')
    .populate('seller', 'first_name last_name phone')
  if (!order) return res.status(404).json({ detail: 'Order not found.' })
  if (order.buyer.toString() !== req.user._id.toString() && order.seller._id.toString() !== req.user._id.toString()) {
    return res.status(403).json({ detail: 'Not authorized.' })
  }
  res.json(order)
}
