const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME || 'doafhhofv',
  api_key: process.env.CLOUDINARY_API_KEY || '133759783449495',
  api_secret: process.env.CLOUDINARY_API_SECRET || '6ElGFDsMy4We3m_LGT0Uc4iYctM',
});

module.exports = cloudinary;