import prisma from '../../config/prisma.js';
import paymentService from '../04-finance/payment/payment.service.js';

class GoodsReceiptService {
  /**
   * Create a Goods Receipt in PENDING status with evidence document support
   */
  async createGoodsReceipt(data, createdById) {
    const { purchaseOrderId, warehouseId, items, evidenceUrl, evidenceCategory, notes } = data;
    const receiptNumber = data.receiptNumber || `GR-${Date.now()}`;
    const receivedAt = new Date();

    const receipt = await prisma.goodsReceipt.create({
      data: {
        receiptNumber,
        purchaseOrderId,
        warehouseId,
        receivedBy: createdById,
        createdById,
        receivedAt,
        status: 'PENDING',
        items: {
          create: items.map(item => ({
            productId: item.productId,
            orderedQuantity: Number(item.orderedQuantity || item.quantity || 0),
            receivedQuantity: Number(item.receivedQuantity || item.quantity || 0),
            damagedQuantity: Number(item.damagedQuantity || 0),
            unitCost: Number(item.unitCost || 0),
            createdById
          }))
        }
      },
      include: { items: { include: { product: true } }, warehouse: true, purchaseOrder: true }
    });

    // Update Purchase Order status to RECEIVED upon Goods Receipt creation
    if (purchaseOrderId) {
      try {
        await prisma.purchaseOrder.update({
          where: { id: purchaseOrderId },
          data: {
            status: 'RECEIVED',
            updatedById: createdById
          }
        });

        if (Array.isArray(items)) {
          for (const item of items) {
            const qty = Number(item.receivedQuantity || item.quantity || 0);
            if (qty > 0 && item.productId) {
              await prisma.purchaseOrderItem.updateMany({
                where: { purchaseOrderId, productId: item.productId },
                data: { receivedQuantity: qty }
              });
            }
          }
        }
      } catch (poErr) {
        console.error('[Goods Receipt Service] Failed to update PO status to RECEIVED:', poErr);
      }
    }

    if (evidenceUrl || notes) {
      try {
        let docType = null;
        if (evidenceCategory) {
          docType = await prisma.documentType.findFirst({
            where: {
              OR: [
                { id: evidenceCategory },
                { code: evidenceCategory }
              ]
            }
          });
        }

        if (!docType) {
          docType = await prisma.documentType.findFirst({
            where: { code: 'DELIVERY_NOTE' }
          });
        }

        if (docType) {
          await prisma.document.create({
            data: {
              documentTypeId: docType.id,
              entityType: 'GOODS_RECEIPT',
              entityId: receipt.id,
              fileUrl: evidenceUrl || '',
              fileName: `Goods Receipt Evidence - ${receipt.receiptNumber}`,
              notes: notes || null,
              status: 'VERIFIED',
              createdById
            }
          });
        }
      } catch (docErr) {
        console.error('Failed to create Goods Receipt evidence document:', docErr);
      }
    }

    return receipt;
  }

