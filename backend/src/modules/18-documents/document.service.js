import prisma from '../../config/prisma.js';

class DocumentService {
  async createDocumentType(data, createdById) {
    return await prisma.documentType.create({
      data: { ...data, createdById }
    });
  }

  async getDocumentTypes() {
    return await prisma.documentType.findMany();
  }

  async createDocument(data, createdById) {
    return await prisma.document.create({
      data: { ...data, createdById },
      include: { documentType: true }
    });
  }

  async updateDocumentStatus(id, status, updatedById) {
    return await prisma.document.update({
      where: { id },
      data: { status, updatedById }
    });
  }
}

export default new DocumentService();
