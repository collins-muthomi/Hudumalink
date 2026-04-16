const mongoose = require('mongoose')

const customerRequestSchema = new mongoose.Schema({
  customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true, trim: true },
  description: { type: String, required: true, trim: true },
  category: { type: String, required: true, trim: true },
  category_name: { type: String, default: '' },
  parent_category: { type: String, default: '' },
  parent_category_name: { type: String, default: '' },
  location: { type: String, default: 'Nyeri Town' },
  budget: { type: Number, default: null },
  status: {
    type: String,
    enum: ['open', 'assigned', 'in_progress', 'completion_requested', 'completed'],
    default: 'open',
  },
  assignedProvider: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  payment_status: {
    type: String,
    enum: ['unpaid', 'paid', 'pending_payment', 'payment_received', 'service_in_progress', 'service_completed', 'payout_pending', 'payout_released'],
    default: 'pending_payment',
  },
  payment_amount: { type: Number, default: 0 },
  admin_fee: { type: Number, default: 0 },
  provider_amount: { type: Number, default: 0 },
  paid_at: { type: Date, default: null },
  payment_reference: { type: String, default: null },
  escrow_admin: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  payout_requested_at: { type: Date, default: null },
  payout_released_at: { type: Date, default: null },
}, { timestamps: true })

customerRequestSchema.index({ title: 'text', description: 'text', category_name: 'text', location: 'text' })
customerRequestSchema.set('toJSON', { virtuals: true })

module.exports = mongoose.model('CustomerRequest', customerRequestSchema)
