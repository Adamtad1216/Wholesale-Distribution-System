import prisma from '../../config/prisma.js';

class SupplierService {
  async syncPayoutChannelsToDb(supplierId, channels = []) {
    if (!supplierId || !Array.isArray(channels)) return;

    await prisma.supplierPayoutChannel.deleteMany({
      where: { supplierId },
    });

    const validChannels = channels.filter((c) => c && (c.bankName || c.accountNumber));
    if (validChannels.length > 0) {
      await prisma.supplierPayoutChannel.createMany({
        data: validChannels.map((c) => ({
          supplierId,
          channelType: c.channelType || 'BANK',
          bankName: c.bankName || null,
          accountNumber: String(c.accountNumber || ''),
          accountName: c.accountName || null,
          isPrimary: Boolean(c.isPrimary),
        })),
      });
    }
  }

  async createSupplier(data, createdById) {
    // 1. Automatically generate sequential supplier code if missing or placeholder
    let supplierCode = data.supplierCode;
    if (!supplierCode || supplierCode.startsWith('SUP-TEMP') || supplierCode.startsWith('Auto-generated')) {
      const count = await prisma.supplier.count();
      supplierCode = `SUP-${String(count + 1).padStart(4, '0')}`;
    }

    const {
      supplierType,
      name,
      companyName,
      contactPerson,
      firstName,
      middleName,
      lastName,
      nationalId,
      altPhone,
      email,
      phone,
      tin,
      address,
      city,
      region,
      bankName,
      accountNumber,
      paymentTerms,
      paymentTermsId,
      status = 'ACTIVE',
      additionalContacts,
      person,
      organization,
      payoutChannels,
    } = data;

    // Build physical address string combining street, city, region
    const combinedAddress = [address, city, region].filter(Boolean).join(', ');

    let personConnectOrCreate = undefined;
    let organizationConnectOrCreate = undefined;

    // Handle Individual Supplier -> create Person record
    if (supplierType === 'INDIVIDUAL' || person || firstName) {
      const pFirstName = firstName || person?.firstName || name?.split(' ')[0] || 'Supplier';
      const pMiddleName = middleName || person?.middleName || name?.split(' ')[1] || '';
      const pLastName = lastName || person?.lastName || name?.split(' ').slice(2).join(' ') || '';

      personConnectOrCreate = {
        create: {
          firstName: pFirstName,
          middleName: pMiddleName,
          lastName: pLastName,
          phone: phone || person?.phone || altPhone,
          email: email && email.includes('@') ? email : undefined,
          address: combinedAddress || undefined,
          ...(createdById ? { createdBy: { connect: { id: createdById } } } : {}),
        },
      };
    } else {
      // Handle Corporate Supplier -> create Organization record
      organizationConnectOrCreate = {
        create: {
          name: companyName || name || 'Corporate Supplier',
          taxNumber: tin || undefined,
          phone: phone || undefined,
          email: email && email.includes('@') ? email : undefined,
          address: combinedAddress || undefined,
          ...(createdById ? { createdBy: { connect: { id: createdById } } } : {}),
        },
      };
    }

    // Create main Supplier record with strict Prisma fields
    const supplier = await prisma.supplier.create({
      data: {
        supplierCode,
        status: status || 'ACTIVE',
        ...(createdById ? { createdBy: { connect: { id: createdById } } } : {}),
        ...(personConnectOrCreate ? { person: personConnectOrCreate } : {}),
        ...(organizationConnectOrCreate ? { organization: organizationConnectOrCreate } : {}),
      },
      include: {
        person: true,
        organization: true,
        paymentTerms: true,
        payoutChannels: true,
      },
    });

    if (Array.isArray(payoutChannels)) {
      await this.syncPayoutChannelsToDb(supplier.id, payoutChannels);
    }

    const freshSupplier = await prisma.supplier.findUnique({
      where: { id: supplier.id },
      include: {
        person: true,
        organization: true,
        paymentTerms: true,
        payoutChannels: true,
      },
    });

    return this.formatSupplierResponse(freshSupplier || supplier, data);
  }

