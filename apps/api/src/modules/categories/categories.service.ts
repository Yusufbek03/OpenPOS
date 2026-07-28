import { Injectable, NotFoundException } from '@nestjs/common';
import { prisma } from '@openpos/database';
import { CreateCategoryDto, UpdateCategoryDto } from './dto/category.dto';

@Injectable()
export class CategoriesService {
  async findAll() {
    return prisma.category.findMany({
      where: { deletedAt: null },
      include: {
        children: {
          where: { deletedAt: null },
          orderBy: { sortOrder: 'asc' },
        },
        _count: {
          select: { products: { where: { deletedAt: null } } },
        },
      },
      orderBy: { sortOrder: 'asc' },
    });
  }

  async findRootCategories() {
    return prisma.category.findMany({
      where: { deletedAt: null, parentId: null },
      include: {
        children: {
          where: { deletedAt: null },
          orderBy: { sortOrder: 'asc' },
          include: {
            _count: {
              select: { products: { where: { deletedAt: null } } },
            },
          },
        },
        _count: {
          select: { products: { where: { deletedAt: null } } },
        },
      },
      orderBy: { sortOrder: 'asc' },
    });
  }

  async findById(id: string) {
    const category = await prisma.category.findUnique({
      where: { id, deletedAt: null },
      include: {
        children: {
          where: { deletedAt: null },
          orderBy: { sortOrder: 'asc' },
        },
        parent: true,
        _count: {
          select: { products: { where: { deletedAt: null } } },
        },
      },
    });

    if (!category) throw new NotFoundException('Category not found');
    return category;
  }

  async create(dto: CreateCategoryDto) {
    if (dto.parentId) {
      const parent = await prisma.category.findUnique({ where: { id: dto.parentId } });
      if (!parent) throw new NotFoundException('Parent category not found');
    }

    return prisma.category.create({
      data: {
        name: dto.name,
        nameRu: dto.nameRu,
        nameEn: dto.nameEn,
        nameUz: dto.nameUz,
        parentId: dto.parentId ?? null,
        sortOrder: dto.sortOrder ?? 0,
        icon: dto.icon ?? null,
        color: dto.color ?? null,
        imageUrl: dto.imageUrl ?? null,
        isActive: dto.isActive ?? true,
      },
    });
  }

  async update(id: string, dto: UpdateCategoryDto) {
    const existing = await prisma.category.findUnique({ where: { id, deletedAt: null } });
    if (!existing) throw new NotFoundException('Category not found');

    if (dto.parentId) {
      if (dto.parentId === id) throw new NotFoundException('Category cannot be its own parent');
      const parent = await prisma.category.findUnique({ where: { id: dto.parentId } });
      if (!parent) throw new NotFoundException('Parent category not found');
    }

    const data: Record<string, unknown> = {};
    if (dto.name !== undefined) data.name = dto.name;
    if (dto.nameRu !== undefined) data.nameRu = dto.nameRu;
    if (dto.nameEn !== undefined) data.nameEn = dto.nameEn;
    if (dto.nameUz !== undefined) data.nameUz = dto.nameUz;
    if (dto.parentId !== undefined) data.parentId = dto.parentId;
    if (dto.sortOrder !== undefined) data.sortOrder = dto.sortOrder;
    if (dto.icon !== undefined) data.icon = dto.icon;
    if (dto.color !== undefined) data.color = dto.color;
    if (dto.imageUrl !== undefined) data.imageUrl = dto.imageUrl;
    if (dto.isActive !== undefined) data.isActive = dto.isActive;

    return prisma.category.update({ where: { id }, data });
  }

  async remove(id: string) {
    const existing = await prisma.category.findUnique({ where: { id, deletedAt: null } });
    if (!existing) throw new NotFoundException('Category not found');

    await prisma.category.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return { message: 'Category deleted successfully' };
  }
}
