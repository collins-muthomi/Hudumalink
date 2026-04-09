const mongoose = require('mongoose')

const menuItemSchema = new mongoose.Schema({
  name:          { type: String, required: true },
  description:   { type: String, default: '' },
  price:         { type: Number, required: true, min: 0 },
  category:      { type: String, default: 'Main' },
  image:         { type: String, default: null },
  is_unavailable:{ type: Boolean, default: false },
})

const restaurantSchema = new mongoose.Schema({
  owner:         { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name:          { type: String, required: true, trim: true },
  description:   { type: String, default: '' },
  cuisine:       { type: String, default: 'Local' },
  location:      { type: String, default: 'Nyeri Town' },
  address:       { type: String, default: '' },
  phone:         { type: String, default: '' },
  image:         { type: String, default: null },
  is_open:       { type: Boolean, default: true },
  delivery_time: { type: Number, default: 30 },
  minimum_order: { type: Number, default: 200 },
  rating:        { type: Number, default: null },
  reviews_count: { type: Number, default: 0 },
  menu:          [menuItemSchema],
}, { timestamps: true })

const orderItemSchema = new mongoose.Schema({
  menu_item:  { type: mongoose.Schema.Types.ObjectId },
  name:       { type: String, required: true },
  price:      { type: Number, required: true },
  quantity:   { type: Number, required: true, min: 1 },
})

const foodOrderSchema = new mongoose.Schema({
  customer:        { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  restaurant:      { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true },
  driver:          { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  items:           [orderItemSchema],
  subtotal:        { type: Number, required: true },
  delivery_fee:    { type: Number, default: 80 },
  service_fee:     { type: Number, default: 0 },
  total:           { type: Number, required: true },
  delivery_address:{ type: String, required: true },
  phone:           { type: String, required: true },
  payment_method:  { type: String, enum: ['mpesa', 'wallet', 'cash'], default: 'mpesa' },
  payment_status:  { type: String, enum: ['pending', 'paid', 'failed'], default: 'pending' },
  mpesa_checkout_id:{ type: String, default: null },
  status:          { type: String, enum: ['pending', 'confirmed', 'preparing', 'ready', 'picked_up', 'delivered', 'cancelled'], default: 'pending' },
  special_instructions: { type: String, default: '' },
  estimated_delivery: { type: Date, default: null },
}, { timestamps: true })

const Restaurant = mongoose.model('Restaurant', restaurantSchema)
const FoodOrder = mongoose.model('FoodOrder', foodOrderSchema)

module.exports = { Restaurant, FoodOrder }
