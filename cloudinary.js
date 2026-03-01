// lib/cloudinary.js — Cloudinary v2 helper
// Free tier: 25 GB storage, 25 GB bandwidth/month
const cloudinary = require('cloudinary').v2;

function getCld() {
  cloudinary.config({
    cloud_name : process.env.CLOUDINARY_CLOUD_NAME,
    api_key    : process.env.CLOUDINARY_API_KEY,
    api_secret : process.env.CLOUDINARY_API_SECRET,
    secure     : true
  });
  return cloudinary;
}

/**
 * Upload a local file path to Cloudinary.
 * Returns the secure_url and public_id.
 */
async function uploadToCloudinary(filePath, category) {
  const cld = getCld();
  const result = await cld.uploader.upload(filePath, {
    folder        : `shayari-gallery/${category}`,
    resource_type : 'image',
    transformation: [
      { quality: 'auto:good', fetch_format: 'auto' },
      { width: 1400, crop: 'limit' }
    ]
  });
  return {
    url      : result.secure_url,
    publicId : result.public_id,
    width    : result.width,
    height   : result.height,
    bytes    : result.bytes,
    format   : result.format
  };
}

/** Delete an image from Cloudinary by public_id */
async function deleteFromCloudinary(publicId) {
  const cld = getCld();
  return cld.uploader.destroy(publicId);
}

module.exports = { uploadToCloudinary, deleteFromCloudinary };
