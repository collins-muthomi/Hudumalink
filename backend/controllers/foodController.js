const { Restaurant, FoodOrder } = require('../models/Food')
const { Delivery } = require('../models/Delivery')
const { paginatedResponse, notify, creditWallet, debitWallet } = require('../utils/helpers')
const { stkPush } = require('../utils/mpesa')

const restaurantFields = [
  'name',
  'description',
  'cuisine',
  'location',
  'address',
  'phone',
  'image',
  'is_open',
  'delivery_time',
  'minimum_order',
]

const mapRestaurantForOwner = (restaurant) => {
  const obj = restaurant.toJSON()
  obj.menu_count = restaurant.menu.length
  return obj
}

// GET /api/food/restaurants/
exports.listRestaurants = async (req, res) => {
  const { search, page = 1, limit = 20 } = req.query
  const filter = {}
  if (search) filter.$or = [
    { name: { $regex: search, $options: 'i' } },
    { cuisine: { $regex: search, $options: 'i' } },
    { location: { $regex: search, $options: 'i' } },
  ]
  const data = await paginatedResponse(Restaurant, filter, { page, limit, sort: { createdAt: -1 } })
  res.json(data)
}

// GET /api/food/me/dashboard/
exports.getOwnerDashboard = async (req, res) => {
  const restaurant = await Restaurant.findOne({ owner: req.user._id })
  if (!restaurant) {
    return res.json({
      has_restaurant: false,
      restaurant: null,
      total_orders: 0,
      pending_orders: 0,
      monthly_revenue: 0,
      menu_count: 0,
      recent_orders: [],
    })
  }

  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
  const [totalOrders, pendingOrders, paidOrders, recentOrders] = await Promise.all([
    FoodOrder.countDocuments({ restaurant: restaurant._id }),
    FoodOrder.countDocuments({ restaurant: restaurant._id, status: { $in: ['pending', 'confirmed', 'preparing', 'ready'] } }),
    FoodOrder.find({ restaurant: restaurant._id, payment_status: 'paid', createdAt: { $gte: monthStart } }).select('total'),
    FoodOrder.find({ restaurant: restaurant._id })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('customer', 'first_name last_name'),
  ])

  const monthlyRevenue = paidOrders.reduce((sum, order) => sum + (order.total || 0), 0)

  res.json({
    has_restaurant: true,
    restaurant: mapRestaurantForOwner(restaurant),
    total_orders: totalOrders,
    pending_orders: pendingOrders,
    monthly_revenue: monthlyRevenue,
    menu_count: restaurant.menu.length,
    recent_orders: recentOrders.map(order => ({
      id: order._id,
      status: order.status,
      payment_status: order.payment_status,
      total: order.total,
      createdAt: order.createdAt,
      customer_name: order.customer ? `${order.customer.first_name} ${order.customer.last_name}` : 'Customer',
    })),
  })
}

// GET /api/food/me/restaurant/
exports.getMyRestaurant = async (req, res) => {
  const restaurant = await Restaurant.findOne({ owner: req.user._id })
  if (!restaurant) return res.status(404).json({ detail: 'Restaurant not found.' })
  res.json(mapRestaurantForOwner(restaurant))
}

// POST /api/food/me/restaurant/
exports.createMyRestaurant = async (req, res) => {
  const existing = await Restaurant.findOne({ owner: req.user._id })
  if (existing) return res.status(400).json({ detail: 'You already have a restaurant profile.' })

  if (!req.body.name || !req.body.phone) {
    return res.status(400).json({ detail: 'Restaurant name and phone are required.' })
  }

  const payload = { owner: req.user._id, menu: [] }
  restaurantFields.forEach((field) => {
    if (req.body[field] !== undefined) payload[field] = req.body[field]
  })

  const restaurant = await Restaurant.create(payload)
  res.status(201).json(mapRestaurantForOwner(restaurant))
}

// PATCH /api/food/me/restaurant/
exports.updateMyRestaurant = async (req, res) => {
  const restaurant = await Restaurant.findOne({ owner: req.user._id })
  if (!restaurant) return res.status(404).json({ detail: 'Restaurant not found.' })

  restaurantFields.forEach((field) => {
    if (req.body[field] !== undefined) restaurant[field] = req.body[field]
  })

  await restaurant.save()
  res.json(mapRestaurantForOwner(restaurant))
}

