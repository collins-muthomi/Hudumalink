const cloudinary = require('cloudinary').v2
const CloudinaryStorage = require('multer-storage-cloudinary')
const multer = require('multer')

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

const makeStorage = (folder) => {
  // Check if Cloudinary is configured
  if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
    // Fallback to local storage if Cloudinary not configured
    return multer.diskStorage({
      destination: (req, file, cb) => cb(null, 'uploads/'),
      filename: (req, file, cb) => {
        const ext = file.originalname.split('.').pop()
        cb(null, `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`)
      },
    })
  }

  return new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
      folder: `hudumalink/${folder}`,
      allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'pdf'],
      transformation: [{ width: 1200, crop: 'limit', quality: 'auto' }],
    },
  })
}

const upload = (folder = 'general') =>
  multer({
    storage: makeStorage(folder),
    limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
    fileFilter: (req, file, cb) => {
      const allowed = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
      if (allowed.includes(file.mimetype)) cb(null, true)
      else cb(new Error('Invalid file type. Only JPG, PNG, WEBP, PDF allowed.'))
    },
  })

module.exports = { cloudinary, upload }
