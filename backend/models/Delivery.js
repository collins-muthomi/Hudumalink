const mongoose = require('mongoose')

const driverProfileSchema = new mongoose.Schema({
  user:            { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  vehicle_type:    { type: String, enum: ['bicycle', 'motorcycle', 'car', 'tuktuk'], required: true },
  vehicle_registration: { type: String, required: true, uppercase: true },
  service_area:    { type: String, default: 'Nyeri Town' },
  id_document:     { type: String, default: null },
  driving_license: { type: String, default: null },
  vehicle_photo:   { type: String, default: null },
  profile_photo:   { type: String, default: null },
  emergency_contact_name:  { type: String, default: '' },
  emergency_contact_phone: { type: String, default: '' },
  is_available:    { type: Boolean, default: false },
  is_approved:     { type: Boolean, default: false },
  rating:          { type: Number, default: null },
  total_deliveries:{ type: Number, default: 0 },
  current_location: {
    lat: { type: Number, default: null },
    lng: { type: Number, default: null },
    updated_at: { type: Date, default: null },
  },
}, { timestamps: true })

const deliverySchema = new mongoose.Schema({
  driver:          { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  food_order:      { type: mongoose.Schema.Types.ObjectId, ref: 'FoodOrder', default: null },
  marketplace_order:{ type: mongoose.Schema.Types.ObjectId, ref: 'MarketplaceOrder', default: null },
  pickup_address:  { type: String, required: true },
  delivery_address:{ type: String, required: true },
  fee:             { type: Number, default: 80 },
  status:          { type: String, enum: ['pending', 'accepted', 'picked_up', 'completed', 'cancelled'], default: 'pending' },
  notes:           { type: String, default: '' },
  completed_at:    { type: Date, default: null },
}, { timestamps: true })

const DriverProfile = mongoose.model('DriverProfile', driverProfileSchema)
const Delivery = mongoose.model('Delivery', deliverySchema)

module.exports = { DriverProfile, Delivery }
