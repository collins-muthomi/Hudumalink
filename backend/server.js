const path = require('path')

// Load correct environment file based on NODE_ENV
const envFile = process.env.NODE_ENV === 'production' ? '.env' : '.env.development'
require('dotenv').config({ path: path.resolve(__dirname, envFile) })
require('express-async-errors')

const express = require('express')
const http = require('http')
const { Server } = require('socket.io')
const cors = require('cors')
const helmet = require('helmet')
const morgan = require('morgan')
const rateLimit = require('express-rate-limit')
const cookieParser = require('cookie-parser')
const { errorHandler, notFound } = require('./middleware/error')
const { sanitizeInput } = require('./middleware/validation')

const connectDB = require('./config/db')

const authRoutes = require('./routes/auth')
const servicesRoutes = require('./routes/services')
const serviceRequestRoutes = require('./routes/serviceRequests')
const marketplaceRoutes = require('./routes/marketplace')
const requestsRoutes = require('./routes/requests')
const walletRoutes = require('./routes/wallet')
const notificationRoutes = require('./routes/notifications')
const providerRoutes = require('./routes/providers')
const adminRoutes = require('./routes/admin')
const { referralRouter, reviewRouter, plansRouter } = require('./routes/misc')

const app = express()
const server = http.createServer(app)

app.set('trust proxy', 1)

// Build CORS allowed origins - Always allow localhost in development
const getSocketIOOrigins = () => {
  const isDev = process.env.NODE_ENV !== 'production'
  const origins = []
  
  if (isDev) {
    // Development: Allow all local origins
    origins.push('http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:3000', 'http://localhost:5174')
  }
  
  if (process.env.FRONTEND_URL) {
    origins.push(process.env.FRONTEND_URL)
  }
  
  return origins.filter(Boolean)
}

const io = new Server(server, {
  cors: {
    origin: getSocketIOOrigins(),
    methods: ['GET', 'POST'],
    credentials: true,
  },
})

app.set('io', io)

io.on('connection', (socket) => {
  console.log(`Socket connected: ${socket.id}`)

  // Join wallet room for real-time updates
  socket.on('join-wallet', (userId) => {
    socket.join(`wallet-${userId}`)
    console.log(`User ${userId} joined wallet room`)
  })

  socket.on('disconnect', () => {
    console.log(`Socket disconnected: ${socket.id}`)
  })
})

app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}))

const allowedOrigins = getSocketIOOrigins()

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true)
    }
    const isDev = process.env.NODE_ENV !== 'production'
    if (isDev) {
      console.warn(`⚠️ CORS blocked from: ${origin}`)
    }
    callback(new Error('CORS origin not allowed'))
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}))

app.use(cookieParser())

app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'))

app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// Input sanitization
app.use(sanitizeInput)

app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')))

const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'production' ? 200 : 1000,
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
app.use('/api/auth/verify-email', authLimiter)
app.use('/api/auth/resend-verification-code', authLimiter)

// ============================================
// HEALTH CHECK ROUTE
// ============================================
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'HudumaLink API',
    version: '1.0.0',
    location: 'Nyeri County, Kenya',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  })
})

// ============================================
// ✅ ROOT ROUTE - FIXES THE 404 ERROR
// ============================================
app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Welcome to HudumaLink API',
    service: 'HudumaLink Backend Service',
    version: '1.0.0',
    location: 'Nyeri County, Kenya',
    documentation: {
      health: '/health',
      auth: '/api/auth',
      services: '/api/services',
      serviceRequests: '/api/service-requests',
      marketplace: '/api/marketplace',
      requests: '/api/requests',
      wallet: '/api/wallet',
      notifications: '/api/notifications',
      providers: '/api/providers',
      admin: '/api/admin',
      referrals: '/api/referrals',
      reviews: '/api/reviews',
      plans: '/api/plans',
    },
    note: 'Your free instance may take 30-60 seconds to wake up after inactivity on Render free tier',
    frontend: 'https://hudumalink-five.vercel.app',
  })
})

// ============================================
// API ROUTES
// ============================================
app.use('/api/auth', authRoutes)
app.use('/api/services', servicesRoutes)
app.use('/api/service-requests', serviceRequestRoutes)
app.use('/api/marketplace', marketplaceRoutes)
app.use('/api/requests', requestsRoutes)
app.use('/api/wallet', walletRoutes)
app.use('/api/notifications', notificationRoutes)
app.use('/api/providers', providerRoutes)
app.use('/api/admin', adminRoutes)
app.use('/api/referrals', referralRouter)
app.use('/api/reviews', reviewRouter)
app.use('/api/plans', plansRouter)

// ============================================
// ERROR HANDLING (must be last)
// ============================================
app.use(notFound)
app.use(errorHandler)

// ============================================
// START SERVER
// ============================================
const PORT = process.env.PORT || 8000

const startServer = async () => {
  try {
    await connectDB()

    server.listen(PORT, () => {
      console.log(`HudumaLink API running on port ${PORT}`)
      console.log(`Socket.IO ready`)
      console.log(`Environment: ${process.env.NODE_ENV || 'development'}`)
      console.log(`Health: /health`)
      console.log(`Root: /`)
    })
  } catch (error) {
    console.error('Database connection failed:', error)
    process.exit(1)
  }
}

startServer()

module.exports = { app, server, io }