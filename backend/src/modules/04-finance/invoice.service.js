import prisma from '../../config/prisma.js';

class InvoiceService {
  /**
   * Generate unique invoice number
   */
  generateInvoiceNumber() {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `INV-${timestamp}-${random}`;
  }

  /**
   * Calculate due date based on payment terms
   */
  async calculateDueDate(customerId, invoiceDate) {
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
      include: { paymentTerms: true }
    });

    const days = customer?.paymentTerms?.days || 0;
    const dueDate = new Date(invoiceDate);
    dueDate.setDate(dueDate.getDate() + days);
    return dueDate;
  }

  /**
   * 1. Create Invoice from Sales Order (For Upfront/Pre-payment)
   */
  async createInvoiceFromOrder(salesOrderId, createdById) {
    const order = await prisma.salesOrder.findUnique({
      where: { id: salesOrderId },
      include: {
        items: true,
        customer: { include: { paymentTerms: true } }
      }
    });

    if (!order) {
      throw new Error(`Sales order with ID ${salesOrderId} not found`);
    }

    const existingInvoice = await prisma.invoice.findFirst({
      where: { salesOrderId }
    });

    if (existingInvoice) {
      throw new Error(`An invoice already exists for Sales Order ${salesOrderId}`);
    }

    const invoiceDate = new Date();
    const dueDate = await this.calculateDueDate(order.customerId, invoiceDate);

    // Map order items to invoice items directly
    const invoiceItems = order.items.map(item => ({
      productId: item.productId,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      discount: item.discount,
      tax: item.tax,
      total: item.total
    }));

    const newInvoice = await prisma.invoice.create({
      data: {
        invoiceNumber: this.generateInvoiceNumber(),
        customerId: order.customerId,
        salesOrderId: order.id,
        invoiceDate,
        dueDate,
        subtotal: order.subtotal,
        discount: order.discount,
        tax: order.tax,
        total: order.total,
        balance: order.total, // Initially fully unpaid
        status: "ISSUED",
        createdById: createdById || null,
        items: {
          create: invoiceItems
        }
      },
      include: { items: true }
    });

    return newInvoice;
  }

  /**
   * 2. Create Invoice from Delivery (For Post-delivery/Credit)
   */
  async createInvoiceFromDelivery(deliveryId, createdById) {
    const delivery = await prisma.delivery.findUnique({
      where: { id: deliveryId },
      include: {
        items: { include: { salesOrderItem: true } },
        salesOrder: { include: { customer: { include: { paymentTerms: true } } } }
      }
    });

    if (!delivery) {
      throw new Error(`Delivery with ID ${deliveryId} not found`);
    }
    if (delivery.status !== 'DELIVERED') {
      throw new Error(`Delivery ${deliveryId} is not yet delivered. Status is ${delivery.status}`);
    }

    const salesOrderId = delivery.salesOrderId;
    const existingInvoice = await prisma.invoice.findFirst({
      where: { salesOrderId }
    });

    if (existingInvoice) {
      throw new Error(`An invoice already exists for Sales Order ${salesOrderId}`);
    }

    const invoiceDate = new Date();
    const dueDate = await this.calculateDueDate(delivery.customerId, invoiceDate);

    let subtotal = 0;
    let totalTax = 0;
    let totalDiscount = 0;

    // Filter to only items that were actually delivered
    const invoiceItems = delivery.items
      .filter(item => Number(item.deliveredQuantity) > 0)
      .map(item => {
        const orderItem = item.salesOrderItem;
        const qty = Number(item.deliveredQuantity);
        const unitPrice = Number(orderItem.unitPrice);
        const lineTotalRaw = qty * unitPrice;
        
        // Calculate proportional discount and tax per unit
        const itemDiscount = (Number(orderItem.discount) / Number(orderItem.quantity)) * qty;
        const itemTax = (Number(orderItem.tax) / Number(orderItem.quantity)) * qty;
        const itemTotal = lineTotalRaw - itemDiscount + itemTax;

        subtotal += lineTotalRaw;
        totalDiscount += itemDiscount;
        totalTax += itemTax;

        return {
          productId: item.productId,
          quantity: qty,
          unitPrice: unitPrice,
          discount: itemDiscount,
          tax: itemTax,
          total: itemTotal
        };
      });

    if (invoiceItems.length === 0) {
       throw new Error(`Delivery ${deliveryId} has no delivered quantities to invoice.`);
    }
    
    const finalTotal = subtotal - totalDiscount + totalTax;

    const newInvoice = await prisma.invoice.create({
      data: {
        invoiceNumber: this.generateInvoiceNumber(),
        customerId: delivery.customerId,
        salesOrderId,
        invoiceDate,
        dueDate,
        subtotal,
        discount: totalDiscount,
        tax: totalTax,
        total: finalTotal,
        balance: finalTotal,
        status: "ISSUED",
        createdById: createdById || null,
        items: {
          create: invoiceItems
        }
      },
      include: { items: true }
    });

    return newInvoice;
  }

  /**
   * Get all invoices with basic filtering
   */
  async getInvoices(filters = {}) {
    return await prisma.invoice.findMany({
      where: filters,
      include: { 
        customer: { select: { id: true, customerCode: true, person: true, organization: true } }, 
        salesOrder: { select: { orderNumber: true } } 
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  /**
   * Get detailed invoice by ID
   */
  async getInvoiceById(id) {
    return await prisma.invoice.findUnique({
      where: { id },
      include: { 
        items: { include: { product: true } }, 
        customer: { select: { id: true, customerCode: true, person: true, organization: true, paymentTerms: true } }, 
        salesOrder: true,
        paymentAllocations: { include: { payment: true } }
      }
    });
  }
}

export default new InvoiceService();
