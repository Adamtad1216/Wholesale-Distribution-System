import prisma from "../../../config/prisma.js";
import { AppError } from "../../../utils/errors.js";
import { logAudit } from "../../../middleware/audit.middleware.js";

function serializeDriver(emp) {
  if (!emp) return null;
  const firstName = emp.person?.firstName || "";
  const lastName = emp.person?.lastName || "";
  return {
    id: emp.id,
    employeeCode: emp.employeeCode,
    name: `${firstName} ${lastName}`.trim() || emp.employeeCode,
    firstName: emp.person?.firstName || "",
    lastName: emp.person?.lastName || "",
    phone: emp.person?.phone || "",
    email: emp.person?.email || "",
    driverLicenseNumber: emp.driverLicenseNumber || null,
    driverLicenseExpiry: emp.driverLicenseExpiry || null,
  };
}

function serializeVehicle(v) {
  return {
    id: v.id,
    plateNumber: v.plateNumber,
    vehicleType: v.vehicleType,
    make: v.make || null,
    model: v.model || null,
    year: v.year || null,
    capacity: v.capacity != null ? Number(v.capacity) : null,
    status: v.status,
    notes: v.notes || null,
    assignedDriverId: v.assignedDriverId || null,
    assignedDriver: serializeDriver(v.assignedDriver),
    deliveriesCount: v._count?.deliveries || (Array.isArray(v.deliveries) ? v.deliveries.length : 0),
    isArchived: v.isArchived,
    createdAt: v.createdAt,
    updatedAt: v.updatedAt,
  };
}

/**
 * List vehicles with pagination, search, status, and assignment status filters
 */
