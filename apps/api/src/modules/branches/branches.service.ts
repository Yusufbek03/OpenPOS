import { Injectable, NotFoundException } from '@nestjs/common';
import { prisma } from '@openpos/database';
import { CreateBranchDto, UpdateBranchDto } from './dto/branch.dto';

@Injectable()
export class BranchesService {
  async findAll(companyId: string, params?: { page?: number; limit?: number; search?: string }) {
    const page = params?.page || 1;
    const limit = params?.limit || 20;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = { companyId, deletedAt: null };
    if (params?.search) {
      where.OR = [
        { name: { contains: params.search, mode: 'insensitive' } },
        { address: { contains: params.search, mode: 'insensitive' } },
      ];
    }

    const [branches, total] = await Promise.all([
      prisma.branch.findMany({
        where,
        include: { _count: { select: { users: true, orders: true, devices: true } } },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.branch.count({ where }),
    ]);

    return { branches, meta: { page, limit, total, pages: Math.ceil(total / limit) } };
  }

  async findAllGlobal(params?: { page?: number; limit?: number }) {
    const page = params?.page || 1;
    const limit = params?.limit || 50;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = { deletedAt: null };

    const [branches, total] = await Promise.all([
      prisma.branch.findMany({
        where,
        include: { company: { select: { id: true, name: true } } },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.branch.count({ where }),
    ]);

    return { branches, meta: { page, limit, total, pages: Math.ceil(total / limit) } };
  }

  async findById(id: string) {
    const branch = await prisma.branch.findUnique({
      where: { id, deletedAt: null },
      include: {
        company: { select: { id: true, name: true } },
        _count: { select: { users: true, orders: true, devices: true } },
      },
    });
    if (!branch) throw new NotFoundException('Branch not found');
    return branch;
  }

  async create(dto: CreateBranchDto) {
    const company = await prisma.company.findUnique({ where: { id: dto.companyId } });
    if (!company) throw new NotFoundException('Company not found');

    return prisma.branch.create({ data: dto });
  }

  async update(id: string, dto: UpdateBranchDto) {
    const existing = await prisma.branch.findUnique({ where: { id, deletedAt: null } });
    if (!existing) throw new NotFoundException('Branch not found');
    return prisma.branch.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    const existing = await prisma.branch.findUnique({ where: { id, deletedAt: null } });
    if (!existing) throw new NotFoundException('Branch not found');
    await prisma.branch.update({ where: { id }, data: { deletedAt: new Date(), isActive: false } });
    return { message: 'Branch deleted successfully' };
  }
}
