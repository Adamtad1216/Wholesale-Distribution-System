import prisma from '../../../config/prisma.js';

export async function getPersons(filters = {}) {
  const { search, hasUserAccount, limit = 20 } = filters;
  const where = { isArchived: false };
  const AND = [];

  if (hasUserAccount !== undefined) {
    const hasAcc = String(hasUserAccount) === 'true';
    
    // Fetch all personIds linked to ANY User record
    const allUsers = await prisma.user.findMany({
      select: { personId: true },
    });
    const userPersonIds = allUsers.map((u) => u.personId).filter(Boolean);

    if (hasAcc) {
      AND.push({
        OR: [
          { user: { isNot: null } },
          { id: { in: userPersonIds } },
        ],
      });
    } else {
      AND.push({
        user: null, // 1. Prisma relation check
        id: { notIn: userPersonIds }, // 2. SQL ID exclusion
      });
    }
  }

  if (search && search.trim()) {
    const query = search.trim();
    AND.push({
      OR: [
        { firstName: { contains: query, mode: 'insensitive' } },
        { lastName: { contains: query, mode: 'insensitive' } },
        { middleName: { contains: query, mode: 'insensitive' } },
        { email: { contains: query, mode: 'insensitive' } },
        { phone: { contains: query, mode: 'insensitive' } },
        {
          employee: {
            OR: [
              { employeeCode: { contains: query, mode: 'insensitive' } },
              { department: { contains: query, mode: 'insensitive' } },
            ],
          },
        },
      ],
    });
  }

  if (AND.length > 0) {
    where.AND = AND;
  }

  const persons = await prisma.person.findMany({
    where,
    include: {
      user: {
        select: {
          id: true,
          username: true,
          accountStatus: true,
        },
      },
      employee: {
        select: {
          id: true,
          employeeCode: true,
          department: true,
          status: true,
        },
      },
    },
    take: Number(limit) || 20,
    orderBy: { createdAt: 'desc' },
  });

  // Layer 3 Defense: Post-filter in JavaScript if hasUserAccount is false
  if (hasUserAccount !== undefined && String(hasUserAccount) === 'false') {
    return persons.filter((p) => !p.user);
  }

  return persons;
}