  /**
   * Approve Goods Receipt and perform inventory stock update
   */
  async approveGoodsReceipt(id, approvedById, paymentData = {}) {
    return await prisma.$transaction(async (tx) => {
      const receipt = await tx.goodsReceipt.findUnique({
        where: { id },
        include: {
          items: true,
          warehouse: true,
          purchaseOrder: {
            include: {
              supplier: {
                include: {
                  person: true,
                  organization: true,
                  payoutChannels: true
                }
              }
            }
          }
        }
      });

      if (!receipt) {
        throw new Error('Goods Receipt not found');
      }

      // 1. Process Payment & Execute Outbound Transfer if provided
      let transferResult = null;
      if (paymentData && (paymentData.amount || paymentData.paymentMethod)) {
        const provCode = (paymentData.paymentMethod || '').toLowerCase();

        // Execute outbound vendor payout via Chapa Transfer API if Online Payment
        if (provCode.includes('chapa') || paymentData.paymentCategory === 'ONLINE') {
          if (paymentData.alreadyInitiated || paymentData.isInitiated) {
            console.log(`[Goods Receipt Approval] Transfer already initiated & verified by client with ref: ${paymentData.referenceNumber}`);
            transferResult = {
              status: 'SUCCESS',
              reference: paymentData.referenceNumber,
              message: 'Transfer already initiated & verified by client'
            };
          } else {
            try {
              const chapaAdapter = paymentService.getAdapter('chapa');

              const supplierObj = receipt.purchaseOrder?.supplier || {};
              const payoutChannels = supplierObj.payoutChannels || [];
              const primaryChannel = payoutChannels.find((c) => c.isPrimary) || payoutChannels[0] || {};

              const rawAccount = primaryChannel.accountNumber || '1000123456789';
              const targetAccountNumber = rawAccount.replace(/\D/g, '') || '1000123456789';

              let targetAccountName = primaryChannel.accountName;
              if (!targetAccountName) {
                if (supplierObj.person?.firstName) {
                  targetAccountName = `${supplierObj.person.firstName} ${supplierObj.person.lastName || ''}`.trim();
                } else if (supplierObj.organization?.name) {
                  targetAccountName = supplierObj.organization.name;
                } else {
                  targetAccountName = 'Vendor Supplier';
                }
              }

              // Map supplier's payout bank name to Chapa Bank ID (128 = CBEBirr, 855 = Telebirr, 656 = Awash, 836 = Coop)
              let chapaBankId = '128'; // CBEBirr in Chapa
              const bankNameLower = (primaryChannel.bankName || primaryChannel.channelType || '').toLowerCase();
              if (bankNameLower.includes('telebirr')) chapaBankId = '855';
              else if (bankNameLower.includes('awash')) chapaBankId = '656';
              else if (bankNameLower.includes('coop')) chapaBankId = '836';
              else if (bankNameLower.includes('abay')) chapaBankId = '130';
              else if (primaryChannel.bankCode && !isNaN(primaryChannel.bankCode)) chapaBankId = String(primaryChannel.bankCode);

              // Normalize account number for mobile wallets (Telebirr / CBEBirr: 10 digits starting with 09)
              let normalizedAccount = targetAccountNumber;
              if (chapaBankId === '855' || chapaBankId === '128') {
                if (normalizedAccount.startsWith('251') && normalizedAccount.length === 12) {
                  normalizedAccount = '0' + normalizedAccount.slice(3);
                }
              }

              transferResult = await chapaAdapter.initiateTransfer({
                accountName: targetAccountName,
                accountNumber: normalizedAccount,
                amount: paymentData.amount || 0,
                currency: 'ETB',
                bankCode: chapaBankId,
                reference: paymentData.referenceNumber || `TR-SUPPLIER-${Date.now()}`
              });
            } catch (trErr) {
              console.warn('[Chapa Outbound Payout Transfer Warning]:', trErr.message);
              throw new Error(`Chapa payment failed: ${trErr.message}`);
            }
          }
        }

        const isOnline = paymentData.paymentCategory === 'ONLINE';

        // Reject approval if outbound transfer failed
        if (isOnline && transferResult && (transferResult.status === 'FAILED' || transferResult.status === 'failed')) {
          throw new Error(`Chapa outbound payout failed: ${transferResult.message || 'Transfer rejected by gateway'}`);
        }

        const txRef = transferResult?.reference || paymentData.referenceNumber || `TR-CHAPA-${Date.now()}`;
        const paymentNumber = `PAY-SETTLE-${Date.now().toString().slice(-6)}`;

        await tx.payment.create({
          data: {
            paymentNumber,
            supplierId: receipt.purchaseOrder?.supplierId || null,
            amount: paymentData.amount || 0,
            currency: 'ETB',
            status: 'COMPLETED',
            method: isOnline ? 'ONLINE_GATEWAY' : 'MANUAL',
            provider: (paymentData.paymentMethod || 'CHAPA').toUpperCase(),
            transactionRef: txRef,
            referenceNumber: paymentData.referenceNumber || txRef,
            paidAt: new Date(),
            processedById: approvedById,
            createdById: approvedById,
            updatedById: approvedById
          }
        });
      }

      // 2. ONLY AFTER Payment succeeds / verified: Update Receipt to PAID & Increment Inventory Stock
      if (receipt.status !== 'PAID' && receipt.status !== 'APPROVED') {
        const updatedReceipt = await tx.goodsReceipt.update({
          where: { id },
          data: {
            status: 'PAID',
            updatedById: approvedById
          },
          include: { items: true, warehouse: true, purchaseOrder: true }
        });

        // Update PO status to COMPLETED when payment is settled
        if (receipt.purchaseOrderId) {
          await tx.purchaseOrder.update({
            where: { id: receipt.purchaseOrderId },
            data: { status: 'COMPLETED', updatedById: approvedById }
          });
        }

        // Increment Warehouse Stock and Log Stock Movement
        for (const item of receipt.items) {
          const qtyReceived = Number(item.receivedQuantity) - Number(item.damagedQuantity);
          if (qtyReceived <= 0) continue;

          const existingStock = await tx.warehouseStock.findUnique({
            where: {
              warehouseId_productId: {
                warehouseId: receipt.warehouseId,
                productId: item.productId
              }
            }
          });

          if (existingStock) {
            await tx.warehouseStock.update({
              where: { id: existingStock.id },
              data: {
                quantity: { increment: qtyReceived },
                availableQuantity: { increment: qtyReceived }
              }
            });
          } else {
            await tx.warehouseStock.create({
              data: {
                warehouseId: receipt.warehouseId,
                productId: item.productId,
                quantity: qtyReceived,
                availableQuantity: qtyReceived,
                createdById: approvedById
              }
            });
          }

          await tx.stockMovement.create({
            data: {
              warehouseId: receipt.warehouseId,
              productId: item.productId,
              movementType: 'PURCHASE_RECEIPT',
              quantity: qtyReceived,
              referenceType: 'GOODS_RECEIPT',
              referenceId: receipt.id,
              unitCost: item.unitCost,
              createdById: approvedById
            }
          });
        }

        return updatedReceipt;
      }

      return receipt;
    });
  }

