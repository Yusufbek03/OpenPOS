import { Injectable, NotFoundException } from '@nestjs/common';
import { prisma } from '@openpos/database';
import { CreateSupplierDto, UpdateSupplierDto } from './dto/supplier.dto';

@Injectable()
export class SuppliersService {
  async findAll(params?: { page?: number; limit?: number; search?: string }) {
    const page = params?.page || 1;
    const limit = params?.limit || 20;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = { deletedAt: null };
    if (params?.search) {
      where.OR = [
        { name: { contains: params.search, mode: 'insensitive' } },
        { inn: { contains: params.search } },
        { contactPerson: { contains: params.search, mode: 'insensitive' } },
      ];
    }

    const [suppliers, total] = await Promise.all([
      prisma.supplier.findMany({ where, skip, take: limit, orderBy: { createdAt: 'desc' } }),
      prisma.supplier.count({ where }),
    ]);

    return { suppliers, meta: { page, limit, total, pages: Math.ceil(total / limit) } };
  }

  async findById(id: string) {
    const supplier = await prisma.supplier.findUnique({ where: { id, deletedAt: null } });
    if (!supplier) throw new NotFoundException('Supplier not found');
    return supplier;
  }

  async create(dto: CreateSupplierDto) {
    return prisma.supplier.create({ data: dto });
  }

  async update(id: string, dto: UpdateSupplierDto) {
    const existing = await prisma.supplier.findUnique({ where: { id, deletedAt: null } });
    if (!existing) throw new NotFoundException('Supplier not found');
    return prisma.supplier.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    const existing = await prisma.supplier.findUnique({ where: { id, deletedAt: null } });
    if (!existing) throw new NotFoundException('Supplier not found');
    await prisma.supplier.update({ where: { id }, data: { deletedAt: new Date() } });
    return { message: 'Supplier deleted successfully' };
  }
}
