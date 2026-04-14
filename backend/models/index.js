const mongoose = require('mongoose')

// ─── Wallet Transaction ──────────────────────────────────
const transactionSchema = new mongoose.Schema({
  user:        { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type:        { type: String, enum: ['credit', 'debit', 'transfer', 'refund'], required: true },
  amount:      { type: Number, required: true, min: 0 },
  description: { type: String, default: '' },
  reference:   { type: String, unique: true, sparse: true },
  status:      { type: String, enum: ['pending', 'completed', 'failed'], default: 'completed' },
  mpesa_receipt:{ type: String, default: null },
  metadata:    { type: mongoose.Schema.Types.Mixed, default: {} },
}, { timestamps: true })

const Transaction = mongoose.model('Transaction', transactionSchema)

// ─── Wallet Balance (embedded in User — this is for fast lookup) ─
const walletSchema = new mongoose.Schema({
  user:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  balance:  { type: Number, default: 0, min: 0 },
  currency: { type: String, default: 'KES' },
  locked:   { type: Number, default: 0 },
}, { timestamps: true })

const Wallet = mongoose.model('Wallet', walletSchema)

// ─── Notification ────────────────────────────────────────
const notificationSchema = new mongoose.Schema({
  user:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type:    { type: String, enum: ['order', 'booking', 'payment', 'service', 'system', 'promo'], default: 'system' },
  title:   { type: String, required: true },
  message: { type: String, default: '' },
  read:    { type: Boolean, default: false },
  data:    { type: mongoose.Schema.Types.Mixed, default: {} },
}, { timestamps: true })

const Notification = mongoose.model('Notification', notificationSchema)

// ─── Referral ────────────────────────────────────────────
const referralSchema = new mongoose.Schema({
  referrer:       { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  referred:       { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  referred_name:  { type: String },
  status:         { type: String, enum: ['pending', 'completed'], default: 'pending' },
  reward:         { type: Number, default: 50 },
  rewarded_at:    { type: Date, default: null },
}, { timestamps: true })

const Referral = mongoose.model('Referral', referralSchema)

// ─── Provider Profile ────────────────────────────────────
const providerProfileSchema = new mongoose.Schema({
  user:            { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  service_type:    { type: String, required: true },
  experience_years:{ type: Number, default: 0 },
  bio:             { type: String, default: '' },
  location:        { type: String, default: 'Nyeri Town' },
  profileImage:    { type: String, default: null },
  profile_photo:   { type: String, default: null },
  id_front:        { type: String, default: null },
  id_back:         { type: String, default: null },
  certificate:     { type: String, default: null },
  verification_status: { type: String, enum: ['unsubmitted', 'pending', 'approved', 'rejected'], default: 'unsubmitted' },
  rejection_reason:{ type: String, default: null },
  submitted_at:    { type: Date, default: null },
  approved_at:     { type: Date, default: null },
  average_rating:  { type: Number, default: null },
  reviews_count:   { type: Number, default: 0 },
  completed_jobs:  { type: Number, default: 0 },
  response_time:   { type: String, default: 'Within 1 hr' },
  availability: {
    monday:    { type: Boolean, default: true },
    tuesday:   { type: Boolean, default: true },
    wednesday: { type: Boolean, default: true },
    thursday:  { type: Boolean, default: true },
    friday:    { type: Boolean, default: true },
    saturday:  { type: Boolean, default: false },
    sunday:    { type: Boolean, default: false },
  },
}, { timestamps: true })

const ProviderProfile = mongoose.model('ProviderProfile', providerProfileSchema)

// ─── Booking ─────────────────────────────────────────────
const bookingSchema = new mongoose.Schema({
  customer:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  provider:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  service:     { type: mongoose.Schema.Types.ObjectId, ref: 'Service', default: null },
  service_request: { type: mongoose.Schema.Types.ObjectId, ref: 'ServiceRequest', default: null },
  service_name:{ type: String, default: '' },
  customer_name:{ type: String, default: '' },
  date:        { type: String, required: true },
  time:        { type: String, required: true },
  amount:      { type: Number, default: null },
  status:      { type: String, enum: ['pending', 'confirmed', 'completed', 'cancelled'], default: 'pending' },
  notes:       { type: String, default: '' },
}, { timestamps: true })

const Booking = mongoose.model('Booking', bookingSchema)

// ─── Review ──────────────────────────────────────────────
const reviewSchema = new mongoose.Schema({
  reviewer:      { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  reviewer_name: { type: String },
  customer:      { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  provider:      { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  service:       { type: mongoose.Schema.Types.ObjectId, ref: 'Service', default: null },
  target_type:   { type: String, enum: ['provider', 'product', 'restaurant', 'driver'], required: true },
  target_id:     { type: mongoose.Schema.Types.ObjectId, required: true },
  rating:        { type: Number, required: true, min: 1, max: 5 },
  comment:       { type: String, default: '' },
}, { timestamps: true })

const Review = mongoose.model('Review', reviewSchema)

// ─── Activity Log ────────────────────────────────────────
const activitySchema = new mongoose.Schema({
  user:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  action:  { type: String, required: true },
  details: { type: String, default: '' },
  ip:      { type: String, default: null },
}, { timestamps: true })

const ActivityLog = mongoose.model('ActivityLog', activitySchema)

module.exports = { Transaction, Wallet, Notification, Referral, ProviderProfile, Booking, Review, ActivityLog }
