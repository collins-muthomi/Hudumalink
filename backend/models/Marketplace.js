const mongoose = require('mongoose')

const productSchema = new mongoose.Schema({
  seller:        { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title:         { type: String, required: true, trim: true },
  description:   { type: String, required: true },
  category:      { type: String, required: true },
  category_name: { type: String },
  price:         { type: Number, required: true, min: 0 },
  condition:     { type: String, enum: ['new', 'like_new', 'good', 'fair'], default: 'good' },
  location:      { type: String, default: 'Nyeri Town' },
  phone:         { type: String, default: null },
  image:         { type: String, default: null },
  is_sold:       { type: Boolean, default: false },
  is_active:     { type: Boolean, default: true },
  views:         { type: Number, default: 0 },
}, { timestamps: true })

productSchema.virtual('seller_name').get(function () { return null })
productSchema.set('toJSON', { virtuals: true })

const orderSchema = new mongoose.Schema({
  buyer:         { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  product:       { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  seller:        { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  quantity:      { type: Number, default: 1, min: 1 },
  total:         { type: Number, required: true },
  status:        { type: String, enum: ['pending', 'confirmed', 'delivered', 'cancelled'], default: 'pending' },
  delivery_address: { type: String, default: null },
  notes:         { type: String, default: null },
}, { timestamps: true })

const Product = mongoose.model('Product', productSchema)
const MarketplaceOrder = mongoose.model('MarketplaceOrder', orderSchema)

module.exports = { Product, MarketplaceOrder }
