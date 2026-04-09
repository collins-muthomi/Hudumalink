const mongoose = require('mongoose')

// ─── Service (Provider's listed service) ────────────────
const serviceSchema = new mongoose.Schema({
  provider:      { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title:         { type: String, required: true, trim: true },
  description:   { type: String, required: true },
  category:      { type: String, required: true },
  category_name: { type: String },
  price_from:    { type: Number, default: null },
  image:         { type: String, default: null },
  location:      { type: String, default: 'Nyeri Town' },
  is_active:     { type: Boolean, default: true },
  rating:        { type: Number, default: null },
  reviews_count: { type: Number, default: 0 },
}, { timestamps: true })

serviceSchema.virtual('provider_name').get(function () { return null })

// ─── Service Request (Customer's request for service) ───
const responseSchema = new mongoose.Schema({
  provider:      { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  provider_name: { type: String },
  quote:         { type: Number, required: true },
  message:       { type: String },
  accepted:      { type: Boolean, default: false },
  created_at:    { type: Date, default: Date.now },
})

const serviceRequestSchema = new mongoose.Schema({
  customer:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title:        { type: String, required: true, trim: true },
  description:  { type: String, required: true },
  category:     { type: String, required: true },
  category_name:{ type: String },
  budget_min:   { type: Number, default: null },
  budget_max:   { type: Number, default: null },
  location:     { type: String, default: 'Nyeri Town' },
  urgency:      { type: String, enum: ['normal', 'urgent', 'asap'], default: 'normal' },
  status:       { type: String, enum: ['pending', 'active', 'completed', 'cancelled'], default: 'pending' },
  assigned_provider: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  responses:    [responseSchema],
}, { timestamps: true })

serviceRequestSchema.virtual('responses_count').get(function () { return this.responses.length })
serviceRequestSchema.set('toJSON', { virtuals: true })
serviceSchema.set('toJSON', { virtuals: true })

const Service = mongoose.model('Service', serviceSchema)
const ServiceRequest = mongoose.model('ServiceRequest', serviceRequestSchema)

module.exports = { Service, ServiceRequest }
