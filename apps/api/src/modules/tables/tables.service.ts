import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { prisma } from '@openpos/database';
import { CreateTableDto, UpdateTableDto, UpdateTableStatusDto } from './dto/table.dto';

@Injectable()
export class TablesService {
  async findAll(params?: { status?: string; zone?: string; branchId?: string }) {
    const where: Record<string, unknown> = {};
    if (params?.status) where.status = params.status;
    if (params?.zone) where.zone = params.zone;
    if (params?.branchId) where.branchId = params.branchId;

    return prisma.restaurantTable.findMany({
      where,
      include: {
        waiter: { select: { id: true, fullName: true } },
        orders: { where: { status: { in: ['DRAFT', 'SENT_TO_KITCHEN', 'PREPARING', 'READY'] } }, select: { id: true, orderNumber: true, total: true } },
      },
      orderBy: { number: 'asc' },
    });
  }

  async findById(id: string) {
    const table = await prisma.restaurantTable.findUnique({
      where: { id },
      include: {
        waiter: { select: { id: true, fullName: true } },
        orders: { where: { status: { in: ['DRAFT', 'SENT_TO_KITCHEN', 'PREPARING', 'READY'] } }, include: { items: { include: { product: { select: { nameRu: true } } } } } },
      },
    });
    if (!table) throw new NotFoundException('Table not found');
    return table;
  }

  async getZones(branchId?: string) {
    const where: Record<string, unknown> = {};
    if (branchId) where.branchId = branchId;
    const zones = await prisma.restaurantTable.findMany({
      where,
      select: { zone: true },
      distinct: ['zone'],
    });
    return zones.map((z) => z.zone).filter(Boolean);
  }

  async getStats(branchId?: string) {
    const where: Record<string, unknown> = {};
    if (branchId) where.branchId = branchId;
    const tables = await prisma.restaurantTable.findMany({ where, select: { status: true } });
    const stats = { total: tables.length, FREE: 0, OCCUPIED: 0, RESERVED: 0, CLEANING: 0 };
    tables.forEach((t) => { stats[t.status as keyof typeof stats] = (stats[t.status as keyof typeof stats] || 0) + 1; });
    return stats;
  }

  async create(dto: CreateTableDto, branchId: string) {
    const existing = await prisma.restaurantTable.findFirst({ where: { number: dto.number, branchId } });
    if (existing) throw new BadRequestException(`Table #${dto.number} already exists in this branch`);
    return prisma.restaurantTable.create({ data: { ...dto, branchId } });
  }

  async update(id: string, dto: UpdateTableDto) {
    const existing = await prisma.restaurantTable.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Table not found');
    if (dto.number && dto.number !== existing.number) {
      const dup = await prisma.restaurantTable.findFirst({ where: { number: dto.number, branchId: existing.branchId, id: { not: id } } });
      if (dup) throw new BadRequestException(`Table #${dto.number} already exists`);
    }
    return prisma.restaurantTable.update({ where: { id }, data: dto });
  }

  async updateStatus(id: string, dto: UpdateTableStatusDto) {
    const table = await prisma.restaurantTable.findUnique({ where: { id } });
    if (!table) throw new NotFoundException('Table not found');
    return prisma.restaurantTable.update({
      where: { id },
      data: {
        status: dto.status as any,
        waiterId: dto.waiterId !== undefined ? dto.waiterId : table.waiterId,
      },
    });
  }

  async remove(id: string) {
    const table = await prisma.restaurantTable.findUnique({ where: { id } });
    if (!table) throw new NotFoundException('Table not found');
    const activeOrders = await prisma.order.count({ where: { tableId: id, status: { in: ['DRAFT', 'SENT_TO_KITCHEN', 'PREPARING', 'READY'] as any } } });
    if (activeOrders > 0) throw new BadRequestException('Cannot delete table with active orders');
    await prisma.restaurantTable.delete({ where: { id } });
    return { message: 'Table deleted successfully' };
  }
}
