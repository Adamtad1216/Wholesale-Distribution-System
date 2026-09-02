import documentService from './document.service.js';
import { uploadToCloudinary } from '../../utils/cloudinary.js';
import logger from '../../utils/logger.js';
import { logAudit } from '../../middleware/audit.middleware.js';

export const createDocumentType = async (req, res, next) => {
  try {
    const docType = await documentService.createDocumentType(req.body, req.user?.id);
    res.status(201).json({ success: true, data: docType });
  } catch (error) {
    next(error);
  }
};

export const getDocumentTypes = async (req, res, next) => {
  try {
    const docTypes = await documentService.getDocumentTypes();
    res.status(200).json({ success: true, data: docTypes });
  } catch (error) {
    next(error);
  }
};

export const createDocument = async (req, res, next) => {
  try {
    const document = await documentService.createDocument(req.body, req.user?.id);
    res.status(201).json({ success: true, data: document });
  } catch (error) {
    next(error);
  }
};

export const updateDocumentStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const document = await documentService.updateDocumentStatus(req.params.id, status, req.user?.id);
    res.status(200).json({ success: true, data: document });
  } catch (error) {
    next(error);
  }
};

export const uploadDocumentFile = async (req, res, next) => {
  const userId = req.user?.id;

  try {
    if (!req.file) {
      logger.warn('[File Upload Warning] Request received with no file attached');

      await logAudit({
        createdById: userId,
        userId,
        action: 'DOCUMENT_UPLOAD_FAILED',
        entityType: 'Document',
        entityId: '00000000-0000-0000-0000-000000000000',
        newValues: { reason: 'No file attached in request' },
        req,
      });

      return res.status(400).json({ success: false, error: 'No file uploaded' });
    }

    const folder = req.body.folder || 'wholesale_docs';
    logger.info(`[File Upload] Processing file "${req.file.originalname}" (${req.file.size} bytes) for user ${userId || 'anonymous'} into folder "${folder}"`);

    const uploadResult = await uploadToCloudinary(req.file.buffer, folder);

    await logAudit({
      createdById: userId,
      userId,
      action: 'DOCUMENT_UPLOADED',
      entityType: 'Document',
      entityId: '00000000-0000-0000-0000-000000000000',
      newValues: {
        fileName: req.file.originalname,
        fileType: req.file.mimetype,
        fileSize: req.file.size,
        folder,
        publicId: uploadResult.public_id,
      },
      req,
    });

    res.status(200).json({
      success: true,
      data: {
        fileUrl: uploadResult.secure_url,
        fileName: req.file.originalname,
        fileType: req.file.mimetype,
        fileSize: req.file.size,
        publicId: uploadResult.public_id,
      },
    });
  } catch (error) {
    logger.error({ error, stack: error.stack, userId }, `[File Upload Error] Upload failed: ${error.message}`);

    await logAudit({
      createdById: userId,
      userId,
      action: 'DOCUMENT_UPLOAD_FAILED',
      entityType: 'Document',
      entityId: '00000000-0000-0000-0000-000000000000',
      newValues: {
        reason: error.message || 'Unknown upload error',
        fileName: req.file?.originalname,
      },
      req,
    });

    next(error);
  }
};
