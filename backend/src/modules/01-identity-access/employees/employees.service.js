import prisma from "../../../config/prisma.js";
import { logAudit } from "../../../middleware/audit.middleware.js";
import { AppError } from "../../../utils/errors.js";
import { getPaginationParams, buildPaginationMeta } from "../../../utils/pagination.js";
import { hashPassword } from "../../../utils/password.js";
import crypto from 'crypto';
import { sendInvitationEmail } from "../../../utils/email.js";

export const generateEmployeeCode = () => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `EMP-${timestamp}-${random}`;
};

export const ensureUniqueEmployeeCode = async (tx, code) => {
  let uniqueCode = code;
  let attempts = 0;
  while (attempts < 5) {
    const existing = await tx.employee.findUnique({
      where: { employeeCode: uniqueCode },
    });
    if (!existing) return uniqueCode;
    uniqueCode = generateEmployeeCode();
    attempts++;
  }
  return uniqueCode;
};

const sanitizeEmployee = (employee) => {
  if (!employee) return employee;
  const { person, jobSpecification, branch, createdBy, updatedBy, ...rest } = employee;
  return {
    ...rest,
    person: person
      ? {
          id: person.id,
          firstName: person.firstName,
          middleName: person.middleName,
          lastName: person.lastName,
          phone: person.phone,
          email: person.email,
          address: person.address,
          status: person.status,
        }
      : null,
    jobSpecification: jobSpecification
      ? {
          id: jobSpecification.id,
          code: jobSpecification.code,
          title: jobSpecification.title,
          department: jobSpecification.department,
          status: jobSpecification.status,
        }
      : null,
    branch: branch
      ? {
          id: branch.id,
          name: branch.name,
          branchCode: branch.branchCode,
        }
      : null,
    createdBy: createdBy
      ? {
          id: createdBy.id,
          person: createdBy.person,
        }
      : null,
    updatedBy: updatedBy
      ? {
          id: updatedBy.id,
          person: updatedBy.person,
        }
      : null,
  };
};

