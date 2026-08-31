import cloudinary from '../config/cloudinary.js';
import { AppError } from './errors.js';

/**
 * Uploads a file buffer to Cloudinary using a stream.
 * @param {Buffer} fileBuffer - The file buffer from multer memory storage
 * @param {string} folder - Target folder in Cloudinary
 * @returns {Promise<object>} The Cloudinary upload result
 */
export function uploadToCloudinary(fileBuffer, folder = 'wholesale_docs') {
  return new Promise((resolve, reject) => {
    if (!fileBuffer) {
      return reject(new AppError('No file buffer provided', 400));
    }

    if (!cloudinary.config().cloud_name) {
      return reject(new AppError('Cloudinary is not configured on this server.', 500));
    }

    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: 'auto',
      },
      (error, result) => {
        if (error) {
          return reject(new AppError(`Cloudinary upload failed: ${error.message}`, 500));
        }
        resolve(result);
      }
    );

    uploadStream.end(fileBuffer);
  });
}
