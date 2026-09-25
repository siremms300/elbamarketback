const express = require('express');
const router = express.Router();
const { uploadImage, deleteImage } = require('../controllers/uploadController');
const { protect } = require('../middleware/auth');

// POST /api/upload — upload an image
router.post('/', protect, uploadImage);

// DELETE /api/upload/:publicId — delete an image
// publicId may contain slashes (elbermarket/products/xyz), so use a wildcard
router.delete('/*publicId', protect, deleteImage);

module.exports = router;





































// const express = require('express');
// const router = express.Router();
// const { uploadImage, deleteImage } = require('../controllers/uploadController');
// const { protect } = require('../middleware/auth');

// router.post('/', protect, uploadImage);
// router.delete('/:publicId', protect, deleteImage);

// module.exports = router;