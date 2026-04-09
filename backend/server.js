require('dotenv').config()
require('express-async-errors')

const express = require('express')
const http = require('http')
const { Server } = require('socket.io')
const cors = require('cors')
const helmet = require('helmet')
const morgan = require('morgan')
const rateLimit = require('express-rate-limit')
const path = require('path')

const connectDB = require('./config/db')
const { errorHandler, notFound } = require('./middleware/error')

// ── Route imports ────────────────────────────────────────
const authRoutes          = require('./routes/auth')
const servicesRoutes      = require('./routes/services')
const serviceRequestRoutes= require('./routes/serviceRequests')
const marketplaceRoutes   = require('./routes/marketplace')
const foodRoutes          = require('./routes/food')
const deliveryRoutes      = require('./routes/delivery')
const walletRoutes        = require('./routes/wallet')
const notificationRoutes  = require('./routes/notifications')
const providerRoutes      = require('./routes/providers')
const adminRoutes         = require('./routes/admin')
const { referralRouter, reviewRouter, plansRouter } = require('./routes/misc')

// ── App setup ────────────────────────────────────────────
const app = express()
const server = http.createServer(app)

// ── Socket.IO ────────────────────────────────────────────
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
  },
})

// Attach io to app so controllers can emit events
app.set('io', io)

io.on('connection', (socket) => {
  console.log(`🔌 Socket connected: ${socket.id}`)

  // Driver joins their own room for location updates
  socket.on('join_driver', (driverId) => socket.join(`driver_${driverId}`))

  // Customer joins order room
  socket.on('join_order', (orderId) => socket.join(`order_${orderId}`))

  // Driver sends location update
  socket.on('driver_location', ({ orderId, lat, lng }) => {
    io.to(`order_${orderId}`).emit('location_update', { lat, lng })
  })

  socket.on('disconnect', () => {
    console.log(`🔌 Socket disconnected: ${socket.id}`)
  })
})

// ── Connect DB ───────────────────────────────────────────
connectDB()

// ── Global middleware ────────────────────────────────────
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }))

app.use(cors({
  origin: [
    process.env.FRONTEND_URL || 'http://localhost:5173',
    'http://localhost:3000',
    'http://localhost:5174',
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}))

app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'))

app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// Serve local uploads (when Cloudinary not configured)
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')))

// ── Rate limiting ────────────────────────────────────────
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { detail: 'Too many requests. Please try again later.' },
})

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { detail: 'Too many auth attempts. Please wait 15 minutes.' },
})

app.use('/api', globalLimiter)
app.use('/api/auth/login', authLimiter)
app.use('/api/auth/register', authLimiter)

// ── Health check ─────────────────────────────────────────
app.get('/health', (req, res) => res.json({
  status: 'ok',
  service: 'HudumaLink API',
  version: '1.0.0',
  location: 'Nyeri County, Kenya',
  timestamp: new Date().toISOString(),
  environment: process.env.NODE_ENV,
}))

// ── API Routes ───────────────────────────────────────────
app.use('/api/auth',             authRoutes)
app.use('/api/services',         servicesRoutes)
app.use('/api/service-requests', serviceRequestRoutes)
app.use('/api/marketplace',      marketplaceRoutes)
app.use('/api/food',             foodRoutes)
app.use('/api/delivery',         deliveryRoutes)
app.use('/api/wallet',           walletRoutes)
app.use('/api/notifications',    notificationRoutes)
app.use('/api/providers',        providerRoutes)
app.use('/api/admin',            adminRoutes)
app.use('/api/referrals',        referralRouter)
app.use('/api/reviews',          reviewRouter)
app.use('/api/plans',            plansRouter)

// ── 404 & Error handlers ─────────────────────────────────
app.use(notFound)
app.use(errorHandler)

// ── Start server ─────────────────────────────────────────
const PORT = process.env.PORT || 8000
server.listen(PORT, () => {
  console.log(`\n🚀 HudumaLink API running on http://localhost:${PORT}`)
  console.log(`📡 Socket.IO ready`)
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`)
  console.log(`❤️  Health: http://localhost:${PORT}/health\n`)
})

module.exports = { app, server, io }