export async function createEmployee(data, createdById, req) {
  const jobSpec = await prisma.jobSpecification.findFirst({
    where: { id: data.jobSpecificationId, isArchived: false },
  });

  if (!jobSpec) {
    throw new AppError('Job specification not found', 404);
  }

  if (data.branchId) {
    const branch = await prisma.branch.findFirst({
      where: { id: data.branchId, isArchived: false },
    });
    if (!branch) {
      throw new AppError('Branch not found', 404);
    }
  }

  if (data.email) {
    const existingEmail = await prisma.person.findUnique({
      where: { email: data.email },
    });
    if (existingEmail) {
      throw new AppError('Email already registered', 409);
    }
  }

  const employeeCode = data.employeeCode
    ? await ensureUniqueEmployeeCode(prisma, data.employeeCode)
    : generateEmployeeCode();

  const result = await prisma.$transaction(async (tx) => {
    const person = await tx.person.create({
      data: {
        firstName: data.firstName,
        middleName: data.middleName,
        lastName: data.lastName,
        phone: data.phone,
        email: data.email,
        address: data.address,
        status: 'ACTIVE',
        createdById,
        updatedById: createdById,
      },
    });

    const employee = await tx.employee.create({
      data: {
        personId: person.id,
        employeeCode,
        hireDate: new Date(data.hireDate),
        department: data.department,
        jobSpecificationId: data.jobSpecificationId,
        status: data.status || 'ACTIVE',
        commissionRate: data.commissionRate,
        salesTerritory: data.salesTerritory,
        driverLicenseNumber: data.driverLicenseNumber,
        driverLicenseExpiry: data.driverLicenseExpiry ? new Date(data.driverLicenseExpiry) : null,
        branchId: data.branchId,
        isAvailableForSales: data.isAvailableForSales ?? true,
        createdById,
        updatedById: createdById,
      },
      include: {
        person: true,
        jobSpecification: true,
        branch: {
          select: {
            id: true,
            name: true,
            branchCode: true,
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

    let user = null;
    if (data.needsUserAccount) {
      if (data.username && data.password) {
        const existingUsername = await tx.user.findUnique({
          where: { username: data.username },
        });
        if (existingUsername) {
          throw new AppError('Username already taken', 409);
        }

        const passwordHash = await hashPassword(data.password);
        user = await tx.user.create({
          data: {
            personId: person.id,
            username: data.username,
            passwordHash,
            accountStatus: 'ACTIVE',
            isActive: true,
            createdById,
            updatedById: createdById,
          },
          include: {
            person: true,
          },
        });

        if (data.roleId) {
          await tx.userRole.create({
            data: {
              createdById: user.id,
              roleId: data.roleId,
            },
          });
        }
      } else {
        const invitationToken = crypto.randomBytes(32).toString('hex');
        const invitationTokenHash = crypto
          .createHash('sha256')
          .update(invitationToken)
          .digest('hex');
        const invitationTokenExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

        user = await tx.user.create({
          data: {
            personId: person.id,
            accountStatus: 'INVITED',
            invitationTokenHash,
            invitationTokenExpiresAt,
            isActive: false,
            createdById,
            updatedById: createdById,
          },
          include: {
            person: true,
          },
        });

        if (data.email) {
          await sendInvitationEmail(data.email, invitationToken, `${data.firstName} ${data.lastName}`);
        }
      }
    }

    return { employee, user };
  });

  await logAudit({
    createdById,
    action: 'EMPLOYEE_CREATED',
    entityType: 'Employee',
    entityId: result.employee.id,
    newValues: { employeeCode: result.employee.employeeCode, needsUserAccount: data.needsUserAccount },
    req,
  });

  return sanitizeEmployee(result.employee);
}

export async function getEmployees(filters) {
  const { page, limit, skip } = getPaginationParams(filters);
  const where = buildEmployeeWhere(filters);

  const [employees, total] = await Promise.all([
    prisma.employee.findMany({
      where,
      include: {
        person: true,
        jobSpecification: true,
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
    prisma.employee.count({ where }),
  ]);

  const meta = buildPaginationMeta({ page, limit, total });

  return {
    employees: employees.map(sanitizeEmployee),
    meta,
  };
}

export async function getEmployeeById(id) {
  const employee = await prisma.employee.findFirst({
    where: { id, isArchived: false },
    include: {
      person: true,
      jobSpecification: true,
      branch: {
        select: {
          id: true,
          name: true,
          branchCode: true,
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

  if (!employee) {
    throw new AppError('Employee not found', 404);
  }

  return sanitizeEmployee(employee);
}

export async function updateEmployee(id, data, createdById, req) {
  const existingEmployee = await prisma.employee.findFirst({
    where: { id, isArchived: false },
    include: {
      person: true,
      jobSpecification: true,
      branch: true,
    },
  });

  if (!existingEmployee) {
    throw new AppError('Employee not found', 404);
  }

  if (data.jobSpecificationId && data.jobSpecificationId !== existingEmployee.jobSpecificationId) {
    const jobSpec = await prisma.jobSpecification.findFirst({
      where: { id: data.jobSpecificationId, isArchived: false },
    });
    if (!jobSpec) {
      throw new AppError('Job specification not found', 404);
    }
  }

  if (data.branchId && data.branchId !== existingEmployee.branchId) {
    const branch = await prisma.branch.findFirst({
      where: { id: data.branchId, isArchived: false },
    });
    if (!branch) {
      throw new AppError('Branch not found', 404);
    }
  }

  if (data.email && data.email !== existingEmployee.person?.email) {
    const existingEmail = await prisma.person.findFirst({
      where: { email: data.email, id: { not: existingEmployee.personId } },
    });
    if (existingEmail) {
      throw new AppError('Email already registered', 409);
    }
  }

  if (data.employeeCode && data.employeeCode !== existingEmployee.employeeCode) {
    const duplicate = await prisma.employee.findFirst({
      where: { employeeCode: data.employeeCode, id: { not: id } },
    });
    if (duplicate) {
      throw new AppError('Employee code already exists', 409);
    }
  }

  const result = await prisma.$transaction(async (tx) => {
    const personUpdates = {};
    if (data.firstName !== undefined) personUpdates.firstName = data.firstName;
    if (data.middleName !== undefined) personUpdates.middleName = data.middleName;
    if (data.lastName !== undefined) personUpdates.lastName = data.lastName;
    if (data.phone !== undefined) personUpdates.phone = data.phone;
    if (data.email !== undefined) personUpdates.email = data.email;
    if (data.address !== undefined) personUpdates.address = data.address;

    if (Object.keys(personUpdates).length > 0) {
      await tx.person.update({
        where: { id: existingEmployee.personId },
        data: {
          ...personUpdates,
          updatedById: createdById,
        },
      });
    }

    const employeeUpdates = {
      updatedById: createdById,
    };
    if (data.employeeCode !== undefined) employeeUpdates.employeeCode = data.employeeCode;
    if (data.hireDate !== undefined) employeeUpdates.hireDate = new Date(data.hireDate);
    if (data.department !== undefined) employeeUpdates.department = data.department;
    if (data.jobSpecificationId !== undefined) employeeUpdates.jobSpecificationId = data.jobSpecificationId;
    if (data.status !== undefined) employeeUpdates.status = data.status;
    if (data.commissionRate !== undefined) employeeUpdates.commissionRate = data.commissionRate;
    if (data.salesTerritory !== undefined) employeeUpdates.salesTerritory = data.salesTerritory;
    if (data.driverLicenseNumber !== undefined) employeeUpdates.driverLicenseNumber = data.driverLicenseNumber;
    if (data.driverLicenseExpiry !== undefined) employeeUpdates.driverLicenseExpiry = data.driverLicenseExpiry ? new Date(data.driverLicenseExpiry) : null;
    if (data.branchId !== undefined) employeeUpdates.branchId = data.branchId;
    if (data.isAvailableForSales !== undefined) employeeUpdates.isAvailableForSales = data.isAvailableForSales;

    const employee = await tx.employee.update({
      where: { id },
      data: employeeUpdates,
      include: {
        person: true,
        jobSpecification: true,
        branch: {
          select: {
            id: true,
            name: true,
            branchCode: true,
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

    let user = null;
    const existingUser = await tx.user.findUnique({
      where: { personId: existingEmployee.personId },
    });

    if (data.needsUserAccount && !existingUser) {
      const invitationToken = crypto.randomBytes(32).toString('hex');
      const invitationTokenHash = crypto
        .createHash('sha256')
        .update(invitationToken)
        .digest('hex');
      const invitationTokenExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

      user = await tx.user.create({
        data: {
          personId: existingEmployee.personId,
          accountStatus: 'INVITED',
          invitationTokenHash,
          invitationTokenExpiresAt,
          isActive: false,
          createdById,
          updatedById: createdById,
        },
        include: {
          person: true,
        },
      });

      const person = await tx.person.findUnique({
        where: { id: existingEmployee.personId },
      });

      if (person?.email) {
        await sendInvitationEmail(person.email, invitationToken, `${person.firstName} ${person.lastName}`);
      }
    } else if (!data.needsUserAccount && existingUser) {
      await tx.user.update({
        where: { id: existingUser.id },
        data: {
          accountStatus: 'DEACTIVATED',
          isActive: false,
          updatedById: createdById,
        },
      });
    }

    return { employee, user };
  });

  await logAudit({
    createdById,
    action: 'EMPLOYEE_UPDATED',
    entityType: 'Employee',
    entityId: id,
    oldValues: { employeeCode: existingEmployee.employeeCode },
    newValues: { employeeCode: result.employee.employeeCode, needsUserAccount: data.needsUserAccount },
    req,
  });

  return sanitizeEmployee(result.employee);
}

export async function deleteEmployee(id, createdById, req) {
  const existingEmployee = await prisma.employee.findFirst({
    where: { id, isArchived: false },
    include: {
      person: true,
    },
  });

  if (!existingEmployee) {
    throw new AppError('Employee not found', 404);
  }

  await prisma.employee.update({
    where: { id },
    data: {
      isArchived: true,
      archivedAt: new Date(),
      updatedById: createdById,
    },
  });

  await logAudit({
    createdById,
    action: 'EMPLOYEE_DELETED',
    entityType: 'Employee',
    entityId: id,
    oldValues: { employeeCode: existingEmployee.employeeCode },
    req,
  });

  return { message: 'Employee deleted successfully' };
}

export async function acceptInvitation(token, username, password) {
  const invitationTokenHash = crypto
    .createHash('sha256')
    .update(token)
    .digest('hex');

  const user = await prisma.user.findFirst({
    where: {
      invitationTokenHash,
      accountStatus: 'INVITED',
      invitationTokenExpiresAt: {
        gt: new Date(),
      },
    },
    include: {
      person: true,
    },
  });

  if (!user) {
    throw new AppError('Invalid or expired invitation token', 400);
  }

  const existingUsername = await prisma.user.findUnique({
    where: { username },
  });
  if (existingUsername) {
    throw new AppError('Username already taken', 409);
  }

  const passwordHash = await hashPassword(password);

  const updatedUser = await prisma.user.update({
    where: { id: user.id },
    data: {
      username,
      passwordHash,
      accountStatus: 'ACTIVE',
      isActive: true,
      invitationAcceptedAt: new Date(),
      invitationTokenHash: null,
      invitationTokenExpiresAt: null,
    },
    include: {
      person: true,
      userRoles: {
        include: {
          role: true,
        },
      },
    },
  });

  return updatedUser;
}

function buildEmployeeWhere(filters) {
  const where = { isArchived: false };

  if (filters.jobSpecificationId) {
    where.jobSpecificationId = filters.jobSpecificationId;
  }

  if (filters.status) {
    where.status = filters.status;
  }

  if (filters.hasUserAccount !== undefined) {
    if (filters.hasUserAccount === 'true') {
      where.person = {
        user: {
          isNot: null,
        },
      };
    } else {
      where.person = {
        user: null,
      };
    }
  }

  if (filters.search) {
    where.OR = [
      { employeeCode: { contains: filters.search, mode: 'insensitive' } },
      {
        person: {
          OR: [
            { firstName: { contains: filters.search, mode: 'insensitive' } },
            { lastName: { contains: filters.search, mode: 'insensitive' } },
          ],
        },
      },
    ];
  }

  return where;
}

