import prisma from "../../../config/prisma.js";
import { logAudit } from "../../../middleware/audit.middleware.js";
import { AppError } from "../../../utils/errors.js";
import { getPaginationParams, buildPaginationMeta } from "../../../utils/pagination.js";

const sanitizeCompany = (company) => {
  if (!company) return company;
  return {
    ...company,
    region: company.region
      ? {
          id: company.region.id,
          name: company.region.name,
          code: company.region.code,
        }
      : null,
    createdBy: company.createdBy
      ? {
          id: company.createdBy.id,
          person: company.createdBy.person,
        }
      : null,
    updatedBy: company.updatedBy
      ? {
          id: company.updatedBy.id,
          person: company.updatedBy.person,
        }
      : null,
  };
};

export async function createCompany(data, createdById, req) {
  const region = await prisma.region.findFirst({
    where: { id: data.regionId, isActive: true },
  });

  if (!region) {
    throw new AppError('Region not found or inactive', 404);
  }

  const company = await prisma.company.create({
    data: {
      name: data.name,
      legalName: data.legalName,
      tradeLicenseNumber: data.tradeLicenseNumber,
      tinNumber: data.tinNumber,
      vatRegistrationNumber: data.vatRegistrationNumber,
      isVatRegistered: data.isVatRegistered || false,
      phone: data.phone,
      alternatePhone: data.alternatePhone,
      email: data.email,
      website: data.website,
      logoUrl: data.logoUrl,
      regionId: data.regionId,
      city: data.city,
      subCity: data.subCity,
      woreda: data.woreda,
      kebele: data.kebele,
      houseNumber: data.houseNumber,
      landmark: data.landmark,
      status: data.status || 'ACTIVE',
      createdById,
      updatedById: createdById,
    },
    include: {
      region: {
        select: {
          id: true,
          name: true,
          code: true,
        },
      },
      createdBy: {
        include: {
          person: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      },
      updatedBy: {
        include: {
          person: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      },
    },
  });

  await logAudit({
    createdById,
    action: 'COMPANY_CREATED',
    entityType: 'Company',
    entityId: company.id,
    newValues: { name: company.name, status: company.status },
    req,
  });

  return sanitizeCompany(company);
}

export async function getCompanies(filters) {
  const { page, limit, skip } = getPaginationParams(filters);
  const where = buildCompanyWhere(filters);

  const [companies, total] = await Promise.all([
    prisma.company.findMany({
      where,
      include: {
        createdBy: {
          include: {
            person: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        updatedBy: {
          include: {
            person: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.company.count({ where }),
  ]);

  const meta = buildPaginationMeta({ page, limit, total });

  return {
    companies: companies.map(sanitizeCompany),
    meta,
  };
}

export async function getCompanyById(id) {
  const company = await prisma.company.findFirst({
    where: { id, isArchived: false },
    include: {
      region: {
        select: {
          id: true,
          name: true,
          code: true,
        },
      },
      branches: true,
      createdBy: {
        include: {
          person: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      },
      updatedBy: {
        include: {
          person: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      },
    },
  });

  if (!company) {
    throw new AppError('Company not found', 404);
  }

  return sanitizeCompany(company);
}

export async function updateCompany(id, data, createdById, req) {
  const existingCompany = await prisma.company.findFirst({
    where: { id, isArchived: false },
    include: {
      region: true,
      createdBy: {
        include: {
          person: true,
        },
      },
    },
  });

  if (!existingCompany) {
    throw new AppError('Company not found', 404);
  }

  if (data.regionId && data.regionId !== existingCompany.regionId) {
    const region = await prisma.region.findFirst({
      where: { id: data.regionId, isActive: true },
    });
    if (!region) {
      throw new AppError('Region not found or inactive', 404);
    }
  }

  if (data.tradeLicenseNumber && data.tradeLicenseNumber !== existingCompany.tradeLicenseNumber) {
    const duplicate = await prisma.company.findFirst({
      where: { tradeLicenseNumber: data.tradeLicenseNumber, id: { not: id } },
    });
    if (duplicate) {
      throw new AppError('Trade license number already exists', 409);
    }
  }

  if (data.tinNumber && data.tinNumber !== existingCompany.tinNumber) {
    const duplicate = await prisma.company.findFirst({
      where: { tinNumber: data.tinNumber, id: { not: id } },
    });
    if (duplicate) {
      throw new AppError('TIN number already exists', 409);
    }
  }

  if (data.vatRegistrationNumber && data.vatRegistrationNumber !== existingCompany.vatRegistrationNumber) {
    const duplicate = await prisma.company.findFirst({
      where: { vatRegistrationNumber: data.vatRegistrationNumber, id: { not: id } },
    });
    if (duplicate) {
      throw new AppError('VAT registration number already exists', 409);
    }
  }

  const updatedCompany = await prisma.company.update({
    where: { id },
    data: {
      name: data.name,
      legalName: data.legalName,
      tradeLicenseNumber: data.tradeLicenseNumber,
      tinNumber: data.tinNumber,
      vatRegistrationNumber: data.vatRegistrationNumber,
      isVatRegistered: data.isVatRegistered,
      phone: data.phone,
      alternatePhone: data.alternatePhone,
      email: data.email,
      website: data.website,
      logoUrl: data.logoUrl,
      regionId: data.regionId,
      city: data.city,
      subCity: data.subCity,
      woreda: data.woreda,
      kebele: data.kebele,
      houseNumber: data.houseNumber,
      landmark: data.landmark,
      status: data.status,
      updatedById: createdById,
    },
    include: {
      region: {
        select: {
          id: true,
          name: true,
          code: true,
        },
      },
      createdBy: {
        include: {
          person: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      },
      updatedBy: {
        include: {
          person: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      },
    },
  });

  await logAudit({
    createdById,
    action: 'COMPANY_UPDATED',
    entityType: 'Company',
    entityId: id,
    oldValues: { name: existingCompany.name },
    newValues: { name: updatedCompany.name },
    req,
  });

  return sanitizeCompany(updatedCompany);
}

export async function deleteCompany(id, createdById, req) {
  const existingCompany = await prisma.company.findFirst({
    where: { id, isArchived: false },
  });

  if (!existingCompany) {
    throw new AppError('Company not found', 404);
  }

  await prisma.company.update({
    where: { id },
    data: {
      isArchived: true,
      archivedAt: new Date(),
      updatedById: createdById,
    },
  });

  await logAudit({
    createdById,
    action: 'COMPANY_DELETED',
    entityType: 'Company',
    entityId: id,
    oldValues: { name: existingCompany.name },
    req,
  });

  return { message: 'Company deleted successfully' };
}

function buildCompanyWhere(filters) {
  const where = { isArchived: false };

  if (filters.status) {
    where.status = filters.status;
  }

  if (filters.search) {
    where.OR = [
      { name: { contains: filters.search, mode: 'insensitive' } },
      { legalName: { contains: filters.search, mode: 'insensitive' } },
      { email: { contains: filters.search, mode: 'insensitive' } },
    ];
  }

  return where;
}

