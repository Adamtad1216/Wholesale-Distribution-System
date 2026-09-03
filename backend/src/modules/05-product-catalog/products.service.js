import prisma from "../../config/prisma.js";
import { AppError } from "../../utils/errors.js";
import { getPaginationParams, buildPaginationMeta } from "../../utils/pagination.js";

export async function getProducts(filters) {
  const { page, limit, skip } = getPaginationParams(filters);
  const warehouseId = filters.warehouseId;

  const where = {
    isArchived: false,
    ...(filters.status && { status: filters.status }),
    ...(filters.search && {
      OR: [
        { name: { contains: filters.search, mode: "insensitive" } },
        { sku: { contains: filters.search, mode: "insensitive" } },
      ],
    }),
    ...(warehouseId && {
      warehouseStocks: { some: { warehouseId } },
    }),
  };

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        sku: true,
        status: true,
        category: { select: { id: true, name: true } },
        brand: { select: { id: true, name: true } },
        unit: { select: { id: true, name: true, abbreviation: true } },
        ...(warehouseId && {
          warehouseStocks: {
            where: { warehouseId },
            select: {
              quantity: true,
              reservedQuantity: true,
              availableQuantity: true,
              minimumStock: true,
              reorderLevel: true,
            },
          },
        }),
      },
    }),
    prisma.product.count({ where }),
  ]);

  return { products, meta: buildPaginationMeta(page, limit, total) };
}

export async function getProductById(id) {
  const product = await prisma.product.findFirst({
    where: { id, isArchived: false },
    select: {
      id: true,
      name: true,
      sku: true,
      status: true,
      description: true,
      category: { select: { id: true, name: true } },
      brand: { select: { id: true, name: true } },
      unit: { select: { id: true, name: true, abbreviation: true } },
    },
  });

  if (!product) {
    throw new AppError("Product not found", 404);
  }

  return product;
}
