import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { prisma } from '@openpos/database';
import { CreateOrderDto, UpdateOrderDto } from './dto/order.dto';

@Injectable()
export class OrdersService {
  private generateOrderNumber(): string {
    const now = new Date();
    const date = now.toISOString().slice(0, 10).replace(/-/g, '');
    const time = now.toTimeString().slice(0, 8).replace(/:/g, '');
    const random = Math.floor(Math.random() * 10000)
      .toString()
      .padStart(4, '0');
    return `ORD-${date}-${time}-${random}`;
  }

  async findAll(params?: { page?: number; limit?: number; status?: string; search?: string }) {
    const page = params?.page || 1;
    const limit = params?.limit || 20;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = { deletedAt: null };

    if (params?.status) {
      where.status = params.status;
    }

    if (params?.search) {
      where.OR = [
        { orderNumber: { contains: params.search, mode: 'insensitive' } },
      ];
    }

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          cashier: { select: { id: true, fullName: true } },
          waiter: { select: { id: true, fullName: true } },
          customer: { select: { id: true, fullName: true } },
          items: {
            include: { product: { select: { id: true, name: true, nameRu: true } } },
          },
          payments: true,
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.order.count({ where }),
    ]);

    return {
      orders,
      meta: { page, limit, total, pages: Math.ceil(total / limit) },
    };
  }

  async findById(id: string) {
    const order = await prisma.order.findUnique({
      where: { id, deletedAt: null },
      include: {
        cashier: { select: { id: true, fullName: true } },
        waiter: { select: { id: true, fullName: true } },
        customer: { select: { id: true, fullName: true, phone: true } },
        items: {
          include: { product: { select: { id: true, name: true, nameRu: true, nameEn: true, nameUz: true } } },
        },
        payments: true,
        kitchenTickets: true,
      },
    });

    if (!order) throw new NotFoundException('Order not found');
    return order;
  }

  async create(dto: CreateOrderDto, branchId: string) {
    const orderNumber = this.generateOrderNumber();

    let subtotal = 0;
    for (const item of dto.items) {
      subtotal += item.unitPrice * item.quantity - (item.discount ?? 0);
    }

    const orderDiscount = dto.discount ?? 0;
    const total = Math.max(0, subtotal - orderDiscount);

    const order = await prisma.order.create({
      data: {
        orderNumber,
        status: 'DRAFT',
        cashierId: dto.cashierId!,
        waiterId: dto.waiterId ?? null,
        tableId: dto.tableId ?? null,
        customerId: dto.customerId ?? null,
        subtotal,
        discount: orderDiscount,
        tax: 0,
        total,
        notes: dto.notes ?? null,
        branchId,
        items: {
          create: dto.items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            discount: item.discount ?? 0,
            total: item.unitPrice * item.quantity - (item.discount ?? 0),
            note: item.note ?? null,
          })),
        },
      },
      include: {
        items: {
          include: { product: { select: { id: true, name: true, nameRu: true } } },
        },
      },
    });

    return order;
  }

  async update(id: string, dto: UpdateOrderDto) {
    const existing = await prisma.order.findUnique({ where: { id, deletedAt: null } });
    if (!existing) throw new NotFoundException('Order not found');

    const data: Record<string, unknown> = {};
    if (dto.status !== undefined) data.status = dto.status;
    if (dto.customerId !== undefined) data.customerId = dto.customerId;
    if (dto.notes !== undefined) data.notes = dto.notes;
    if (dto.discount !== undefined) {
      data.discount = dto.discount;
      data.total = Number(existing.subtotal) - dto.discount + Number(existing.tax);
    }

    return prisma.order.update({
      where: { id },
      data,
      include: {
        items: {
          include: { product: { select: { id: true, name: true, nameRu: true } } },
        },
      },
    });
  }

  async sendToKitchen(id: string) {
    const existing = await prisma.order.findUnique({
      where: { id, deletedAt: null },
      include: { items: { include: { product: true } } },
    });

    if (!existing) throw new NotFoundException('Order not found');
    if (existing.status !== 'DRAFT' && existing.status !== 'PENDING') {
      throw new BadRequestException(`Cannot send order in status ${existing.status}`);
    }

    const order = await prisma.order.update({
      where: { id },
      data: { status: 'SENT_TO_KITCHEN' },
    });

    for (const item of existing.items) {
      await prisma.kitchenTicket.create({
        data: {
          orderId: id,
          stationId: item.product.kitchenStationId ?? 'default',
          status: 'NEW',
        },
      });
    }

    return order;
  }

  async remove(id: string) {
    const existing = await prisma.order.findUnique({ where: { id, deletedAt: null } });
    if (!existing) throw new NotFoundException('Order not found');

    await prisma.order.update({
      where: { id },
      data: { deletedAt: new Date(), status: 'CANCELLED' },
    });

    return { message: 'Order cancelled successfully' };
  }

  async countOpenOrders() {
    const count = await prisma.order.count({
      where: {
        deletedAt: null,
        status: { in: ['DRAFT', 'PENDING', 'SENT_TO_KITCHEN', 'PREPARING', 'READY'] },
      },
    });
    return { count };
  }

  async findOpenOrders() {
    return prisma.order.findMany({
      where: {
        deletedAt: null,
        status: { in: ['DRAFT', 'PENDING', 'SENT_TO_KITCHEN', 'PREPARING', 'READY'] },
      },
      select: {
        id: true,
        orderNumber: true,
        status: true,
        total: true,
        createdAt: true,
        cashier: { select: { fullName: true } },
        restaurantTable: { select: { name: true } },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async returnOrder(id: string, userId: string, reason?: string) {
    const existing = await prisma.order.findUnique({
      where: { id, deletedAt: null },
      include: { items: true },
    });
    if (!existing) throw new NotFoundException('Order not found');
    if (existing.status === 'RETURNED') throw new BadRequestException('Order already returned');
    if (existing.status === 'CANCELLED') throw new BadRequestException('Cannot return a cancelled order');

    for (const item of existing.items) {
      const productId = (item as Record<string, unknown>).productId as string;
      const quantity = Number(item.quantity);

      const inventory = await prisma.inventory.findFirst({ where: { productId } });
      if (inventory) {
        await prisma.inventory.update({
          where: { id: inventory.id },
          data: { quantity: Number(inventory.quantity) + quantity },
        });
      }

      await prisma.stockMovement.create({
        data: {
          productId,
          type: 'RETURN',
          quantity,
          notes: `Возврат по заказу ${existing.orderNumber}${reason ? ': ' + reason : ''}`,
        },
      });
    }

    await prisma.payment.create({
      data: {
        orderId: id,
        method: 'CASH',
        amount: existing.total,
        status: 'REFUNDED',
        processedBy: userId,
      },
    });

    return prisma.order.update({
      where: { id },
      data: { status: 'RETURNED' },
      include: { items: { include: { product: { select: { id: true, name: true, nameRu: true } } } } },
    });
  }
}
