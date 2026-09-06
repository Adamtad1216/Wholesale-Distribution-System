import prisma from '../../config/prisma.js';

class DocumentService {
  async createDocumentType(data, createdById) {
    let code = data.code;
    if (!code || !code.trim()) {
      const baseCode = (data.name || 'DOC_CAT')
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, '_')
        .replace(/_+/g, '_')
        .replace(/^_+|_+$/g, '') || 'DOC_CAT';

      let uniqueCode = baseCode;
      let counter = 1;
      while (await prisma.documentType.findUnique({ where: { code: uniqueCode } })) {
        uniqueCode = `${baseCode}_${counter++}`;
      }
      code = uniqueCode;
    }

    return await prisma.documentType.create({
      data: { ...data, code, createdById }
    });
  }

  async getDocumentTypes() {
    if (!prisma.documentType) return [];
    try {
      return await prisma.documentType.findMany({
        include: {
          _count: {
            select: { documents: true }
          }
        },
        orderBy: { name: 'asc' }
      });
    } catch (e) {
      return [];
    }
  }

  async getDocuments(filters = {}) {
    const { entityType, entityId, status, documentTypeId } = filters;
    const where = {};
    if (entityType) where.entityType = entityType;
    if (entityId) where.entityId = entityId;
    if (status) where.status = status;
    if (documentTypeId) where.documentTypeId = documentTypeId;

    if (!prisma.document) return [];

    return await prisma.document.findMany({
      where,
      include: {
        documentType: true,
        createdBy: {
          select: {
            id: true,
            username: true,
            email: true,
            person: { select: { firstName: true, lastName: true } }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async deleteDocument(id) {
    return await prisma.document.delete({
      where: { id }
    });
  }
}

export default new DocumentService();
