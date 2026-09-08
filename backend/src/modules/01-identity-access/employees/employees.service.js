import prisma from "../../../config/prisma.js";
import { logAudit } from "../../../middleware/audit.middleware.js";
import { AppError } from "../../../utils/errors.js";
import { getPaginationParams, buildPaginationMeta } from "../../../utils/pagination.js";
import { hashPassword } from "../../../utils/password.js";
import crypto from 'crypto';
import { sendInvitationEmail, sendResetPasswordEmail } from "../../../utils/email.js";

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
  const { person, jobSpecifications, branch, createdBy, updatedBy, managedBranches, managedWarehouses, _count, ...rest } = employee;
  const specs = jobSpecifications
    ? jobSpecifications.map((js) => ({
      id: js.jobSpecification?.id || js.id,
      code: js.jobSpecification?.code || js.code,
      title: js.jobSpecification?.title || js.title,
      department: js.jobSpecification?.department || js.department,
      description: js.jobSpecification?.description || js.description || null,
      status: js.jobSpecification?.status || js.status,
      createdAt: js.jobSpecification?.createdAt || js.createdAt,
      updatedAt: js.jobSpecification?.updatedAt || js.updatedAt,
    }))
    : [];

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
        user: person.user
          ? {
            id: person.user.id,
            username: person.user.username,
            accountStatus: person.user.accountStatus,
            isActive: person.user.isActive,
            lastLoginAt: person.user.lastLoginAt,
            roles: person.user.userRoles?.map((ur) => ur.role).filter(Boolean) || [],
            role: person.user.userRoles?.[0]?.role || null,
            userRoles: person.user.userRoles || [],
          }
          : null,
      }
      : null,
    jobSpecifications: specs,
    jobSpecification: specs[0] || null,
    branch: branch
      ? {
        id: branch.id,
        name: branch.name,
        branchCode: branch.branchCode,
        isHeadOffice: branch.isHeadOffice || false,
        city: branch.city || null,
        subCity: branch.subCity || null,
        woreda: branch.woreda || null,
        kebele: branch.kebele || null,
        houseNumber: branch.houseNumber || null,
        landmark: branch.landmark || null,
        phone: branch.phone || null,
        email: branch.email || null,
        status: branch.status || null,
      }
      : null,
    managedBranches: managedBranches || [],
    managedWarehouses: managedWarehouses || [],
    counts: _count || {
      salesOrders: 0,
      deliveries: 0,
      preparationTasks: 0,
      managedWarehouses: 0,
      managedBranches: 0,
    },
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
  const targetJobSpecIds = (data.jobSpecificationIds && data.jobSpecificationIds.length > 0)
    ? data.jobSpecificationIds
    : (data.jobSpecificationId ? [data.jobSpecificationId] : []);

  if (targetJobSpecIds.length > 0) {
    const jobSpecs = await prisma.jobSpecification.findMany({
      where: {
        id: { in: targetJobSpecIds },
        isArchived: false,
      },
    });

    if (jobSpecs.length !== targetJobSpecIds.length) {
      throw new AppError('One or more job specifications not found', 404);
    }
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
        middleName: data.middleName || null,
        lastName: data.lastName,
        phone: data.phone || null,
        email: data.email || null,
        address: data.address || null,
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
        department: data.department || null,
        status: (data.needsUserAccount && !data.password) ? 'INVITED' : (data.status || 'ACTIVE'),
        commissionRate: data.commissionRate || null,
        salesTerritory: data.salesTerritory || null,
        driverLicenseNumber: data.driverLicenseNumber || null,
        driverLicenseExpiry: data.driverLicenseExpiry ? new Date(data.driverLicenseExpiry) : null,
        branchId: data.branchId || null,
        isAvailableForSales: data.isAvailableForSales ?? true,
        createdById,
        updatedById: createdById,
        jobSpecifications: targetJobSpecIds.length > 0 ? {
          create: targetJobSpecIds.map((specId) => ({
            jobSpecificationId: specId,
          })),
        } : undefined,
      },
      include: {
        person: true,
        jobSpecifications: {
          include: {
            jobSpecification: true,
          },
        },
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
    let invitationLink = null;
    let invitationToken = null;
    if (data.needsUserAccount) {
      const assignedRoleIds = (data.roleIds && data.roleIds.length > 0)
        ? data.roleIds
        : (data.roleId ? [data.roleId] : []);

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

        for (const rId of assignedRoleIds) {
          await tx.userRole.create({
            data: {
              userId: user.id,
              createdById,
              roleId: rId,
            },
          });
        }
      } else {
        // Pre-validate username if optionally supplied by admin
        if (data.username) {
          const existingUsername = await tx.user.findUnique({
            where: { username: data.username },
          });
          if (existingUsername) {
            throw new AppError('Username already taken', 409);
          }
        }

        invitationToken = crypto.randomBytes(32).toString('hex');
        const invitationTokenHash = crypto
          .createHash('sha256')
          .update(invitationToken)
          .digest('hex');
        const invitationTokenExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

        user = await tx.user.create({
          data: {
            personId: person.id,
            username: data.username || null,
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

        // Assign selected role(s) so employee has them once invitation is accepted
        for (const rId of assignedRoleIds) {
          await tx.userRole.create({
            data: {
              userId: user.id,
              createdById,
              roleId: rId,
            },
          });
        }

        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        invitationLink = `${frontendUrl}/accept-invitation?token=${invitationToken}`;
      }
    }

    return { employee, user, invitationLink, invitationToken: user?.accountStatus === 'INVITED' ? invitationToken : null };
  }, {
    timeout: 15000,
    maxWait: 10000,
  });

  // Dispatch invitation email asynchronously after transaction commits successfully
  if (result.invitationToken && data.email) {
    sendInvitationEmail(data.email, result.invitationToken, `${data.firstName} ${data.lastName}`)
      .catch((mailErr) => {
        console.error('[Employee Invitation] Mail send failed:', mailErr.message);
      });
  }

  await logAudit({
    createdById,
    action: 'EMPLOYEE_CREATED',
    entityType: 'Employee',
    entityId: result.employee.id,
    newValues: { employeeCode: result.employee.employeeCode, needsUserAccount: data.needsUserAccount },
    req,
  });

  const sanitized = sanitizeEmployee(result.employee);
  if (result.invitationLink) {
    sanitized.invitationLink = result.invitationLink;
  }
  return sanitized;
}

