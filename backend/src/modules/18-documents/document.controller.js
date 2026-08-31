import documentService from './document.service.js';

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
