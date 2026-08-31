import { v2 as cloudinary } from 'cloudinary';
import { env } from '../utils/env.js';
import { logger } from '../utils/logger.js';

if (!env.CLOUDINARY_CLOUD_NAME || !env.CLOUDINARY_API_KEY || !env.CLOUDINARY_API_SECRET) {
  logger.warn('Cloudinary environment variables are missing. File uploads to Cloudinary will fail.');
} else {
  cloudinary.config({
    cloud_name: env.CLOUDINARY_CLOUD_NAME,
    api_key: env.CLOUDINARY_API_KEY,
    api_secret: env.CLOUDINARY_API_SECRET,
    secure: true,
  });
}

export default cloudinary;
