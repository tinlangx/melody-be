const express = require('express');
const { requireAuth, requireRole } = require('../middleware/auth');
const { cloudinary, ensureCloudinaryConfig } = require('../utils/cloudinary');

const router = express.Router();

// Cho phép Admin/Artist lấy signature để upload trực tiếp lên Cloudinary
router.post('/uploads/signature', requireAuth, requireRole(['ADMIN', 'ARTIST']), (req, res) => {
  try {
    ensureCloudinaryConfig();
    const folder = (req.body && req.body.folder) || 'melody-media/audio';
    const resource_type = (req.body && req.body.resource_type) || 'auto';
    const timestamp = Math.floor(Date.now() / 1000);

    // Chỉ ký các tham số cần thiết; client dùng để upload trực tiếp
    const signature = cloudinary.utils.api_sign_request({ timestamp, folder }, process.env.CLOUDINARY_API_SECRET);

    return res.json({
      cloudName: process.env.CLOUDINARY_CLOUD_NAME,
      apiKey: process.env.CLOUDINARY_API_KEY,
      signature,
      timestamp,
      folder,
      resource_type,
    });
  } catch (err) {
    console.error('Signature error:', err);
    return res.status(500).json({ message: 'Không tạo được chữ ký upload Cloudinary.' });
  }
});

module.exports = router;