// POST /api/food/me/menu/
exports.createMenuItem = async (req, res) => {
  const restaurant = await Restaurant.findOne({ owner: req.user._id })
  if (!restaurant) return res.status(404).json({ detail: 'Create your restaurant profile first.' })

  const { name, price, description, category, image, is_unavailable } = req.body
  if (!name || price === undefined) {
    return res.status(400).json({ detail: 'Menu item name and price are required.' })
  }

  restaurant.menu.push({
    name,
    price: Number(price),
    description: description || '',
    category: category || 'Main',
    image: image || null,
    is_unavailable: !!is_unavailable,
  })

  await restaurant.save()
  res.status(201).json(restaurant.menu[restaurant.menu.length - 1])
}

// PATCH /api/food/me/menu/:itemId/
exports.updateMenuItem = async (req, res) => {
  const restaurant = await Restaurant.findOne({ owner: req.user._id })
  if (!restaurant) return res.status(404).json({ detail: 'Restaurant not found.' })

  const item = restaurant.menu.id(req.params.itemId)
  if (!item) return res.status(404).json({ detail: 'Menu item not found.' })

  const allowed = ['name', 'description', 'price', 'category', 'image', 'is_unavailable']
  allowed.forEach((field) => {
    if (req.body[field] !== undefined) item[field] = field === 'price' ? Number(req.body[field]) : req.body[field]
  })

  await restaurant.save()
  res.json(item)
}

// DELETE /api/food/me/menu/:itemId/
exports.deleteMenuItem = async (req, res) => {
  const restaurant = await Restaurant.findOne({ owner: req.user._id })
  if (!restaurant) return res.status(404).json({ detail: 'Restaurant not found.' })

  const item = restaurant.menu.id(req.params.itemId)
  if (!item) return res.status(404).json({ detail: 'Menu item not found.' })

  item.deleteOne()
  await restaurant.save()
  res.json({ detail: 'Menu item deleted.' })
}

// GET /api/food/restaurants/:id/
exports.getRestaurant = async (req, res) => {
  const r = await Restaurant.findById(req.params.id).select('-menu')
  if (!r) return res.status(404).json({ detail: 'Restaurant not found.' })
  res.json(r)
}

// GET /api/food/restaurants/:id/menu/
exports.getMenu = async (req, res) => {
  const r = await Restaurant.findById(req.params.id).select('menu name')
  if (!r) return res.status(404).json({ detail: 'Restaurant not found.' })
  res.json(r.menu)
}