  /**
   * Update Goods Receipt status (e.g. REJECTED)
   */
  async updateStatus(id, status, updatedById) {
    return await prisma.goodsReceipt.update({
      where: { id },
      data: { status, updatedById }
    });
  }

  async getGoodsReceipts(filters = {}, options = {}) {
    const skip = options.skip ? parseInt(options.skip, 10) : 0;
    const take = options.take ? parseInt(options.take, 10) : 50;

    const [receipts, total] = await Promise.all([
      prisma.goodsReceipt.findMany({
        where: filters,
        skip,
        take,
        include: {
          purchaseOrder: {
            include: {
              supplier: {
                include: {
                  payoutChannels: true,
                  person: true,
                  organization: true,
                },
              },
            },
          },
          warehouse: true,
          items: { include: { product: true } },
          receiver: { select: { id: true, username: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.goodsReceipt.count({ where: filters }),
    ]);

    return { receipts, total, skip, take };
  }

  async getGoodsReceiptById(id) {
    const gr = await prisma.goodsReceipt.findUnique({
      where: { id },
      include: {
        items: { include: { product: true } },
        purchaseOrder: {
          include: {
            supplier: {
              include: {
                payoutChannels: true,
                person: true,
                organization: true,
              },
            },
          },
        },
        warehouse: true,
        receiver: { select: { id: true, username: true } },
      },
    });

    if (!gr) return null;

    let documents = [];
    if (prisma.document) {
      try {
        documents = await prisma.document.findMany({
          where: { entityType: 'GOODS_RECEIPT', entityId: id },
          include: { documentType: true }
        });
      } catch (e) {}
    }

    const firstDoc = documents[0];
    return {
      ...gr,
      evidenceUrl: firstDoc?.fileUrl || null,
      notes: firstDoc?.notes || null,
      documents
    };
  }
}

export default new GoodsReceiptService();
