const cloudinary = require('../config/cloudinary');

const uploadImage = async (req, res) => {
  try {
    console.log('=== UPLOAD REQUEST ===');
    console.log('User:', req.user?._id, req.user?.role);
    console.log('Body keys:', Object.keys(req.body));
    console.log('Image data present:', !!req.body.image);
    console.log('Image data size (chars):', req.body.image?.length || 0);

    if (!req.body.image) {
      return res.status(400).json({
        success: false,
        message: 'No image data provided',
      });
    }

    // Check if it's a valid base64 data URL
    if (!req.body.image.startsWith('data:image/')) {
      return res.status(400).json({
        success: false,
        message: 'Invalid image format. Must be a base64 data URL.',
      });
    }

    console.log('Uploading to Cloudinary...');

    const result = await cloudinary.uploader.upload(req.body.image, {
      folder: 'elbermarket/products',
      resource_type: 'image',
      transformation: [
        { width: 1000, height: 1000, crop: 'limit' },
        { quality: 'auto:good' },
      ],
    });

    console.log('Cloudinary upload success:', result.secure_url);

    res.status(200).json({
      success: true,
      data: {
        url: result.secure_url,
        publicId: result.public_id,
      },
    });
  } catch (error) {
    console.error('=== UPLOAD ERROR ===');
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error details:', JSON.stringify(error, null, 2));

    res.status(500).json({
      success: false,
      message: 'Upload failed: ' + error.message,
      errorName: error.name,
    });
  }
};

const deleteImage = async (req, res) => {
  try {
    const { publicId } = req.params;

    if (!publicId) {
      return res.status(400).json({ success: false, message: 'Public ID required' });
    }

    const decodedPublicId = decodeURIComponent(publicId);

    console.log('Deleting image:', decodedPublicId);

    const result = await cloudinary.uploader.destroy(decodedPublicId);

    console.log('Delete result:', result);

    res.status(200).json({
      success: true,
      message: 'Image deleted',
      result,
    });
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({
      success: false,
      message: 'Delete failed: ' + error.message,
    });
  }
};

module.exports = { uploadImage, deleteImage };





































// const cloudinary = require('../config/cloudinary');

// // @desc    Upload image to Cloudinary
// // @route   POST /api/upload
// // @access  Private
// const uploadImage = async (req, res) => {
//   try {
//     if (!req.body.image) {
//       return res.status(400).json({ success: false, message: 'Image data is required' });
//     }

//     const result = await cloudinary.uploader.upload(req.body.image, {
//       folder: 'elbermarket/products',
//       transformation: [
//         { width: 800, height: 800, crop: 'limit' },
//         { quality: 'auto', fetch_format: 'auto' },
//       ],
//     });

//     res.status(200).json({
//       success: true,
//       data: {
//         url: result.secure_url,
//         publicId: result.public_id,
//       },
//     });
//   } catch (error) {
//     console.error('Upload error:', error);
//     res.status(500).json({ success: false, message: 'Upload failed: ' + error.message });
//   }
// };

// // @desc    Delete image from Cloudinary
// // @route   DELETE /api/upload/:publicId
// // @access  Private
// const deleteImage = async (req, res) => {
//   try {
//     await cloudinary.uploader.destroy(req.params.publicId);
//     res.status(200).json({ success: true, message: 'Image deleted' });
//   } catch (error) {
//     res.status(500).json({ success: false, message: error.message });
//   }
// };

// module.exports = { uploadImage, deleteImage };