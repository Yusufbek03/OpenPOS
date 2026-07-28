import { Injectable, NotFoundException } from '@nestjs/common';
import { prisma } from '@openpos/database';
import { CreatePrinterDto, UpdatePrinterDto } from './dto/printer.dto';

@Injectable()
export class PrintersService {
  async findAll(params?: { department?: string; branchId?: string }) {
    const where: Record<string, unknown> = { deletedAt: null };
    if (params?.department) where.department = params.department;

    return prisma.printer.findMany({
      where,
      include: {
        _count: { select: { stations: true, printJobs: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string) {
    const printer = await prisma.printer.findUnique({
      where: { id, deletedAt: null },
      include: {
        stations: { select: { id: true, name: true } },
      },
    });
    if (!printer) throw new NotFoundException('Printer not found');
    return printer;
  }

  async create(dto: CreatePrinterDto) {
    return prisma.printer.create({ data: dto });
  }

  async update(id: string, dto: UpdatePrinterDto) {
    const existing = await prisma.printer.findUnique({ where: { id, deletedAt: null } });
    if (!existing) throw new NotFoundException('Printer not found');
    return prisma.printer.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    const existing = await prisma.printer.findUnique({ where: { id, deletedAt: null } });
    if (!existing) throw new NotFoundException('Printer not found');
    await prisma.printer.update({ where: { id }, data: { deletedAt: new Date() } });
    return { message: 'Printer deleted successfully' };
  }

  async getPrintJobs(params?: { printerId?: string; status?: string; page?: number; limit?: number }) {
    const page = params?.page || 1;
    const limit = params?.limit || 50;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (params?.printerId) where.printerId = params.printerId;
    if (params?.status) where.status = params.status;

    const [jobs, total] = await Promise.all([
      prisma.printJob.findMany({
        where,
        include: {
          printer: { select: { id: true, name: true, department: true } },
          user: { select: { id: true, fullName: true } },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.printJob.count({ where }),
    ]);

    return { jobs, meta: { page, limit, total, pages: Math.ceil(total / limit) } };
  }

  async createPrintJob(data: { printerId: string; type: string; data: Record<string, unknown>; userId?: string }) {
    const printer = await prisma.printer.findUnique({ where: { id: data.printerId } });
    if (!printer) throw new NotFoundException('Printer not found');

    return prisma.printJob.create({
      data: {
        printerId: data.printerId,
        type: data.type as 'RECEIPT' | 'KITCHEN_TICKET' | 'BAR_TICKET' | 'DESSERT_TICKET' | 'RETURN' | 'X_REPORT' | 'Z_REPORT',
        data: data.data as never,
        userId: data.userId ?? null,
      },
      include: {
        printer: { select: { id: true, name: true, department: true } },
      },
    });
  }

  async updatePrintJobStatus(id: string, status: 'PRINTING' | 'COMPLETED' | 'FAILED' | 'CANCELLED', error?: string) {
    const job = await prisma.printJob.findUnique({ where: { id } });
    if (!job) throw new NotFoundException('Print job not found');

    const data: Record<string, unknown> = { status };
    if (status === 'COMPLETED') data.printedAt = new Date();
    if (error) data.lastError = error;

    return prisma.printJob.update({
      where: { id },
      data,
      include: { printer: { select: { id: true, name: true } } },
    });
  }
}
