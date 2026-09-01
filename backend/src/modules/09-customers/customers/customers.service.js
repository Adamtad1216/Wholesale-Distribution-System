import prisma from "../../../config/prisma.js";
import { logAudit } from "../../../middleware/audit.middleware.js";
import { AppError } from "../../../utils/errors.js";
import { getPaginationParams, buildPaginationMeta } from "../../../utils/pagination.js";
import { hashPassword } from "../../../utils/password.js";

export const generateCustomerCode = () => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `CUS-${timestamp}-${random}`;
};

export const ensureUniqueCode = async (tx, code) => {
  let uniqueCode = code;
  let attempts = 0;
  while (attempts < 5) {
    const existing = await tx.customer.findUnique({
      where: { customerCode: uniqueCode },
    });
    if (!existing) return uniqueCode;
    uniqueCode = generateCustomerCode();
    attempts++;
  }
  return uniqueCode;
};

const toNumber = (value) => {
  if (value === null || value === undefined) return 0;
  if (typeof value === 'number') return value;
  return Number(value);
};

const sanitizeCustomer = (customer) => {
  if (!customer) return customer;
  return {
    ...customer,
    creditLimit: toNumber(customer.creditLimit),
    createdBy: customer.createdBy
      ? {
          id: customer.createdBy.id,
          person: customer.createdBy.person,
        }
      : null,
    updatedBy: customer.updatedBy
      ? {
          id: customer.updatedBy.id,
          person: customer.updatedBy.person,
        }
      : null,
  };
};

const createUserAccountForCustomer = async (tx, personId, username, password, createdById) => {
  const existingUsername = await tx.user.findUnique({
    where: { username },
  });
  if (existingUsername) {
    throw new AppError('Username already taken', 409);
  }

  const customerRole = await tx.role.findUnique({
    where: { name: 'CUSTOMER' },
  });

  if (!customerRole) {
    throw new AppError('CUSTOMER role not configured', 500);
  }

  const passwordHash = await hashPassword(password);

  const user = await tx.user.create({
    data: {
      personId,
      username,
      passwordHash,
      isActive: true,
      createdById,
      updatedById: createdById,
    },
  });

  await tx.userRole.create({
    data: {
      createdById: user.id,
      roleId: customerRole.id,
    },
  });

  return user;
};

