const cloudinary = require('cloudinary').v2;

const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } = process.env;

const ensureCloudinaryConfig = () => {
  if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
    throw new Error('Thiếu cấu hình Cloudinary. Vui lòng set CLOUDINARY_CLOUD_NAME/API_KEY/API_SECRET');
  }
};

const configureCloudinary = () => {
  ensureCloudinaryConfig();
  cloudinary.config({
    cloud_name: CLOUDINARY_CLOUD_NAME,
    api_key: CLOUDINARY_API_KEY,
    api_secret: CLOUDINARY_API_SECRET,
  });
};

module.exports = {
  cloudinary,
  ensureCloudinaryConfig,
  configureCloudinary,
};
