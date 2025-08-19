const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

// Configurar Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Configuración de storage para hoteles
const hotelStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'turismo-app/hoteles',
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
    transformation: [
      { width: 800, height: 600, crop: 'limit' },
      { quality: 'auto' }
    ]
  }
});

// Configuración de storage para cabañas
const cabanaStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'turismo-app/cabanas',
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
    transformation: [
      { width: 800, height: 600, crop: 'limit' },
      { quality: 'auto' }
    ]
  }
});

// Configuración de storage para airbnb
const airbnbStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'turismo-app/airbnb',
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
    transformation: [
      { width: 800, height: 600, crop: 'limit' },
      { quality: 'auto' }
    ]
  }
});

module.exports = {
  cloudinary,
  hotelStorage,
  cabanaStorage,
  airbnbStorage
};