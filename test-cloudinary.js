require('dotenv').config();
const cloudinary = require('cloudinary').v2;

console.log('Testing with:');
console.log('  Cloud name:', process.env.CLOUD_NAME);
console.log('  API Key:', process.env.CLOUDINARY_API_KEY);
console.log('  Secret length:', process.env.CLOUDINARY_API_SECRET?.length);

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
  timeout: 60000, // 60 second timeout
});

const testImage = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

cloudinary.uploader.upload(testImage, {
  folder: 'test',
})
  .then(result => {
    console.log('✓ SUCCESS:', result.secure_url);
    process.exit(0);
  })
  .catch(error => {
    console.error('✗ FAILED');
    console.error(JSON.stringify(error, null, 2));
    process.exit(1);
  });























// require('dotenv').config();
// const cloudinary = require('cloudinary').v2;

// console.log('Testing with:');
// console.log('  Cloud name:', process.env.CLOUD_NAME);
// console.log('  API Key:', process.env.CLOUDINARY_API_KEY);
// console.log('  Secret length:', process.env.CLOUDINARY_API_SECRET?.length);
// console.log('  Secret preview:', process.env.CLOUDINARY_API_SECRET?.substring(0, 4) + '...');

// cloudinary.config({
//   cloud_name: process.env.CLOUD_NAME,
//   api_key: process.env.CLOUDINARY_API_KEY,
//   api_secret: process.env.CLOUDINARY_API_SECRET,
//   secure: true,
// });

// // Try to upload a tiny base64 image
// const testImage = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

// cloudinary.uploader.upload(testImage, {
//   folder: 'test',
// })
//   .then(result => {
//     console.log('✓ SUCCESS:', result.secure_url);
//     process.exit(0);
//   })
//   .catch(error => {
//     console.error('✗ FAILED');
//     console.error('  Name:', error.name);
//     console.error('  Message:', error.message);
//     console.error('  HTTP Code:', error.http_code);
//     console.error('  Full error:', JSON.stringify(error, null, 2));
//     process.exit(1);
//   });