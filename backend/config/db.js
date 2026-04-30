const dns = require('dns')
const mongoose = require('mongoose')

// Use public DNS servers for Atlas SRV resolution when the system resolver refuses SRV queries.
// This is safe for both local development and deployed environments.
dns.setServers(['1.1.1.1', '8.8.8.8'])

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
    })
    console.log(`✅ MongoDB connected: ${conn.connection.host}`)
  } catch (err) {
    console.error(`❌ MongoDB connection error: ${err.message}`)
    process.exit(1)
  }
}

module.exports = connectDB
