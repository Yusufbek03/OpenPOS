import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { prisma } from '@openpos/database';

@Injectable()
export class PaymentsService {
  async create(data: { orderId: string; method: string; amount: number; processedBy: string }) {
    const order = await prisma.order.findUnique({ where: { id: data.orderId } });
    if (!order) throw new NotFoundException('Order not found');
    if (order.status === 'CANCELLED') throw new BadRequestException('Cannot pay for cancelled order');

    const payment = await prisma.payment.create({
      data: {
        orderId: data.orderId,
        method: data.method as 'CASH' | 'CARD' | 'CLICK' | 'PAYME' | 'UZUM_BANK' | 'MIXED',
        amount: data.amount,
        status: 'COMPLETED',
        processedBy: data.processedBy,
      },
    });

    const totalPaid = await prisma.payment.aggregate({
      where: { orderId: data.orderId, status: 'COMPLETED' },
      _sum: { amount: true },
    });

    const paidAmount = Number(totalPaid._sum.amount ?? 0);
    if (paidAmount >= Number(order.total)) {
      await prisma.order.update({
        where: { id: data.orderId },
        data: { status: 'COMPLETED' },
      });
    }

    return payment;
  }

  async findByOrder(orderId: string) {
    return prisma.payment.findMany({
      where: { orderId, deletedAt: null },
      include: { processor: { select: { id: true, fullName: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }
}