export async function createCustomer(data, createdById, req) {
  const customerCode = data.customerCode
    ? await ensureUniqueCode(prisma, data.customerCode)
    : generateCustomerCode();

  if (data.customerType === 'PERSON') {
    if (data.person.email) {
      const existingPerson = await prisma.person.findUnique({
        where: { email: data.person.email },
      });
      if (existingPerson) {
        throw new AppError('Person with this email already exists', 409);
      }
    }

    const customer = await prisma.$transaction(async (tx) => {
      const person = await tx.person.create({
        data: {
          firstName: data.person.firstName,
          middleName: data.person.middleName,
          lastName: data.person.lastName,
          phone: data.person.phone,
          email: data.person.email,
          address: data.person.address,
          status: data.status || 'ACTIVE',
          createdById: createdById,
          updatedById: createdById,
        },
      });

      if (data.username && data.password) {
        await createUserAccountForCustomer(tx, person.id, data.username, data.password, createdById);
      }

      return tx.customer.create({
        data: {
          customerCode,
          customerType: 'PERSON',
          personId: person.id,
          creditLimit: data.creditLimit,
          paymentTermsId: data.paymentTermsId,
          status: data.status || 'ACTIVE',
          createdById: createdById,
          updatedById: createdById,
        },
        include: {
          person: true,
          paymentTerms: true,
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
    });

    await logAudit({
      createdById,
      action: 'CUSTOMER_CREATED',
      entityType: 'Customer',
      entityId: customer.id,
      newValues: { customerCode: customer.customerCode, customerType: 'PERSON', hasUserAccount: !!data.username },
      req,
    });

    return sanitizeCustomer(customer);
  }

  if (data.customerType === 'ORGANIZATION') {
    if (data.organization.registrationNumber) {
      const existingOrg = await prisma.organization.findFirst({
        where: { registrationNumber: data.organization.registrationNumber },
      });
      if (existingOrg) {
        throw new AppError(
          'Organization with this registration number already exists',
          409
        );
      }
    }

    if (data.organization.taxNumber) {
      const existingOrg = await prisma.organization.findFirst({
        where: { taxNumber: data.organization.taxNumber },
      });
      if (existingOrg) {
        throw new AppError(
          'Organization with this tax number already exists',
          409
        );
      }
    }

    const customer = await prisma.$transaction(async (tx) => {
      const organization = await tx.organization.create({
        data: {
          name: data.organization.name,
          registrationNumber: data.organization.registrationNumber,
          taxNumber: data.organization.taxNumber,
          phone: data.organization.phone,
          email: data.organization.email,
          address: data.organization.address,
          status: data.status || 'ACTIVE',
          createdById: createdById,
          updatedById: createdById,
        },
      });

      if (data.organization.contacts && data.organization.contacts.length > 0) {
        let primaryPerson = null;

        for (const contact of data.organization.contacts) {
          if (contact.email) {
            const existingEmail = await tx.person.findUnique({
              where: { email: contact.email },
            });
            if (existingEmail) {
              throw new AppError('Contact email already registered', 409);
            }
          }

          const person = await tx.person.create({
            data: {
              firstName: contact.firstName,
              middleName: contact.middleName,
              lastName: contact.lastName,
              phone: contact.phone,
              email: contact.email,
              address: contact.address || data.organization.address,
              status: 'ACTIVE',
              createdById: createdById,
              updatedById: createdById,
            },
          });

          if (contact.isPrimary) {
            primaryPerson = person;
          }

          await tx.organizationContact.create({
            data: {
              organizationId: organization.id,
              personId: person.id,
              position: contact.position,
              isPrimary: contact.isPrimary,
            },
          });
        }

        if (data.username && data.password) {
          const personForAccount = primaryPerson;
          if (personForAccount) {
            await createUserAccountForCustomer(tx, personForAccount.id, data.username, data.password, createdById);
          } else {
            const orgPerson = await tx.person.create({
              data: {
                firstName: data.organization.name,
                lastName: '',
                phone: data.organization.phone,
                email: data.organization.email,
                address: data.organization.address,
                status: 'ACTIVE',
                createdById: createdById,
                updatedById: createdById,
              },
            });
            await createUserAccountForCustomer(tx, orgPerson.id, data.username, data.password, createdById);
          }
        }
      } else if (data.username && data.password) {
        const orgPerson = await tx.person.create({
          data: {
            firstName: data.organization.name,
            lastName: '',
            phone: data.organization.phone,
            email: data.organization.email,
            address: data.organization.address,
            status: 'ACTIVE',
            createdById: createdById,
            updatedById: createdById,
          },
        });
        await createUserAccountForCustomer(tx, orgPerson.id, data.username, data.password, createdById);
      }

      return tx.customer.create({
        data: {
          customerCode,
          customerType: 'ORGANIZATION',
          organizationId: organization.id,
          creditLimit: data.creditLimit,
          paymentTermsId: data.paymentTermsId,
          status: data.status || 'ACTIVE',
          createdById: createdById,
          updatedById: createdById,
        },
        include: {
          organization: {
            include: {
              contacts: {
                include: {
                  person: {
                    select: {
                      id: true,
                      firstName: true,
                      middleName: true,
                      lastName: true,
                      phone: true,
                      email: true,
                    },
                  },
                },
              },
            },
          },
          paymentTerms: true,
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
    });

    await logAudit({
      createdById,
      action: 'CUSTOMER_CREATED',
      entityType: 'Customer',
      entityId: customer.id,
      newValues: { customerCode: customer.customerCode, customerType: 'ORGANIZATION', hasUserAccount: !!data.username },
      req,
    });

    return sanitizeCustomer(customer);
  }

  throw new AppError('Invalid customer type', 400);
}

export async function getCustomers(filters) {
  const { page, limit, skip } = getPaginationParams(filters);
  const where = buildCustomerWhere(filters);

  const [customers, total] = await Promise.all([
    prisma.customer.findMany({
      where,
      include: {
        person: {
          select: {
            id: true,
            firstName: true,
            middleName: true,
            lastName: true,
            phone: true,
            email: true,
          },
        },
        organization: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
          },
        },
        paymentTerms: {
          select: {
            id: true,
            name: true,
            days: true,
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
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.customer.count({ where }),
  ]);

  const meta = buildPaginationMeta({ page, limit, total });

  return {
    customers: customers.map(sanitizeCustomer),
    meta,
  };
}

export async function getCustomerById(id) {
  const customer = await prisma.customer.findFirst({
    where: { id, isArchived: false },
    include: {
      person: true,
      organization: {
        include: {
          contacts: {
            include: {
              person: {
                select: {
                  id: true,
                  firstName: true,
                  middleName: true,
                  lastName: true,
                  phone: true,
                  email: true,
                },
              },
            },
          },
        },
      },
      paymentTerms: true,
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

  if (!customer) {
    throw new AppError('Customer not found', 404);
  }

  return sanitizeCustomer(customer);
}

export async function updateCustomer(id, data, createdById, req) {
  const existingCustomer = await prisma.customer.findFirst({
    where: { id, isArchived: false },
    include: {
      person: true,
      organization: true,
    },
  });

  if (!existingCustomer) {
    throw new AppError('Customer not found', 404);
  }

  if (data.customerType && data.customerType !== existingCustomer.customerType) {
    throw new AppError('Cannot change customer type', 400);
  }

  if (data.customerCode && data.customerCode !== existingCustomer.customerCode) {
    const duplicateCode = await prisma.customer.findFirst({
      where: { customerCode: data.customerCode, id: { not: id } },
    });
    if (duplicateCode) {
      throw new AppError('Customer code already exists', 409);
    }
  }

  const updatedCustomer = await prisma.$transaction(async (tx) => {
    if (existingCustomer.customerType === 'PERSON' && data.person) {
      await tx.person.update({
        where: { id: existingCustomer.personId },
        data: {
          firstName: data.person.firstName,
          middleName: data.person.middleName,
          lastName: data.person.lastName,
          phone: data.person.phone,
          email: data.person.email,
          address: data.person.address,
        },
      });
    }

    if (existingCustomer.customerType === 'ORGANIZATION' && data.organization) {
      if (data.organization.registrationNumber && data.organization.registrationNumber !== existingCustomer.organization?.registrationNumber) {
        const duplicateReg = await tx.organization.findFirst({
          where: { registrationNumber: data.organization.registrationNumber, id: { not: existingCustomer.organizationId } },
        });
        if (duplicateReg) {
          throw new AppError('Organization with this registration number already exists', 409);
        }
      }

      if (data.organization.taxNumber && data.organization.taxNumber !== existingCustomer.organization?.taxNumber) {
        const duplicateTax = await tx.organization.findFirst({
          where: { taxNumber: data.organization.taxNumber, id: { not: existingCustomer.organizationId } },
        });
        if (duplicateTax) {
          throw new AppError('Organization with this tax number already exists', 409);
        }
      }

      await tx.organization.update({
        where: { id: existingCustomer.organizationId },
        data: {
          name: data.organization.name,
          registrationNumber: data.organization.registrationNumber,
          taxNumber: data.organization.taxNumber,
          phone: data.organization.phone,
          email: data.organization.email,
          address: data.organization.address,
        },
      });

      if (data.organization.contacts) {
        await tx.organizationContact.deleteMany({
          where: { organizationId: existingCustomer.organizationId },
        });

        for (const contact of data.organization.contacts) {
          if (contact.email) {
            const existingEmail = await tx.person.findFirst({
              where: { email: contact.email },
            });
            if (existingEmail) {
              throw new AppError('Contact email already registered', 409);
            }
          }

          const person = await tx.person.create({
            data: {
              firstName: contact.firstName,
              middleName: contact.middleName,
              lastName: contact.lastName,
              phone: contact.phone,
              email: contact.email,
              address: existingCustomer.organization?.address || '',
              status: 'ACTIVE',
              createdById: createdById,
              updatedById: createdById,
            },
          });

          await tx.organizationContact.create({
            data: {
              organizationId: existingCustomer.organizationId,
              personId: person.id,
              position: contact.position,
              isPrimary: contact.isPrimary,
            },
          });
        }
      }
    }

    return tx.customer.update({
      where: { id },
      data: {
        customerCode: data.customerCode,
        creditLimit: data.creditLimit,
        paymentTermsId: data.paymentTermsId,
        status: data.status,
        updatedById: createdById,
      },
      include: {
        person: true,
        organization: {
          include: {
            contacts: {
              include: {
                person: {
                  select: {
                    id: true,
                    firstName: true,
                    middleName: true,
                    lastName: true,
                    phone: true,
                    email: true,
                  },
                },
              },
            },
          },
        },
        paymentTerms: true,
        createdBy: {
          select: {
            id: true,
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
          select: {
            id: true,
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
  });

  await logAudit({
    createdById,
    action: 'CUSTOMER_UPDATED',
    entityType: 'Customer',
    entityId: id,
    oldValues: { customerType: existingCustomer.customerType },
    newValues: { customerType: existingCustomer.customerType },
    req,
  });

  return sanitizeCustomer(updatedCustomer);
}

function buildCustomerWhere(filters) {
  const where = { isArchived: false };

  if (filters.customerType) {
    where.customerType = filters.customerType;
  }

  if (filters.status) {
    where.status = filters.status;
  }

  if (filters.paymentTermsId) {
    where.paymentTermsId = filters.paymentTermsId;
  }

  if (filters.search) {
    where.OR = [
      { customerCode: { contains: filters.search, mode: 'insensitive' } },
      {
        customerType: 'PERSON',
        person: {
          OR: [
            { firstName: { contains: filters.search, mode: 'insensitive' } },
            { lastName: { contains: filters.search, mode: 'insensitive' } },
          ],
        },
      },
      {
        customerType: 'ORGANIZATION',
        organization: {
          name: { contains: filters.search, mode: 'insensitive' } },
      },
    ];
  }

  return where;
}

export async function deleteCustomer(id, createdById, req) {
  const existingCustomer = await prisma.customer.findFirst({
    where: { id, isArchived: false },
    include: {
      person: true,
      organization: true,
    },
  });

  if (!existingCustomer) {
    throw new AppError('Customer not found', 404);
  }

  await prisma.customer.update({
    where: { id },
    data: {
      isArchived: true,
      archivedAt: new Date(),
      updatedById: createdById,
    },
  });

  await logAudit({
    createdById,
    action: 'CUSTOMER_DELETED',
    entityType: 'Customer',
    entityId: id,
    oldValues: { customerCode: existingCustomer.customerCode, customerType: existingCustomer.customerType },
    req,
  });

  return { message: 'Customer deleted successfully' };
}

