import { Injectable } from '@nestjs/common';
import { prisma } from '@openpos/database';

@Injectable()
export class ReportsService {
  async getDashboard(params?: { from?: string; to?: string; branchId?: string }) {
    const where: Record<string, unknown> = {};
    if (params?.branchId) where.branchId = params.branchId;

    const from = params?.from ? new Date(params.from) : new Date();
    from.setHours(0, 0, 0, 0);
    const to = params?.to ? new Date(params.to) : new Date();
    to.setHours(23, 59, 59, 999);

    const allTimeWhere: Record<string, unknown> = { ...where, deletedAt: null };

    const [totalOrders, dayOrders, revenue, dayRevenue, dayPayments, topProducts, lowStock, activeOrders] = await Promise.all([
      prisma.order.count({ where: allTimeWhere }),
      prisma.order.count({ where: { ...where, createdAt: { gte: from, lte: to } } }),
      prisma.order.aggregate({ _sum: { total: true }, where: { ...allTimeWhere, status: 'COMPLETED' } }),
      prisma.order.aggregate({ _sum: { total: true }, where: { ...where, createdAt: { gte: from, lte: to }, status: 'COMPLETED' } }),
      prisma.payment.groupBy({
        by: ['method'],
        _sum: { amount: true },
        _count: true,
        where: { status: 'COMPLETED', createdAt: { gte: from, lte: to } },
      }),
      prisma.orderItem.groupBy({
        by: ['productId'],
        _sum: { quantity: true, total: true },
        _count: true,
        where: { order: { ...allTimeWhere, status: 'COMPLETED' } },
        orderBy: { _sum: { total: 'desc' } },
        take: 10,
      }),
      prisma.inventory.findMany({
        where: { quantity: { lte: prisma.inventory.fields?.minQuantity ?? 0 } },
        include: { product: { select: { id: true, name: true, sku: true } } },
        take: 10,
      }),
      prisma.order.findMany({
        where: { ...where, status: { in: ['SENT_TO_KITCHEN', 'PREPARING'] }, deletedAt: null },
        select: { id: true, orderNumber: true, status: true, createdAt: true },
        take: 20,
      }),
    ]);

    return {
      totalOrders,
      dayOrders,
      totalRevenue: revenue._sum.total ?? 0,
      dayRevenue: dayRevenue._sum.total ?? 0,
      dayPayments,
      topProducts,
      lowStock,
      activeOrders,
      period: { from: from.toISOString(), to: to.toISOString() },
    };
  }

  async getSalesByPeriod(params: { from: string; to: string; branchId?: string }) {
    const from = new Date(params.from);
    const to = new Date(params.to);

    const where: Record<string, unknown> = {
      deletedAt: null,
      status: 'COMPLETED',
      createdAt: { gte: from, lte: to },
    };
    if (params.branchId) where.branchId = params.branchId;

    const [sales, orders] = await Promise.all([
      prisma.order.aggregate({
        _sum: { total: true, tax: true, discount: true },
        _count: true,
        where,
      }),
      prisma.order.groupBy({
        by: ['status'],
        _count: true,
        _sum: { total: true },
        where: { ...where, deletedAt: null, createdAt: { gte: from, lte: to } },
      }),
    ]);

    return { sales, byStatus: orders };
  }

  async getPaymentsReport(params: { from: string; to: string; branchId?: string }) {
    const from = new Date(params.from);
    const to = new Date(params.to);

    const where: Record<string, unknown> = {
      deletedAt: null,
      createdAt: { gte: from, lte: to },
    };
    if (params.branchId) where.branchId = params.branchId;

    const byMethod = await prisma.payment.groupBy({
      by: ['method'],
      _sum: { amount: true },
      _count: true,
      where: { ...where, status: 'COMPLETED' },
    });

    const total = await prisma.payment.aggregate({
      _sum: { amount: true },
      _count: true,
      where: { ...where, status: 'COMPLETED' },
    });

    return { byMethod, total };
  }

  async getInventoryReport() {
    const [totalProducts, lowStockProducts, outOfStock, totalValue] = await Promise.all([
      prisma.inventory.count(),
      prisma.inventory.findMany({
        where: { quantity: { gt: 0 } },
        include: { product: { select: { id: true, name: true, sku: true, cost: true } } },
      }).then((items) => items.filter((i) => Number(i.quantity) <= Number(i.minQuantity))),
      prisma.inventory.findMany({
        where: { quantity: 0 },
        include: { product: { select: { id: true, name: true, sku: true } } },
      }),
      prisma.inventory.aggregate({
        _sum: { quantity: true },
      }),
    ]);

    return { totalProducts, lowStockProducts, outOfStock, totalValue };
  }

  async clearAllData(userId: string) {
    await Promise.all([
      prisma.orderItem.deleteMany(),
      prisma.payment.deleteMany(),
      prisma.auditLog.deleteMany(),
      prisma.session.deleteMany(),
      prisma.refreshToken.deleteMany(),
      prisma.printJob.deleteMany(),
      prisma.stockMovement.deleteMany(),
      prisma.kitchenTicket.deleteMany(),
      prisma.inventoryCountItem.deleteMany(),
      prisma.stockTransferItem.deleteMany(),
    ]);

    await prisma.order.deleteMany();
    await prisma.inventoryCount.deleteMany();
    await prisma.stockTransfer.deleteMany();

    await prisma.auditLog.create({
      data: {
        userId,
        action: 'CLEAR_ALL_DATA',
        entity: 'SYSTEM',
        newValues: { message: 'Все данные были очищены владельцем' },
      },
    });

    return { message: 'Все данные очищены', cleared: true };
  }
}
