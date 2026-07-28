import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { prisma } from '@openpos/database';
import { CreateCustomerDto, UpdateCustomerDto } from './dto/customer.dto';

@Injectable()
export class CustomersService {
  async findAll(params?: { page?: number; limit?: number; search?: string; status?: string }) {
    const page = params?.page || 1;
    const limit = params?.limit || 20;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = { deletedAt: null };
    if (params?.status) where.status = params.status;
    if (params?.search) {
      where.OR = [
        { fullName: { contains: params.search, mode: 'insensitive' } },
        { phone: { contains: params.search } },
        { email: { contains: params.search, mode: 'insensitive' } },
      ];
    }

    const [customers, total] = await Promise.all([
      prisma.customer.findMany({ where, skip, take: limit, orderBy: { createdAt: 'desc' } }),
      prisma.customer.count({ where }),
    ]);

    return { customers, meta: { page, limit, total, pages: Math.ceil(total / limit) } };
  }

  async findById(id: string) {
    const customer = await prisma.customer.findUnique({
      where: { id, deletedAt: null },
      include: {
        orders: {
          where: { deletedAt: null },
          orderBy: { createdAt: 'desc' },
          take: 10,
          select: {
            id: true, orderNumber: true, total: true, status: true,
            createdAt: true,
          },
        },
      },
    });
    if (!customer) throw new NotFoundException('Customer not found');
    return customer;
  }

  async search(query: string) {
    return prisma.customer.findMany({
      where: {
        deletedAt: null,
        OR: [
          { fullName: { contains: query, mode: 'insensitive' } },
          { phone: { contains: query } },
        ],
      },
      take: 20,
      orderBy: { fullName: 'asc' },
    });
  }

  async create(dto: CreateCustomerDto) {
    if (dto.phone) {
      const existing = await prisma.customer.findFirst({
        where: { phone: dto.phone, deletedAt: null },
      });
      if (existing) throw new BadRequestException('Customer with this phone already exists');
    }
    return prisma.customer.create({
      data: {
        fullName: dto.fullName,
        phone: dto.phone ?? null,
        email: dto.email ?? null,
        birthDate: dto.birthDate ? new Date(dto.birthDate) : null,
        notes: dto.notes ?? null,
      },
    });
  }

  async update(id: string, dto: UpdateCustomerDto) {
    const existing = await prisma.customer.findUnique({ where: { id, deletedAt: null } });
    if (!existing) throw new NotFoundException('Customer not found');

    if (dto.phone && dto.phone !== existing.phone) {
      const duplicate = await prisma.customer.findFirst({
        where: { phone: dto.phone, deletedAt: null, id: { not: id } },
      });
      if (duplicate) throw new BadRequestException('Customer with this phone already exists');
    }

    const data: Record<string, unknown> = {};
    if (dto.fullName !== undefined) data.fullName = dto.fullName;
    if (dto.phone !== undefined) data.phone = dto.phone || null;
    if (dto.email !== undefined) data.email = dto.email || null;
    if (dto.birthDate !== undefined) data.birthDate = dto.birthDate ? new Date(dto.birthDate) : null;
    if (dto.status !== undefined) data.status = dto.status;
    if (dto.notes !== undefined) data.notes = dto.notes || null;

    return prisma.customer.update({ where: { id }, data });
  }

  async remove(id: string) {
    const existing = await prisma.customer.findUnique({ where: { id, deletedAt: null } });
    if (!existing) throw new NotFoundException('Customer not found');
    await prisma.customer.update({ where: { id }, data: { deletedAt: new Date() } });
    return { message: 'Customer deleted successfully' };
  }

  async accrueBonus(id: string, amount: number) {
    const customer = await prisma.customer.findUnique({ where: { id, deletedAt: null } });
    if (!customer) throw new NotFoundException('Customer not found');
    if (amount <= 0) throw new BadRequestException('Amount must be positive');

    const newBalance = Number(customer.bonusBalance) + amount;
    return prisma.customer.update({
      where: { id },
      data: { bonusBalance: newBalance },
    });
  }

  async writeOffBonus(id: string, amount: number) {
    const customer = await prisma.customer.findUnique({ where: { id, deletedAt: null } });
    if (!customer) throw new NotFoundException('Customer not found');
    if (amount <= 0) throw new BadRequestException('Amount must be positive');
    if (Number(customer.bonusBalance) < amount) {
      throw new BadRequestException(`Insufficient bonus balance. Available: ${customer.bonusBalance}`);
    }

    const newBalance = Number(customer.bonusBalance) - amount;
    return prisma.customer.update({
      where: { id },
      data: { bonusBalance: newBalance },
    });
  }

  async getStats() {
    const [total, newCount, regular, vip, blocked] = await Promise.all([
      prisma.customer.count({ where: { deletedAt: null } }),
      prisma.customer.count({ where: { deletedAt: null, status: 'NEW' } }),
      prisma.customer.count({ where: { deletedAt: null, status: 'REGULAR' } }),
      prisma.customer.count({ where: { deletedAt: null, status: 'VIP' } }),
      prisma.customer.count({ where: { deletedAt: null, status: 'BLOCKED' } }),
    ]);

    const bonusTotal = await prisma.customer.aggregate({
      where: { deletedAt: null },
      _sum: { bonusBalance: true },
    });

    return {
      total,
      byStatus: { NEW: newCount, REGULAR: regular, VIP: vip, BLOCKED: blocked },
      totalBonusBalance: Number(bonusTotal._sum.bonusBalance || 0),
    };
  }
}
