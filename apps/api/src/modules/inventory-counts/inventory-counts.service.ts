import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { prisma } from '@openpos/database';
import { CreateCountDto, UpdateCountDto, SubmitCountDto } from './dto/count.dto';

@Injectable()
export class InventoryCountsService {
  async findAll(params?: { status?: string; page?: number; limit?: number }) {
    const page = params?.page || 1;
    const limit = params?.limit || 20;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = { deletedAt: null };
    if (params?.status) where.status = params.status;

    const [counts, total] = await Promise.all([
      prisma.inventoryCount.findMany({
        where,
        include: {
          items: {
            include: { product: { select: { id: true, name: true, sku: true } } },
          },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.inventoryCount.count({ where }),
    ]);

    return { counts, meta: { page, limit, total, pages: Math.ceil(total / limit) } };
  }

  async findById(id: string) {
    const count = await prisma.inventoryCount.findUnique({
      where: { id, deletedAt: null },
      include: {
        items: {
          include: { product: { select: { id: true, name: true, nameRu: true, sku: true } } },
        },
      },
    });
    if (!count) throw new NotFoundException('Inventory count not found');
    return count;
  }

  async create(dto: CreateCountDto) {
    const count = await prisma.inventoryCount.create({
      data: {
        notes: dto.notes,
        warehouseId: dto.warehouseId,
        status: 'DRAFT',
      },
    });

    if (dto.productIds && dto.productIds.length > 0) {
      const inventories = await prisma.inventory.findMany({
        where: { productId: { in: dto.productIds } },
      });

      await prisma.inventoryCountItem.createMany({
        data: inventories.map((inv) => ({
          countId: count.id,
          productId: inv.productId,
          systemQuantity: inv.quantity,
        })),
      });
    } else {
      const allInventories = await prisma.inventory.findMany();
      await prisma.inventoryCountItem.createMany({
        data: allInventories.map((inv) => ({
          countId: count.id,
          productId: inv.productId,
          systemQuantity: inv.quantity,
        })),
      });
    }

    return this.findById(count.id);
  }

  async update(id: string, dto: UpdateCountDto) {
    const existing = await prisma.inventoryCount.findUnique({ where: { id, deletedAt: null } });
    if (!existing) throw new NotFoundException('Inventory count not found');
    if (existing.status !== 'DRAFT') throw new BadRequestException('Can only update DRAFT counts');

    await prisma.inventoryCount.update({ where: { id }, data: { notes: dto.notes } });

    if (dto.items) {
      for (const item of dto.items) {
        const difference = item.actualQuantity != null ? item.actualQuantity - item.systemQuantity : null;
        await prisma.inventoryCountItem.updateMany({
          where: { countId: id, productId: item.productId },
          data: { actualQuantity: item.actualQuantity, difference },
        });
      }
    }

    return this.findById(id);
  }

  async submit(id: string, dto: SubmitCountDto) {
    const existing = await prisma.inventoryCount.findUnique({
      where: { id, deletedAt: null },
      include: { items: true },
    });
    if (!existing) throw new NotFoundException('Inventory count not found');
    if (existing.status !== 'DRAFT') throw new BadRequestException('Can only submit DRAFT counts');

    for (const item of dto.items) {
      const countItem = existing.items.find((i) => i.productId === item.productId);
      if (!countItem) throw new BadRequestException(`Item ${item.productId} not found in count`);

      const difference = item.actualQuantity - Number(countItem.systemQuantity);

      await prisma.inventoryCountItem.update({
        where: { id: countItem.id },
        data: { actualQuantity: item.actualQuantity, difference },
      });

      if (difference !== 0) {
        await prisma.inventory.upsert({
          where: { productId: item.productId },
          update: { quantity: item.actualQuantity },
          create: { productId: item.productId, quantity: item.actualQuantity },
        });

        await prisma.stockMovement.create({
          data: {
            productId: item.productId,
            type: 'INVENTORY',
            quantity: difference,
            notes: `Inventory count adjustment for count ${id}`,
          },
        });
      }
    }

    return prisma.inventoryCount.update({ where: { id }, data: { status: 'COMPLETED' } });
  }

  async cancel(id: string) {
    const existing = await prisma.inventoryCount.findUnique({ where: { id, deletedAt: null } });
    if (!existing) throw new NotFoundException('Inventory count not found');
    if (existing.status === 'COMPLETED') throw new BadRequestException('Cannot cancel completed count');

    return prisma.inventoryCount.update({ where: { id }, data: { status: 'CANCELLED' } });
  }
}
