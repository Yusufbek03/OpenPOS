import { Injectable, NotFoundException } from '@nestjs/common';
import { prisma } from '@openpos/database';
import { CreateStationDto, UpdateStationDto } from './dto/station.dto';

@Injectable()
export class KitchenService {
  async findAllStations() {
    return prisma.kitchenStation.findMany({
      where: { deletedAt: null },
      include: {
        printer: { select: { id: true, name: true, status: true } },
        _count: { select: { products: true, tickets: true } },
      },
      orderBy: { sortOrder: 'asc' },
    });
  }

  async findStationById(id: string) {
    const station = await prisma.kitchenStation.findUnique({
      where: { id, deletedAt: null },
      include: {
        printer: { select: { id: true, name: true, status: true } },
        products: { select: { id: true, name: true, nameRu: true, nameEn: true } },
      },
    });
    if (!station) throw new NotFoundException('Kitchen station not found');
    return station;
  }

  async createStation(dto: CreateStationDto) {
    if (dto.printerId) {
      const printer = await prisma.printer.findUnique({ where: { id: dto.printerId } });
      if (!printer) throw new NotFoundException('Printer not found');
    }
    return prisma.kitchenStation.create({ data: dto });
  }

  async updateStation(id: string, dto: UpdateStationDto) {
    const existing = await prisma.kitchenStation.findUnique({ where: { id, deletedAt: null } });
    if (!existing) throw new NotFoundException('Kitchen station not found');
    const data: Record<string, unknown> = {};
    if (dto.name !== undefined) data.name = dto.name;
    if (dto.sortOrder !== undefined) data.sortOrder = dto.sortOrder;
    if (dto.printerId !== undefined) data.printerId = dto.printerId;
    if (dto.isActive !== undefined) data.isActive = dto.isActive === 'true';
    return prisma.kitchenStation.update({ where: { id }, data });
  }

  async removeStation(id: string) {
    const existing = await prisma.kitchenStation.findUnique({ where: { id, deletedAt: null } });
    if (!existing) throw new NotFoundException('Kitchen station not found');
    await prisma.kitchenStation.update({ where: { id }, data: { deletedAt: new Date() } });
    return { message: 'Kitchen station deleted successfully' };
  }

  async getActiveTickets(stationId?: string) {
    const where: Record<string, unknown> = {
      status: { in: ['NEW', 'ACCEPTED', 'PREPARING'] },
    };
    if (stationId) where.stationId = stationId;

    return prisma.kitchenTicket.findMany({
      where,
      include: {
        order: {
          select: {
            id: true,
            orderNumber: true,
            notes: true,
            createdAt: true,
            items: {
              select: {
                id: true,
                quantity: true,
                note: true,
                status: true,
                product: { select: { id: true, name: true, nameRu: true } },
              },
            },
          },
        },
        station: { select: { id: true, name: true } },
        printer: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async updateTicketStatus(id: string, status: 'ACCEPTED' | 'PREPARING' | 'READY' | 'SERVED' | 'CANCELLED') {
    const ticket = await prisma.kitchenTicket.findUnique({ where: { id } });
    if (!ticket) throw new NotFoundException('Kitchen ticket not found');

    const updated = await prisma.kitchenTicket.update({
      where: { id },
      data: { status },
    });

    if (status === 'READY' || status === 'SERVED') {
      const allTickets = await prisma.kitchenTicket.findMany({
        where: { orderId: ticket.orderId },
      });
      const allReady = allTickets.every(
        (t) => t.id === id || t.status === 'READY' || t.status === 'SERVED' || t.status === 'CANCELLED',
      );

      if (allReady) {
        await prisma.order.update({
          where: { id: ticket.orderId },
          data: { status: 'READY' },
        });
      }
    }

    return updated;
  }
}
