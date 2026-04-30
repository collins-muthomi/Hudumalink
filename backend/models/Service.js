const mongoose = require('mongoose')
const { PAYMENT_STATUS } = require('../constants/paymentStatus')

const serviceSchema = new mongoose.Schema({
  provider: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true, trim: true },
  description: { type: String, required: true, trim: true },
  category: { type: String, required: true, trim: true },
  category_name: { type: String, default: '' },
  parent_category: { type: String, default: '' },
  parent_category_name: { type: String, default: '' },
  price_from: { type: Number, default: null },
  image: { type: String, default: null },
  location: { type: String, default: 'Nyeri Town' },
  is_active: { type: Boolean, default: true },
  rating: { type: Number, default: null },
  reviews_count: { type: Number, default: 0 },
}, { timestamps: true })

serviceSchema.index({ title: 'text', description: 'text', category_name: 'text', location: 'text' })
serviceSchema.set('toJSON', { virtuals: true })

const serviceBookingSchema = new mongoose.Schema({
  customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  provider: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  service: { type: mongoose.Schema.Types.ObjectId, ref: 'Service', required: true },
  title: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  location: { type: String, default: 'Nyeri Town' },
  budget: { type: Number, default: null },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'in_progress', 'completion_requested', 'completed', 'cancelled'],
    default: 'pending',
  },
  payment_status: {
    type: String,
    enum: [
      PAYMENT_STATUS.UNPAID,
      'paid',
      PAYMENT_STATUS.PENDING_PAYMENT,
      PAYMENT_STATUS.PAYMENT_RECEIVED,
      'service_in_progress',
      'service_completed',
      PAYMENT_STATUS.PAYOUT_PENDING,
      PAYMENT_STATUS.PAYOUT_RELEASED,
    ],
    default: PAYMENT_STATUS.PENDING_PAYMENT,
  },
  payment_amount: { type: Number, default: 0 },
  admin_fee: { type: Number, default: 0 },
  provider_amount: { type: Number, default: 0 },
  paid_at: { type: Date, default: null },
  payment_reference: { type: String, default: null },
  escrow_admin: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  payout_requested_at: { type: Date, default: null },
  payout_released_at: { type: Date, default: null },
  reviewed: { type: Boolean, default: false },
}, { timestamps: true })

serviceBookingSchema.set('toJSON', { virtuals: true })

const Service = mongoose.model('Service', serviceSchema)
const ServiceBooking = mongoose.model('ServiceBooking', serviceBookingSchema)

module.exports = {
  Service,
  ServiceBooking,
  ServiceRequest: ServiceBooking,
}