// POST /api/food/orders/
exports.createOrder = async (req, res) => {
  const {
    restaurant: restaurantId,
    items,
    delivery_address,
    phone,
    payment_method,
    mpesa_phone,
    special_instructions,
    delivery_fee = 80,
    service_fee = 0,
  } = req.body

  if (!restaurantId || !items?.length || !delivery_address || !phone) {
    return res.status(400).json({ detail: 'Restaurant, items, delivery address and phone are required.' })
  }

  const restaurant = await Restaurant.findById(restaurantId)
  if (!restaurant) return res.status(404).json({ detail: 'Restaurant not found.' })
  if (!restaurant.is_open) return res.status(400).json({ detail: 'Restaurant is currently closed.' })

  // Build order items from menu
  const orderItems = []
  let subtotal = 0
  for (const item of items) {
    const menuItem = restaurant.menu.id(item.menu_item)
    if (!menuItem || menuItem.is_unavailable) {
      return res.status(400).json({ detail: `Item "${item.menu_item}" is not available.` })
    }
    const qty = Number(item.quantity) || 1
    orderItems.push({ menu_item: menuItem._id, name: menuItem.name, price: menuItem.price, quantity: qty })
    subtotal += menuItem.price * qty
  }

  if (subtotal < (restaurant.minimum_order || 0)) {
    return res.status(400).json({ detail: `Minimum order is KSh ${restaurant.minimum_order}.` })
  }

  const total = subtotal + Number(delivery_fee) + Number(service_fee)

  const order = await FoodOrder.create({
    customer: req.user._id,
    restaurant: restaurantId,
    items: orderItems,
    subtotal,
    delivery_fee: Number(delivery_fee),
    service_fee: Number(service_fee),
    total,
    delivery_address,
    phone,
    payment_method: payment_method || 'mpesa',
    special_instructions: special_instructions || '',
    estimated_delivery: new Date(Date.now() + (restaurant.delivery_time || 30) * 60 * 1000),
  })

  // Handle payment
  if (payment_method === 'mpesa' && mpesa_phone) {
    try {
      const mpesaRes = await stkPush({
        phone: mpesa_phone,
        amount: total,
        accountRef: `HL-FOOD-${order._id.toString().slice(-6).toUpperCase()}`,
        description: `Food order from ${restaurant.name}`,
      })
      order.mpesa_checkout_id = mpesaRes.CheckoutRequestID
      await order.save()
    } catch (err) {
      // STK push failed — order still created, payment pending
      console.warn('STK push error:', err.message)
    }
  } else if (payment_method === 'wallet') {
    try {
      await debitWallet(req.user._id, total, `Food order from ${restaurant.name}`, `FOOD-${order._id}`)
      order.payment_status = 'paid'
      order.status = 'confirmed'
      await order.save()
    } catch (err) {
      await FoodOrder.findByIdAndDelete(order._id)
      return res.status(400).json({ detail: err.message })
    }
  }

  // Notify restaurant owner
  await notify(restaurant.owner, {
    type: 'order',
    title: 'New food order! 🍔',
    message: `New order received — KSh ${total.toLocaleString()}`,
  })

  // Create delivery task
  await Delivery.create({
    food_order: order._id,
    pickup_address: `${restaurant.name}, ${restaurant.location}`,
    delivery_address,
    fee: delivery_fee,
    status: 'pending',
  })

  res.status(201).json(order)
}

// GET /api/food/orders/my/
exports.myOrders = async (req, res) => {
  const orders = await FoodOrder.find({ customer: req.user._id })
    .sort({ createdAt: -1 })
    .populate('restaurant', 'name image location')
  res.json(orders)
}

// GET /api/food/orders/:id/
exports.getOrder = async (req, res) => {
  const order = await FoodOrder.findById(req.params.id)
    .populate('restaurant', 'name image location phone')
    .populate('driver', 'first_name last_name phone')
  if (!order) return res.status(404).json({ detail: 'Order not found.' })
  if (order.customer.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    return res.status(403).json({ detail: 'Not authorized.' })
  }
  res.json(order)
}

// GET /api/food/orders/:id/track/
exports.trackOrder = async (req, res) => {
  const order = await FoodOrder.findById(req.params.id)
    .select('status estimated_delivery driver payment_status')
    .populate('driver', 'first_name last_name phone')
  if (!order) return res.status(404).json({ detail: 'Order not found.' })
  res.json({
    order_id: order._id,
    status: order.status,
    estimated_delivery: order.estimated_delivery,
    payment_status: order.payment_status,
    driver: order.driver ? {
      name: `${order.driver.first_name} ${order.driver.last_name}`,
      phone: order.driver.phone,
    } : null,
  })
}

// POST /api/wallet/mpesa/callback — M-Pesa payment confirmation
exports.mpesaCallback = async (req, res) => {
  try {
    const { Body } = req.body
    const result = Body?.stkCallback
    if (!result) return res.json({ ResultCode: 0 })

    const checkoutId = result.CheckoutRequestID
    const success = result.ResultCode === 0

    if (success) {
      const order = await FoodOrder.findOne({ mpesa_checkout_id: checkoutId })
      if (order && order.payment_status === 'pending') {
        order.payment_status = 'paid'
        order.status = 'confirmed'
        await order.save()
        await notify(order.customer, {
          type: 'payment',
          title: 'Payment confirmed ✅',
          message: `Your food order payment of KSh ${order.total.toLocaleString()} was received.`,
        })
      }
    }
    res.json({ ResultCode: 0, ResultDesc: 'Accepted' })
  } catch {
    res.json({ ResultCode: 0 })
  }
}
