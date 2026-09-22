const cloudinary = require('../config/cloudinary');

// @desc    Upload image to Cloudinary
// @route   POST /api/upload
// @access  Private
const uploadImage = async (req, res) => {
  try {
    if (!req.body.image) {
      return res.status(400).json({ success: false, message: 'Image data is required' });
    }

    const result = await cloudinary.uploader.upload(req.body.image, {
      folder: 'elbermarket/products',
      transformation: [
        { width: 800, height: 800, crop: 'limit' },
        { quality: 'auto', fetch_format: 'auto' },
      ],
    });

    res.status(200).json({
      success: true,
      data: {
        url: result.secure_url,
        publicId: result.public_id,
      },
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ success: false, message: 'Upload failed: ' + error.message });
  }
};

// @desc    Delete image from Cloudinary
// @route   DELETE /api/upload/:publicId
// @access  Private
const deleteImage = async (req, res) => {
  try {
    await cloudinary.uploader.destroy(req.params.publicId);
    res.status(200).json({ success: true, message: 'Image deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { uploadImage, deleteImage };