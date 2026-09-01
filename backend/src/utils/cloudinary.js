import cloudinary from '../config/cloudinary.js';
import { AppError } from './errors.js';
import logger from './logger.js';

/**
 * Uploads a file buffer to Cloudinary using a stream.
 * Automatically organizes files under the `whole_Sale` root folder:
 * - Profile pictures -> `whole_Sale/Profile`
 * - Other documents  -> `whole_Sale/<folder>`
 *
 * @param {Buffer} fileBuffer - The file buffer from multer memory storage
 * @param {string} folder - Target subfolder (e.g., 'Profile', 'Invoices', 'Documents')
 * @returns {Promise<object>} The Cloudinary upload result
 */
export function uploadToCloudinary(fileBuffer, folder = 'Documents') {
  return new Promise((resolve, reject) => {
    if (!fileBuffer) {
      logger.error('[Cloudinary Upload Error] No file buffer provided');
      return reject(new AppError('No file buffer provided', 400));
    }

    if (!cloudinary.config().cloud_name) {
      logger.error('[Cloudinary Upload Error] Cloudinary configuration missing');
      return reject(new AppError('Cloudinary is not configured on this server.', 500));
    }

    // Determine subfolder and build full Cloudinary folder path under 'whole_Sale'
    let subFolder = folder.trim();
    if (['avatars', 'avatar', 'profile', 'user_profile'].includes(subFolder.toLowerCase())) {
      subFolder = 'Profile';
    }

    const fullFolderPath = subFolder.startsWith('whole_Sale')
      ? subFolder
      : `whole_Sale/${subFolder}`;

    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: fullFolderPath,
        resource_type: 'auto',
      },
      (error, result) => {
        if (error) {
          logger.error({ err: error }, `[Cloudinary Upload Failed] Folder: "${fullFolderPath}" - Error: ${error.message}`);
          return reject(new AppError(`Cloudinary upload failed: ${error.message}`, 500));
        }
        logger.info({ publicId: result.public_id, url: result.secure_url }, `[Cloudinary Upload Success] Folder: "${fullFolderPath}"`);
        resolve(result);
      }
    );

    uploadStream.end(fileBuffer);
  });
}