export async function listVehicles({ page = 1, limit = 20, status, vehicleType, assigned, search }) {
  const where = { isArchived: false };

  if (status) where.status = status;
  if (vehicleType) where.vehicleType = vehicleType;

  if (assigned === "true") {
    where.assignedDriverId = { not: null };
  } else if (assigned === "false") {
    where.assignedDriverId = null;
  }

  if (search) {
    const q = search.trim();
    where.OR = [
      { plateNumber: { contains: q, mode: "insensitive" } },
      { make: { contains: q, mode: "insensitive" } },
      { model: { contains: q, mode: "insensitive" } },
      { vehicleType: { contains: q, mode: "insensitive" } },
      {
        assignedDriver: {
          person: {
            OR: [
              { firstName: { contains: q, mode: "insensitive" } },
              { lastName: { contains: q, mode: "insensitive" } },
            ],
          },
        },
      },
    ];
  }

  const [items, total] = await Promise.all([
    prisma.vehicle.findMany({
      where,
      include: {
        assignedDriver: {
          include: { person: true },
        },
        _count: {
          select: { deliveries: true },
        },
      },
      orderBy: [{ status: "asc" }, { plateNumber: "asc" }],
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.vehicle.count({ where }),
  ]);

  return {
    data: items.map(serializeVehicle),
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasNextPage: page * limit < total,
      hasPreviousPage: page > 1,
    },
  };
}

/**
 * Get vehicle details by ID including driver profile, assignment history, and recent deliveries
 */
export async function getVehicleById(id) {
  const vehicle = await prisma.vehicle.findUnique({
    where: { id },
    include: {
      assignedDriver: {
        include: { person: true },
      },
      assignments: {
        orderBy: { assignedAt: "desc" },
        take: 20,
        include: {
          driver: {
            include: { person: true },
          },
          createdBy: {
            select: { id: true, username: true },
          },
        },
      },
      deliveries: {
        orderBy: { scheduledDate: "desc" },
        take: 10,
        select: {
          id: true,
          deliveryNumber: true,
          status: true,
          scheduledDate: true,
          deliveryDate: true,
          deliveryAddress: true,
          customer: {
            select: { id: true, customerCode: true, person: true, organization: true },
          },
        },
      },
    },
  });

  if (!vehicle || vehicle.isArchived) {
    throw new AppError("Vehicle not found", 404);
  }

  const result = serializeVehicle(vehicle);
  result.assignments = vehicle.assignments.map((a) => ({
    id: a.id,
    driverId: a.driverId,
    driver: serializeDriver(a.driver),
    assignedAt: a.assignedAt,
    unassignedAt: a.unassignedAt,
    status: a.status,
    notes: a.notes,
    assignedBy: a.createdBy?.username || "System",
  }));
  result.recentDeliveries = vehicle.deliveries;

  return result;
}

/**
 * Retrieve eligible drivers: employees with DRIVER role, driver permissions, or commercial driver license
 */
export async function getEligibleDrivers() {
  const employees = await prisma.employee.findMany({
    where: {
      status: "ACTIVE",
      isArchived: false,
      OR: [
        {
          person: {
            user: {
              userRoles: {
                some: {
                  role: {
                    OR: [
                      { name: "DRIVER" },
                      {
                        rolePermissions: {
                          some: {
                            permission: {
                              name: { in: ["deliveries:update", "deliveries:read", "vehicles:assign"] },
                            },
                          },
                        },
                      },
                    ],
                  },
                },
              },
            },
          },
        },
        {
          driverLicenseNumber: { not: null },
        },
      ],
    },
    include: {
      person: true,
      assignedVehicles: {
        where: { isArchived: false, status: "ACTIVE" },
        select: { id: true, plateNumber: true, vehicleType: true, model: true },
      },
    },
    orderBy: { employeeCode: "asc" },
  });

  return employees.map((emp) => {
    const serialized = serializeDriver(emp);
    serialized.currentVehicle = emp.assignedVehicles[0] || null;
    return serialized;
  });
}

/**
 * Register a new vehicle and optionally assign an initial driver
 */
export async function createVehicle(data, user) {
  // Check plate number uniqueness
  const existing = await prisma.vehicle.findUnique({
    where: { plateNumber: data.plateNumber },
  });

  if (existing) {
    if (existing.isArchived) {
      // Reactivate archived vehicle
      const restored = await prisma.vehicle.update({
        where: { id: existing.id },
        data: {
          vehicleType: data.vehicleType,
          make: data.make ?? existing.make,
          model: data.model ?? existing.model,
          year: data.year ?? existing.year,
          capacity: data.capacity ?? existing.capacity,
          status: data.status ?? "ACTIVE",
          notes: data.notes ?? existing.notes,
          isArchived: false,
          archivedAt: null,
          updatedById: user.id,
        },
        include: {
          assignedDriver: { include: { person: true } },
        },
      });
      return serializeVehicle(restored);
    }
    throw new AppError(`A vehicle with plate number "${data.plateNumber}" already exists`, 409);
  }

  // Validate driver eligibility if assignedDriverId provided
  if (data.assignedDriverId) {
    const driver = await prisma.employee.findFirst({
      where: { id: data.assignedDriverId, status: "ACTIVE", isArchived: false },
    });
    if (!driver) throw new AppError("Assigned driver employee record not found", 404);
  }

  const vehicle = await prisma.vehicle.create({
    data: {
      plateNumber: data.plateNumber,
      vehicleType: data.vehicleType,
      make: data.make ?? null,
      model: data.model ?? null,
      year: data.year ?? null,
      capacity: data.capacity ?? null,
      status: data.status ?? "ACTIVE",
      notes: data.notes ?? null,
      assignedDriverId: data.assignedDriverId ?? null,
      createdById: user.id,
      updatedById: user.id,
      ...(data.assignedDriverId
        ? {
            assignments: {
              create: {
                driverId: data.assignedDriverId,
                status: "ACTIVE",
                notes: "Initial assignment upon vehicle registration",
                createdById: user.id,
              },
            },
          }
        : {}),
    },
    include: {
      assignedDriver: { include: { person: true } },
    },
  });

  await logAudit({
    createdById: user.id,
    action: "VEHICLE_REGISTERED",
    entityType: "Vehicle",
    entityId: vehicle.id,
    newValues: {
      plateNumber: vehicle.plateNumber,
      vehicleType: vehicle.vehicleType,
      capacity: vehicle.capacity,
      assignedDriverId: vehicle.assignedDriverId,
    },
  });

  return serializeVehicle(vehicle);
}

/**
 * Update vehicle specifications or driver assignment
 */
export async function updateVehicle(id, data, user) {
  const existing = await prisma.vehicle.findUnique({ where: { id } });
  if (!existing || existing.isArchived) throw new AppError("Vehicle not found", 404);

  if (data.plateNumber && data.plateNumber !== existing.plateNumber) {
    const duplicate = await prisma.vehicle.findUnique({ where: { plateNumber: data.plateNumber } });
    if (duplicate && duplicate.id !== id) {
      throw new AppError(`A vehicle with plate number "${data.plateNumber}" already exists`, 409);
    }
  }

  // If driver changed via update
  if (data.assignedDriverId !== undefined && data.assignedDriverId !== existing.assignedDriverId) {
    if (data.assignedDriverId) {
      const driver = await prisma.employee.findFirst({
        where: { id: data.assignedDriverId, status: "ACTIVE", isArchived: false },
      });
      if (!driver) throw new AppError("Driver not found", 404);
    }

    // Close current assignment
    await prisma.vehicleAssignment.updateMany({
      where: { vehicleId: id, status: "ACTIVE" },
      data: {
        unassignedAt: new Date(),
        status: data.assignedDriverId ? "REPLACED" : "UNASSIGNED",
      },
    });

    // If new driver assigned, open new assignment
    if (data.assignedDriverId) {
      await prisma.vehicleAssignment.create({
        data: {
          vehicleId: id,
          driverId: data.assignedDriverId,
          status: "ACTIVE",
          notes: "Assigned via vehicle profile update",
          createdById: user.id,
        },
      });
    }
  }

  const updated = await prisma.vehicle.update({
    where: { id },
    data: {
      ...(data.plateNumber !== undefined ? { plateNumber: data.plateNumber } : {}),
      ...(data.vehicleType !== undefined ? { vehicleType: data.vehicleType } : {}),
      ...(data.make !== undefined ? { make: data.make } : {}),
      ...(data.model !== undefined ? { model: data.model } : {}),
      ...(data.year !== undefined ? { year: data.year } : {}),
      ...(data.capacity !== undefined ? { capacity: data.capacity } : {}),
      ...(data.status !== undefined ? { status: data.status } : {}),
      ...(data.notes !== undefined ? { notes: data.notes } : {}),
      ...(data.assignedDriverId !== undefined ? { assignedDriverId: data.assignedDriverId } : {}),
      updatedById: user.id,
    },
    include: {
      assignedDriver: { include: { person: true } },
    },
  });

  await logAudit({
    createdById: user.id,
    action: "VEHICLE_UPDATED",
    entityType: "Vehicle",
    entityId: id,
    oldValues: { status: existing.status, assignedDriverId: existing.assignedDriverId },
    newValues: { status: updated.status, assignedDriverId: updated.assignedDriverId },
  });

  return serializeVehicle(updated);
}

/**
 * Assign an eligible driver to a vehicle
 */
export async function assignVehicleDriver(vehicleId, driverId, notes, user) {
  const vehicle = await prisma.vehicle.findUnique({ where: { id: vehicleId } });
  if (!vehicle || vehicle.isArchived) throw new AppError("Vehicle not found", 404);

  const driver = await prisma.employee.findFirst({
    where: { id: driverId, status: "ACTIVE", isArchived: false },
    include: { person: true },
  });
  if (!driver) throw new AppError("Driver not found or inactive", 404);

  // Close previous active assignment
  await prisma.vehicleAssignment.updateMany({
    where: { vehicleId, status: "ACTIVE" },
    data: {
      unassignedAt: new Date(),
      status: "REPLACED",
    },
  });

  // Create new active assignment
  const assignment = await prisma.vehicleAssignment.create({
    data: {
      vehicleId,
      driverId,
      status: "ACTIVE",
      notes: notes || "Assigned by fleet administrator",
      createdById: user.id,
    },
  });

  // Update current driver on vehicle
  const updatedVehicle = await prisma.vehicle.update({
    where: { id: vehicleId },
    data: {
      assignedDriverId: driverId,
      updatedById: user.id,
    },
    include: {
      assignedDriver: { include: { person: true } },
    },
  });

  await logAudit({
    createdById: user.id,
    action: "VEHICLE_DRIVER_ASSIGNED",
    entityType: "Vehicle",
    entityId: vehicleId,
    newValues: {
      driverId,
      driverName: `${driver.person?.firstName} ${driver.person?.lastName}`,
      assignmentId: assignment.id,
    },
  });

  return serializeVehicle(updatedVehicle);
}

/**
 * Unassign currently assigned driver from vehicle
 */
export async function unassignVehicleDriver(vehicleId, notes, user) {
  const vehicle = await prisma.vehicle.findUnique({ where: { id: vehicleId } });
  if (!vehicle || vehicle.isArchived) throw new AppError("Vehicle not found", 404);

  const previousDriverId = vehicle.assignedDriverId;

  // Close active assignments
  await prisma.vehicleAssignment.updateMany({
    where: { vehicleId, status: "ACTIVE" },
    data: {
      unassignedAt: new Date(),
      status: "UNASSIGNED",
      notes: notes || "Driver unassigned by fleet administrator",
    },
  });

  const updatedVehicle = await prisma.vehicle.update({
    where: { id: vehicleId },
    data: {
      assignedDriverId: null,
      updatedById: user.id,
    },
    include: {
      assignedDriver: { include: { person: true } },
    },
  });

  await logAudit({
    createdById: user.id,
    action: "VEHICLE_DRIVER_UNASSIGNED",
    entityType: "Vehicle",
    entityId: vehicleId,
    oldValues: { assignedDriverId: previousDriverId },
  });

  return serializeVehicle(updatedVehicle);
}

/**
 * Soft-delete or archive vehicle
 */
export async function deleteVehicle(id, user) {
  const vehicle = await prisma.vehicle.findUnique({ where: { id } });
  if (!vehicle) throw new AppError("Vehicle not found", 404);

  // Close any active assignments
  await prisma.vehicleAssignment.updateMany({
    where: { vehicleId: id, status: "ACTIVE" },
    data: {
      unassignedAt: new Date(),
      status: "UNASSIGNED",
    },
  });

  await prisma.vehicle.update({
    where: { id },
    data: {
      isArchived: true,
      archivedAt: new Date(),
      status: "INACTIVE",
      assignedDriverId: null,
      updatedById: user.id,
    },
  });

  await logAudit({
    createdById: user.id,
    action: "VEHICLE_DELETED",
    entityType: "Vehicle",
    entityId: id,
  });

  return true;
}
