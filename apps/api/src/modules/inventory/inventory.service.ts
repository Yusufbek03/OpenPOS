import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { prisma } from '@openpos/database';

@Injectable()
export class InventoryService {
  async findAll(params?: { page?: number; limit?: number; search?: string; lowStock?: boolean }) {
    const page = params?.page || 1;
    const limit = params?.limit || 20;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};

    const [items, total] = await Promise.all([
      prisma.inventory.findMany({
        where,
        include: { product: { select: { id: true, name: true, nameRu: true, sku: true, barcode: true } } },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.inventory.count({ where }),
    ]);

    const result = params?.lowStock
      ? items.filter((item) => Number(item.quantity) <= Number(item.minQuantity))
      : items;

    return { items: result, meta: { page, limit, total, pages: Math.ceil(total / limit) } };
  }

  async getProductStock(productId: string) {
    const inventory = await prisma.inventory.findUnique({
      where: { productId },
      include: { product: { select: { id: true, name: true, sku: true } } },
    });
    if (!inventory) throw new NotFoundException('Inventory record not found');
    return inventory;
  }

  async receive(data: { productId: string; quantity: number; notes?: string }) {
    const inventory = await prisma.inventory.findUnique({ where: { productId: data.productId } });

    if (inventory) {
      await prisma.inventory.update({
        where: { productId: data.productId },
        data: { quantity: { increment: data.quantity } },
      });
    } else {
      await prisma.inventory.create({
        data: { productId: data.productId, quantity: data.quantity },
      });
    }

    return prisma.stockMovement.create({
      data: {
        productId: data.productId,
        type: 'RECEIPT',
        quantity: data.quantity,
        notes: data.notes ?? null,
      },
    });
  }

  async writeOff(data: { productId: string; quantity: number; reason: string; notes?: string }) {
    const inventory = await prisma.inventory.findUnique({ where: { productId: data.productId } });
    if (!inventory) throw new NotFoundException('No inventory record found');
    if (Number(inventory.quantity) < data.quantity) {
      throw new BadRequestException('Insufficient stock');
    }

    await prisma.inventory.update({
      where: { productId: data.productId },
      data: { quantity: { decrement: data.quantity } },
    });

    return prisma.stockMovement.create({
      data: {
        productId: data.productId,
        type: 'WRITE_OFF',
        quantity: -data.quantity,
        notes: `${data.reason}: ${data.notes ?? ''}`.trim(),
      },
    });
  }

  async getHistory(params?: { productId?: string; page?: number; limit?: number }) {
    const page = params?.page || 1;
    const limit = params?.limit || 50;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (params?.productId) where.productId = params.productId;

    const [movements, total] = await Promise.all([
      prisma.stockMovement.findMany({
        where,
        include: { product: { select: { id: true, name: true, nameRu: true } } },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.stockMovement.count({ where }),
    ]);

    return { movements, meta: { page, limit, total, pages: Math.ceil(total / limit) } };
  }
}
