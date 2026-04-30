require('dotenv').config()
const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')

const User = require('../models/User')
const { Wallet, ProviderProfile } = require('../models/index')
const { Restaurant } = require('../models/Food')
const { Service } = require('../models/Service')
const { Product } = require('../models/Marketplace')

const connectDB = require('../config/db')

const seed = async () => {
  await connectDB()
  console.log('🌱 Seeding database...')

  // ── Clear existing data ──────────────────────────────
  await Promise.all([
    User.deleteMany({}),
    Wallet.deleteMany({}),
    ProviderProfile.deleteMany({}),
    Restaurant.deleteMany({}),
    Service.deleteMany({}),
    Product.deleteMany({}),
  ])
  console.log('🗑️  Cleared existing data')

  // ── Admin user ───────────────────────────────────────
  const admin = await User.create({
    first_name: 'Admin',
    last_name: 'HudumaLink',
    email: 'admin@hudumalink.co.ke',
    phone: '+254700000001',
    password: 'Admin@1234',
    role: 'admin',
    is_verified: true,
    referral_code: 'ADMIN001',
  })
  await Wallet.create({ user: admin._id, balance: 0 })
  console.log('✅ Admin created — email: admin@hudumalink.co.ke | password: Admin@1234')

  // ── Sample customers ─────────────────────────────────
  const customers = await User.insertMany([
    {
      first_name: 'John',
      last_name: 'Kamau',
      email: 'john@example.com',
      phone: '+254712000001',
      password: await bcrypt.hash('Test@1234', 12),
      role: 'customer',
      referral_code: 'JOHN2024',
    },
    {
      first_name: 'Grace',
      last_name: 'Wanjiru',
      email: 'grace@example.com',
      phone: '+254712000002',
      password: await bcrypt.hash('Test@1234', 12),
      role: 'customer',
      referral_code: 'GRACE24',
    },
  ])
  for (const c of customers) await Wallet.create({ user: c._id, balance: 1500 })
  console.log(`✅ ${customers.length} customers created — password: Test@1234`)

  // ── Sample providers ─────────────────────────────────
  const providerData = [
    {
      first_name: 'Peter',
      last_name: 'Mwangi',
      email: 'peter@example.com',
      phone: '+254712000010',
      service_type: 'Electrician',
      experience_years: 7,
      bio: 'Certified electrician with 7 years of experience in Nyeri. Specializes in residential wiring and solar installation.',
    },
    {
      first_name: 'Mary',
      last_name: 'Njeri',
      email: 'mary@example.com',
      phone: '+254712000011',
      service_type: 'Hair Stylist',
      experience_years: 5,
      bio: 'Professional hair stylist offering braiding, relaxing, and natural hair care. Mobile service available.',
    },
    {
      first_name: 'James',
      last_name: 'Gitau',
      email: 'james@example.com',
      phone: '+254712000012',
      service_type: 'Plumber',
      experience_years: 10,
      bio: 'Expert plumber for residential and commercial projects. Available 24/7 for emergencies in Nyeri Town.',
    },
    {
      first_name: 'Alice',
      last_name: 'Wairimu',
      email: 'alice@example.com',
      phone: '+254712000013',
      service_type: 'House Cleaner',
      experience_years: 3,
      bio: 'Thorough and trustworthy house cleaner. I bring my own supplies and always leave your home sparkling.',
    },
    {
      first_name: 'David',
      last_name: 'Kariuki',
      email: 'david@example.com',
      phone: '+254712000014',
      service_type: 'Private Tutor',
      experience_years: 6,
      bio: 'Mathematics and Science tutor for Form 1–4 students. Proven track record of improving grades.',
    },
    {
      first_name: 'Samuel',
      last_name: 'Maina',
      email: 'samuel@example.com',
      phone: '+254712000015',
      service_type: 'Cobbler',
      experience_years: 8,
      bio: 'Experienced cobbler offering shoe repair, sole replacement, leather restoration, polishing, and bag repairs around Nyeri.',
    },
  ]

  for (const pd of providerData) {
    const user = await User.create({
      first_name: pd.first_name,
      last_name: pd.last_name,
      email: pd.email,
      phone: pd.phone,
      password: await bcrypt.hash('Test@1234', 12),
      role: 'provider',
      is_verified: true,
      referral_code: `${pd.first_name.toUpperCase()}${Math.floor(Math.random() * 9000 + 1000)}`,
    })
    await Wallet.create({ user: user._id, balance: 3200 })
    await ProviderProfile.create({
      user: user._id,
      service_type: pd.service_type,
      experience_years: pd.experience_years,
      bio: pd.bio,
      location: 'Nyeri Town',
      verification_status: 'approved',
      submitted_at: new Date(Date.now() - 7 * 24 * 3600 * 1000),
      approved_at: new Date(),
      average_rating: (Math.random() * 1.5 + 3.5).toFixed(1),
      reviews_count: Math.floor(Math.random() * 40 + 5),
      completed_jobs: Math.floor(Math.random() * 80 + 10),
    })
  }
  console.log(`✅ ${providerData.length} providers created — password: Test@1234`)

  // ── Delivery driver ───────────────────────────────────
  const driver = await User.create({
    first_name: 'Brian',
    last_name: 'Otieno',
    email: 'driver@example.com',
    phone: '+254712000020',
    password: await bcrypt.hash('Test@1234', 12),
    role: 'delivery_driver',
    referral_code: 'BRIAN24',
  })
  await Wallet.create({ user: driver._id, balance: 800 })
  const { DriverProfile } = require('../models/Delivery')
  await DriverProfile.create({
    user: driver._id,
    vehicle_type: 'motorcycle',
    vehicle_registration: 'KCB 123A',
    service_area: 'Nyeri Town',
    is_approved: true,
    is_available: true,
    rating: 4.7,
    total_deliveries: 142,
    emergency_contact_name: 'Jane Otieno',
    emergency_contact_phone: '+254712000021',
  })
  console.log('✅ Driver created — email: driver@example.com | password: Test@1234')

  // ── Restaurants ───────────────────────────────────────
  const restaurants = await Restaurant.insertMany([
    {
      owner: admin._id,
      name: 'Nyeri Grill House',
      description: 'Best nyama choma and grills in Nyeri Town. Family-friendly atmosphere.',
      cuisine: 'Kenyan BBQ',
      location: 'Nyeri Town',
      address: 'Kimathi Way, Nyeri Town',
      phone: '+254712100001',
      is_open: true,
      delivery_time: 25,
      minimum_order: 200,
      rating: 4.6,
      reviews_count: 89,
      menu: [
        { name: 'Nyama Choma (500g)', description: 'Perfectly grilled goat meat with kachumbari', price: 650, category: 'Grills' },
        { name: 'Chicken Quarter', description: 'Grilled chicken with ugali and greens', price: 380, category: 'Grills' },
        { name: 'Ugali & Sukuma Wiki', description: 'Classic Kenyan meal', price: 120, category: 'Sides' },
        { name: 'Chapati (2 pcs)', description: 'Soft homemade chapati', price: 60, category: 'Sides' },
        { name: 'Soda (500ml)', description: 'Coke, Fanta or Sprite', price: 80, category: 'Drinks' },
        { name: 'Fresh Juice', description: 'Mango, passion or mix', price: 120, category: 'Drinks' },
      ],
    },
    {
      owner: admin._id,
      name: 'Mama Pima Kitchen',
      description: 'Authentic home-style Kenyan food. We cook like your mama would!',
      cuisine: 'Kenyan Home Cooking',
      location: 'Karatina',
      address: 'Market Road, Karatina',
      phone: '+254712100002',
      is_open: true,
      delivery_time: 35,
      minimum_order: 150,
      rating: 4.8,
      reviews_count: 134,
      menu: [
        { name: 'Githeri Special', description: 'Maize and beans with vegetables', price: 100, category: 'Main' },
        { name: 'Mukimo', description: 'Traditional Kikuyu dish with potatoes and greens', price: 130, category: 'Main' },
        { name: 'Beef Stew & Ugali', description: 'Rich beef stew served with ugali', price: 200, category: 'Main' },
        { name: 'Matoke with Groundnuts', description: 'Steamed bananas with groundnut sauce', price: 150, category: 'Main' },
        { name: 'Chai Maziwa', description: 'Strong milk tea', price: 50, category: 'Drinks' },
        { name: 'Mandazi (3 pcs)', description: 'Freshly fried doughnuts', price: 60, category: 'Snacks' },
      ],
    },
    {
      owner: admin._id,
      name: 'Pizza Palace Nyeri',
      description: 'Stone-baked pizzas and fast food. Perfect for the whole family.',
      cuisine: 'Pizza & Fast Food',
      location: 'Nyeri Town',
      address: 'Shopping Centre, Nyeri Town',
      phone: '+254712100003',
      is_open: true,
      delivery_time: 40,
      minimum_order: 400,
      rating: 4.3,
      reviews_count: 56,
      menu: [
        { name: 'Margherita Pizza (Small)', description: 'Classic tomato and mozzarella', price: 450, category: 'Pizza' },
        { name: 'Pepperoni Pizza (Small)', description: 'Pepperoni with extra cheese', price: 550, category: 'Pizza' },
        { name: 'Chicken Pizza (Medium)', description: 'Grilled chicken, peppers and mushrooms', price: 750, category: 'Pizza' },
        { name: 'Chips & Chicken', description: 'Crispy chips with fried chicken', price: 320, category: 'Fast Food' },
        { name: 'Beef Burger', description: 'Juicy beef patty with lettuce and tomato', price: 380, category: 'Fast Food' },
        { name: 'Milkshake', description: 'Chocolate, vanilla or strawberry', price: 200, category: 'Drinks' },
      ],
    },
    {
      owner: admin._id,
      name: 'Café Arabica',
      description: 'Premium coffee from the slopes of Mt. Kenya. Pastries and light meals.',
      cuisine: 'Coffee & Café',
      location: 'Nyeri Town',
      address: 'White Rhino Hotel Area, Nyeri',
      phone: '+254712100004',
      is_open: true,
      delivery_time: 20,
      minimum_order: 200,
      rating: 4.9,
      reviews_count: 203,
      menu: [
        { name: 'Americano', description: 'Rich single-origin Kenyan coffee', price: 180, category: 'Coffee' },
        { name: 'Cappuccino', description: 'Espresso with steamed milk foam', price: 220, category: 'Coffee' },
        { name: 'Cold Brew Coffee', description: '24-hour cold brew, served over ice', price: 260, category: 'Coffee' },
        { name: 'Blueberry Muffin', description: 'Freshly baked daily', price: 150, category: 'Pastries' },
        { name: 'Avocado Toast', description: 'Sourdough toast with avocado and egg', price: 320, category: 'Light Meals' },
        { name: 'Club Sandwich', description: 'Triple-decker with chicken and bacon', price: 420, category: 'Light Meals' },
      ],
    },
  ])
  console.log(`✅ ${restaurants.length} restaurants created with full menus`)

  // ── Services ──────────────────────────────────────────
  const providerUsers = await User.find({ role: 'provider' })
  const serviceData = [
    { title: 'Home Electrical Wiring & Repairs', category: 'electrical', category_name: 'Electrical', price_from: 500, description: 'Professional electrical work including installation, repairs, and safety inspections.', location: 'Nyeri Town' },
    { title: 'Solar Panel Installation', category: 'electrical', category_name: 'Electrical', price_from: 15000, description: 'Full solar system installation for homes and businesses in Nyeri County.', location: 'Nyeri Town' },
    { title: 'Plumbing Services — Pipe Repair & Fitting', category: 'plumbing', category_name: 'Plumbing', price_from: 300, description: 'Experienced plumber for burst pipes, leak repairs, bathroom fitting and more.', location: 'Nyeri Town' },
    { title: 'House Cleaning Service', category: 'cleaning', category_name: 'Cleaning', price_from: 800, description: 'Deep cleaning for apartments, bungalows and offices. All supplies included.', location: 'Nyeri Town' },
    { title: 'Hair Braiding & Styling', category: 'beauty', category_name: 'Beauty & Hair', price_from: 300, description: 'Expert braiding, weaving and natural hair styling. Home visits available.', location: 'Nyeri Town' },
    { title: 'KCSE Mathematics Tutor', category: 'tutoring', category_name: 'Tutoring', price_from: 500, description: 'Form 1–4 maths and sciences. Evening and weekend classes. Proven results.', location: 'Nyeri Town' },
    { title: 'Furniture Repair & Carpentry', category: 'carpentry', category_name: 'Carpentry', price_from: 400, description: 'Custom furniture making and repair services. Quality craftsmanship guaranteed.', location: 'Karatina' },
    { title: 'House Painting — Interior & Exterior', category: 'painting', category_name: 'Painting', price_from: 2000, description: 'Professional painters for all types of surfaces. Quality materials used.', location: 'Nyeri Town' },
    { title: 'Shoe Repair & Leather Restoration', category: 'cobbler', category_name: 'Cobbler', price_from: 250, description: 'Reliable cobbler for sole replacement, stitching, polishing, zip fixes, and general shoe or bag repair.', location: 'Nyeri Town' },
  ]
  for (let i = 0; i < serviceData.length; i++) {
    const provider = providerUsers[i % providerUsers.length]
    await Service.create({ ...serviceData[i], provider: provider._id })
  }
  console.log(`✅ ${serviceData.length} services created`)

  // ── Marketplace products ───────────────────────────────
  const productData = [
    { title: 'Samsung Galaxy A52 — 128GB', description: 'Used for 6 months, excellent condition. Comes with original charger and box.', category: 'phones', category_name: 'Phones & Accessories', price: 18000, condition: 'like_new', location: 'Nyeri Town' },
    { title: 'HP Laptop 15" — Intel i5', description: 'Core i5 8th gen, 8GB RAM, 256GB SSD. Great for students and professionals.', category: 'electronics', category_name: 'Electronics', price: 32000, condition: 'good', location: 'Nyeri Town' },
    { title: 'Sofa Set — 3+1+1', description: 'Brown leather sofa set, slightly used, very comfortable. Selling because relocating.', category: 'furniture', category_name: 'Furniture & Home', price: 25000, condition: 'good', location: 'Karatina' },
    { title: 'KCSE Past Papers — All Subjects', description: '2010–2023 past papers with marking schemes. Perfect for revision.', category: 'books', category_name: 'Books & Education', price: 500, condition: 'new', location: 'Nyeri Town' },
    { title: 'Fresh Farm Potatoes — 50kg', description: 'Clean Shangi potatoes from Nyeri farms. Wholesale price.', category: 'farm', category_name: 'Farm Produce', price: 1800, condition: 'new', location: 'Othaya' },
    { title: 'Toyota Premio — 2010', description: 'KCB registered, accident-free, well maintained. Mileage: 89,000km.', category: 'vehicles', category_name: 'Vehicles & Parts', price: 850000, condition: 'good', location: 'Nyeri Town' },
    { title: 'School Uniform — Alliance High', description: 'Complete uniform set, Form 1 size. Barely used.', category: 'clothing', category_name: 'Clothing & Fashion', price: 2500, condition: 'like_new', location: 'Nyeri Town' },
    { title: 'LG 32" Smart TV', description: 'Full HD Smart TV, works perfectly. Selling because upgrading to bigger screen.', category: 'electronics', category_name: 'Electronics', price: 15000, condition: 'good', location: 'Nyeri Town' },
  ]
  for (let i = 0; i < productData.length; i++) {
    const seller = customers[i % customers.length]
    await Product.create({ ...productData[i], seller: seller._id })
  }
  console.log(`✅ ${productData.length} marketplace products created`)

  console.log('\n✨ Seeding complete!\n')
  console.log('─── Login credentials ───────────────────────────────')
  console.log('Admin:    admin@hudumalink.co.ke   |  Admin@1234')
  console.log('Customer: john@example.com         |  Test@1234')
  console.log('Provider: peter@example.com        |  Test@1234')
  console.log('Driver:   driver@example.com       |  Test@1234')
  console.log('─────────────────────────────────────────────────────\n')

  await mongoose.disconnect()
  process.exit(0)
}

seed().catch(err => {
  console.error('❌ Seed failed:', err)
  process.exit(1)
})