  async getSuppliers(filters = {}, options = {}) {
    const skip = options.skip ? parseInt(options.skip, 10) : 0;
    const take = options.take ? parseInt(options.take, 10) : 50;

    const [suppliers, total] = await Promise.all([
      prisma.supplier.findMany({
        where: filters,
        skip,
        take,
        include: {
          person: true,
          organization: true,
          paymentTerms: true,
          payoutChannels: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.supplier.count({ where: filters }),
    ]);

    const formattedSuppliers = suppliers.map((sup) => this.formatSupplierResponse(sup));

    return { suppliers: formattedSuppliers, total, skip, take };
  }

  async getSupplierById(id) {
    const supplier = await prisma.supplier.findUnique({
      where: { id },
      include: {
        person: true,
        organization: true,
        paymentTerms: true,
        payoutChannels: true,
        purchaseOrders: true,
        supplierInvoices: true,
      },
    });

    if (!supplier) return null;
    return this.formatSupplierResponse(supplier);
  }

  async updateSupplier(id, data, updatedById) {
    const {
      supplierType,
      supplierCode,
      status,
      name,
      companyName,
      contactPerson,
      firstName,
      middleName,
      lastName,
      phone,
      email,
      tin,
      address,
      city,
      region,
      payoutChannels,
    } = data;

    // Fetch existing supplier to check relations
    const existing = await prisma.supplier.findUnique({
      where: { id },
      include: { person: true, organization: true },
    });

    if (!existing) {
      throw new Error(`Supplier with ID ${id} not found`);
    }

    const combinedAddress = [address, city, region].filter(Boolean).join(', ');

    let updatedPersonId = existing.personId;
    let updatedOrgId = existing.organizationId;

    if (existing.personId) {
      const nameParts = name ? name.trim().split(' ') : [];
      const pFirstName = firstName || nameParts[0] || existing.person?.firstName || 'Supplier';
      const pMiddleName = middleName || nameParts[1] || existing.person?.middleName || '';
      const pLastName = lastName || nameParts.slice(2).join(' ') || existing.person?.lastName || '';

      await prisma.person.update({
        where: { id: existing.personId },
        data: {
          firstName: pFirstName,
          middleName: pMiddleName,
          lastName: pLastName,
          phone: phone || existing.person?.phone,
          ...(email && email.includes('@') ? { email } : {}),
          address: combinedAddress || address || existing.person?.address,
          ...(updatedById ? { updatedById } : {}),
        },
      });
    } else if (existing.organizationId) {
      await prisma.organization.update({
        where: { id: existing.organizationId },
        data: {
          name: companyName || name || existing.organization?.name || 'Corporate Supplier',
          taxNumber: tin || existing.organization?.taxNumber,
          phone: phone || existing.organization?.phone,
          ...(email && email.includes('@') ? { email } : {}),
          address: combinedAddress || address || existing.organization?.address,
          ...(updatedById ? { updatedById } : {}),
        },
      });
    } else {
      // If neither exists yet, create person or organization based on supplier type
      if (supplierType === 'INDIVIDUAL' || firstName) {
        const nameParts = name ? name.trim().split(' ') : [];
        const newPerson = await prisma.person.create({
          data: {
            firstName: firstName || nameParts[0] || 'Supplier',
            middleName: middleName || nameParts[1] || '',
            lastName: lastName || nameParts.slice(2).join(' ') || '',
            phone: phone || undefined,
            email: email && email.includes('@') ? email : undefined,
            address: combinedAddress || address || undefined,
            ...(updatedById ? { createdBy: { connect: { id: updatedById } } } : {}),
          },
        });
        updatedPersonId = newPerson.id;
      } else {
        const newOrg = await prisma.organization.create({
          data: {
            name: companyName || name || 'Corporate Supplier',
            taxNumber: tin || undefined,
            phone: phone || undefined,
            email: email && email.includes('@') ? email : undefined,
            address: combinedAddress || address || undefined,
            ...(updatedById ? { createdBy: { connect: { id: updatedById } } } : {}),
          },
        });
        updatedOrgId = newOrg.id;
      }
    }

    // Sanitize supplier code to avoid unique constraint failure when updating
    const validSupplierCode =
      supplierCode &&
      !supplierCode.startsWith('Auto-generated') &&
      !supplierCode.startsWith('SUP-TEMP') &&
      supplierCode !== existing.supplierCode
        ? supplierCode
        : undefined;

    await prisma.supplier.update({
      where: { id },
      data: {
        ...(status ? { status } : {}),
        ...(validSupplierCode ? { supplierCode: validSupplierCode } : {}),
        ...(updatedPersonId && !existing.personId ? { person: { connect: { id: updatedPersonId } } } : {}),
        ...(updatedOrgId && !existing.organizationId ? { organization: { connect: { id: updatedOrgId } } } : {}),
        ...(updatedById ? { updatedBy: { connect: { id: updatedById } } } : {}),
      },
    });

    if (Array.isArray(payoutChannels)) {
      await this.syncPayoutChannelsToDb(id, payoutChannels);
    }

    const freshSupplier = await prisma.supplier.findUnique({
      where: { id },
      include: {
        person: true,
        organization: true,
        paymentTerms: true,
        payoutChannels: true,
      },
    });

    return this.formatSupplierResponse(freshSupplier, data);
  }

  async archiveSupplier(id, updatedById) {
    const supplier = await prisma.supplier.update({
      where: { id },
      data: {
        isArchived: true,
        archivedAt: new Date(),
        status: 'ARCHIVED',
        updatedById,
      },
    });
    return supplier;
  }

  // Helper method to standardize supplier properties for the frontend
  formatSupplierResponse(sup, rawData = {}) {
    const isIndividual = Boolean(sup.person || rawData.supplierType === 'INDIVIDUAL');

    let name = rawData.name || '';
    if (isIndividual && sup.person) {
      name = `${sup.person.firstName} ${sup.person.middleName || ''} ${sup.person.lastName || ''}`.replace(/\s+/g, ' ').trim();
    } else if (sup.organization) {
      name = sup.organization.name;
    }

    const rawChannels =
      sup.payoutChannels && sup.payoutChannels.length > 0
        ? sup.payoutChannels
        : (rawData.payoutChannels || []);

    const formattedPaymentChannels = rawChannels.map((c, idx) => ({
      id: c.id || `channel-${idx}`,
      icon: c.channelType === 'CHAPA' ? '⚡' : c.channelType === 'TELEBIRR' ? '📱' : '🏦',
      title: c.bankName || (c.channelType === 'BANK' ? 'Bank Transfer' : c.channelType || 'Payout Channel'),
      badge: c.isPrimary ? 'Primary Account' : (c.channelType || 'Registered'),
      badgeStyle: c.isPrimary ? 'bg-emerald-500/20 text-emerald-400' : 'bg-indigo-500/20 text-indigo-400',
      account: `Acc: ${c.accountNumber}`,
      subtitle: c.accountName ? `Holder: ${c.accountName}` : 'Vendor Payout Account',
      bankName: c.bankName,
      accountNumber: c.accountNumber,
      accountName: c.accountName,
      channelType: c.channelType,
      isPrimary: c.isPrimary,
    }));

    const primaryChannel = rawChannels.find((c) => c.isPrimary) || rawChannels[0];

    return {
      ...sup,
      supplierType: isIndividual ? 'INDIVIDUAL' : 'ORGANIZATION',
      name: name || rawData.companyName || 'Supplier Vendor',
      companyName: sup.organization?.name || rawData.companyName || name,
      contactPerson: isIndividual ? name : (rawData.contactPerson || sup.organization?.name || 'Representative'),
      phone: sup.person?.phone || sup.organization?.phone || rawData.phone || '',
      email: sup.person?.email || sup.organization?.email || rawData.email || '',
      tin: sup.organization?.taxNumber || rawData.tin || '',
      address: sup.person?.address || sup.organization?.address || rawData.address || '',
      city: rawData.city || '',
      region: rawData.region || '',
      bankName: primaryChannel?.bankName || rawData.bankName || '',
      accountNumber: primaryChannel?.accountNumber || rawData.accountNumber || '',
      nationalId: rawData.nationalId || '',
      altPhone: rawData.altPhone || '',
      paymentTerms: sup.paymentTerms?.name || rawData.paymentTerms || 'Net 30',
      additionalContacts: rawData.additionalContacts || [],
      payoutChannels: rawChannels,
      paymentChannels: formattedPaymentChannels.length > 0 ? formattedPaymentChannels : undefined,
    };
  }
}

export default new SupplierService();
