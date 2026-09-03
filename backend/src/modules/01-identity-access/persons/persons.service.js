import prisma from '../../../config/prisma.js';

export async function getPersons(filters = {}) {
  const { search, hasUserAccount, limit = 20 } = filters;
  const where = { isArchived: false };
  const AND = [];

  if (hasUserAccount !== undefined) {
    const hasAcc = String(hasUserAccount) === 'true';
    if (hasAcc) {
      AND.push({
        user: { isNot: null },
      });
    } else {
      AND.push({
        user: null, // Strictly guarantees Person does NOT have a user account
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
            employeeCode: { contains: query, mode: 'insensitive' },
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

  return persons;
}
