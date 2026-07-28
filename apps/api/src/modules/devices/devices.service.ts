import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { prisma } from '@openpos/database';
import { CreateDeviceDto, UpdateDeviceDto } from './dto/device.dto';

@Injectable()
export class DevicesService {
  async findAll(params?: { branchId?: string; page?: number; limit?: number }) {
    const page = params?.page || 1;
    const limit = params?.limit || 50;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = { deletedAt: null };
    if (params?.branchId) where.branchId = params.branchId;

    const [devices, total] = await Promise.all([
      prisma.device.findMany({
        where,
        include: { branch: { select: { id: true, name: true } } },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.device.count({ where }),
    ]);

    return { devices, meta: { page, limit, total, pages: Math.ceil(total / limit) } };
  }

  async findById(id: string) {
    const device = await prisma.device.findUnique({
      where: { id, deletedAt: null },
      include: { branch: { select: { id: true, name: true } } },
    });
    if (!device) throw new NotFoundException('Device not found');
    return device;
  }

  async findByCode(code: string) {
    const device = await prisma.device.findUnique({
      where: { code },
      include: { branch: { select: { id: true, name: true } } },
    });
    if (!device) throw new NotFoundException('Device not found');
    return device;
  }

  async create(dto: CreateDeviceDto) {
    const existing = await prisma.device.findUnique({ where: { code: dto.code } });
    if (existing) throw new ConflictException('Device code already exists');

    if (dto.branchId) {
      const branch = await prisma.branch.findUnique({ where: { id: dto.branchId } });
      if (!branch) throw new NotFoundException('Branch not found');
    }

    return prisma.device.create({ data: dto });
  }

  async update(id: string, dto: UpdateDeviceDto) {
    const existing = await prisma.device.findUnique({ where: { id, deletedAt: null } });
    if (!existing) throw new NotFoundException('Device not found');

    if (dto.code && dto.code !== existing.code) {
      const conflict = await prisma.device.findUnique({ where: { code: dto.code } });
      if (conflict) throw new ConflictException('Device code already exists');
    }

    return prisma.device.update({ where: { id }, data: dto });
  }

  async heartbeat(id: string) {
    const existing = await prisma.device.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Device not found');
    return prisma.device.update({ where: { id }, data: { lastActiveAt: new Date() } });
  }

  async remove(id: string) {
    const existing = await prisma.device.findUnique({ where: { id, deletedAt: null } });
    if (!existing) throw new NotFoundException('Device not found');
    await prisma.device.update({ where: { id }, data: { deletedAt: new Date() } });
    return { message: 'Device deleted successfully' };
  }
}
