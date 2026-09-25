const cloudinary = require('cloudinary').v2;

// Log what we have at startup
console.log('Cloudinary config check:');
console.log('  CLOUD_NAME:', process.env.CLOUD_NAME ? '✓ set' : '✗ MISSING');
console.log('  CLOUDINARY_API_KEY:', process.env.CLOUDINARY_API_KEY ? '✓ set' : '✗ MISSING');
console.log('  CLOUDINARY_API_SECRET:', process.env.CLOUDINARY_API_SECRET ? '✓ set' : '✗ MISSING');

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

module.exports = cloudinary;






























// const cloudinary = require('cloudinary').v2;

// cloudinary.config({
//   cloud_name: process.env.CLOUD_NAME || 'doafhhofv',
//   api_key: process.env.CLOUDINARY_API_KEY || '133759783449495',
//   api_secret: process.env.CLOUDINARY_API_SECRET || '6ElGFDsMy4We3m_LGT0Uc4iYctM',
// });

// module.exports = cloudinary;