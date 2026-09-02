import multer from 'multer';
import { AppError } from '../utils/errors.js';

// Setup multer memory storage (stores file in memory buffer)
const storage = multer.memoryStorage();

// File size limit: 10MB
const limits = {
  fileSize: 10 * 1024 * 1024, // 10MB
};

// Allowed file types
const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = [
    'image/jpeg',
    'image/png',
    'image/webp',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // docx
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // xlsx
    'text/plain',
    'text/csv',
  ];

  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new AppError('Invalid file type. Only images, PDFs, Word, Excel, CSV, and text files are allowed.', 400), false);
  }
};

export const uploadMiddleware = multer({
  storage,
  limits,
  fileFilter,
});
