import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { prisma } from '@openpos/database';
import { CreateTransferDto, UpdateTransferDto, ReceiveTransferDto } from './dto/transfer.dto';

@Injectable()
export class StockTransfersService {
  async findAll(params?: { status?: string; page?: number; limit?: number }) {
    const page = params?.page || 1;
    const limit = params?.limit || 20;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = { deletedAt: null };
    if (params?.status) where.status = params.status;

    const [transfers, total] = await Promise.all([
      prisma.stockTransfer.findMany({
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
      prisma.stockTransfer.count({ where }),
    ]);

    return { transfers, meta: { page, limit, total, pages: Math.ceil(total / limit) } };
  }

  async findById(id: string) {
    const transfer = await prisma.stockTransfer.findUnique({
      where: { id, deletedAt: null },
      include: {
        items: {
          include: { product: { select: { id: true, name: true, nameRu: true, sku: true } } },
        },
      },
    });
    if (!transfer) throw new NotFoundException('Stock transfer not found');
    return transfer;
  }

  async create(dto: CreateTransferDto) {
    return prisma.stockTransfer.create({
      data: {
        fromWarehouseId: dto.fromWarehouseId,
        toWarehouseId: dto.toWarehouseId,
        notes: dto.notes,
        status: 'DRAFT',
        items: {
          create: dto.items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
          })),
        },
      },
      include: {
        items: { include: { product: { select: { id: true, name: true, sku: true } } } },
      },
    });
  }

  async update(id: string, dto: UpdateTransferDto) {
    const existing = await prisma.stockTransfer.findUnique({ where: { id, deletedAt: null } });
    if (!existing) throw new NotFoundException('Stock transfer not found');
    if (existing.status !== 'DRAFT') throw new BadRequestException('Can only update DRAFT transfers');

    if (dto.items) {
      await prisma.stockTransferItem.deleteMany({ where: { transferId: id } });
      await prisma.stockTransfer.update({
        where: { id },
        data: {
          notes: dto.notes,
          items: {
            create: dto.items.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
            })),
          },
        },
      });
    } else {
      await prisma.stockTransfer.update({ where: { id }, data: { notes: dto.notes } });
    }

    return this.findById(id);
  }

  async send(id: string) {
    const existing = await prisma.stockTransfer.findUnique({ where: { id, deletedAt: null } });
    if (!existing) throw new NotFoundException('Stock transfer not found');
    if (existing.status !== 'DRAFT') throw new BadRequestException('Can only send DRAFT transfers');

    return prisma.stockTransfer.update({ where: { id }, data: { status: 'IN_TRANSIT' } });
  }

  async receive(id: string, dto: ReceiveTransferDto) {
    const existing = await prisma.stockTransfer.findUnique({
      where: { id, deletedAt: null },
      include: { items: true },
    });
    if (!existing) throw new NotFoundException('Stock transfer not found');
    if (existing.status !== 'IN_TRANSIT') throw new BadRequestException('Transfer is not in transit');

    for (const item of dto.items) {
      const transferItem = existing.items.find((i) => i.productId === item.productId);
      if (!transferItem) throw new BadRequestException(`Item ${item.productId} not found in transfer`);

      await prisma.stockTransferItem.update({
        where: { id: transferItem.id },
        data: { receivedQuantity: item.receivedQuantity },
      });

      await prisma.inventory.upsert({
        where: { productId: item.productId },
        update: { quantity: { increment: item.receivedQuantity } },
        create: { productId: item.productId, quantity: item.receivedQuantity },
      });
    }

    return prisma.stockTransfer.update({ where: { id }, data: { status: 'COMPLETED' } });
  }

  async cancel(id: string) {
    const existing = await prisma.stockTransfer.findUnique({ where: { id, deletedAt: null } });
    if (!existing) throw new NotFoundException('Stock transfer not found');
    if (existing.status === 'COMPLETED') throw new BadRequestException('Cannot cancel completed transfer');

    return prisma.stockTransfer.update({ where: { id }, data: { status: 'CANCELLED' } });
  }
}
