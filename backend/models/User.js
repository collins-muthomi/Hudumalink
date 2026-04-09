const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')

const userSchema = new mongoose.Schema({
  first_name:  { type: String, required: true, trim: true },
  last_name:   { type: String, required: true, trim: true },
  email:       { type: String, required: true, unique: true, lowercase: true, trim: true },
  phone:       { type: String, required: true, unique: true, trim: true },
  password:    { type: String, required: true, minlength: 8, select: false },
  role:        { type: String, enum: ['customer', 'provider', 'delivery_driver', 'restaurant_owner', 'admin'], default: 'customer' },
  is_active:   { type: Boolean, default: true },
  is_verified: { type: Boolean, default: false },
  avatar:      { type: String, default: null },
  referral_code:   { type: String, unique: true, sparse: true },
  referred_by:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  plan:        { type: String, enum: ['free', 'pro', 'business'], default: 'free' },
  plan_expires_at: { type: Date, default: null },
  google_id:   { type: String, default: null },
  last_login:  { type: Date, default: null },
}, { timestamps: true })

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next()
  this.password = await bcrypt.hash(this.password, 12)
  next()
})

userSchema.methods.comparePassword = function (candidate) {
  return bcrypt.compare(candidate, this.password)
}

userSchema.methods.toJSON = function () {
  const obj = this.toObject()
  delete obj.password
  delete obj.__v
  return obj
}

module.exports = mongoose.model('User', userSchema)
