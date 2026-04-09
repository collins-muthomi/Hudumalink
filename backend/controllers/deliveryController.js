const { DriverProfile, Delivery } = require('../models/Delivery')
const { FoodOrder } = require('../models/Food')
const { paginatedResponse, notify, creditWallet } = require('../utils/helpers')

// POST /api/delivery/register/
exports.register = async (req, res) => {
  const existing = await DriverProfile.findOne({ user: req.user._id })
  if (existing) return res.status(400).json({ detail: 'You already have a driver profile.' })

  const {
    vehicle_type, vehicle_registration, service_area,
    emergency_contact_name, emergency_contact_phone,
  } = req.body

  if (!vehicle_type || !vehicle_registration) {
    return res.status(400).json({ detail: 'Vehicle type and registration are required.' })
  }

  const files = req.files || {}
  const profile = await DriverProfile.create({
    user: req.user._id,
    vehicle_type,
    vehicle_registration: vehicle_registration.toUpperCase(),
    service_area: service_area || 'Nyeri Town',
    emergency_contact_name: emergency_contact_name || '',
    emergency_contact_phone: emergency_contact_phone || '',
    id_document: files.id_document?.[0]?.path || files.id_document?.[0]?.secure_url || null,
    driving_license: files.driving_license?.[0]?.path || files.driving_license?.[0]?.secure_url || null,
    vehicle_photo: files.vehicle_photo?.[0]?.path || files.vehicle_photo?.[0]?.secure_url || null,
    profile_photo: files.profile_photo?.[0]?.path || files.profile_photo?.[0]?.secure_url || null,
    is_approved: false,
    is_available: false,
  })

  res.status(201).json({ detail: 'Registration submitted. Awaiting approval.', profile })
}

// GET /api/delivery/profile/
exports.getProfile = async (req, res) => {
  const profile = await DriverProfile.findOne({ user: req.user._id })
  if (!profile) return res.status(404).json({ detail: 'Driver profile not found.' })
  res.json(profile)
}

// PATCH /api/delivery/profile/
exports.updateProfile = async (req, res) => {
  const profile = await DriverProfile.findOne({ user: req.user._id })
  if (!profile) return res.status(404).json({ detail: 'Driver profile not found.' })
  const allowed = ['service_area', 'emergency_contact_name', 'emergency_contact_phone', 'is_available']
  allowed.forEach(k => { if (req.body[k] !== undefined) profile[k] = req.body[k] })
  await profile.save()
  res.json(profile)
}

// GET /api/delivery/active/
exports.activeDeliveries = async (req, res) => {
  const profile = await DriverProfile.findOne({ user: req.user._id })

  // If driver — show their assigned + pending nearby
  let deliveries
  if (profile?.is_approved) {
    deliveries = await Delivery.find({
      $or: [
        { driver: req.user._id, status: { $in: ['accepted', 'picked_up'] } },
        { driver: null, status: 'pending' },
      ],
    })
      .sort({ createdAt: -1 })
      .populate('food_order', 'total delivery_address phone')
  } else {
    deliveries = []
  }
  res.json(deliveries)
}

// GET /api/delivery/history/
exports.history = async (req, res) => {
  const { page = 1, limit = 20 } = req.query
  const data = await paginatedResponse(Delivery, { driver: req.user._id, status: 'completed' }, {
    page, limit, sort: { updatedAt: -1 },
  })
  res.json(data)
}

// POST /api/delivery/location/
exports.updateLocation = async (req, res) => {
  const { lat, lng } = req.body
  if (!lat || !lng) return res.status(400).json({ detail: 'lat and lng required.' })
  await DriverProfile.findOneAndUpdate(
    { user: req.user._id },
    { 'current_location.lat': lat, 'current_location.lng': lng, 'current_location.updated_at': new Date() }
  )
  res.json({ detail: 'Location updated.' })
}

// POST /api/delivery/:id/accept/
exports.acceptDelivery = async (req, res) => {
  const profile = await DriverProfile.findOne({ user: req.user._id })
  if (!profile?.is_approved) return res.status(403).json({ detail: 'Your driver account is not yet approved.' })

  const delivery = await Delivery.findById(req.params.id)
  if (!delivery) return res.status(404).json({ detail: 'Delivery not found.' })
  if (delivery.status !== 'pending') return res.status(400).json({ detail: 'Delivery already taken.' })

  delivery.driver = req.user._id
  delivery.status = 'accepted'
  await delivery.save()

  // Update food order if applicable
  if (delivery.food_order) {
    await FoodOrder.findByIdAndUpdate(delivery.food_order, { driver: req.user._id })
    const order = await FoodOrder.findById(delivery.food_order)
    if (order) {
      await notify(order.customer, {
        type: 'order',
        title: 'Driver assigned 🚴',
        message: `${req.user.first_name} is picking up your order. On the way!`,
      })
    }
  }

  res.json(delivery)
}

// POST /api/delivery/:id/complete/
exports.completeDelivery = async (req, res) => {
  const delivery = await Delivery.findById(req.params.id)
  if (!delivery) return res.status(404).json({ detail: 'Delivery not found.' })
  if (delivery.driver?.toString() !== req.user._id.toString()) {
    return res.status(403).json({ detail: 'Not your delivery.' })
  }
  if (delivery.status === 'completed') return res.status(400).json({ detail: 'Already completed.' })

  delivery.status = 'completed'
  delivery.completed_at = new Date()
  await delivery.save()

  // Credit driver's wallet
  await creditWallet(req.user._id, delivery.fee, `Delivery fee — order #${delivery._id.toString().slice(-6)}`, `DEL-${delivery._id}`)

  // Update stats
  await DriverProfile.findOneAndUpdate({ user: req.user._id }, { $inc: { total_deliveries: 1 } })

  // Update food order status
  if (delivery.food_order) {
    await FoodOrder.findByIdAndUpdate(delivery.food_order, { status: 'delivered' })
    const order = await FoodOrder.findById(delivery.food_order)
    if (order) {
      await notify(order.customer, {
        type: 'order',
        title: 'Order delivered! 🎉',
        message: 'Your order has been delivered. Enjoy your meal!',
      })
    }
  }

  res.json({ detail: 'Delivery completed.', earnings: delivery.fee })
}
