import documentService from './document.service.js';
import { uploadToCloudinary } from '../../utils/cloudinary.js';

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
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No file uploaded' });
    }

    const folder = req.body.folder || 'wholesale_docs';
    const uploadResult = await uploadToCloudinary(req.file.buffer, folder);

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
    next(error);
  }
};

