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
    return await prisma.documentType.findMany({
      include: {
        _count: {
          select: { documents: true }
        }
      },
      orderBy: { name: 'asc' }
    });
  }

  async getDocuments(filters = {}) {
    const { entityType, entityId, status, documentTypeId } = filters;
    const where = {};
    if (entityType) where.entityType = entityType;
    if (entityId) where.entityId = entityId;
    if (status) where.status = status;
    if (documentTypeId) where.documentTypeId = documentTypeId;

    const generalDocs = await prisma.document.findMany({
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

    let extraSystemFiles = [];

    if (!documentTypeId && !entityId) {
      // Payment proofs
      try {
        const paymentProofs = await prisma.paymentProof.findMany({
          take: 50,
          orderBy: { createdAt: 'desc' },
          include: { payment: { select: { paymentNumber: true } } }
        });
        paymentProofs.forEach(p => {
          extraSystemFiles.push({
            id: p.id,
            fileName: p.fileName || `Payment Slip (${p.payment?.paymentNumber || 'Receipt'})`,
            fileUrl: p.fileUrl,
            entityType: 'PAYMENT_PROOF',
            entityId: p.paymentId,
            notes: `Payment proof attachment for payment ${p.payment?.paymentNumber || ''}`,
            status: p.status || 'VERIFIED',
            createdAt: p.createdAt,
            documentType: { id: 'payment-proof-type', name: 'Payment Receipts', code: 'PAYMENT_PROOF' },
            isSystemAttachment: true,
          });
        });
      } catch (e) {}

      // Delivery proofs
      try {
        const deliveryProofs = await prisma.deliveryProof.findMany({
          take: 50,
          orderBy: { createdAt: 'desc' },
          include: { delivery: { select: { deliveryNumber: true } } }
        });
        deliveryProofs.forEach(d => {
          if (d.fileUrl) {
            extraSystemFiles.push({
              id: d.id,
              fileName: `Delivery Proof (${d.delivery?.deliveryNumber || 'POD'})`,
              fileUrl: d.fileUrl,
              entityType: 'DELIVERY_PROOF',
              entityId: d.deliveryId,
              notes: d.notes || (d.recipientName ? `Recipient: ${d.recipientName}` : 'Proof of delivery document'),
              status: 'VERIFIED',
              createdAt: d.createdAt,
              documentType: { id: 'delivery-proof-type', name: 'Delivery Proofs & POD', code: 'DELIVERY_PROOF' },
              isSystemAttachment: true,
            });
          }
        });
      } catch (e) {}

      // Product images
      try {
        const productImages = await prisma.productImage.findMany({
          take: 50,
          orderBy: { createdAt: 'desc' },
          include: { product: { select: { name: true, sku: true } } }
        });
        productImages.forEach(img => {
          if (img.imageUrl) {
            extraSystemFiles.push({
              id: img.id,
              fileName: `${img.product?.name || 'Product'} - Photo`,
              fileUrl: img.imageUrl,
              entityType: 'PRODUCT_IMAGE',
              entityId: img.productId,
              notes: `Product catalog image (SKU: ${img.product?.sku || 'N/A'})`,
              status: 'VERIFIED',
              createdAt: img.createdAt,
              documentType: { id: 'product-media-type', name: 'Product Catalog Media', code: 'PRODUCT_MEDIA' },
              isSystemAttachment: true,
            });
          }
        });
      } catch (e) {}
    }

    return [...generalDocs, ...extraSystemFiles];
  }

  async deleteDocument(id) {
    return await prisma.document.delete({
      where: { id }
    });
  }
}

export default new DocumentService();