export async function getEmployees(filters) {
  const { page, limit, skip } = getPaginationParams(filters);
  const where = buildEmployeeWhere(filters);

  const [employees, total] = await Promise.all([
    prisma.employee.findMany({
      where,
      include: {
        person: {
          include: {
            user: {
              include: {
                userRoles: {
                  include: {
                    role: true,
                  },
                },
              },
            },
          },
        },
        jobSpecifications: {
          include: {
            jobSpecification: true,
          },
        },
        branch: true,
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
      person: {
        include: {
          user: {
            include: {
              userRoles: {
                include: {
                  role: true,
                },
              },
            },
          },
        },
      },
      jobSpecifications: {
        include: {
          jobSpecification: true,
        },
      },
      branch: true,
      managedBranches: {
        select: {
          id: true,
          name: true,
          branchCode: true,
          city: true,
          status: true,
        },
      },
      managedWarehouses: {
        select: {
          id: true,
          name: true,
          warehouseCode: true,
          status: true,
        },
      },
      _count: {
        select: {
          salesOrders: true,
          deliveries: true,
          preparationTasks: true,
          managedWarehouses: true,
          managedBranches: true,
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
      person: {
        include: {
          user: {
            include: {
              userRoles: {
                include: {
                  role: true,
                },
              },
            },
          },
        },
      },
      jobSpecifications: {
        include: {
          jobSpecification: true,
        },
      },
      branch: true,
    },
  });

  if (!existingEmployee) {
    throw new AppError('Employee not found', 404);
  }

  // Prevent Super Admin from deactivating or suspending their own profile
  const isSelf = existingEmployee.person?.user?.id === createdById;
  const isSuperAdmin = existingEmployee.person?.user?.userRoles?.some(
    (ur) => ur.role?.name === 'SUPER_ADMIN' || ur.role?.code === 'SUPER_ADMIN'
  );

  if (isSelf && isSuperAdmin) {
    if (data.status === 'INACTIVE' || data.status === 'SUSPENDED') {
      throw new AppError('A Super Admin cannot set their own employment status to inactive or suspended', 400);
    }
    if (data.needsUserAccount === false) {
      throw new AppError('A Super Admin cannot deactivate their own user account', 400);
    }
  }

  if (data.jobSpecificationIds) {
    const jobSpecs = await prisma.jobSpecification.findMany({
      where: {
        id: { in: data.jobSpecificationIds },
        isArchived: false,
      },
    });

    if (jobSpecs.length !== data.jobSpecificationIds.length) {
      throw new AppError('One or more job specifications not found', 404);
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
        jobSpecifications: {
          include: {
            jobSpecification: true,
          },
        },
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

    if (data.jobSpecificationIds !== undefined) {
      await tx.employeeJobSpecification.deleteMany({
        where: { employeeId: id },
      });

      for (const jobSpecId of data.jobSpecificationIds) {
        await tx.employeeJobSpecification.create({
          data: {
            employeeId: id,
            jobSpecificationId: jobSpecId,
          },
        });
      }
    }

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

      return { employee, user, invitationToken, person };
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

    return { employee, user, invitationToken: null, person: null };
  });

  if (result.invitationToken && result.person?.email) {
    sendInvitationEmail(result.person.email, result.invitationToken, `${result.person.firstName} ${result.person.lastName}`)
      .then((info) => console.log(`[INFO] Invitation email sent to ${result.person.email}:`, info?.messageId))
      .catch((err) => console.error(`[ERROR] Failed to send invitation email to ${result.person.email}:`, err.message));
  }

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
      person: {
        include: {
          user: {
            include: {
              userRoles: {
                include: {
                  role: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!existingEmployee) {
    throw new AppError('Employee not found', 404);
  }

  const isSelf = existingEmployee.person?.user?.id === createdById;
  const isSuperAdmin = existingEmployee.person?.user?.userRoles?.some(
    (ur) => ur.role?.name === 'SUPER_ADMIN' || ur.role?.code === 'SUPER_ADMIN'
  );

  if (isSelf && isSuperAdmin) {
    throw new AppError('A Super Admin cannot delete their own employee profile', 400);
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

  if (user.personId) {
    await prisma.employee.updateMany({
      where: {
        personId: user.personId,
        status: 'INVITED',
      },
      data: {
        status: 'ACTIVE',
      },
    });
  }

  return updatedUser;
}

function buildEmployeeWhere(filters) {
  const where = { isArchived: false };

  if (filters.jobSpecificationId) {
    where.jobSpecifications = {
      some: {
        jobSpecificationId: filters.jobSpecificationId,
      },
    };
  }

  if (filters.status) {
    if (filters.status === 'INVITED') {
      where.OR = [
        { status: 'INVITED' },
        { person: { user: { accountStatus: 'INVITED' } } },
      ];
    } else if (filters.status === 'ACTIVE') {
      where.status = 'ACTIVE';
      where.NOT = {
        person: { user: { accountStatus: 'INVITED' } },
      };
    } else {
      where.status = filters.status;
    }
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

