import { Injectable, NotFoundException } from '@nestjs/common';
import { prisma } from '@openpos/database';
import { CreateProductDto, UpdateProductDto } from './dto/product.dto';

@Injectable()
export class ProductsService {
  async findAll(params?: {
    page?: number;
    limit?: number;
    search?: string;
    categoryId?: string;
    active?: boolean;
  }) {
    const page = params?.page || 1;
    const limit = params?.limit || 20;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = { deletedAt: null };

    if (params?.active !== undefined) {
      where.isActive = params.active;
    }

    if (params?.categoryId) {
      where.categoryId = params.categoryId;
    }

    if (params?.search) {
      where.OR = [
        { name: { contains: params.search, mode: 'insensitive' } },
        { nameRu: { contains: params.search, mode: 'insensitive' } },
        { nameEn: { contains: params.search, mode: 'insensitive' } },
        { nameUz: { contains: params.search, mode: 'insensitive' } },
        { sku: { contains: params.search, mode: 'insensitive' } },
        { barcode: { contains: params.search } },
      ];
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          category: { select: { id: true, name: true, nameRu: true, color: true } },
          inventories: { select: { quantity: true } },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.product.count({ where }),
    ]);

    return {
      products,
      meta: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async search(query: string) {
    const products = await prisma.product.findMany({
      where: {
        deletedAt: null,
        isActive: true,
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { nameRu: { contains: query, mode: 'insensitive' } },
          { nameEn: { contains: query, mode: 'insensitive' } },
          { nameUz: { contains: query, mode: 'insensitive' } },
          { sku: { contains: query, mode: 'insensitive' } },
          { barcode: { contains: query } },
        ],
      },
      include: {
        category: { select: { id: true, name: true, nameRu: true, color: true } },
        inventories: { select: { quantity: true } },
      },
      take: 50,
      orderBy: { name: 'asc' },
    });

    return products;
  }

  async findById(id: string) {
    const product = await prisma.product.findUnique({
      where: { id, deletedAt: null },
      include: {
        category: true,
        inventories: true,
      },
    });

    if (!product) throw new NotFoundException('Product not found');
    return product;
  }

  async create(dto: CreateProductDto) {
    const categoryId = dto.categoryId ?? (await prisma.category.findFirst({ where: { deletedAt: null } }))?.id;
    if (!categoryId) throw new NotFoundException('Category not found');
    const sku = dto.sku ?? `PRD-${Date.now().toString(36).toUpperCase()}`;

    return prisma.product.create({
      data: {
        categoryId,
        sku,
        barcode: dto.barcode ?? null,
        name: dto.name,
        nameRu: dto.nameRu,
        nameEn: dto.nameEn,
        nameUz: dto.nameUz,
        description: dto.description ?? null,
        price: dto.price,
        cost: dto.cost ?? 0,
        taxRate: dto.taxRate ?? 0,
        imageUrl: dto.imageUrl ?? null,
        isActive: dto.isActive ?? true,
        trackInventory: dto.trackInventory ?? true,
        kitchenStationId: dto.kitchenStationId ?? null,
      },
      include: {
        category: { select: { id: true, name: true, nameRu: true, color: true } },
      },
    });
  }

  async update(id: string, dto: UpdateProductDto) {
    const existing = await prisma.product.findUnique({ where: { id, deletedAt: null } });
    if (!existing) throw new NotFoundException('Product not found');

    if (dto.categoryId) {
      const category = await prisma.category.findUnique({ where: { id: dto.categoryId } });
      if (!category) throw new NotFoundException('Category not found');
    }

    const data: Record<string, unknown> = {};
    if (dto.categoryId !== undefined) data.categoryId = dto.categoryId;
    if (dto.barcode !== undefined) data.barcode = dto.barcode;
    if (dto.name !== undefined) data.name = dto.name;
    if (dto.nameRu !== undefined) data.nameRu = dto.nameRu;
    if (dto.nameEn !== undefined) data.nameEn = dto.nameEn;
    if (dto.nameUz !== undefined) data.nameUz = dto.nameUz;
    if (dto.description !== undefined) data.description = dto.description;
    if (dto.price !== undefined) data.price = dto.price;
    if (dto.cost !== undefined) data.cost = dto.cost;
    if (dto.taxRate !== undefined) data.taxRate = dto.taxRate;
    if (dto.imageUrl !== undefined) data.imageUrl = dto.imageUrl;
    if (dto.isActive !== undefined) data.isActive = dto.isActive;
    if (dto.trackInventory !== undefined) data.trackInventory = dto.trackInventory;
    if (dto.kitchenStationId !== undefined) data.kitchenStationId = dto.kitchenStationId;

    return prisma.product.update({
      where: { id },
      data,
      include: {
        category: { select: { id: true, name: true, nameRu: true, color: true } },
      },
    });
  }

  async remove(id: string) {
    const existing = await prisma.product.findUnique({ where: { id, deletedAt: null } });
    if (!existing) throw new NotFoundException('Product not found');

    await prisma.product.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return { message: 'Product deleted successfully' };
  }
}
