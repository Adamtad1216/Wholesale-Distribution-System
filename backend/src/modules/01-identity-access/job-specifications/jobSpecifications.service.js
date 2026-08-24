import prisma from "../../../config/prisma.js";
import { logAudit } from "../../../middleware/audit.middleware.js";
import { AppError } from "../../../utils/errors.js";
import { getPaginationParams, buildPaginationMeta } from "../../../utils/pagination.js";

const sanitizeJobSpecification = (jobSpec) => {
  if (!jobSpec) return jobSpec;
  return {
    ...jobSpec,
    createdBy: jobSpec.createdBy
      ? {
          id: jobSpec.createdBy.id,
          person: jobSpec.createdBy.person,
        }
      : null,
    updatedBy: jobSpec.updatedBy
      ? {
          id: jobSpec.updatedBy.id,
          person: jobSpec.updatedBy.person,
        }
      : null,
  };
};

export async function createJobSpecification(data, createdById, req) {
  const jobSpec = await prisma.jobSpecification.create({
    data: {
      code: data.code,
      title: data.title,
      description: data.description,
      department: data.department,
      status: data.status || 'ACTIVE',
      createdById,
      updatedById: createdById,
    },
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
  });

  await logAudit({
    createdById,
    action: 'JOB_SPECIFICATION_CREATED',
    entityType: 'JobSpecification',
    entityId: jobSpec.id,
    newValues: { code: jobSpec.code, title: jobSpec.title },
    req,
  });

  return sanitizeJobSpecification(jobSpec);
}

export async function getJobSpecifications(filters) {
  const { page, limit, skip } = getPaginationParams(filters);
  const where = buildJobSpecificationWhere(filters);

  const [jobSpecs, total] = await Promise.all([
    prisma.jobSpecification.findMany({
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
      orderBy: { title: 'asc' },
      skip,
      take: limit,
    }),
    prisma.jobSpecification.count({ where }),
  ]);

  const meta = buildPaginationMeta({ page, limit, total });

  return {
    jobSpecifications: jobSpecs.map(sanitizeJobSpecification),
    meta,
  };
}

export async function getJobSpecificationById(id) {
  const jobSpec = await prisma.jobSpecification.findFirst({
    where: { id, isArchived: false },
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
  });

  if (!jobSpec) {
    throw new AppError('Job specification not found', 404);
  }

  return sanitizeJobSpecification(jobSpec);
}

export async function updateJobSpecification(id, data, createdById, req) {
  const existingJobSpec = await prisma.jobSpecification.findFirst({
    where: { id },
  });

  if (!existingJobSpec) {
    throw new AppError('Job specification not found', 404);
  }

  if (data.code && data.code !== existingJobSpec.code) {
    const duplicate = await prisma.jobSpecification.findFirst({
      where: { code: data.code, id: { not: id } },
    });
    if (duplicate) {
      throw new AppError('Job specification code already exists', 409);
    }
  }

  if (data.title && data.title !== existingJobSpec.title) {
    const duplicate = await prisma.jobSpecification.findFirst({
      where: { title: data.title, id: { not: id } },
    });
    if (duplicate) {
      throw new AppError('Job specification title already exists', 409);
    }
  }

  const updatedJobSpec = await prisma.jobSpecification.update({
    where: { id },
    data: {
      code: data.code,
      title: data.title,
      description: data.description,
      department: data.department,
      status: data.status,
      updatedById: createdById,
    },
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
  });

  await logAudit({
    createdById,
    action: 'JOB_SPECIFICATION_UPDATED',
    entityType: 'JobSpecification',
    entityId: id,
    oldValues: { code: existingJobSpec.code, title: existingJobSpec.title },
    newValues: { code: updatedJobSpec.code, title: updatedJobSpec.title },
    req,
  });

  return sanitizeJobSpecification(updatedJobSpec);
}

export async function deleteJobSpecification(id, createdById, req) {
  const existingJobSpec = await prisma.jobSpecification.findFirst({
    where: { id },
  });

  if (!existingJobSpec) {
    throw new AppError('Job specification not found', 404);
  }

  await prisma.jobSpecification.update({
    where: { id },
    data: {
      isArchived: true,
      archivedAt: new Date(),
      updatedById: createdById,
    },
  });

  await logAudit({
    createdById,
    action: 'JOB_SPECIFICATION_DELETED',
    entityType: 'JobSpecification',
    entityId: id,
    oldValues: { code: existingJobSpec.code, title: existingJobSpec.title },
    req,
  });

  return { message: 'Job specification deleted successfully' };
}

function buildJobSpecificationWhere(filters) {
  const where = { isArchived: false };

  if (filters.department) {
    where.department = filters.department;
  }

  if (filters.status) {
    where.status = filters.status;
  }

  if (filters.search) {
    where.OR = [
      { code: { contains: filters.search, mode: 'insensitive' } },
      { title: { contains: filters.search, mode: 'insensitive' } },
      { description: { contains: filters.search, mode: 'insensitive' } },
    ];
  }

  return where;
}

